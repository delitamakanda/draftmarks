import type {APIRoute } from "astro";

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