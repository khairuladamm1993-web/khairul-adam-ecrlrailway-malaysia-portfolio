'use strict';
const {createHandler,providerFromEnv}=require('../server/auth-r2/core.cjs');
module.exports=async function handler(req,res){
 const origin=process.env.P01_R2_ORIGIN||(process.env.VERCEL_URL?'https://'+process.env.VERCEL_URL:null);
 const key=Buffer.from(process.env.P01_R2_COOKIE_KEY||'','base64');
 const handle=createHandler({provider:providerFromEnv(process.env),key,origin:origin||'https://invalid.example',enabled:process.env.P01_R2_AUTH_ENABLED==='true'&&Boolean(origin)&&key.length===32});
 const result=await handle(req);res.statusCode=result.status;
 for(const [k,v] of Object.entries(result.headers))res.setHeader(k,v);
 if(result.cookies?.length)res.setHeader('Set-Cookie',result.cookies);
 if(result.location)res.setHeader('Location',result.location);
 res.end(JSON.stringify(result.body));
};
