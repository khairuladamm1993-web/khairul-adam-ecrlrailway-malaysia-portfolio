'use strict';
// Local test harness only. There is deliberately no deployed mock-auth route.
const https=require('node:https'),fs=require('node:fs'),path=require('node:path');
const {fixture}=require('./auth-private-r2-fixture.cjs');
const port=8767,origin='https://127.0.0.1:'+port;let f=fixture(origin);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
https.createServer({key:fs.readFileSync('/tmp/p01-r2-test-key.pem'),cert:fs.readFileSync('/tmp/p01-r2-test-cert.pem')},async(req,res)=>{
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>3200000){res.writeHead(413);res.end();return}}let body;try{body=raw?JSON.parse(raw):{}}catch{res.writeHead(400);res.end();return}
 const url=new URL(req.url,origin);
 if(url.pathname==='/__test__/reset'){f=fixture(origin);res.end('{}');return}
 if(url.pathname==='/__test__/code'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({otp:f.readOtp(body.email),factorId:[...f.factors.keys()].at(-1),mfa:[...f.factors.values()].at(-1)?.code}));return}
 if(url.pathname==='/api/auth-r2'){
  const r=await f.handler({...req,url:req.url,method:req.method,headers:req.headers,body});res.writeHead(r.status,{...r.headers,...(r.cookies?.length?{'Set-Cookie':r.cookies}:{}),...(r.location?{Location:r.location}:{})});res.end(JSON.stringify(r.body));return
 }
 const target=path.resolve('dist-auth-r2','.'+url.pathname);if(!target.startsWith(path.resolve('dist-auth-r2')+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(target).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('R2_HTTPS_MOCK_TEST_SERVER_READY'));
