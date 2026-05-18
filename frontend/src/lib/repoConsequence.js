function shortHash(hash) {
  if (!hash || typeof hash !== 'string') return '???????';
  return hash.slice(0, 7);
}

function headLabel(refs) {
  const head = refs?.HEAD;
  if (!head) return null;
  if (head.type === 'branch') return head.ref;
  if (head.type === 'detached') return `detached at ${shortHash(head.hash)}`;
  return null;
}

function statesEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function describeConsequence(prevState, nextState, { command, error, targetAchieved }) {
  if (error) {
    return { tone: 'negative', message: "That command didn't change the repository." };
  }

  if (!nextState) {
    return { tone: 'neutral', message: 'Repository state unchanged.' };
  }

  if (statesEqual(prevState, nextState)) {
    return { tone: 'negative', message: "That command didn't change the repository." };
  }

  if (targetAchieved) {
    return { tone: 'positive', message: 'Target state reached — you matched the expected repository.' };
  }

  const prevCommits = prevState?.commits?.length ?? 0;
  const nextCommits = nextState?.commits?.length ?? 0;
  if (nextCommits > prevCommits) {
    const newest = nextState.commits[0];
    const branch = headLabel(nextState.refs);
    const hash = shortHash(newest?.hash);
    return {
      tone: 'positive',
      message: branch
        ? `Created commit ${hash} on ${branch}.`
        : `Created commit ${hash}.`,
    };
  }

  const prevBranches = Object.keys(prevState?.refs || {}).filter(k => k !== 'HEAD');
  const nextBranches = Object.keys(nextState?.refs || {}).filter(k => k !== 'HEAD');
  const newBranch = nextBranches.find(b => !prevBranches.includes(b));
  if (newBranch) {
    return { tone: 'neutral', message: `Created branch ${newBranch}.` };
  }

  const prevHead = headLabel(prevState?.refs);
  const nextHead = headLabel(nextState?.refs);
  if (prevHead !== nextHead && nextHead) {
    return { tone: 'neutral', message: `HEAD now points to ${nextHead}.` };
  }

  return { tone: 'neutral', message: 'Repository state updated.' };
}
