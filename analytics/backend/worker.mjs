// Deployment transport only. The tested collector is imported unchanged.
import {collect} from '../original/analytics/collector.mjs';
const frontend = 'https://khairuladamm1993-web.github.io';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Permissions-Policy':'geolocation=()', 'Vary':'Origin'};
    const reply = status => new Response(null, {status, headers});
    if (url.pathname !== '/api/anonymous-counts' || url.search) return reply(404);
    if (request.headers.get('Origin') !== frontend) return reply(403);
    headers['Access-Control-Allow-Origin'] = frontend;
    if (request.method === 'OPTIONS') {
      const requested = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
      if (request.headers.get('Access-Control-Request-Method') !== 'POST' || requested.some(h=>!['content-type','dnt','sec-gpc'].includes(h))) return reply(403);
      headers['Access-Control-Allow-Methods'] = 'POST';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, DNT, Sec-GPC';
      return reply(204);
    }
    if (request.method !== 'POST') return reply(405);
    // Only forward collector-required headers. Never forward cookies or credentials.
    // Normalize origin only AFTER verifying the public frontend origin above.
    const internalHeaders = new Headers({Origin:url.origin});
    for (const name of ['Content-Type','Content-Length','DNT','Sec-GPC']) {
      const value=request.headers.get(name); if(value!==null) internalHeaders.set(name,value);
    }
    const internal = new Request(url, {method:'POST',headers:internalHeaders,body:request.body,duplex:'half'});
    // The original collector accesses only cf.country, with its original fallback.
    Object.defineProperty(internal, 'cf', {get:()=>request.cf});
    const result = await collect(internal, env);
    return new Response(null, {status:result.status,headers});
  }
};
