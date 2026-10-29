/* P01 ECRL freight locality markers. Port / PETRONAS area indicators are
 * public approximate area references, NOT proven ECRL spur line endpoints.
 * Purple circles = port, amber square = OSM Kerteh yard landuse reference.
 * Never become train movement nodes or route coordinates. */
(function(root){'use strict';
const P=root.MRS10ECRLPortReferences,K=root.MRS10ECRLKertehFreight,G=root.MRS10ECRLGISV1;
if(!P||!K||!G)throw Error('ECRL_FREIGHT_REFERENCE_SOURCES_MISSING');
const originals=[
 ...G.facilities.filter(a=>['ecrl-port-northport','ecrl-port-westports'].includes(a.assetId)),
 ...P.assets.filter(a=>['ecrl-port-kemaman','ecrl-port-kuantan'].includes(a.assetId)),
 ...K.assets.filter(a=>a.assetId==='ecrl-yard-kerteh-petronas')
];
const SOURCES={...G.sources,...P.sources,...K.sources};
const ASSETS=Object.freeze(originals.filter(a=>Array.isArray(a.referencePoint)&&a.referencePoint.length===2).map(a=>Object.freeze({
 id:a.assetId,name:a.officialName,point:Object.freeze([...a.referencePoint]),
 code:a.assetId==='ecrl-yard-kerteh-petronas'?'KERTEH_YARD':a.assetId.replace('ecrl-port-','').toUpperCase(),
 category:a.assetId==='ecrl-yard-kerteh-petronas'?'YARD':'PORT',
 section:a.section,assetStatus:a.assetStatus,operator:a.operatorName||null,
 referenceKind:a.referenceKind,referenceAccuracy:a.referenceAccuracy,
 terminalPointVerified:false,loadingBayVerified:false,railLinkVerified:false,
 sourceLinks:Object.freeze((a.sourceIds||[]).map(id=>({id,url:SOURCES[id]?.url||null})).filter(x=>x.url))
})));
if(ASSETS.length!==5||new Set(ASSETS.map(x=>x.id)).size!==5)throw Error('ECRL_FREIGHT_REFERENCE_COUNT_MISMATCH');
const SRC='mrs10-lab-public-freight-areas',PORT='mrs10-lab-port-purple',YARD='mrs10-lab-kerteh-amber',INNER='mrs10-lab-kerteh-inner',LABEL='mrs10-lab-freight-label';
const features={type:'FeatureCollection',features:ASSETS.map(a=>({type:'Feature',properties:{assetId:a.id,name:a.name,kind:a.category,geometryVerified:false,trackEndVerified:false},geometry:{type:'Point',coordinates:a.point}}))};
const T={
 ms:{heading:'Port / Yard Intelligence',warning:'Penanda kawasan rujukan sahaja. Bukan hujung rel, loading bay atau titik turnout ECRL.',kind:'Jenis',port:'Pelabuhan',yard:'Kawasan yard rel sejarah',status:'Status',section:'Seksyen',operator:'Pengendali / rujukan',geometry:'End Lane / sambungan fizikal',missing:'BELUM DISAHKAN',reference:'Sumber',focus:'Fokus aset'},
 en:{heading:'Port / Yard Intelligence',warning:'Area-reference marker only, not an ECRL rail end, loading bay or turnout.',kind:'Type',port:'Port',yard:'Historic railway yard area',status:'Status',section:'Section',operator:'Operator / reference',geometry:'End Lane / physical railway connection',missing:'UNVERIFIED',reference:'Sources',focus:'Focus asset'},
 zh:{heading:'港口／货场信息',warning:'仅表示参考区域，不代表 ECRL 铁路终点、装卸区或道岔。',kind:'类型',port:'港口',yard:'历史铁路货场区域',status:'状态',section:'区段',operator:'运营方／来源',geometry:'终端线／实体铁路连接',missing:'尚未核实',reference:'来源',focus:'聚焦资产'},
 th:{heading:'ข้อมูลท่าเรือและลานสินค้า',warning:'หมุดอ้างอิงพื้นที่เท่านั้น ไม่ใช่ปลายราง จุดขนถ่าย หรือประแจ ECRL',kind:'ประเภท',port:'ท่าเรือ',yard:'พื้นที่ลานรถไฟประวัติศาสตร์',status:'สถานะ',section:'ช่วง',operator:'ผู้ดำเนินการ / อ้างอิง',geometry:'ปลายราง / การเชื่อมต่อจริง',missing:'ยังไม่ยืนยัน',reference:'แหล่งที่มา',focus:'ดูจุด'}
};
let map=null,installed=false,locale='ms',selected=null,bound=false;
const $=(tag,v,c)=>{const e=document.createElement(tag);if(v!==undefined&&v!==null)e.textContent=String(v);if(c)e.className=c;return e};
function install(m){
 map=m;if(!m?.getStyle?.())return false;
 try{
 if(!m.getSource(SRC))m.addSource(SRC,{type:'geojson',data:features});
 if(!m.getLayer(PORT))m.addLayer({id:PORT,type:'circle',source:SRC,filter:['==',['get','kind'],'PORT'],paint:{'circle-radius':10,'circle-color':'#f7f3ff','circle-stroke-color':'#7c3aed','circle-stroke-width':3}});
 if(!m.getLayer(YARD))m.addLayer({id:YARD,type:'symbol',source:SRC,filter:['==',['get','kind'],'YARD'],layout:{'icon-image':'','text-field':'■','text-size':27,'text-allow-overlap':true},paint:{'text-color':'#d38b21','text-halo-color':'#fff4d6','text-halo-width':1}});
 if(!m.getLayer(INNER))m.addLayer({id:INNER,type:'circle',source:SRC,filter:['==',['get','kind'],'YARD'],paint:{'circle-radius':3,'circle-color':'#ffe8a3','circle-stroke-color':'#91520d','circle-stroke-width':1}});
 if(!m.getLayer(LABEL))m.addLayer({id:LABEL,type:'symbol',source:SRC,minzoom:8.8,layout:{'text-field':['get','name'],'text-size':11,'text-offset':[0,2.2],'text-allow-overlap':false},paint:{'text-color':'#342c3f','text-halo-color':'#ffffff','text-halo-width':2}});
 if(!bound){for(const layer of [PORT,YARD,INNER]){m.on('click',layer,e=>{const id=e.features?.[0]?.properties?.assetId;if(id)select(id)});m.on('mouseenter',layer,()=>{m.getCanvas().style.cursor='pointer'});m.on('mouseleave',layer,()=>{m.getCanvas().style.cursor=''})}bound=true}
 installed=true;return true;
 }catch(e){installed=false;return false}
}
function focus(id){const a=ASSETS.find(x=>x.id===id);if(a&&map)map.flyTo({center:a.point,zoom:11,duration:400})}
function select(id,fly=false){const a=ASSETS.find(x=>x.id===id);if(!a)return false;selected=id;render();if(fly)focus(id);return true}
function setLocale(l){locale=T[l]?l:'ms';render()}
function render(){
 const host=document.getElementById('lab-freight-intelligence');if(!host)return;
 host.replaceChildren();const t=T[locale],a=ASSETS.find(x=>x.id===selected);
 const header=$('h2',t.heading);host.append(header);
 const selector=$('select');selector.id='lab-freight-select';selector.setAttribute('aria-label',t.heading);
 const placeholder=$('option','— Pilih pelabuhan / yard —');placeholder.value='';selector.append(placeholder);
 for(const x of ASSETS){const op=$('option',x.name);op.value=x.id;selector.append(op)}
 selector.value=a?.id||'';selector.onchange=()=>select(selector.value,true);host.append(selector);
 if(!a){host.append($('p',t.warning,'lab-trail-note'));return}
 host.append($('h3',a.name),$('p',t.warning,'lab-warning'));
 const grid=$('dl',null,'lab-station-grid');
 for(const [key,val] of [[t.kind,a.category==='PORT'?t.port:t.yard],[t.section,a.section],[t.status,a.assetStatus],[t.operator,a.operator||t.missing],[t.geometry,t.missing]])grid.append($('dt',key),$('dd',val));
 host.append(grid);
 const links=$('details');links.append($('summary',t.reference+' · '+a.sourceLinks.length));
 for(const x of a.sourceLinks){const u=$('a',x.id+' · '+x.url);u.href=x.url;u.target='_blank';u.rel='noopener noreferrer';links.append(u)}
 host.append(links);
 const button=$('button',t.focus+' · '+a.name);button.type='button';button.onclick=()=>focus(a.id);host.append(button);
}
function connect(m){map=m;const retry=()=>install(m);m.on('style.load',retry);m.on('load',retry);m.on('styledata',retry);retry();render()}
const api=Object.freeze({connect,select,focus,setLocale,assets:ASSETS,snapshot:()=>({count:ASSETS.length,ports:ASSETS.filter(x=>x.category==='PORT').length,yards:ASSETS.filter(x=>x.category==='YARD').length,selected,installed,trainMovementEligible:false,physicalTerminalVerified:false})});
root.MRS10ECRLFreightAreaMap=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
