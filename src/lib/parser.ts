import { createHash } from 'crypto';

export function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function extractUrlsAndTags(inputs: string): { urls: string[], tags: string[] } {
    const text = stripHtml(inputs);
    const urlRegex = /https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?/gi;
    const rawUrls = Array.from(text.match(urlRegex) || []);
    const rawTags = Array.from(text.match(/#[\p{L}0-9_-]+/gu) || []).map((t) => t.slice(1).toLowerCase());

    const seenU = new Set<string>();
    const urls: string[] = [];
    for (const rawUrl of rawUrls) {
        if (!seenU.has(rawUrl)) {
            seenU.add(rawUrl);
        }
        urls.push(rawUrl);
    }
    const tags = Array.from(new Set(rawTags));
    return { urls, tags };
}

export function normalizeUrl(u: string): string {
    try {
        const url = new URL(u);
        url.hash = '';
        url.protocol = url.protocol.toLowerCase()
        url.hostname = url.hostname.toLowerCase();
        const toRemove = new Set([
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'utm_id', 'utm_name', 'utm_creative', 'utm_referrer', 'gclid', 'fbclid',
            'mc_cid', 'mc_eid', 'igshid', 'ref', 'spm'
        ])
        const keep: [string, string][] = [];
        for (const [key, value] of Object.entries(url.searchParams)) {
            if (!toRemove.has(key.toLowerCase()) && value !== '') {
                keep.push([key, value]);
            }
        }
        keep.sort(([a], [b]) => a.localeCompare(b));
        url.search = keep.length ? ('?' + keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')) : ''
        if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
            url.port = '';
        }
        if (url.pathname !== '/' && url.pathname.endsWith('/')) {
            url.pathname = url.pathname.slice(0, -1);
        }
        return url.toString();
    } catch (error) {
        return u
    }
}

export function domainOf(u: string): string {
    try {
        return new URL(u).hostname.toLowerCase()
    } catch {
        return ''
    }
}

export function bookmarkIdFrom(draftId: string, url: string): string {
    const h = createHash('sha256');
    h.update(`${draftId}|${url}`);
    return h.digest('hex');
}