import type {APIRoute } from "astro";
import { getSessionCookie } from "../../../lib/oauth";
import { db } from "../../../lib/db"

export const prerender = false; // This route does not need prerendering

export const GET: APIRoute = async ({ request }) => {
    const sessionId = getSessionCookie(request.headers);
    if (!sessionId) {
        return new Response('No session found', { status: 401 });
    }
    
    const urlQ = new URL(request.url)
    const querystring = Object.fromEntries(urlQ.searchParams.entries())
    
    try {
        const { items, totalCount, page, pageSize } = await db.listBookmarks({
            q: querystring.q,
            tag: querystring.tag,
            domain: querystring.domain,
            page: Number(querystring.page || 1),
            pageSize: Number(querystring.pageSize || 50),
            sort: querystring.sort || 'added_at',
            order: querystring.order === 'desc'? 'desc': 'asc',
        })
        return new Response(JSON.stringify({ items, totalCount, page, pageSize }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    } catch (error) {
        console.error('List bookmarks error:', error);
        return new Response(JSON.stringify({ error: 'Failed to list bookmarks' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}