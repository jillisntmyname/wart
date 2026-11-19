import { getServerKeyPair } from "../_crypto.js";

/**
 * Resolve firm-wide Python backend URL from either:
 * 1) Static Cloudflare Secret env.PYTHON_BACKEND_URL, OR
 * 2) Auto-registered Quick Tunnel URL saved in Cloudflare KV (env.PETITION_CONFIG).
 */
export async function resolveFirmBackend(env) {
  const staticUrl = String(env?.PYTHON_BACKEND_URL || "").trim().replace(/\/+$/, "");
  if (staticUrl) {
    return { url: staticUrl, source: "static-secret", updated_at: null };
  }
  if (env?.PETITION_CONFIG && typeof env.PETITION_CONFIG.get === "function") {
    try {
      const raw = await env.PETITION_CONFIG.get("python_backend_url");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.url) {
          return {
            url: String(parsed.url).trim().replace(/\/+$/, ""),
            source: "kv-auto-registered",
            updated_at: parsed.updated_at || null,
            host: parsed.host || "Office Windows PC",
          };
        }
      }
    } catch (_) {}
  }
  return { url: "", source: "none", updated_at: null };
}

/**
 * GET /api/crypto/handshake
 * Returns the Cloudflare Worker's encryption capabilities, ECDH P-256 public key,
 * and whether the shared Office Python Server is active.
 */
export async function onRequestGet({ env }) {
  const kp = await getServerKeyPair(env);
  const hasPassphrase = Boolean(env && env.PETITION_ENCRYPTION_KEY);
  const firmBackend = await resolveFirmBackend(env);

  return new Response(
    JSON.stringify({
      ok: true,
      alg: "AES-256-GCM",
      kex: "ECDH-P256-HKDF-SHA256",
      requires_passphrase: hasPassphrase,
      recommended_mode: hasPassphrase ? "psk" : "ecdh",
      server_pub_jwk: kp.publicJwk,
      key_mode: kp.keyMode,
      backend_mode: firmBackend.url ? "encrypted-python-relay" : "cloudflare-edge-standalone",
      backend_source: firmBackend.source,
      backend_updated_at: firmBackend.updated_at,
      kv_bound: Boolean(env?.PETITION_CONFIG),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
