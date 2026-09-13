import type { RequestHandler } from './$types';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0f172a"/><path d="M17 17h10v23h20v8H17z" fill="#d7f36b"/><circle cx="44" cy="24" r="5" fill="#d7f36b"/></svg>`;

export const GET: RequestHandler = () => new Response(favicon, {
  headers: {
    'cache-control': 'public, max-age=86400',
    'content-type': 'image/svg+xml; charset=utf-8'
  }
});
