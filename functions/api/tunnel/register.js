/**
 * POST /api/tunnel/register
 *
 * Called automatically on startup by the office Windows PC launcher (`start_shared_server.ps1`)
 * whenever a new Cloudflare Quick Tunnel URL (`https://xxxx.trycloudflare.com`) is created.
 * Authenticated strictly via X-Relay-Secret matching env.PYTHON_RELAY_SECRET and stored in
 * Cloudflare KV binding `env.PETITION_CONFIG` so all staff connect automatically with zero copy-paste!
 */
export async function onRequestPost({ request, env }) {
  try {
    const expectedSecret = String(env?.PYTHON_RELAY_SECRET || "").trim();
    if (!expectedSecret) {
      return new Response(
        JSON.stringify({
          detail: "PYTHON_RELAY_SECRET is not configured in Cloudflare Worker Settings -> Variables and Secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    const suppliedSecret = String(request.headers.get("x-relay-secret") || "").trim();
    if (!suppliedSecret || suppliedSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ detail: "Unauthorized: invalid X-Relay-Secret header." }),
        { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    if (!env?.PETITION_CONFIG || typeof env.PETITION_CONFIG.put !== "function") {
      return new Response(
        JSON.stringify({
          detail:
            "Cloudflare KV namespace binding 'PETITION_CONFIG' is not attached to this Worker. Add a KV binding named PETITION_CONFIG in Cloudflare Dashboard -> Worker -> Settings -> Bindings.",
        }),
        { status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    const body = await request.json();
    const rawUrl = String(body?.url || "").trim().replace(/\/+$/, "");
    if (!rawUrl.startsWith("https://")) {
      return new Response(
        JSON.stringify({ detail: "Invalid tunnel URL: must start with https://" }),
        { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    // Validate URL syntax cleanly
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch (_) {
      return new Response(
        JSON.stringify({ detail: "Malformed tunnel URL." }),
        { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    const record = {
      url: parsed.origin,
      host: String(body?.host || "Office Windows PC"),
      updated_at: new Date().toISOString(),
    };

    await env.PETITION_CONFIG.put("python_backend_url", JSON.stringify(record));

    return new Response(
      JSON.stringify({
        ok: true,
        registered_url: record.url,
        updated_at: record.updated_at,
        message: "Live Quick Tunnel URL registered in Cloudflare KV. All staff browsers will use it automatically!",
      }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: `Tunnel registration error: ${err.message || err}` }),
      { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }
}
