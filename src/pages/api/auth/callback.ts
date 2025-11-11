import type { APIRoute } from "astro";
import { getSessionCookie, exchangeCodeForTokens } from "../../../lib/oauth";
import { db } from "../../../lib/db";

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    const err = url.searchParams.get('error');
    if (err) {
        return json({ error: err }, 400);
    }
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
        expiresAt: Date.now() + Math.max(0, (tokens.expires_in - 60)) * 1000,
    })
    const headers = new Headers({
        Location: '/api/auth/callback',
        'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax;`,
    });
    return new Response(null, { status: 302, headers });
}