import supabase from './supabase';

export type Bookmark = {
    id: string;
    title?: string;
    url: string;
    domain: string;
    description?: string;
    ogImageUrl?: string;
    faviconUrl?: string;
    tags: string[];
    source: { gmailDraftId: string; gmailMessageId?: string; createdAt?: string; };
    status: 'fresh' | 'stale' | 'archived';
    addedAt: string;
    lastSeenAt: string;
    userId?: string;
}

type Token = {
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

export const db = {
    // insert or update bookmark
    async upsertBookmark(bookmark: Bookmark){
        const { data, error } = await supabase
            .from('bookmarks')
            .upsert({
                    id: bookmark.id,
                    title: bookmark.title,
                    url: bookmark.url,
                    domain: bookmark.domain,
                    description: bookmark.description,
                    og_image_url: bookmark.ogImageUrl,
                    favicon_url: bookmark.faviconUrl,
                    tags: bookmark.tags,
                    source: bookmark.source,
                    status: bookmark.status,
                    addedAt: bookmark.addedAt,
                    last_seen_at: bookmark.lastSeenAt,
                    user_id: bookmark.userId ?? 'me',
                }).select()
            .single();
        if (error) {
            throw new Error(`Failed to upsert bookmark: ${error.message}`);
        }
        return data;
    },

// list bookmarks for a user
     async listBookmarks(params: {
         q?: string;
         tag?: string;
         domain?: string;
         page?: number;
         pageSize?: number;
         sort?: string;
         order?: 'asc' | 'desc';
     }) {
        const { q, tag, domain, page=1, pageSize=50, sort ='added_at', order='desc' } = params;

        let query = supabase
            .from('bookmarks')
            .select('*', {
                count: 'exact'
            }).eq('user_id', 'me');
        if (domain) {
            query = query.ilike('domain', `%${domain}%`);
        }
        if (tag) {
            query = query.contains('tags', [tag])
        }
        if (q) {
            const like = `%${q}%`
            query = query.or(`title.ilike.${like},url.ilike.${like},domain.ilike.${like}`)
        }
        const columns = [
            'added_at',
            'last_seen_at',
            'title',
            'domain',
        ].includes(sort) ? sort : 'added_at';
        query = query.order(columns, { ascending: order === 'asc'
     });
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
        const { data, error, count } = await query
         if (error) {
             throw error
         }
         const items = (data || []).map((item) => ({
             id: item.id,
             title: item.title,
             url: item.url,
             domain: item.domain,
             description: item.description,
             ogImageUrl: item.og_image_url,
             faviconUrl: item.favicon_url,
             tags: item.tags,
             source: {
                 gmailDraftId: item.source.gmail_draft_id,
                 gmailMessageId: item.source.gmail_message_id,
                 createdAt: item.source.created_at,
             },
             status: item.status,
             addedAt: item.added_at,
             lastSeenAt: item.last_seen_at,
             userId: item.user_id,
         }))
         return { items, totalCount: count || 0, page, pageSize }
    },

// get bookmark by id
     async getBookmarkById(bookmarkId: string): Promise<Bookmark | null> {
        const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('id', bookmarkId).single();
        if (error ||!data) {
            return  null
        }

        return {
            id: data.id,
            title: data.title,
            url: data.url,
            domain: data.domain,
            description: data.description,
            ogImageUrl: data.og_image_url,
            faviconUrl: data.favicon_url,
            tags: data.tags,
            source: {
                gmailDraftId: data.source.gmail_draft_id,
                gmailMessageId: data.source.gmail_message_id,
                createdAt: data.source.created_at,
            },
            status: data.status,
            addedAt: data.added_at,
            lastSeenAt: data.last_seen_at,
            userId: data.user_id,
        };
    },

// set token
     async setToken(sessionId: string, rec: any): Promise<void> {
        const { error } = await supabase
            .from('oauth_tokens').upsert({
                session_id: sessionId,
                user_id: rec.userId,
                access_token: rec.accessToken,
                refresh_token: rec.refreshToken,
                expires_at: rec.expiry_date,
            });
        if (error) {
            throw new Error(`Failed to set token: ${error.message}`);
        }
    },

// get token
     async getToken(sessionId: string): Promise<Token | null> {
        const { data, error } = await supabase
            .from('oauth_tokens')
            .select('*')
            .eq('sessionId', sessionId).single();
        if (error || !data) {
            return  null
        }
        return {
            userId: data.user_id,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: +data.expires_at,
        };
    },

// set session
     async setSession(sessionId: string, userId: string): Promise<void> {
        const {error} =await supabase
            .from('sessions')
            .insert({ session_id: sessionId, user_id: userId });
        if (error) {
            throw new Error(`Failed to set session: ${error.message}`);
        }
    },

// get session
     async getSession(sessionId: string): Promise<string | null> {
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('sessionId', sessionId).single();
        return data?.user_id || null;
    }
};

