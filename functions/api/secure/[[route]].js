import { decryptEnvelope, encryptResponse } from "../_crypto.js";

/**
 * POST /api/secure/:route
 *
 * Receives an AES-256-GCM encrypted payload from the user's PC browser,
 * decrypts it inside Cloudflare Worker volatile memory, routes it either to:
 *   (A) The firm's shared Windows Python PDF Server (via Cloudflare Secret PYTHON_BACKEND_URL
 *       OR per-session override payload._backend_url from Tab 8 Settings), OR
 *   (B) Standalone Cloudflare Edge mode (no external server required),
 * and returns an AES-256-GCM encrypted response back to the user's PC.
 */
export async function onRequestPost({ request, params, env }) {
  try {
    const route = Array.isArray(params.route) ? params.route.join("/") : String(params.route || "");
    const envelope = await request.json();

    // 1. Decrypt payload inside Cloudflare Worker volatile memory
    const { payload, aesKey, mode } = await decryptEnvelope(envelope, env);

    // Resolve shared Python backend URL (Cloudflare firm-wide secret takes priority unless user explicitly overrides)
    const rawOverrideUrl = String(payload?._backend_url || "").trim();
    const rawOverrideSecret = String(payload?._relay_secret || "").trim();
    const envBackendUrl = String(env?.PYTHON_BACKEND_URL || "").trim();
    const envRelaySecret = String(env?.PYTHON_RELAY_SECRET || "").trim();

    const backendUrl = (rawOverrideUrl || envBackendUrl).replace(/\/+$/, "");
    const relaySecret = rawOverrideUrl ? (rawOverrideSecret || envRelaySecret) : (envRelaySecret || rawOverrideSecret);
    const usingFirmWideEnv = Boolean(envBackendUrl && !rawOverrideUrl);

    // Strip internal routing metadata before forwarding
    const cleanPayload = payload && typeof payload === "object" ? { ...payload } : payload;
    if (cleanPayload && typeof cleanPayload === "object") {
      delete cleanPayload._backend_url;
      delete cleanPayload._relay_secret;
    }

    const relayHeaders = (isJson = true) => {
      const h = {};
      if (isJson) h["Content-Type"] = "application/json";
      if (relaySecret) h["X-Relay-Secret"] = relaySecret;
      return h;
    };

    let resultObj;

    if (route === "ping") {
      resultObj = {
        ok: true,
        decrypted_on: "Cloudflare Worker Edge",
        python_backend_configured: Boolean(backendUrl),
        python_backend_scope: usingFirmWideEnv ? "firm-wide (Cloudflare Secret)" : (backendUrl ? "browser-settings" : "none"),
        timestamp: new Date().toISOString(),
        echo_length: JSON.stringify(cleanPayload).length,
      };
    } else if (route === "ping-backend") {
      if (!backendUrl) {
        throw new Error("No Python Server URL configured. Enter your Cloudflare Tunnel URL in Tab 8 Settings or set PYTHON_BACKEND_URL in Cloudflare Secrets.");
      }
      const resp = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        headers: relayHeaders(false),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body.detail || `Python server returned HTTP ${resp.status}`);
      }
      resultObj = {
        ...body,
        connected_via: usingFirmWideEnv ? "Firm-Wide Cloudflare Secret (Shared by All Users)" : "Browser Settings Tunnel URL",
      };
    } else if (backendUrl) {
      // ===== ENCRYPTED RELAY TO SHARED PYTHON PDF SERVER =====
      if (route === "cif-intake") {
        const pdfBytes = Uint8Array.from(atob(cleanPayload.pdf_base64), (c) => c.charCodeAt(0));
        const fd = new FormData();
        fd.append("file", new Blob([pdfBytes], { type: "application/pdf" }), cleanPayload.filename || "CIF.pdf");
        fd.append("chapter", String(cleanPayload.chapter || "7"));
        const resp = await fetch(`${backendUrl}/api/import-cif`, {
          method: "POST",
          headers: relayHeaders(false),
          body: fd,
        });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python CIF import failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else if (route === "import-creditors") {
        const fileBytes = Uint8Array.from(atob(cleanPayload.file_base64), (c) => c.charCodeAt(0));
        const mime = String(cleanPayload.filename || "").toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/csv";
        const fd = new FormData();
        fd.append("file", new Blob([fileBytes], { type: mime }), cleanPayload.filename || "creditors.csv");
        const resp = await fetch(`${backendUrl}/api/import-creditors`, {
          method: "POST",
          headers: relayHeaders(false),
          body: fd,
        });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python creditor import failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else if (route === "generate") {
        const resp = await fetch(`${backendUrl}/api/generate?return_zip=true`, {
          method: "POST",
          headers: relayHeaders(true),
          body: JSON.stringify(cleanPayload.case_data || cleanPayload),
        });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python PDF generation failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else if (route === "cases-list") {
        const resp = await fetch(`${backendUrl}/api/cases`, { method: "GET", headers: relayHeaders(false) });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python cases list failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else if (route === "cases-load") {
        const folder = encodeURIComponent(String(cleanPayload.folder_name || ""));
        const resp = await fetch(`${backendUrl}/api/cases/${folder}`, { method: "GET", headers: relayHeaders(false) });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python case load failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else if (route === "cases-save") {
        const resp = await fetch(`${backendUrl}/api/cases/save`, {
          method: "POST",
          headers: relayHeaders(true),
          body: JSON.stringify(cleanPayload.case_data || cleanPayload),
        });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python case save failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else if (route === "check-forms" || route === "sync-forms") {
        const resp = await fetch(`${backendUrl}/api/updates/${route}`, {
          method: "POST",
          headers: relayHeaders(false),
        });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python template check failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      } else {
        const resp = await fetch(`${backendUrl}/api/${route}`, {
          method: "POST",
          headers: relayHeaders(true),
          body: JSON.stringify(cleanPayload),
        });
        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.detail || `Python ${route} failed (${resp.status})`);
        resultObj = { ...body, processed_by: "python-server" };
      }
    } else {
      // ===== STANDALONE CLOUDFLARE WORKER MODE (No Python Server Configured) =====
      if (route === "cif-intake") {
        const b64 = String(cleanPayload.pdf_base64 || "");
        if (!b64) throw new Error("Missing pdf_base64 in decrypted CIF payload.");
        const headerBytes = atob(b64.slice(0, 16));
        if (!headerBytes.startsWith("%PDF")) {
          throw new Error("Decrypted file is not a valid PDF document.");
        }
        resultObj = {
          ok: true,
          mode: "cloudflare-edge-standalone",
          verified_pdf: true,
          filename: cleanPayload.filename || "CIF.pdf",
          chapter: String(cleanPayload.chapter || "7"),
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
          received: cleanPayload,
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
