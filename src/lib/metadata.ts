type Meta = {
    title?: string;
    description?: string;
    ogImage?: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    (promise as any).signal = controller.signal;
    return Promise.race([
        promise,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]).finally(() => clearTimeout(t));
}

function absoluteUrl(baseUrl: string, path?: string | null): string | undefined {
    if(!path) {
        return undefined
    }
    try {
        return new URL(path, baseUrl).toString();
    } catch {
        return undefined
    }
}

export async function fetchMetadata(u: string, timeoutMs = 2500): Promise<Meta> {
    try {
        const req = fetch(u, {
            redirect: 'follow',
            // A gentle UA helps some servers return full HTML not minimal
            headers: { 'user-agent': 'DraftMarksBot/1.0 (+https://example.invalid)' },
        });
        // @ts-ignore assign signal in withTimeout
        const resp = await withTimeout(req as any, timeoutMs) as Response;
        if (!resp.ok) return {};
        const html = await resp.text();

        // Extract tags (cheap regex parsing)
        const get = (re: RegExp) => re.exec(html)?.[1]?.trim();

        const titleTag = get(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const ogTitle = get(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)/i) ||
            get(/<meta[^>]+name=["']og:title["'][^>]*content=["']([^"']+)/i);
        const description = get(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)/i) ||
            get(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)/i);
        const ogImage = get(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)/i) ||
            get(/<meta[^>]+name=["']og:image["'][^>]*content=["']([^"']+)/i);

        const title = ogTitle || titleTag || undefined;
        const ogImageUrl = absoluteUrl(u, ogImage);

        return { title, description, ogImage };
    } catch {
        return {};
    }
}

export function faviconUrl(u: string): string | undefined {
    try {
        const { hostname } = new URL(u);
    } catch {
        return undefined;
    }
}

