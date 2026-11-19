import { getServerKeyPair } from "../_crypto.js";

/**
 * GET /api/crypto/handshake
 * Returns the Cloudflare Pages Function's encryption capabilities and ECDH P-256 public key.
 */
export async function onRequestGet({ env }) {
  const kp = await getServerKeyPair(env);
  const hasPassphrase = Boolean(env && env.PETITION_ENCRYPTION_KEY);
  const hasPythonBackend = Boolean(env && env.PYTHON_BACKEND_URL);

  return new Response(
    JSON.stringify({
      ok: true,
      alg: "AES-256-GCM",
      kex: "ECDH-P256-HKDF-SHA256",
      requires_passphrase: hasPassphrase,
      recommended_mode: hasPassphrase ? "psk" : "ecdh",
      server_pub_jwk: kp.publicJwk,
      key_mode: kp.keyMode,
      backend_mode: hasPythonBackend ? "encrypted-python-relay" : "cloudflare-edge-standalone",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
