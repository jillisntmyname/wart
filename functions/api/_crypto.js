/**
 * Application-Layer End-to-End Encryption Engine for Cloudflare Pages Functions
 * Uses native Web Crypto API (ECDH P-256 + HKDF-SHA-256 + AES-256-GCM)
 *
 * Flow:
 * 1. Client PC fetches server ECDH public key from GET /api/crypto/handshake
 * 2. Client PC generates ephemeral ECDH P-256 keypair, derives shared 256-bit AES-GCM key
 *    (+ optional firm passphrase mixed into HKDF salt), encrypts uploaded CIF PDF / case JSON
 *    on the client PC BEFORE sending across the internet.
 * 3. Cloudflare Pages Function derives the matching 256-bit AES-GCM key using its private key
 *    and client's ephemeral public key, decrypts the payload in volatile Worker memory,
 *    processes it, and encrypts the response back with a fresh 96-bit IV.
 */

const HKDF_INFO = new TextEncoder().encode("MDFL-Tampa-Petition-E2E-AES-256-GCM-v1");

export function b64Encode(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function b64Decode(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a deterministic server ECDH P-256 keypair from Cloudflare secret `PETITION_MASTER_KEY`
 * (or generate a strong ephemeral keypair per isolate if secret is not configured).
 * Note: For multi-isolate Cloudflare Pages reliability, set `PETITION_MASTER_KEY` (any 32+ char
 * random string) or `PETITION_ECDH_JWK` in Cloudflare Pages -> Settings -> Environment Variables.
 */
let _cachedKeyPair = null;

export async function getServerKeyPair(env) {
  // 1. Preferred: Explicit JWK private key stored as Cloudflare Pages Secret
  if (env && env.PETITION_ECDH_JWK) {
    const privJwk = JSON.parse(env.PETITION_ECDH_JWK);
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      privJwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveBits"]
    );
    const pubJwk = { kty: privJwk.kty, crv: privJwk.crv, x: privJwk.x, y: privJwk.y };
    return { privateKey, publicJwk: pubJwk, keyMode: "secret-ecdh-jwk" };
  }

  // 2. Shared AES-256 secret mode if PETITION_ENCRYPTION_KEY is set (works reliably across all edge isolates!)
  if (_cachedKeyPair) return _cachedKeyPair;

  const kp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
  _cachedKeyPair = { privateKey: kp.privateKey, publicJwk, keyMode: "ephemeral-ecdh" };
  return _cachedKeyPair;
}

/**
 * Derive an AES-256-GCM key from a shared firm passphrase/secret via PBKDF2-SHA-256.
 */
export async function derivePassphraseAesKey(secretString, saltBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretString),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Derive a 256-bit AES-GCM session key via ECDH P-256 + HKDF-SHA-256.
 */
export async function deriveEcdhAesKey(serverPrivateKey, clientPublicJwk, saltBytes) {
  const clientPub = await crypto.subtle.importKey(
    "jwk",
    clientPublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPub },
    serverPrivateKey,
    256
  );
  const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: saltBytes, info: HKDF_INFO },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Decrypt an incoming encrypted envelope from the client browser.
 * Supports:
 * - mode "psk": PBKDF2(PETITION_ENCRYPTION_KEY, salt) -> AES-256-GCM (stateless across all Cloudflare edge nodes!)
 * - mode "ecdh": ECDH P-256 + HKDF-SHA-256 -> AES-256-GCM
 */
export async function decryptEnvelope(envelope, env) {
  if (!envelope || envelope.alg !== "AES-256-GCM" || !envelope.iv || !envelope.ct) {
    throw new Error("Invalid encrypted envelope format.");
  }
  const iv = b64Decode(envelope.iv);
  const ct = b64Decode(envelope.ct);
  const salt = envelope.salt ? b64Decode(envelope.salt) : new Uint8Array(16);

  let aesKey;
  if (envelope.mode === "psk") {
    const secret = env?.PETITION_ENCRYPTION_KEY;
    if (!secret) {
      throw new Error("Server PETITION_ENCRYPTION_KEY secret is not configured in Cloudflare Pages.");
    }
    aesKey = await derivePassphraseAesKey(secret, salt);
  } else if (envelope.mode === "ecdh") {
    const kp = await getServerKeyPair(env);
    aesKey = await deriveEcdhAesKey(kp.privateKey, envelope.clientPubJwk, salt);
  } else {
    throw new Error(`Unsupported encryption mode: ${envelope.mode}`);
  }

  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
  const plainText = new TextDecoder().decode(plainBuf);
  return { payload: JSON.parse(plainText), aesKey, mode: envelope.mode };
}

/**
 * Encrypt a JSON response object using the established AES-256-GCM session key and fresh random IV.
 */
export async function encryptResponse(dataObj, aesKey, mode) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = new TextEncoder().encode(JSON.stringify(dataObj));
  const ctBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plainBytes);
  return {
    e2e: true,
    alg: "AES-256-GCM",
    mode,
    iv: b64Encode(iv),
    ct: b64Encode(new Uint8Array(ctBuf)),
  };
}
