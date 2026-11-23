'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const expected=process.env.P01_EXPECTED_SHA;
if(expected&&sha!==expected)throw Error('P01_PREVIEW_SOURCE_SHA_MISMATCH');
if(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}))
 throw Error('P01_PREVIEW_TRACKED_SOURCE_DIRTY');
if(!process.argv[2])throw Error('P01_PREVIEW_OUTPUT_REQUIRED');
const out=path.resolve(process.argv[2]);
if(fs.existsSync(out))throw Error('P01_PREVIEW_OUTPUT_MUST_BE_FRESH');

const policy=fs.readFileSync(path.join(root,'vercel.json'));
const {headers}=JSON.parse(policy);
const routes=headers.map(({source,headers})=>{
 if(source!=='/(.*)'&&!/^\/[a-z0-9-]+\.html$/.test(source))throw Error('P01_PREVIEW_UNSUPPORTED_HEADER_SOURCE:'+source);
 return {
  src:source==='/(.*)'?'^/.*$':'^'+source.replace('.','\\.')+'$',
  headers:Object.fromEntries(headers.map(({key,value})=>[key,value])),
  continue:true
 };
});
const output=path.join(out,'.vercel','output');
const staticRoot=path.join(output,'static');
const env={...process.env,VERCEL_GIT_COMMIT_SHA:sha,VERCEL_ENV:'preview'};
delete env.VERCEL_DEPLOYMENT_ID;
delete env.VERCEL_URL;
execFileSync(process.execPath,[path.join(root,'scripts','build-p01-map-candidate.cjs'),staticRoot],{cwd:root,env,stdio:'inherit'});
fs.unlinkSync(path.join(staticRoot,'data','owner-project-registry.json'));

fs.writeFileSync(path.join(out,'vercel.json'),policy);
fs.writeFileSync(path.join(output,'config.json'),JSON.stringify({version:3,routes:[...routes,{handle:'filesystem'}]},null,2)+'\n');
const checksum=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function collect(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>{
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())return collect(file);
  if(!entry.isFile())throw Error('P01_PREVIEW_UNEXPECTED_FILE_TYPE:'+file);
  return [{path:path.relative(out,file).split(path.sep).join('/'),sha256:checksum(file)}];
 });
}
fs.writeFileSync(path.join(out,'release-manifest.json'),JSON.stringify({
 version:1,sourceSha:sha,target:'preview',files:collect(out)
},null,2)+'\n');
console.log('P01_PROTECTED_PREVIEW_PACKAGE_READY',sha,out);
