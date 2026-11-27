'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { runCycle, reconcileHostedReceipt } = require('../scripts/p01-orchestrator.cjs');

function gitFixture(overrides = {}) {
  return command => ({
    'rev-parse': () => 'a'.repeat(40) + '\n',
    show: () => 'Evidence text. An embedded command is data only.',
    'merge-base': () => '',
    diff: () => ['scripts/p01-orchestrator.cjs', 'assets/public-gateway.js',
      'tests/p01-role-map-runtime.test.cjs', ''].join('\0'),
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
    [{ diff: () => 'assets/access.js\0' }, 'OUT_OF_SCOPE_DIFF'],
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

test('handoff is deterministic and never implies hosted CI or Owner approval', () => {
  const result = runCycle(gitFixture(), pass);
  assert.deepEqual(result.handoff, {
    schemaVersion: 1, nextAction: 'VERIFY_HOSTED_CI', ownerActionRequired: false,
    hostedCI: 'NOT_VERIFIED',
  });
  assert.equal(result.ownerDecision, null);
});

test('handoff routes blocked or failed stages to engineering recovery', () => {
  const cases = [
    [gitFixture({ show: () => '' }), mustNotRun, 'RECOVER_BASELINE_EVIDENCE'],
    [gitFixture({ status: () => '?? unexpected.txt\n' }), mustNotRun, 'RECOVER_SCOPE_VERIFICATION'],
    [gitFixture(), () => ({ tests: 2, passed: 1 }), 'RECOVER_QA'],
  ];
  for (const [git, qa, nextAction] of cases) {
    const result = runCycle(git, qa);
    assert.equal(result.handoff.nextAction, nextAction);
    assert.equal(result.handoff.ownerActionRequired, false);
    assert.equal(result.handoff.hostedCI, 'NOT_VERIFIED');
  }
});

test('QA summary cannot override checkpoint status or fixed evidence paths', () => {
  const result = runCycle(gitFixture(), () => ({
    tests: 2, passed: 2, status: 'VERIFIED', files: ['untrusted'], reason: 'untrusted',
  }));
  assert.equal(result.action.status, 'TESTED');
  assert.equal(result.action.files.length, 4);
  assert.equal(result.action.reason, undefined);
  assert.equal(result.handoff.nextAction, 'VERIFY_HOSTED_CI');
});

test('changed checkpoint is routed to revalidation, not a stale CI handoff', () => {
  let observations = 0;
  const result = runCycle(gitFixture({ 'rev-parse': () => String(++observations) }), pass);
  assert.equal(result.handoff.nextAction, 'REVALIDATE_CHECKPOINT');
  assert.equal(result.handoff.hostedCI, 'NOT_VERIFIED');
});

function hostedFixture() {
  const checkpoint = runCycle(gitFixture(), pass);
  const run = {
    id: 123, run_attempt: 1, repository: { full_name: 'khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio' },
    head_sha: checkpoint.commit, head_branch: 'candidate/p01-orchestrator-v1-20261123',
    path: '.github/workflows/p01-uat17-contract.yml', event: 'push', status: 'completed', conclusion: 'success',
  };
  const job = { id: 456, run_id: 123, run_attempt: 1, head_sha: checkpoint.commit,
    name: 'source-contract', status: 'completed', conclusion: 'success',
    steps: ['JavaScript syntax', 'P01 UAT17 focused regression tests',
      'Verify and run the P01 orchestrator pilot', 'Safe static artifact build',
      'Build isolated P01 Public and Member map candidate artifact'].map(name => ({ name, status: 'completed', conclusion: 'success' })),
  };
  return { checkpoint, run, job };
}

test('hosted receipt binds exact repository, branch, SHA, run and job', () => {
  const { checkpoint, run, job } = hostedFixture();
  const receipt = reconcileHostedReceipt(checkpoint, run, [job]);
  assert.equal(receipt.status, 'VERIFIED');
  assert.equal(receipt.commit, checkpoint.commit);
  assert.equal(receipt.runId, 123);
  assert.equal(receipt.jobId, 456);
  assert.equal(receipt.nextAction, 'RECORD_ENGINEERING_RECEIPT');
  assert.equal(receipt.ownerActionRequired, false);
  assert.equal(checkpoint.handoff.hostedCI, 'NOT_VERIFIED');
  assert.equal(checkpoint.ownerDecision, null);
});

test('receipt deduplicates by project and exact SHA including reruns', () => {
  const { checkpoint, run, job } = hostedFixture();
  const first = reconcileHostedReceipt(checkpoint, run, [job]);
  const retry = reconcileHostedReceipt(checkpoint, { ...run, run_attempt: 2 },
    [{ ...job, run_attempt: 2 }], [first.key]);
  assert.equal(retry.key, first.key);
  assert.equal(retry.nextAction, 'NO_DUPLICATE_WRITE');
  assert.equal(retry.runAttempt, 2);
});

test('receipt rejects cross-project, stale SHA, branch, repo, workflow and event', () => {
  const { checkpoint, run, job } = hostedFixture();
  for (const override of [{ head_sha: 'b'.repeat(40) }, { head_branch: 'main' },
    { repository: { full_name: 'another/repo' } }, { path: '.github/workflows/other.yml' },
    { event: 'pull_request' }]) {
    assert.equal(reconcileHostedReceipt(checkpoint, { ...run, ...override }, [job]).status, 'NOT_VERIFIED');
  }
  assert.equal(reconcileHostedReceipt({ ...checkpoint, project: 'P02' }, run, [job]).status, 'NOT_VERIFIED');
  assert.equal(reconcileHostedReceipt({ ...checkpoint, action: { status: 'FAILED' } }, run, [job]).status, 'NOT_VERIFIED');
});

test('receipt distinguishes pending and failed runs from verified success', () => {
  const { checkpoint, run, job } = hostedFixture();
  assert.equal(reconcileHostedReceipt(checkpoint, { ...run, status: 'in_progress', conclusion: null }, []).status, 'PENDING');
  assert.equal(reconcileHostedReceipt(checkpoint, { ...run, conclusion: 'failure' }, [job]).nextAction, 'RECOVER_QA');
});

test('receipt rejects unrelated jobs, stale attempts and absent or skipped steps', () => {
  const { checkpoint, run, job } = hostedFixture();
  for (const jobs of [[], [job, job], [{ ...job, run_id: 999 }],
    [{ ...job, run_attempt: 2 }], [{ ...job, head_sha: 'b'.repeat(40) }],
    [{ ...job, conclusion: 'failure' }], [{ ...job, steps: job.steps.slice(1) }],
    [{ ...job, steps: job.steps.map((s, i) => i === 0 ? { ...s, conclusion: 'skipped' } : s) }]]) {
    assert.equal(reconcileHostedReceipt(checkpoint, run, jobs).status, 'NOT_VERIFIED');
  }
  assert.equal(reconcileHostedReceipt(checkpoint, run, [job], null).status, 'NOT_VERIFIED');
});
