// These ten short clips are kept below 2 MiB by the media asset budget test.
// Static Assets does not serve byte ranges, which browsers need for seeking.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!/^\/assets\/concepts\/stage-[1-5]\.(mp4|webm)$/.test(path)
        || !['GET', 'HEAD'].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }

    const assetHeaders = new Headers(request.headers);
    assetHeaders.delete('Range');
    assetHeaders.delete('If-Range');
    assetHeaders.set('Accept-Encoding', 'identity');
    const asset = await env.ASSETS.fetch(new Request(request, { method: 'GET', headers: assetHeaders }));
    if (asset.status !== 200) {
      return request.method === 'HEAD' ? new Response(null, asset) : asset;
    }

    const bytes = await asset.arrayBuffer();
    const size = bytes.byteLength;
    const headers = new Headers(asset.headers);
    headers.delete('Content-Encoding');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(size));
    if (request.method === 'HEAD') return new Response(null, { headers });

    const validator = request.headers.get('If-Range');
    const matches = !validator || (!validator.startsWith('W/')
      && (validator === headers.get('ETag') || validator === headers.get('Last-Modified')));
    const range = matches && request.headers.get('Range')?.match(/^bytes=(\d*)-(\d*)$/);
    if (!range || (!range[1] && !range[2])) return new Response(bytes, { headers });

    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end || (!range[1] && Number(range[2]) === 0)) {
      headers.set('Content-Range', `bytes */${size}`);
      headers.set('Content-Length', '0');
      return new Response(null, { status: 416, headers });
    }

    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  },
};
