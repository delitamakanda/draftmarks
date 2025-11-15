import type { APIRoute } from "astro";
import {exchangeCodeForTokens, getSessionCookie} from "../../../lib/oauth.ts";
import { db } from "../../../lib/db.ts";

export const prerender = false; // This route does not need prerendering

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request }) => {
    let payload: any;
    try {
        payload = await request.json();
    } catch (error) {
        return json({ error: "Invalid request payload" }, 400);
    }
    const { code, state } = payload;
    if (!code ||!state) {
        return json({ error: "Missing code or state" }, 400);
    }
    const sessionId = getSessionCookie(request.headers);
    if (!sessionId) {
        return json({ error: "No session found" }, 401);
    }
    try {
        (globalThis as any)._FORCE_REDIRECT_URI = '/oauth/callback';
        const tokens = await exchangeCodeForTokens(request, code);
        await db.setToken(sessionId, {
            userId: 'me',
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + Math.max(0, (tokens.expires_in - 60)) * 1000,
        })
        return json({ success: true });
    } catch (error: any) {
        // Handle the error
        return json({ error: 'token_exchange_failed', detail: String(error?.message) }, 500);
    }
}
