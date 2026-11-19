import { decryptEnvelope, encryptResponse } from "../_crypto.js";

/**
 * POST /api/secure/:route
 *
 * Receives an AES-256-GCM encrypted payload from the user's PC browser,
 * decrypts it inside Cloudflare Pages, processes or relays it, and returns
 * an AES-256-GCM encrypted response.
 *
 * Routes:
 * - /api/secure/cif-intake    : Decrypts uploaded CIF PDF bytes inside Cloudflare, returns verified
 *                               payload (or relays to PYTHON_BACKEND_URL if configured)
 * - /api/secure/generate      : Relays to PYTHON_BACKEND_URL (if set) or confirms edge generation
 * - /api/secure/ping          : End-to-end encryption self-test roundtrip
 */
export async function onRequestPost({ request, params, env }) {
  try {
    const route = Array.isArray(params.route) ? params.route.join("/") : String(params.route || "");
    const envelope = await request.json();

    // 1. Decrypt payload inside Cloudflare Worker volatile memory
    const { payload, aesKey, mode } = await decryptEnvelope(envelope, env);

    let resultObj;

    if (route === "ping") {
      resultObj = {
        ok: true,
        decrypted_on: "Cloudflare Pages Edge Worker",
        timestamp: new Date().toISOString(),
        echo_length: JSON.stringify(payload).length,
      };
    } else if (env && env.PYTHON_BACKEND_URL) {
      // Optional Encrypted Relay Mode -> forwards to firm's Python FastAPI server (e.g., via Cloudflare Tunnel)
      const base = env.PYTHON_BACKEND_URL.replace(/\/+$/, "");
      const headers = { "Content-Type": "application/json" };
      if (env.PYTHON_RELAY_SECRET) {
        headers["X-Relay-Secret"] = env.PYTHON_RELAY_SECRET;
      }

      if (route === "cif-intake") {
        // Reconstruct multipart upload for FastAPI /api/import-cif
        const pdfBytes = Uint8Array.from(atob(payload.pdf_base64), (c) => c.charCodeAt(0));
        const fd = new FormData();
        fd.append("file", new Blob([pdfBytes], { type: "application/pdf" }), payload.filename || "CIF.pdf");
        fd.append("chapter", String(payload.chapter || "7"));
        const relayHeaders = {};
        if (env.PYTHON_RELAY_SECRET) relayHeaders["X-Relay-Secret"] = env.PYTHON_RELAY_SECRET;
        const resp = await fetch(`${base}/api/import-cif`, { method: "POST", headers: relayHeaders, body: fd });
        if (!resp.ok) throw new Error(`Backend import-cif failed (${resp.status})`);
        resultObj = await resp.json();
      } else if (route === "generate") {
        const resp = await fetch(`${base}/api/generate`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload.case_data || payload),
        });
        if (!resp.ok) throw new Error(`Backend generate failed (${resp.status})`);
        resultObj = await resp.json();
      } else {
        const resp = await fetch(`${base}/api/${route}`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error(`Backend ${route} failed (${resp.status})`);
        resultObj = await resp.json();
      }
    } else {
      // Standalone Cloudflare Pages Mode:
      // Payload was encrypted on client PC -> transmitted over HTTPS as AES-256-GCM ciphertext ->
      // decrypted & validated inside Cloudflare Pages Worker -> returned encrypted for PDF generation!
      if (route === "cif-intake") {
        const b64 = String(payload.pdf_base64 || "");
        if (!b64) throw new Error("Missing pdf_base64 in decrypted CIF payload.");
        const headerBytes = atob(b64.slice(0, 16));
        if (!headerBytes.startsWith("%PDF")) {
          throw new Error("Decrypted file is not a valid PDF document.");
        }
        resultObj = {
          ok: true,
          mode: "cloudflare-edge-standalone",
          verified_pdf: true,
          filename: payload.filename || "CIF.pdf",
          chapter: String(payload.chapter || "7"),
          byte_length: Math.floor((b64.length * 3) / 4),
          decrypted_at_edge: new Date().toISOString(),
          pdf_base64: b64,
        };
      } else {
        resultObj = {
          ok: true,
          mode: "cloudflare-edge-standalone",
          route,
          decrypted_at_edge: new Date().toISOString(),
          received: payload,
        };
      }
    }

    // 2. Re-encrypt response with AES-256-GCM before sending back over the internet
    const encryptedReply = await encryptResponse(resultObj, aesKey, mode);
    return new Response(JSON.stringify(encryptedReply), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: `E2E Crypto/Route Error: ${err.message || err}` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }
}
