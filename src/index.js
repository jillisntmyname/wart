/**
 * Cloudflare Worker Entrypoint (Workers with Static Assets)
 * Routes /api/* requests to our encrypted API handlers + KV tunnel auto-registration,
 * and serves everything else from ./public via env.ASSETS.
 */
import { onRequestGet as handleHandshake } from "../functions/api/crypto/handshake.js";
import { onRequestPost as handleSecurePost } from "../functions/api/secure/[[route]].js";
import { onRequestGet as handleUpdates } from "../functions/api/updates.js";
import { onRequestPost as handleTunnelRegister } from "../functions/api/tunnel/register.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. E2E Encryption Handshake
    if (path === "/api/crypto/handshake" && request.method === "GET") {
      return handleHandshake({ request, env, ctx });
    }

    // 2. Auto-Register Quick Tunnel URL from Office Windows PC (authenticated by X-Relay-Secret)
    if (path === "/api/tunnel/register" && request.method === "POST") {
      return handleTunnelRegister({ request, env, ctx });
    }

    // 3. Encrypted Payload Endpoint (/api/secure/*)
    if (path.startsWith("/api/secure/") && request.method === "POST") {
      const route = path.slice("/api/secure/".length);
      return handleSecurePost({ request, env, ctx, params: { route } });
    }

    // 4. Live MDFL Tampa Division Announcements Proxy
    if (path === "/api/updates" && request.method === "GET") {
      return handleUpdates({ request, env, ctx });
    }

    // 5. Static Assets (public/, public/Templates/, public/means-test/)
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
