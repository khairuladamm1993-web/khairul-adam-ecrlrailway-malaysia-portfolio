const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('maintenance preview is allowlisted by safe build script',()=>{
 const build=read('scripts/build-production.py');
 assert.match(build,/"public-maintenance-preview\.html"/);
 assert.match(build,/Broken production reference/);
 assert.match(build,/forbidden_assets/);
});

test('Owner dashboard has a visible preview entry, but no misleading active toggle',()=>{
 const page=read('owner-command-center.html');
 assert.match(page,/id="dashboard" hidden/);
 assert.match(page,/id="maintenance-panel"/);
 assert.match(page,/href="public-maintenance-preview\.html"/);
 assert.match(page,/INACTIVE · NOT DEPLOYED/);
 assert.doesNotMatch(page,/id="maintenance-activate"/);
});

test('Owner command center fail-closed gate remains tied to verified access state',()=>{
 const controller=read('assets/owner-command-center.js');
 const access=read('assets/access.js');
 assert.match(controller,/A&&A\.canAdmin&&A\.status==='authenticated'/);
 assert.match(controller,/dashboard\.hidden=true/);
 assert.match(access,/c\.auth\.getUser\(liveSession\.access_token\)/);
 assert.match(access,/c\.rpc\('account_role'\)/);
});

test('maintenance teaser is informational, not a fake rail alignment or auth bypass',()=>{
 const teaser=read('public-maintenance-preview.html');
 assert.match(teaser,/China/i);
 assert.match(teaser,/Thailand/i);
 assert.match(teaser,/Malaysia/i);
 assert.match(teaser,/Singapore/i);
 assert.doesNotMatch(teaser,/localStorage\.setItem\(['"]maintenance/i);
});
