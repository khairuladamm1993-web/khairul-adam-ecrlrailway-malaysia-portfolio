const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('assets/asia-map-ui.css','utf8'),map=fs.readFileSync('assets/map-gateway.js','utf8'),asia=fs.readFileSync('assets/asia-map-ui.js','utf8');
test('preserves openrailwaymap tiles',()=>assert(asia.includes('tiles.openrailwaymap.org/standard')));
test('hides asset listing and toolbar visually without removing protected internal controls',()=>{assert(css.includes('.map-toolbar,.map-side,.map-identity-row'));assert(map.includes('data-map-results'));assert(map.includes('data-map-detail'));});
test('station tap has popup without automatic opening',()=>{assert(map.includes('marker.bindPopup?.('));assert(map.includes('mrs10-station-popup'));assert(!map.includes('marker.openPopup()'));});
test('existing confidence and owner paths retained',()=>{assert(map.includes('RailwayOwnerMap'));assert(map.includes('locationConfidence'));});
test('glass controls retain adequate tap height and reduced motion',()=>{assert(css.includes('backdrop-filter:blur(12px)'));assert(css.includes('min-height:44px'));assert(css.includes('prefers-reduced-motion:reduce'))});
