const DESKTOP_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

export function desktopOptionsResponse() {
  return new Response(null, { status: 204, headers: DESKTOP_HEADERS });
}

export function withDesktopCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(DESKTOP_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
