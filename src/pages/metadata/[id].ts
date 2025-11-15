import type { APIRoute } from 'astro';
import {db} from '../../lib/db'
import { fetchMetadata, faviconUrl } from "../../lib/metadata";

export const prerender = false; // This route needs prerendering to fetch the metadata and favicon

export const GET: APIRoute = async ({ params }) => {
    const id = params.id!;
    const bookmark = await db.getBookmarkById(id);
    if (!bookmark) {
        return new Response('Bookmark not found', { status: 404 });
    }
    const meta = await fetchMetadata(bookmark.url);
    bookmark.title = meta.title || bookmark.title;
    bookmark.description = meta.description || bookmark.description;
    bookmark.ogImageUrl = meta.ogImage || bookmark.ogImageUrl;
    bookmark.faviconUrl = faviconUrl(bookmark.url) || bookmark.faviconUrl;
    bookmark.status  = "fresh";
    await db.upsertBookmark(bookmark);
    return new Response(JSON.stringify(bookmark), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
