 const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
 const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

 export const OAUTH_SCOPES = [
     'https://www.googleapis.com/auth/gmail.readonly',
 ]

function baseUrl(request: Request): URL | string {
     const url = new URL(request.url);
     return `${url.protocol}//${url.host}`;
}

export function authUrl(request: Request): any {
     const clientId = import.meta.env.GOOGLE_CLIENT_ID;
     const redirectUri = new URL('/api/auth/callback', baseUrl(request)).toString();
     const state = crypto.randomUUID()
    const url = new URL(GOOGLE_OAUTH_AUTH_URL);
     url.searchParams.set('client_id', clientId);
     url.searchParams.set('scope', OAUTH_SCOPES.join(' '));
     url.searchParams.set('redirect_uri', redirectUri);
     url.searchParams.set('response_type', 'code');
     url.searchParams.set('state', state);
     url.searchParams.set('prompt', 'consent');
     url.searchParams.set('access_type', 'offline');
     url.searchParams.set('include_granted_scopes', 'true');

     return { url: url.toString(), state};
}

export async function  exchangeCodeForTokens(request: Request, code: string): Promise<any> {
     const clientId = import.meta.env.GOOGLE_CLIENT_ID;
     const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;
     const redirectUri = new URL('/api/auth/callback', baseUrl(request)).toString();

     const body = new URLSearchParams({
         code,
         client_id: clientId,
         client_secret: clientSecret,
         redirect_uri: redirectUri,
         grant_type: 'authorization_code',
     })

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body });
     if (!response.ok) {
         throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
     }
     return await response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<any> {
     const clientId = import.meta.env.GOOGLE_CLIENT_ID;
     const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;

     const body = new URLSearchParams({
         refresh_token: refreshToken,
         client_id: clientId,
         client_secret: clientSecret,
         grant_type:'refresh_token',
     })

     const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body });
     if (!response.ok) {
         throw new Error(`Failed to refresh access token: ${response.statusText}`);
     }
     return await response.json();
}

export function getSessionCookie(headers: Headers): string | null {
     const cookie = headers.get('Cookie');
     const match = cookie?.match(/sessionId=([^;]+);/);
     return match?.[1] || null;
}

export function setSessionCookie(responseHeaders: Headers, sessionId: string): void {
     responseHeaders.append('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Secure`);
}