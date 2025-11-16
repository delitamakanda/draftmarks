import type {APIRoute } from "astro";
import { getSessionCookie } from "../../../lib/oauth";
import { db } from "../../../lib/db"
import {gmailListDrafts, gmailGetDraftDetail, extractBodyFromMessage, decodeBase64Url } from '../../../lib/gmail'
import {extractUrlsAndTags, normalizeUrl, bookmarkIdFrom, domainOf} from '../../../lib/parser'

export const prerender = false;

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

export const POST: APIRoute = async ({ request }) => {
    const sessionId = getSessionCookie(request.headers);
    if (!sessionId) {
        return new Response('No session found', { status: 401 });
    }
    
    try {
        const accessToken = await ensureAccessToken(sessionId);
        let pageToken: string | undefined = undefined;
        let syncedCount = 0;
        
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
                        gmailDraftId: det.id,
                        gmailMessageId: det.message.id,
                        addedAt: new Date().toISOString(),
                        lastSeenAt: new Date().toISOString(),
                        status: 'fresh',
                        userId: 'me',
                    });
                    syncedCount++;
                }
            }
            
            if (!page.nextPageToken) {
                break;
            }
            pageToken = page.nextPageToken;
        }
        
        return new Response(JSON.stringify({ success: true, syncedCount }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    } catch (error) {
        console.error('Sync error:', error);
        return new Response(JSON.stringify({ error: 'Sync failed' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
