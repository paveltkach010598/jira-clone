const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

function getHeaders() {
    const raw = localStorage.getItem(`sb-kppjxvktndpmtwlpohnb-auth-token`)
    let token = ''
    try {
        token = raw ? JSON.parse(raw).access_token : ''
    } catch {
        token = ''
    }

    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: getHeaders()
    })
    return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    return res.json()
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body)
    })
    return res.json()
}

export async function apiDelete(path: string): Promise<void> {
    await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: 'DELETE',
        headers: getHeaders(),
    })
}