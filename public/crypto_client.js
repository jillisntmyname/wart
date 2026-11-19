/**
 * Browser Client-Side End-to-End Encryption Module (Web Crypto API)
 * Encrypts uploaded CIF PDFs and case payloads on your PC using AES-256-GCM
 * BEFORE transmitting across the internet to Cloudflare Pages Functions.
 */
"use strict";

window.PetitionCrypto = (() => {
  const HKDF_INFO = new TextEncoder().encode("MDFL-Tampa-Petition-E2E-AES-256-GCM-v1");
  const PASSPHRASE_KEY = "mdfl_petition_e2e_passphrase_session";

  let handshakeCache = null;

  function b64Encode(bytes) {
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < arr.length; i += chunk) {
      binary += String.fromCharCode(...arr.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function b64Decode(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function handshake(force = false) {
    if (handshakeCache && !force) return handshakeCache;
    const res = await fetch("/api/crypto/handshake", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Handshake unavailable (${res.status})`);
    }
    handshakeCache = await res.json();
    return handshakeCache;
  }

  function getPassphrase() {
    return sessionStorage.getItem(PASSPHRASE_KEY) || "";
  }

  function setPassphrase(val) {
    if (val) sessionStorage.setItem(PASSPHRASE_KEY, val);
    else sessionStorage.removeItem(PASSPHRASE_KEY);
  }

  async function derivePassphraseKey(passphrase, salt) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function deriveEcdhKey(serverPubJwk, salt) {
    const clientKp = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );
    const clientPubJwk = await crypto.subtle.exportKey("jwk", clientKp.publicKey);
    const serverPub = await crypto.subtle.importKey(
      "jwk",
      serverPubJwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );
    const sharedBits = await crypto.subtle.deriveBits(
      { name: "ECDH", public: serverPub },
      clientKp.privateKey,
      256
    );
    const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
    const aesKey = await crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info: HKDF_INFO },
      hkdfKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    return { aesKey, clientPubJwk };
  }

  /**
   * Encrypt payload JSON on your PC with AES-256-GCM, send to Cloudflare Pages `/api/secure/{route}`,
   * and decrypt the AES-256-GCM response back on your PC.
   */
  async function securePost(route, payloadObj) {
    const hs = await handshake();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plainBytes = new TextEncoder().encode(JSON.stringify(payloadObj));

    let mode = hs.recommended_mode || "ecdh";
    let aesKey;
    let clientPubJwk = null;

    if (mode === "psk") {
      let pass = getPassphrase();
      if (!pass) {
        pass = window.prompt("Enter your Law Office E2E Encryption Passphrase (configured in Cloudflare Pages):") || "";
        if (!pass) throw new Error("Firm encryption passphrase is required.");
        setPassphrase(pass);
      }
      aesKey = await derivePassphraseKey(pass, salt);
    } else {
      const derived = await deriveEcdhKey(hs.server_pub_jwk, salt);
      aesKey = derived.aesKey;
      clientPubJwk = derived.clientPubJwk;
    }

    const ctBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plainBytes);
    const envelope = {
      e2e: true,
      alg: "AES-256-GCM",
      mode,
      salt: b64Encode(salt),
      iv: b64Encode(iv),
      ct: b64Encode(new Uint8Array(ctBuf)),
      ...(clientPubJwk ? { clientPubJwk } : {}),
    };

    const res = await fetch(`/api/secure/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    });

    const respJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (mode === "psk" && String(respJson.detail || "").toLowerCase().includes("operation")) {
        setPassphrase("");
        throw new Error("Decryption failed — incorrect Firm Encryption Passphrase.");
      }
      throw new Error(respJson.detail || `Encrypted request failed (${res.status})`);
    }

    if (!respJson.e2e || !respJson.iv || !respJson.ct) {
      throw new Error("Server returned unencrypted response.");
    }

    const respIv = b64Decode(respJson.iv);
    const respCt = b64Decode(respJson.ct);
    const decBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: respIv }, aesKey, respCt);
    return JSON.parse(new TextDecoder().decode(decBuf));
  }

  async function secureUploadPdf(file, chapter) {
    const arrBuf = await file.arrayBuffer();
    const pdfBase64 = b64Encode(new Uint8Array(arrBuf));
    return securePost("cif-intake", {
      filename: file.name,
      chapter: String(chapter || "7"),
      pdf_base64: pdfBase64,
    });
  }

  return {
    handshake,
    securePost,
    secureUploadPdf,
    getPassphrase,
    setPassphrase,
    b64Encode,
    b64Decode,
  };
})();
