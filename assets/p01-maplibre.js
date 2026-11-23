// Keep the existing station catalogue available if the renderer CDN is unavailable.
const maplibre=await import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs').catch(()=>null);
// Use an origin-local module worker entry to avoid the CDN blob-worker fallback on WebKit.
if(maplibre)maplibre.setWorkerUrl(new URL('./p01-maplibre-worker.js',import.meta.url).href);
export default maplibre;
