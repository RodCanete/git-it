import { useMemo } from 'react';
import { COLORS } from '../tokens';

const DAG_HEAD_COLOR = '#FF4D6D';
const DAG_LANE_COLORS = ['#01C38D', '#4A9EFF', '#A78BFA', '#F5A623', '#F472B6'];

function dagLaneColor(lane) {
  return DAG_LANE_COLORS[Math.abs(lane) % DAG_LANE_COLORS.length];
}

function shortHash(hash) {
  if (!hash || typeof hash !== 'string') return '???????';
  return hash.slice(0, 7);
}

/** API target_state uses abstract commits (no hash); synthesize display-only nodes. */
function normalizeRepoStateForDisplay(state) {
  if (!state?.commits?.length) return state;

  const rawCommits = state.commits;
  if (rawCommits.every(c => c.hash)) return state;

  const syntheticHashes = rawCommits.map((_, i) => `target${String(i).padStart(7, '0')}`);

  const commits = rawCommits.map((c, i) => {
    const hash = c.hash || syntheticHashes[i];
    const parents = (c.parents || [])
      .map(p => {
        const idx = rawCommits.findIndex(rc => rc.hash === p);
        return idx >= 0 ? (rawCommits[idx].hash || syntheticHashes[idx]) : p;
      })
      .filter(p => syntheticHashes.includes(p) || rawCommits.some(rc => rc.hash === p));

    return {
      ...c,
      hash,
      shortHash: (c.shortHash || hash).slice(0, 7),
      message: c.message === '__any__' ? 'commit' : (c.message || 'commit'),
      parents,
      timestamp: c.timestamp ?? (i + 1) * 1000,
    };
  });

  const tipHash = commits[commits.length - 1]?.hash;
  const refs = { ...state.refs };

  for (const [name, val] of Object.entries(refs)) {
    if (name === 'HEAD') continue;
    if (val === '__any__' || val === '__any_with_login__') {
      refs[name] = tipHash;
    } else if (typeof val === 'string') {
      const idx = rawCommits.findIndex(rc => rc.hash === val);
      if (idx >= 0 && !rawCommits[idx].hash) refs[name] = syntheticHashes[idx];
    }
  }

  const head = refs.HEAD;
  if (head?.type === 'branch' && head.ref && !refs[head.ref] && tipHash) {
    refs[head.ref] = tipHash;
  }

  return { ...state, commits, refs };
}

function resolveHEAD(state) {
  const head = state.refs?.HEAD;
  if (!head) return null;
  if (head.type === 'branch') return state.refs[head.ref] || null;
  if (head.type === 'detached') return head.hash;
  return null;
}

function computeDAGLayoutH(repoState, compact) {
  const { commits, refs } = repoState;
  const byHash = {};
  commits.forEach(c => { byHash[c.hash] = c; });

  const sortedCommits = [...commits].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  const CX  = compact ? 80  : 120;
  const LH  = compact ? 52  : 72;
  const PX  = compact ? 28  : 48;
  const NR  = compact ? 9   : 13;
  const TOP = compact ? 46  : 64;
  const BOT = compact ? 34  : 48;

  const localBranches = Object.keys(refs).filter(k => k !== 'HEAD');

  const mainBranch = localBranches.includes('main') ? 'main'
    : localBranches.includes('master') ? 'master'
    : localBranches[0] || 'main';

  const branchLaneMap = { [mainBranch]: 0 };
  let nextLane = 1;
  localBranches.forEach(b => { if (b !== mainBranch) branchLaneMap[b] = nextLane++; });
  const numLanes = Math.max(1, nextLane);

  const laneOf = {};
  [...localBranches]
    .sort((a, b) => (branchLaneMap[a] ?? 0) - (branchLaneMap[b] ?? 0))
    .forEach(branch => {
      const tip = refs[branch];
      if (!tip) return;
      const queue = [tip];
      const seen = new Set();
      while (queue.length) {
        const h = queue.shift();
        if (!h || seen.has(h) || laneOf[h] !== undefined) continue;
        seen.add(h);
        laneOf[h] = branchLaneMap[branch] ?? 0;
        byHash[h]?.parents.forEach(p => queue.push(p));
      }
    });

  const svgH = TOP + (numLanes - 1) * LH + 2 * NR + BOT;
  const mainY = TOP + (numLanes - 1) * LH + NR;
  const laneY = k => mainY - k * LH;

  const positions = {};
  sortedCommits.forEach((c, idx) => {
    const lane = laneOf[c.hash] ?? 0;
    positions[c.hash] = { x: PX + idx * CX, y: laneY(lane), lane };
  });

  const svgW = PX * 2 + Math.max(0, sortedCommits.length - 1) * CX + (compact ? 80 : 120);

  return {
    positions, sortedCommits, laneOf, localBranches, branchLaneMap,
    mainBranch, numLanes, laneY, svgW, svgH,
    NR, PX, CX, LH, TOP, BOT,
  };
}

export default function DAGRenderer({ repoState, compact = false, animated = true }) {
  const displayState = useMemo(
    () => normalizeRepoStateForDisplay(repoState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(repoState)]
  );

  const layout = useMemo(
    () => (displayState?.commits?.length ? computeDAGLayoutH(displayState, compact) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(displayState), compact]
  );

  if (!displayState?.commits?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" opacity="0.3">
          <circle cx="24" cy="24" r="10" stroke="#01C38D" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
          <circle cx="24" cy="24" r="3" fill="#01C38D" fillOpacity="0.4"/>
        </svg>
        <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace" }}>empty repo</span>
      </div>
    );
  }

  const { positions, sortedCommits, laneOf, branchLaneMap, laneY, svgW, svgH, NR } = layout;

  const byHash = {};
  displayState.commits.forEach(c => { byHash[c.hash] = c; });

  const headHash   = resolveHEAD(displayState);
  const headRef    = displayState.refs.HEAD;
  const headBranch = headRef?.type === 'branch' ? headRef.ref : null;

  const labelsAt = {};
  Object.entries(displayState.refs).forEach(([name, val]) => {
    if (name === 'HEAD') return;
    const hash = typeof val === 'string' ? val : null;
    if (!hash) return;
    (labelsAt[hash] = labelsAt[hash] || []).push(name);
  });

  const byLane = {};
  sortedCommits.forEach(c => {
    const l = laneOf[c.hash] ?? 0;
    (byLane[l] = byLane[l] || []).push(c);
  });

  const crossEdges = [];
  sortedCommits.forEach(commit => {
    const cl = laneOf[commit.hash] ?? 0;
    (commit.parents || []).forEach(ph => {
      const pl = laneOf[ph] ?? 0;
      if (cl !== pl) crossEdges.push({ commit, parentHash: ph, childLane: cl, parentLane: pl });
    });
  });

  function crossPath(from, to) {
    if (to.y < from.y) {
      return `M ${from.x + NR} ${from.y} Q ${to.x} ${from.y} ${to.x} ${to.y + NR}`;
    } else {
      return `M ${from.x} ${from.y + NR} Q ${from.x} ${to.y} ${to.x - NR} ${to.y}`;
    }
  }

  const filterId = `dag-${compact ? 'c' : 'f'}`;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', minWidth: svgW, overflow: 'visible' }}>
        <defs>
          <filter id={`${filterId}-head-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {Object.entries(byLane).map(([laneStr, laneCommits]) => {
          const lane = parseInt(laneStr);
          if (laneCommits.length < 2) return null;
          const clr = dagLaneColor(lane);
          const isMain = lane === 0;
          const fx = positions[laneCommits[0].hash]?.x;
          const lx = positions[laneCommits[laneCommits.length - 1].hash]?.x;
          const ty = laneY(lane);
          if (fx == null || lx == null) return null;
          return (
            <line key={`track-${lane}`}
              x1={fx} y1={ty} x2={lx} y2={ty}
              stroke={clr} strokeWidth={compact ? 1.5 : 2}
              strokeOpacity={isMain ? 0.55 : 0.45}
              strokeDasharray={isMain ? 'none' : (compact ? '4 3' : '6 4')}
            />
          );
        })}

        {crossEdges.map(({ commit, parentHash, childLane }) => {
          const from = positions[parentHash];
          const to   = positions[commit.hash];
          if (!from || !to) return null;
          const clr = dagLaneColor(childLane);
          return (
            <path key={`xedge-${commit.hash}-${parentHash}`}
              d={crossPath(from, to)} stroke={clr}
              strokeWidth={compact ? 1.5 : 2} strokeOpacity={0.55}
              fill="none" strokeLinecap="round"
              strokeDasharray={compact ? '4 3' : '6 4'}
            />
          );
        })}

        {sortedCommits.map(commit => {
          const pos    = positions[commit.hash];
          if (!pos) return null;
          const lane   = laneOf[commit.hash] ?? 0;
          const clr    = dagLaneColor(lane);
          const isHead = commit.hash === headHash;
          const nc     = isHead ? DAG_HEAD_COLOR : clr;
          const sh     = shortHash(commit.hash);
          const labels = labelsAt[commit.hash] || [];

          return (
            <g key={commit.hash} style={animated ? { transition: 'all 0.3s ease' } : {}}>
              {isHead && (
                <>
                  <circle cx={pos.x} cy={pos.y} r={NR + 11} fill={DAG_HEAD_COLOR} fillOpacity="0.10" filter={`url(#${filterId}-head-glow)`}/>
                  <circle cx={pos.x} cy={pos.y} r={NR + 5} fill="none" stroke={DAG_HEAD_COLOR} strokeOpacity="0.30" strokeWidth="1.5"/>
                </>
              )}
              <circle cx={pos.x} cy={pos.y} r={NR}
                fill={isHead ? `${DAG_HEAD_COLOR}1A` : `${clr}14`}
                stroke={nc} strokeWidth={isHead ? (compact ? 2 : 2.5) : (compact ? 1.5 : 2)}
              />
              <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                fill={nc} fontSize={compact ? 7 : 9}
                fontFamily="'JetBrains Mono', 'Courier New', monospace" fontWeight="600"
              >{sh.slice(0, 4)}</text>
              <text x={pos.x} y={pos.y + NR + (compact ? 9 : 13)} textAnchor="middle" dominantBaseline="hanging"
                fill={nc} fillOpacity={0.55} fontSize={compact ? 7.5 : 9.5}
                fontFamily="'JetBrains Mono', monospace"
              >{sh}</text>
              {isHead && (
                <text x={pos.x} y={pos.y + NR + (compact ? 20 : 28)} textAnchor="middle" dominantBaseline="hanging"
                  fill={DAG_HEAD_COLOR} fillOpacity="0.9" fontSize={compact ? 7.5 : 9.5}
                  fontFamily="'JetBrains Mono', monospace" fontWeight="700"
                >{headBranch ? `HEAD  ${headBranch}` : 'HEAD'}</text>
              )}
              {labels.map((lbl, li) => {
                const isHB = headBranch === lbl && isHead;
                if (isHB) return null;
                const lc = dagLaneColor(branchLaneMap[lbl] ?? 0);
                const display = lbl.length > (compact ? 14 : 26) ? lbl.slice(0, compact ? 12 : 24) + '…' : lbl;
                const charW = compact ? 5.0 : 6.0;
                const padH  = compact ? 5 : 7;
                const boxW  = display.length * charW + padH * 2;
                const boxH  = compact ? 14 : 18;
                const boxX  = pos.x - boxW / 2;
                const gap   = compact ? 10 : 14;
                const boxY  = pos.y - NR - gap - boxH - li * (boxH + 4);
                return (
                  <g key={lbl}>
                    <line x1={pos.x} y1={pos.y - NR - 2} x2={pos.x} y2={boxY + boxH}
                      stroke={lc} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="2 2"
                    />
                    <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={3}
                      fill={`${lc}0D`} stroke={lc} strokeWidth={1.5}
                      strokeDasharray={compact ? '3 2' : '4 3'}
                    />
                    <text x={pos.x} y={boxY + boxH / 2} textAnchor="middle" dominantBaseline="central"
                      fill={lc} fontSize={compact ? 7.5 : 9.5} fontFamily="'JetBrains Mono', monospace"
                    >{display}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ExpectedStatePanel({ targetState, style: s }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: COLORS.bg1, border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 10, overflow: 'hidden', ...s,
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(74,158,255,0.05)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A9EFF' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#4A9EFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Target State
        </span>
      </div>
      <div style={{ padding: 12, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <DAGRenderer repoState={targetState} compact={true} animated={false} />
      </div>
    </div>
  );
}
