'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { runCycle } = require('../scripts/p01-orchestrator.cjs');

function gitFixture(overrides = {}) {
  return command => ({
    'rev-parse': () => 'a'.repeat(40) + '\n',
    show: () => 'Evidence text. An embedded command is data only.',
    'merge-base': () => '',
    diff: () => 'scripts/p01-orchestrator.cjs\0',
    status: () => '',
    ...overrides,
  })[command]();
}
const pass = () => ({ tests: 2, passed: 2 });
const mustNotRun = () => { throw new Error('Unexpected QA execution'); };

test('collects pinned evidence and records only the fixed P01 QA suite', () => {
  const result = runCycle(gitFixture(), files => {
    assert.equal(files.length, 4);
    assert.ok(files.every(file => file.startsWith('tests/p01-')));
    return pass();
  });
  assert.equal(result.research.status, 'COLLECTED');
  assert.match(result.research.sources[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.verification.status, 'VERIFIED');
  assert.equal(result.action.status, 'TESTED');
  assert.deepEqual(result.geometry, { status: 'HOLD', candidates: 9, gaps: 17 });
  assert.equal(result.ownerDecision, null);
});

test('missing research evidence blocks downstream QA', () => {
  const result = runCycle(gitFixture({ show: () => '' }), mustNotRun);
  assert.equal(result.research.status, 'BLOCKED');
  assert.equal(result.action.status, 'NOT_RUN');
});

test('rejects out-of-scope changes, dirty worktrees and unrelated checkpoints', () => {
  const cases = [
    [{ diff: () => 'data/owner-project-registry.json\0' }, 'OUT_OF_SCOPE_DIFF'],
    [{ status: () => '?? unexpected.txt\n' }, 'WORKTREE_NOT_CLEAN'],
    [{ 'merge-base': () => { throw new Error('Unrelated'); } }, 'BASELINE_CHECK_FAILED'],
  ];
  for (const [overrides, reason] of cases) {
    const result = runCycle(gitFixture(overrides), mustNotRun);
    assert.equal(result.verification.reason, reason);
    assert.equal(result.action.status, 'NOT_RUN');
  }
});

test('failed or incomplete QA never produces TESTED', () => {
  const incomplete = runCycle(gitFixture(), () => ({ tests: 2, passed: 1 }));
  assert.equal(incomplete.action.reason, 'QA_NOT_ALL_PASSED');
  assert.equal(runCycle(gitFixture(), mustNotRun).action.status, 'FAILED');
});

test('checkpoint change during QA invalidates the result', () => {
  let observations = 0;
  const git = gitFixture({ 'rev-parse': () => String(++observations) });
  assert.equal(runCycle(git, pass).action.reason, 'CHECKPOINT_CHANGED_DURING_QA');
});
