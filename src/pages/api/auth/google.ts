import type { APIRoute } from "astro";
import { authUrl, setSessionCookie } from "../../../lib/oauth";
import { db } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
    const { url } = authUrl(request)
    const sessionId = crypto.randomUUID()
    await db.setSession(sessionId, 'me')
    const headers = new Headers({ Location: url });
    setSessionCookie(headers, sessionId)
    return new Response(null, { status: 302, headers });
}