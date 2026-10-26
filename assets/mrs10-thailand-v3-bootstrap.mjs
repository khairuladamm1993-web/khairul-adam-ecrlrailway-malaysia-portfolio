/* MR-S10 Thailand V3 MapLibre v6 ESM bootstrap. No implicit main/KTMB state. */
import * as maplibregl from './thailand-v3-vendor/maplibre-gl-6.13.0.mjs';
import './mrs10-thailand-v3-model.js';
import './mrs10-thailand-v3-gis.js';
window.maplibregl=maplibregl;
await import('./mrs10-thailand-v3-view.js');
