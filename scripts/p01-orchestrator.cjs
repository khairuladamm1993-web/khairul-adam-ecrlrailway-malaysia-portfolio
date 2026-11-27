'use strict';

const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const baseline = 'eb302fa6dc8d5979c7f3cebe199c0df235c75c1e';
const evidencePaths = [
  'docs/p01-ecrl-gis-evidence-checkpoint-20261122.md',
  '.github/workflows/p01-uat17-contract.yml',
];
const pilotPaths = new Set([
  'assets/public-gateway.js',
  'scripts/p01-orchestrator.cjs',
  'tests/p01-orchestrator.test.cjs',
  'tests/p01-role-map-runtime.test.cjs',
  'docs/p01-orchestrator-v1.md',
  '.github/workflows/p01-uat17-contract.yml',
  'vercel.json',
]);
const qaFiles = [
  'tests/p01-ecrl-gap-coverage-audit.test.cjs',
  'tests/p01-ecrl-alignment-evidence-gate.test.cjs',
  'tests/p01-uat17-ecrl-inventory.test.cjs',
  'tests/p01-role-map-runtime.test.cjs',
];

// Handoff is a bounded P01 recommendation, not a dispatch or approval.
function finalizeCheckpoint(checkpoint) {
  let nextAction;
  if (checkpoint.research.status !== 'COLLECTED') nextAction = 'RECOVER_BASELINE_EVIDENCE';
  else if (checkpoint.verification.status !== 'VERIFIED') nextAction = 'RECOVER_SCOPE_VERIFICATION';
  else if (checkpoint.action.status === 'TESTED') nextAction = 'VERIFY_HOSTED_CI';
  else if (checkpoint.action.reason === 'CHECKPOINT_CHANGED_DURING_QA') nextAction = 'REVALIDATE_CHECKPOINT';
  else nextAction = 'RECOVER_QA';
  checkpoint.handoff = { schemaVersion: 1, nextAction, ownerActionRequired: false, hostedCI: 'NOT_VERIFIED' };
  return checkpoint;
}

function runCycle(git, runQA) {
  const checkpoint = {
    schemaVersion: 1,
    project: 'P01',
    baseline,
    geometry: { status: 'HOLD', candidates: 9, gaps: 17 },
    research: { status: 'PENDING' },
    verification: { status: 'PENDING' },
    action: { status: 'NOT_RUN' },
    ownerDecision: null,
  };

  try {
    checkpoint.commit = git('rev-parse', 'HEAD').trim();
    const sources = evidencePaths.map(path => {
      const body = git('show', baseline + ':' + path);
      if (!body.trim()) throw new Error('Empty checkpoint source: ' + path);
      return { path, commit: baseline, sha256: createHash('sha256').update(body).digest('hex') };
    });
    checkpoint.research = { status: 'COLLECTED', sources };
  } catch {
    checkpoint.research = { status: 'BLOCKED', reason: 'BASELINE_EVIDENCE_UNAVAILABLE' };
    return finalizeCheckpoint(checkpoint);
  }

  try {
    git('merge-base', '--is-ancestor', baseline, checkpoint.commit);
    const changed = git('diff', '--name-only', '--no-renames', '-z', baseline, checkpoint.commit);
    if (changed.split('\0').filter(Boolean).some(path => !pilotPaths.has(path))) {
      throw new Error('OUT_OF_SCOPE_DIFF');
    }
    if (git('status', '--porcelain', '--untracked-files=all')) {
      throw new Error('WORKTREE_NOT_CLEAN');
    }
    checkpoint.verification = { status: 'VERIFIED', scope: 'P01_ORCHESTRATOR_PILOT_ONLY' };
  } catch (error) {
    const allowedReasons = ['OUT_OF_SCOPE_DIFF', 'WORKTREE_NOT_CLEAN'];
    const reason = allowedReasons.includes(error.message) ? error.message : 'BASELINE_CHECK_FAILED';
    checkpoint.verification = { status: 'BLOCKED', reason };
    return finalizeCheckpoint(checkpoint);
  }

  try {
    const summary = runQA(qaFiles);
    if (!summary || !Number.isInteger(summary.tests) || summary.tests < 1 ||
      summary.tests !== summary.passed) {
      checkpoint.action = { status: 'FAILED', reason: 'QA_NOT_ALL_PASSED', files: qaFiles };
      return finalizeCheckpoint(checkpoint);
    }
    if (git('rev-parse', 'HEAD').trim() !== checkpoint.commit ||
      git('status', '--porcelain', '--untracked-files=all')) {
      checkpoint.action = { status: 'BLOCKED', reason: 'CHECKPOINT_CHANGED_DURING_QA' };
      return finalizeCheckpoint(checkpoint);
    }
    checkpoint.action = { status: 'TESTED', files: qaFiles, tests: summary.tests, passed: summary.passed };
  } catch {
    checkpoint.action = { status: 'FAILED', reason: 'QA_EXECUTION_FAILED', files: qaFiles };
  }
  return finalizeCheckpoint(checkpoint);
}

if (require.main === module) {
  const cwd = require('node:path').resolve(__dirname, '..');
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 15000 });
  const runQA = files => {
    const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
      cwd, encoding: 'utf8', timeout: 120000,
    });
    return {
      tests: Number(output.match(/^# tests (\d+)$/m)?.[1]),
      passed: Number(output.match(/^# pass (\d+)$/m)?.[1]),
    };
  };
  const checkpoint = runCycle(git, runQA);
  console.log(JSON.stringify(checkpoint, null, 2));
  if (checkpoint.action.status !== 'TESTED') process.exitCode = 1;
}

function reconcileHostedReceipt(checkpoint, run, jobs, recordedKeys = []) {
  const result = (status, reason, nextAction) => ({ status, reason, nextAction, ownerActionRequired: false });
  const repo = 'khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio';
  const branch = 'candidate/p01-orchestrator-v1-20261123';
  const validId = n => Number.isSafeInteger(n) && n > 0;
  if (checkpoint?.project !== 'P01' || !/^[a-f0-9]{40}$/.test(checkpoint.commit || '') ||
      checkpoint.verification?.status !== 'VERIFIED' || checkpoint.action?.status !== 'TESTED' ||
      checkpoint.handoff?.nextAction !== 'VERIFY_HOSTED_CI') {
    return result('NOT_VERIFIED', 'INVALID_CHECKPOINT', 'REVALIDATE_CHECKPOINT');
  }
  if (run?.repository?.full_name !== repo || run.head_branch !== branch ||
      run.head_sha !== checkpoint.commit || run.event !== 'push' ||
      run.path !== '.github/workflows/p01-uat17-contract.yml' ||
      !validId(run.id) || !validId(run.run_attempt)) {
    return result('NOT_VERIFIED', 'RUN_IDENTITY_MISMATCH', 'VERIFY_HOSTED_CI');
  }
  if (run.status !== 'completed') return result('PENDING', 'RUN_INCOMPLETE', 'VERIFY_HOSTED_CI');
  if (run.conclusion !== 'success') return result('FAILED', 'RUN_NOT_SUCCESSFUL', 'RECOVER_QA');
  const matching = Array.isArray(jobs) ? jobs.filter(j => j?.name === 'source-contract') : [];
  const job = matching[0];
  if (matching.length !== 1 || !validId(job.id) || job.run_id !== run.id ||
      job.run_attempt !== run.run_attempt || job.head_sha !== checkpoint.commit ||
      job.status !== 'completed' || job.conclusion !== 'success') {
    return result('NOT_VERIFIED', 'JOB_IDENTITY_OR_STATUS_MISMATCH', 'VERIFY_HOSTED_CI');
  }
  const required = ['JavaScript syntax', 'P01 UAT17 focused regression tests',
    'Verify and run the P01 orchestrator pilot', 'Safe static artifact build',
    'Build isolated P01 Public and Member map candidate artifact'];
  if (!Array.isArray(job.steps) || !required.every(name => {
    const steps = job.steps.filter(step => step?.name === name);
    return steps.length === 1 && steps[0].status === 'completed' && steps[0].conclusion === 'success';
  })) return result('NOT_VERIFIED', 'REQUIRED_STEP_NOT_SUCCESSFUL', 'VERIFY_HOSTED_CI');
  const key = 'P01:' + checkpoint.commit + ':hosted-ci';
  if (!Array.isArray(recordedKeys)) return result('NOT_VERIFIED', 'INVALID_RECEIPT_LEDGER', 'RECOVER_RECEIPT_LEDGER');
  return {
    schemaVersion: 1, project: 'P01', commit: checkpoint.commit, status: 'VERIFIED',
    key, runId: run.id, runAttempt: run.run_attempt, jobId: job.id,
    evidenceUrl: 'https://github.com/' + repo + '/actions/runs/' + run.id,
    nextAction: recordedKeys.includes(key) ? 'NO_DUPLICATE_WRITE' : 'RECORD_ENGINEERING_RECEIPT',
    ownerActionRequired: false,
  };
}

module.exports = { runCycle, reconcileHostedReceipt };
