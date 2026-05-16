import { useState, useRef, useCallback } from 'react';
import * as git from 'isomorphic-git';
import LightningFS from '@isomorphic-git/lightning-fs';

const DIR = '/repo';

function makeFs(name) {
  return new LightningFS(name);
}

async function replayInitialState(fs, initialState) {
  const { commits = [], refs = {}, workingDir = [] } = initialState;
  const hashMap = {};

  for (const file of workingDir) {
    await fs.promises.writeFile(`${DIR}/${file.name}`, `# ${file.name}\n`);
  }

  const sortedCommits = [...commits].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  for (const commit of sortedCommits) {
    const fname = `${DIR}/.gitkeep_${commit.hash.slice(0, 7)}`;
    await fs.promises.writeFile(fname, commit.message);
    await git.add({ fs, dir: DIR, filepath: `.gitkeep_${commit.hash.slice(0, 7)}` });
    const newHash = await git.commit({
      fs, dir: DIR,
      message: commit.message,
      author: { name: 'GIT it!', email: 'gitit@example.com' },
    });
    hashMap[commit.hash] = newHash;
  }

  for (const [name, target] of Object.entries(refs)) {
    if (name === 'HEAD') continue;
    if (!target) continue;
    const newTarget = typeof target === 'string' ? hashMap[target] : null;
    try {
      if (newTarget) {
        await git.branch({ fs, dir: DIR, ref: name, object: newTarget, checkout: false });
      } else {
        await git.branch({ fs, dir: DIR, ref: name, checkout: false });
      }
    } catch { /* branch may already exist */ }
  }

  const headRef = refs.HEAD;
  if (headRef?.type === 'branch' && headRef.ref) {
    try {
      await git.checkout({ fs, dir: DIR, ref: headRef.ref });
    } catch { /* ignore */ }
  }

  return hashMap;
}

async function buildRepoSnapshot(fs) {
  let commits = [];
  let refs = {};

  try {
    const log = await git.log({ fs, dir: DIR, depth: 50 });
    commits = log.map(entry => ({
      hash: entry.oid,
      shortHash: entry.oid.slice(0, 7),
      message: entry.commit.message.trim(),
      parents: entry.commit.parent || [],
      timestamp: entry.commit.author.timestamp,
    }));
  } catch { /* empty repo */ }

  try {
    const branches = await git.listBranches({ fs, dir: DIR });
    for (const branch of branches) {
      try {
        const hash = await git.resolveRef({ fs, dir: DIR, ref: branch });
        refs[branch] = hash;
      } catch { /* ignore */ }
    }
    const currentBranch = await git.currentBranch({ fs, dir: DIR });
    if (currentBranch) {
      refs.HEAD = { type: 'branch', ref: currentBranch };
    } else {
      const head = await git.resolveRef({ fs, dir: DIR, ref: 'HEAD' });
      refs.HEAD = { type: 'detached', hash: head };
    }
  } catch { /* ignore */ }

  return { commits, refs, stagingArea: [], workingDir: [] };
}

function translateTargetHashes(targetState, hashMap) {
  if (!targetState) return targetState;
  const result = { ...targetState };
  if (targetState.refs) {
    result.refs = {};
    for (const [name, val] of Object.entries(targetState.refs)) {
      if (typeof val === 'string' && hashMap[val]) {
        result.refs[name] = hashMap[val];
      } else {
        result.refs[name] = val;
      }
    }
  }
  return result;
}

function checkCompletion(repoState, targetState) {
  if (!targetState?.refs) return false;
  for (const [key, expected] of Object.entries(targetState.refs)) {
    if (key === 'HEAD') {
      const actual = repoState.refs?.HEAD;
      if (!actual) return false;
      if (expected.type && actual.type !== expected.type) return false;
      if (expected.ref && actual.ref !== expected.ref) return false;
    } else {
      const actualHash = repoState.refs?.[key];
      if (expected === '__any_with_login__') {
        if (!actualHash) return false;
        const commit = repoState.commits.find(c => c.hash === actualHash);
        if (!commit?.message?.toLowerCase().includes('login')) return false;
      } else if (expected === '__any__') {
        if (!actualHash) return false;
      } else if (expected !== null && expected !== undefined) {
        if (actualHash !== expected) return false;
      }
    }
  }
  if (targetState.commits?.length > 0) {
    for (const tc of targetState.commits) {
      if (tc.message === '__any__') {
        if (repoState.commits.length === 0) return false;
      }
    }
  }
  if (targetState.stagingArea !== undefined && targetState.stagingArea.length === 0) {
    if (repoState.stagingArea?.length > 0) return false;
  }
  return true;
}

const COMMAND_DISPATCH = {
  'git init': async (fs) => {
    await git.init({ fs, dir: DIR, defaultBranch: 'main' });
    return 'Initialized empty Git repository.';
  },
  'git status': async (fs) => {
    const status = await git.statusMatrix({ fs, dir: DIR });
    if (!status.length) return 'nothing to commit, working tree clean';
    return status.map(([f, h, w, s]) => `${f}: ${w === 2 ? 'modified' : w === 0 ? 'deleted' : 'new file'}`).join('\n');
  },
  'git log': async (fs) => {
    try {
      const log = await git.log({ fs, dir: DIR, depth: 10 });
      return log.map(e => `commit ${e.oid.slice(0, 7)}\n  ${e.commit.message.trim()}`).join('\n\n');
    } catch { return '(no commits yet)'; }
  },
  'git branch': async (fs) => {
    const branches = await git.listBranches({ fs, dir: DIR });
    const current = await git.currentBranch({ fs, dir: DIR });
    return branches.map(b => `${b === current ? '* ' : '  '}${b}`).join('\n');
  },
};

async function dispatchCommand(fs, cmdStr) {
  const parts = cmdStr.trim().split(/\s+/);
  if (parts[0] !== 'git') return { output: `command not found: ${parts[0]}`, error: true };

  const sub = parts[1];

  if (sub === 'init') return { output: await COMMAND_DISPATCH['git init'](fs), error: false };
  if (sub === 'status') return { output: await COMMAND_DISPATCH['git status'](fs), error: false };
  if (sub === 'log') return { output: await COMMAND_DISPATCH['git log'](fs), error: false };
  if (sub === 'branch' && parts.length === 2) return { output: await COMMAND_DISPATCH['git branch'](fs), error: false };

  if (sub === 'add') {
    const filepath = parts[2] === '.' ? '.' : parts[2];
    await git.add({ fs, dir: DIR, filepath });
    return { output: '', error: false };
  }

  if (sub === 'commit') {
    const mIdx = parts.indexOf('-m');
    const message = mIdx >= 0 ? parts.slice(mIdx + 1).join(' ').replace(/^["']|["']$/g, '') : 'commit';
    const result = await git.commit({ fs, dir: DIR, message, author: { name: 'Student', email: 'student@gitit.app' } });
    return { output: `[${result.slice(0, 7)}] ${message}`, error: false };
  }

  if (sub === 'branch' && parts.length >= 3) {
    if (parts[2] === '-d' || parts[2] === '-D') {
      await git.deleteBranch({ fs, dir: DIR, ref: parts[3] });
      return { output: `Deleted branch ${parts[3]}.`, error: false };
    }
    await git.branch({ fs, dir: DIR, ref: parts[2] });
    return { output: `Created branch ${parts[2]}.`, error: false };
  }

  if (sub === 'checkout') {
    const ref = parts[2];
    if (parts[2] === '-b' && parts[3]) {
      await git.branch({ fs, dir: DIR, ref: parts[3] });
      await git.checkout({ fs, dir: DIR, ref: parts[3] });
      return { output: `Switched to a new branch '${parts[3]}'`, error: false };
    }
    await git.checkout({ fs, dir: DIR, ref });
    return { output: `Switched to branch '${ref}'`, error: false };
  }

  if (sub === 'switch') {
    if (parts[2] === '-c' && parts[3]) {
      await git.branch({ fs, dir: DIR, ref: parts[3] });
      await git.checkout({ fs, dir: DIR, ref: parts[3] });
      return { output: `Switched to a new branch '${parts[3]}'`, error: false };
    }
    await git.checkout({ fs, dir: DIR, ref: parts[2] });
    return { output: `Switched to branch '${parts[2]}'`, error: false };
  }

  if (sub === 'merge') {
    const theirs = parts[2];
    const result = await git.merge({ fs, dir: DIR, theirs, author: { name: 'Student', email: 'student@gitit.app' }, message: `Merge branch '${theirs}'` });
    return { output: result.fastForward ? `Fast-forward merge to ${theirs}.` : `Merge branch '${theirs}' — merge commit created.`, error: false };
  }

  if (['push', 'pull', 'fetch', 'remote', 'clone'].includes(sub)) {
    return { output: `'git ${sub}' is not available in the simulator.`, error: true };
  }

  return { output: `git: '${sub}' is not a known command in this simulator.`, error: true };
}

export default function useGitEngine() {
  const fsRef = useRef(null);
  const hashMapRef = useRef({});
  const [repoState, setRepoState] = useState(null);

  async function initRepo(template) {
    const fsName = `gitit-${Date.now()}`;
    const fs = makeFs(fsName);
    fsRef.current = fs;
    hashMapRef.current = {};

    await git.init({ fs, dir: DIR, defaultBranch: 'main' });
    const hashMap = await replayInitialState(fs, template.initial_state);
    hashMapRef.current = hashMap;

    const snapshot = await buildRepoSnapshot(fs);
    setRepoState(snapshot);
    return snapshot;
  }

  const runCommand = useCallback(async (cmdStr) => {
    const fs = fsRef.current;
    if (!fs) return { output: 'Repository not initialized.', error: true, valid: false };

    try {
      const result = await dispatchCommand(fs, cmdStr);
      const snapshot = await buildRepoSnapshot(fs);
      setRepoState(snapshot);
      return { ...result, valid: !result.error, repoState: snapshot };
    } catch (err) {
      return { output: err.message || 'An error occurred.', error: true, valid: false };
    }
  }, []);

  const isComplete = useCallback((targetState, currentState) => {
    const state = currentState || repoState;
    if (!state) return false;
    const translated = translateTargetHashes(targetState, hashMapRef.current);
    return checkCompletion(state, translated);
  }, [repoState]);

  const resetRepo = useCallback(async (template) => {
    setRepoState(null);
    await initRepo(template);
  }, []);

  return { repoState, initRepo, runCommand, isComplete, resetRepo };
}
