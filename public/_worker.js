// Cloudflare Pages advanced mode.
// Serves static assets as-is; any path that would 404 is answered with
// index.html at status 200 so client-side routes (React Router) resolve
// properly for crawlers and direct links.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    url.pathname = '/index.html';
    url.search = '';

    const index = await env.ASSETS.fetch(new Request(url.toString(), request));
    if (index.status !== 200) return response;

    const headers = new Headers(index.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'no-cache');

    return new Response(index.body, { status: 200, headers });
  },
};
