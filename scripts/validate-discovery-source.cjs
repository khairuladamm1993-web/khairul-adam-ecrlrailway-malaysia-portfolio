#!/usr/bin/env node
'use strict';
/**
 * Public-source quality gate for MR-S10 Railway Discovery.
 * Generic integrity checks only; this is not a deployment or source-ingestion job.
 * No environment credentials, network connections or private project logic.
 */
const fs = require('node:fs');
const path = require('node:path');

const baseMinimum = Object.freeze({ facilities: 14, relationships: 6, sectors: 11 });
const requiredSource = ['url', 'publisher', 'kind'];
const requiredFacility = [
  'id', 'name', 'objectType', 'sourceId', 'sourceURL', 'sourceDate',
  'geometryVerificationStatus', 'operationalStatus', 'confidence',
  'trackRelationship', 'missingData'
];
const requiredRelation = [
  'id', 'from', 'to', 'type', 'sourceURL', 'sourceDate',
  'geometryVerificationStatus', 'operationalStatus', 'confidence',
  'trackRelationship', 'missingData'
];

function validateCatalogue(data, options = {}) {
  const errors = [];
  const reject = (condition, message) => { if (!condition) errors.push(message); };
  const string = value => typeof value === 'string' && value.trim().length > 0;
  const https = value => string(value) && /^https:\/\/[^/\s]+(?:\/|$)/i.test(value);
  const record = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
  const sources = record(data && data.sources) ? data.sources : {};
  const facilities = Array.isArray(data && data.facilities) ? data.facilities : [];
  const relations = Array.isArray(data && data.relationships) ? data.relationships : [];
  const sectors = Array.isArray(data && data.sectors) ? data.sectors : [];
  const minimum = options.minimum || baseMinimum;
  reject(record(data), 'Katalog: objek utama tidak sah');
  reject(string(data && data.schemaVersion), 'Katalog: schemaVersion tiada');
  reject(string(data && data.observedAt), 'Katalog: observedAt tiada');
  reject(Object.keys(sources).length > 0, 'Katalog: pendaftaran sumber kosong');
  for (const [section, entries] of [['facilities', facilities], ['relationships', relations], ['sectors', sectors]]) {
    reject(Array.isArray(data && data[section]), section + ': bukan senarai');
    reject(entries.length >= (minimum[section] ?? 0), section + ': bilangan berkurang daripada checkpoint minimum');
  }
  const sourceUrls = new Set();
  for (const [id, entry] of Object.entries(sources)) {
    reject(record(entry), 'Sumber ' + id + ': bukan rekod');
    for (const field of requiredSource) reject(string(entry && entry[field]), 'Sumber ' + id + ': ' + field + ' tiada');
    reject(https(entry && entry.url), 'Sumber ' + id + ': URL mesti HTTPS');
    if (https(entry && entry.url)) sourceUrls.add(entry.url);
  }
  const ids = new Set();
  const checkID = (id, section) => {
    reject(string(id), section + ': ID tiada');
    if (string(id)) {
      reject(!ids.has(id), section + ': ID berganda ' + id);
      ids.add(id);
    }
  };
  const facilityIds = new Set();
  for (const f of facilities) {
    reject(record(f), 'Kemudahan: rekod tidak sah');
    if (!record(f)) continue;
    checkID(f.id, 'Kemudahan');
    if (string(f.id)) facilityIds.add(f.id);
    for (const field of requiredFacility) {
      if (field === 'missingData') reject(Array.isArray(f.missingData), f.id + ': missingData mesti senarai');
      else reject(string(f[field]), f.id + ': medan wajib tiada ' + field);
    }
    reject(https(f.sourceURL), f.id + ': URL rujukan tidak selamat');
    reject(Boolean(sources[f.sourceId]), f.id + ': sourceId tidak didaftarkan');
    reject(sourceUrls.has(f.sourceURL), f.id + ': pautan tiada dalam daftar sumber');
    reject(f.geometry === null, f.id + ': geometri tidak boleh diandaikan');
  }
  for (const r of relations) {
    reject(record(r), 'Hubungan: rekod tidak sah');
    if (!record(r)) continue;
    checkID(r.id, 'Hubungan');
    for (const field of requiredRelation) {
      if (field === 'missingData') reject(Array.isArray(r.missingData), r.id + ': missingData mesti senarai');
      else reject(string(r[field]), r.id + ': medan wajib tiada ' + field);
    }
    reject(facilityIds.has(r.from), r.id + ': sumber hubungan tidak wujud');
    reject(facilityIds.has(r.to), r.id + ': destinasi hubungan tidak wujud');
    reject(r.from !== r.to, r.id + ': hubungan kepada lokasi sendiri');
    reject(https(r.sourceURL) && sourceUrls.has(r.sourceURL), r.id + ': sumber hubungan tidak didaftarkan');
    reject(r.type === 'DOCUMENTARY_RELATION_NOT_GEOMETRY', r.id + ': hubungan tidak boleh ditukar menjadi rail link tanpa bukti');
    reject(r.geometry === null, r.id + ': geometri hubungan tidak boleh direka');
  }
  for (const s of sectors) {
    reject(record(s), 'Industri: rekod tidak sah');
    if (!record(s)) continue;
    checkID(s.id, 'Industri');
    for (const field of ['id','name','benefit','confidence','sourceURL','sourceDate'])
      reject(string(s[field]), s.id + ': medan wajib tiada ' + field);
    for (const field of ['constraints','infrastructureGaps','dataRisks','furtherStudy'])
      reject(Array.isArray(s[field]), s.id + ': ' + field + ' mesti senarai');
    reject(https(s.sourceURL) && sourceUrls.has(s.sourceURL), s.id + ': sumber industri tidak didaftarkan');
  }
  return {
    ok: errors.length === 0,
    errors,
    summary: {
      sourceCount: Object.keys(sources).length,
      facilities: facilities.length, relationships: relations.length, sectors: sectors.length,
      reviewedAt: string(data && data.observedAt) ? data.observedAt : null
    }
  };
}

if (require.main === module) {
  const file = path.join(__dirname, '..', 'data', 'openmr-r3', 'intelligence.json');
  try {
    const result = validateCatalogue(JSON.parse(fs.readFileSync(file, 'utf8')));
    process.stdout.write(JSON.stringify({ gate: 'MR-S10 Railway Discovery source QA', ...result }, null, 2) + '\n');
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write('Source QA failed: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
module.exports = { validateCatalogue };
