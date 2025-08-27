export type GmailDraft = { id: string; message: { id: string;} };
export type GmailDraftsResponse = { drafts?: GmailDraft[]; nextPageToken?: string; resultSizeEstimate?: number; };
export type GmailDraftDetail = {
    id: string;
    message: {
        id: string;
        internalDate?: string;
        snippet?: string;
        payload: {
            mimeType?: string;
            body?: {
                size: number;
                data?: string | null;
            };
            parts?: any[];
        };
    }
}

const GMAIL_API_BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';
type FetchLike = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
export async function withBackoff<T>(fn: () =>Promise<T>, attemps=4, baseMs=200): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attemps; i++) {
        try {
            return await fn();
        } catch  (error: any) {
            lastError = error;
            const status = typeof error?.status === 'number'? error.status : error.response?.status;
            if (status && status < 500 && status !== 429) {
                const wait = baseMs * Math.pow(2, i) + Math.floor(Math.random() * 100);
                await new Promise((r) => setTimeout(r, wait));
            }
        }
    }
    throw lastError;
}

function authHeader(accessToken: string): HeadersInit {
    return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
}

export async function gmailListDrafts(accessToken: string, pageToken?: string): Promise<GmailDraftsResponse> {
    const url = new URL(`${GMAIL_API_BASE_URL}/drafts`);
    url.searchParams.set('pageToken', String(pageToken) || '');
    if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
    }
    const run = async () => {
        const response = await fetch(url.toString(), {
            headers: authHeader(accessToken),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch drafts: ${response.statusText}`);
        }
        return await response.json() as GmailDraftsResponse;
    }
    return await withBackoff(run);
}

export async function gmailGetDraftDetail(accessToken: string, draftId: string): Promise<GmailDraftDetail> {
    const url = `${GMAIL_API_BASE_URL}/drafts/${encodeURIComponent(draftId)}`;

    const run = async () => {
        const response = await fetch(url.toString(), {
            headers: authHeader(accessToken),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch draft details: ${response.statusText}`);
        }
        return await response.json() as GmailDraftDetail;
    }
    return await withBackoff(run);
}

export function extractBodyFromMessage(message: GmailDraftDetail["message"] | any):
    | { mimeType: string; data: string }
    | null {
    function flatten(part: any): any[] {
        if (!part) return [];
        const arr: any[] = [];
        function walk(p: any) {
            if (!p) return;
            arr.push(p);
            if (Array.isArray(p.parts)) p.parts.forEach(walk);
        }
        walk(part);
        return arr;
    }
    const payload = message?.payload;
    if (!payload) return null;
    const all = flatten(payload);
    // Prefer HTML, fallback to plain text
    const preferred =
        all.find((p) => p?.mimeType === "text/html" && p?.body?.data) ||
        all.find((p) => p?.mimeType === "text/plain" && p?.body?.data) ||
        (payload?.body?.data ? payload : null);

    if (!preferred?.body?.data) return null;
    const mt = preferred.mimeType || "text/plain";
    return { mimeType: mt, data: preferred.body.data as string };
}

export function decodeBase64Url(data: string): string {
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
    // Pad if necessary
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    return Buffer.from(padded, "base64").toString("utf-8");
}

export function internalDateToISO(msString?: string): string | undefined {
    if (!msString) return undefined;
    const ms = +msString;
    if (Number.isNaN(ms)) return undefined;
    return new Date(ms).toISOString();
}