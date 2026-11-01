// Test-only Preview-cookie transport fixture. No Supabase user, role or Auth response is mocked.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'dist-complete-map');
http.createServer((req,res)=>{try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/')name='/index.html';
 if(name.startsWith('/data/unified-complete/')&&!/(?:^|;\s*)p01-preview-transport=allowed(?:;|$)/.test(req.headers.cookie||'')){res.writeHead(401,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"PREVIEW_TRANSPORT_COOKIE_REQUIRED"}');return;}
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile())throw Error('NOT_FOUND');
 const mime={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.geojson':'application/geo+json'};
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 if(name==='/index.html'||name==='/unified-map-v8.html')res.setHeader('Set-Cookie','p01-preview-transport=allowed; Path=/; HttpOnly; SameSite=Lax');
 res.writeHead(200);fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(404);res.end('NOT_FOUND');}}).listen(8765,'127.0.0.1',()=>console.log('P01_PREVIEW_TRANSPORT_FIXTURE_READY'));
