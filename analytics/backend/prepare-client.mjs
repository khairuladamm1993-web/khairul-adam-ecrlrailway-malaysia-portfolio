// Transport substitution only; preserve the audited original file and metric logic.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source=readFileSync(new URL('../original/dist/analytics.js',import.meta.url),'utf8');
if(createHash('sha256').update(source).digest('hex')!=='34b315a854e35a81e62af7ec57cd99846ed3559e3c918e50464b5d3d4b69ba6c')throw Error('Original client has changed; stop and review.');
const url=new URL(process.argv[2]);
if(url.protocol!=='https:'||!url.hostname.endsWith('.workers.dev')||url.username||url.password||url.port||url.search||url.hash||url.pathname!=='/api/anonymous-counts')throw Error('Supply the actual deployed HTTPS workers.dev collection endpoint.');
const output=source.replace("const endpoint='/api/anonymous-counts'",'const endpoint='+JSON.stringify(url.href)).replace("credentials:'same-origin'","credentials:'omit'");
writeFileSync(new URL('./analytics-pages.js',import.meta.url),output);
console.log('Prepared analytics-pages.js. No HTML or live page was modified.');
