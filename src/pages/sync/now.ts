import type {APIRoute } from "astro";

export const prerender = false; // This route does not need prerendering

export const POST: APIRoute = async () => {
    return new Response(
        JSON.stringify({
            ok: true,
            at: new Date().toISOString(),
            headers: {
                'Content-Type': 'application/json',
            }
        })
    )
}