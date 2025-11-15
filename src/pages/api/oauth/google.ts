import type { APIRoute } from "astro";
import { authUrl, setSessionCookie } from "../../../lib/oauth";
import { db } from "../../../lib/db";

export const prerender = false; // This route does not need prerendering
export const GET: APIRoute = async ({ request }) => {
    const { url } = authUrl(request)
    const sessionId = crypto.randomUUID()
    await db.setSession(sessionId, 'me')
    const headers = new Headers({ Location: url });
    const isSecure = new URL(request.url).protocol === 'https:' || process.env.NODE_ENV === 'production';
    setSessionCookie(headers, sessionId, isSecure)
    return new Response(null, { status: 302, headers });
}