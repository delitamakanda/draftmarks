import type { APIRoute } from "astro";
import { getSessionCookie, exchangeCodeForTokens } from "../../../lib/oauth";
import { db } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
        return new Response('No code provided', { status: 400 });
    }
    const tokens = await exchangeCodeForTokens(request, code);
    const sessionId = getSessionCookie(request.headers);
    if (!sessionId) {
        return new Response('Failed to create session', { status: 500 });
    }
    await db.setToken(sessionId, {
        userId: 'me',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiry_date: Date.now() + (tokens.expires_in-60) * 1000,
    })
    return new Response(null, { status: 200, headers: { Location: '/'} });
}