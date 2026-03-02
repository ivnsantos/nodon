export const config = {
  runtime: 'edge',
}

const isAllowedHost = (hostname) => {
  if (!hostname) return false
  const h = hostname.toLowerCase()

  // Allow Cloudflare R2 public domains
  if (h.endsWith('.r2.dev') || h === 'r2.dev') return true

  // Allow explicit host via env if needed
  const extra = (process.env.ALLOWED_IMAGE_HOSTS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (extra.includes(h)) return true

  return false
}

export default async function handler(request) {
  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    const url = new URL(request.url)
    const target = url.searchParams.get('url')

    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    let targetUrl
    try {
      targetUrl = new URL(target)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid url' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Invalid protocol' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    if (!isAllowedHost(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: 'GET',
      // Do not forward cookies/auth; this is for public assets
      headers: {
        'User-Agent': 'NodonImageProxy/1.0',
      },
    })

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: 'Upstream error', status: upstream.status }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      })
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache aggressively since images are immutable by key
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || 'Unexpected error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
