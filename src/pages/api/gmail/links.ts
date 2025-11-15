import type {APIRoute } from "astro";
import { getSessionCookie } from "../../../lib/oauth";
import { db } from "../../../lib/db"
import {gmailListDrafts, gmailGetDraftDetail, extractBodyFromMessage, decodeBase64Url } from '../../../lib/gmail'
import {extractUrlsAndTags, normalizeUrl, bookmarkIdFrom, domainOf} from '../../../lib/parser'

export const prerender = false; // This route does not need prerendering

async function ensureAccessToken(sessionId: string): Promise<string> {
    const token = await db.getToken(sessionId)
    if (!token) {
        throw new Error('No access token found');
    }
    if (Date.now() < token.expiresAt) {
        return token.accessToken;
    }
    // todo: refresh the access token
    return token.accessToken
}

export const GET: APIRoute = async ({ request }) => {
    const sessionId = getSessionCookie(request.headers);
    if (!sessionId) {
        return new Response('No session found', { status: 401 });
    }
    const accessToken = await ensureAccessToken(sessionId);
    let pageToken: string | undefined = undefined;
    for(let i = 0; i<5 ; i++) {
        const page = await gmailListDrafts(accessToken, pageToken);
        const drafts = page.drafts || [];
        for (const draft of drafts) {
            const det = await gmailGetDraftDetail(accessToken, draft.id);
            const body = extractBodyFromMessage(det.message);
            if (!body) {
                continue;
            }
            const raw = decodeBase64Url(body.data);
            const { urls, tags } = extractUrlsAndTags(raw);
            for (const url of urls) {
                const normalizedUrl = normalizeUrl(url);
                const id = bookmarkIdFrom(det.id, normalizedUrl);
                await db.upsertBookmark({
                    id,
                    title: det.message.snippet || '',
                    url: normalizedUrl,
                    domain: domainOf(normalizedUrl),
                    description: '',
                    ogImageUrl: '',
                    faviconUrl: '',
                    tags: tags,
                    source: {
                        gmailDraftId: det.id,
                        gmailMessageId: det.message.id,
                        createdAt: det.message.internalDate ? new Date(Number(det.message.internalDate)).toISOString() : undefined,
                    },
                    addedAt: new Date().toISOString(),
                    lastSeenAt: new Date().toISOString(),
                    status: 'fresh',
                    userId: 'me',
                })
            }
        }
        if (!page.nextPageToken) {
            break;
        }
        pageToken = page.nextPageToken;
    }
    const urlQ = new URL(request.url)
    const querystring = Object.fromEntries(urlQ.searchParams.entries())
    const { items, totalCount, page, pageSize } = await db.listBookmarks({
        q: querystring.q,
        tag: querystring.tag,
        domain: querystring.domain,
        page: Number(querystring.page || 1),
        pageSize: Number(querystring.pageSize || 50),
        sort: querystring.sort || 'added_at',
        order: querystring.order === 'desc'? 'desc': 'asc',
    })
    return new Response(JSON.stringify({ items, totalCount, page, pageSize }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}