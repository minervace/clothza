// Cloudflare Pages Function — SPA fallback.
// Serves built assets normally; any path without a file is answered with
// index.html at status 200 so React Router can resolve client-side routes.
// (Git-connected Pages projects ignore public/_worker.js, hence this file.)

export async function onRequest(context) {
  const response = await context.next();
  if (response.status !== 404) return response;

  const url = new URL(context.request.url);
  url.pathname = '/index.html';
  url.search = '';

  const index = await context.env.ASSETS.fetch(url.toString());
  if (index.status !== 200) return response;

  const headers = new Headers(index.headers);
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-cache');

  return new Response(index.body, { status: 200, headers });
}
