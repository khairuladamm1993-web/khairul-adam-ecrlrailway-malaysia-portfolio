const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('assets/asia-map-ui.css','utf8'),map=fs.readFileSync('assets/map-gateway.js','utf8'),asia=fs.readFileSync('assets/asia-map-ui.js','utf8');
test('preserves openrailwaymap tiles',()=>assert(asia.includes('tiles.openrailwaymap.org/standard')));
test('hides asset listing and toolbar visually without removing protected internal controls',()=>{assert(css.includes('.map-toolbar,.map-side,.map-identity-row'));assert(map.includes('data-map-results'));assert(map.includes('data-map-detail'));});
test('station tap has popup without automatic opening',()=>{assert(map.includes('marker.bindPopup?.('));assert(map.includes('mrs10-station-popup'));assert(!map.includes('marker.openPopup()'));});
test('existing confidence and owner paths retained',()=>{assert(map.includes('RailwayOwnerMap'));assert(map.includes('locationConfidence'));});
test('glass controls retain adequate tap height and reduced motion',()=>{assert(css.includes('backdrop-filter:blur(12px)'));assert(css.includes('min-height:44px'));assert(css.includes('prefers-reduced-motion:reduce'))});

test('R1 prevents keyboard access to hidden controls',()=>{assert(map.includes('element.inert=!owner'));assert(map.includes("setAttribute('aria-hidden','true')"));});
test('R1 refreshes owner controls on access change',()=>assert(map.includes('if(instance===state){updateAccessibleControls();')));
test('R1 supports dark glass and fallback',()=>{assert(css.includes(':root[data-theme="dark"] .asia-map-switch'));assert(css.includes('@supports not ((backdrop-filter:'));});
test('R1 popup limits public source to public reference',()=>{assert(map.includes('Public ECRL reference source'));assert(map.includes('Project location record · source not publicly linked'));});
test('R1 guards late Malaysia station results',()=>{assert(asia.includes("if(state.country!=='malaysia'||controller.signal.aborted"));assert(asia.includes('state.osmAbort?.abort();state.osmVersion++;'));});
