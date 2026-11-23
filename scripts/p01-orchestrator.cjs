'use strict';

const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const baseline = 'eb302fa6dc8d5979c7f3cebe199c0df235c75c1e';
const evidencePaths = [
  'docs/p01-ecrl-gis-evidence-checkpoint-20261122.md',
  '.github/workflows/p01-uat17-contract.yml',
];
const pilotPaths = new Set([
  'scripts/p01-orchestrator.cjs',
  'tests/p01-orchestrator.test.cjs',
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
    return checkpoint;
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
    return checkpoint;
  }

  try {
    const summary = runQA(qaFiles);
    if (!summary || !Number.isInteger(summary.tests) || summary.tests < 1 ||
      summary.tests !== summary.passed) {
      checkpoint.action = { status: 'FAILED', reason: 'QA_NOT_ALL_PASSED', files: qaFiles };
      return checkpoint;
    }
    if (git('rev-parse', 'HEAD').trim() !== checkpoint.commit ||
      git('status', '--porcelain', '--untracked-files=all')) {
      checkpoint.action = { status: 'BLOCKED', reason: 'CHECKPOINT_CHANGED_DURING_QA' };
      return checkpoint;
    }
    checkpoint.action = { status: 'TESTED', files: qaFiles, ...summary };
  } catch {
    checkpoint.action = { status: 'FAILED', reason: 'QA_EXECUTION_FAILED', files: qaFiles };
  }
  return checkpoint;
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

module.exports = { runCycle };
