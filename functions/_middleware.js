// Middleware to fix Angular lazy-loaded chunk paths and handle SPA routing
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // If requesting a .js/.css/.map file from a nested route, fetch from root
  if (path.match(/^\/[^\/]+\/.*\.(js|css|map)$/)) {
    const filename = path.split('/').pop();
    const assetUrl = new URL('/' + filename, url.origin);
    return context.env.ASSETS.fetch(assetUrl);
  }

  // Try to fetch the requested asset
  const response = await context.next();

  // If asset exists, return it
  if (response.status !== 404) {
    return response;
  }

  // For 404s on non-asset routes, serve index.html (SPA fallback)
  if (!path.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|map|json)$/)) {
    return context.env.ASSETS.fetch(new URL('/index.html', url.origin));
  }

  // Otherwise return the 404
  return response;
}
