import { useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { COLORS } from '../tokens';

import WorkspaceHeader from '../components/workspace/WorkspaceHeader';

import ScenarioSidebar from '../components/workspace/ScenarioSidebar';

import WorkspaceTerminal from '../components/workspace/WorkspaceTerminal';

import ScaffoldBanner from '../components/workspace/ScaffoldBanner';

import { LiveDagPanel, TargetDagPanel } from '../components/workspace/DagPanels';

import { panelDefaultsForDifficulty } from '../components/workspace/panelDefaults';

import { getDifficultyTheme, isTierUnlocked } from '../components/workspace/difficultyTheme';

import { fetchNextTemplate, fetchScenario, advanceVariant } from '../api/queries';

import { describeConsequence } from '../lib/repoConsequence';

import useGitEngine from '../hooks/useGitEngine';

import useSession from '../hooks/useSession';

import ScenarioLoadingScreen from '../components/ScenarioLoadingScreen';

function splitTemplatePayload(data) {

  const { scaffold, ...template } = data;

  return { template, scaffold: scaffold ?? null };

}

export default function WorkspaceScreen() {

  const { scenarioId } = useParams();

  const location = useLocation();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [difficulty, setDifficulty] = useState('easy');

  const [panels, setPanels] = useState(() => panelDefaultsForDifficulty('easy'));

  const [termHistory, setTermHistory] = useState([]);

  const [done, setDone] = useState(false);

  const [template, setTemplate] = useState(null);

  const [scaffold, setScaffold] = useState(null);

  const [bannerMessage, setBannerMessage] = useState(null);

  const [consequence, setConsequence] = useState(null);

  const [busy, setBusy] = useState(false);

  const [initialized, setInitialized] = useState(false);

  const [minDurationComplete, setMinDurationComplete] = useState(false);

  const { data: scenario } = useQuery({

    queryKey: ['scenario', scenarioId],

    queryFn: () => fetchScenario(scenarioId),

  });

  const lessonTitle = location.state?.title ?? scenario?.title ?? 'Scenario';

  const { repoState, initRepo, resetRepo, runCommand, isComplete } = useGitEngine();

  const {

    startSession,

    recordCommand,

    finishSession,

    commandCount,

    resetCommandCount,

  } = useSession();

  const applyScaffold = useCallback((scaffoldData, message = null) => {

    setScaffold(scaffoldData);

    if (message !== undefined) setBannerMessage(message);

    else if (scaffoldData?.message) setBannerMessage(scaffoldData.message);

  }, []);

  const loadTemplate = useCallback(async (tpl, { newSession = true, scaffoldData = null, message = null } = {}) => {

    setTemplate(tpl);

    await initRepo(tpl);

    if (scaffoldData) applyScaffold(scaffoldData, message);

    if (newSession) {

      resetCommandCount();

      await startSession(scenarioId, tpl.id);

    }

  }, [initRepo, resetCommandCount, startSession, scenarioId, applyScaffold]);

  const loadWorkspaceTemplate = useCallback(async (tier, { message } = {}) => {

    const data = await fetchNextTemplate(scenarioId, tier);

    const { template: tpl, scaffold: sc } = splitTemplatePayload(data);

    if (sc?.tier && sc.tier !== tier) {

      setDifficulty(sc.tier);

      setPanels(panelDefaultsForDifficulty(sc.tier));

    }

    await loadTemplate(tpl, { newSession: true, scaffoldData: sc, message });

    return { tpl, sc };

  }, [scenarioId, loadTemplate]);

  function clearWorkspaceState() {

    setTermHistory([]);

    setDone(false);

    setConsequence(null);

  }

  useEffect(() => {

    setInitialized(false);

    setTemplate(null);

    setScaffold(null);

    setBannerMessage(null);

    setMinDurationComplete(false);

    setDifficulty('easy');

    setPanels(panelDefaultsForDifficulty('easy'));

    clearWorkspaceState();

  }, [scenarioId]);

  const handleMinDurationComplete = useCallback(() => {

    setMinDurationComplete(true);

  }, []);

  const dataReady = initialized && !!scenario;

  const showLoader = !(minDurationComplete && dataReady);

  useEffect(() => {

    if (!scenarioId || initialized) return;

    let cancelled = false;

    (async () => {

      setBusy(true);

      try {

        if (cancelled) return;

        await loadWorkspaceTemplate('easy');

        setInitialized(true);

      } finally {

        if (!cancelled) setBusy(false);

      }

    })();

    return () => { cancelled = true; };

  }, [scenarioId, initialized, loadWorkspaceTemplate]);

  async function handleScaffoldAction(scaffoldResult, sessionResult) {

    const action = scaffoldResult?.action;

    const message = scaffoldResult?.message ?? null;

    if (action === 'scenario_complete') {

      setDone(true);

      navigate('/completion', {

        state: {

          result: sessionResult?.result || 'pass',

          commandsUsed: sessionResult?.commands_used,

          minCommands: template?.min_commands,

          scenarioTitle: scenario?.title,

          allTiersComplete: true,

        },

      });

      return;

    }

    if (action === 'tier_unlocked') {

      const nextTier = scaffoldResult.unlocked_tier || 'medium';

      setDifficulty(nextTier);

      setPanels(panelDefaultsForDifficulty(nextTier));

      applyScaffold({ ...scaffoldResult, tier_progress: scaffoldResult.tier_progress }, message);

      setTermHistory(h => [

        ...h,

        { type: 'success', text: scaffoldResult.message || `${nextTier} unlocked!` },

      ]);

      clearWorkspaceState();

      setBusy(true);

      try {

        await loadWorkspaceTemplate(nextTier, { message });

      } finally {

        setBusy(false);

      }

      return;

    }

    if (action === 'reset_same') {

      applyScaffold(scaffoldResult, message);

      setPanels(p => ({ ...p, feedback: difficulty === 'easy' ? true : p.feedback }));

      setTermHistory(h => [

        ...h,

        { type: 'output', text: message || 'Try again — review the feedback above.' },

      ]);

      setBusy(true);

      try {

        await resetRepo(template);

        resetCommandCount();

        await startSession(scenarioId, template.id);

        setDone(false);

      } finally {

        setBusy(false);

      }

      return;

    }

    if (action === 'rotate_variant' || action === 'hint_restart') {

      applyScaffold(scaffoldResult, message);

      setTermHistory(h => [

        ...h,

        { type: 'output', text: message || "Let's try a fresh scenario." },

      ]);

      setBusy(true);

      try {

        await queryClient.invalidateQueries({ queryKey: ['next-template', scenarioId] });

        await loadWorkspaceTemplate(difficulty, { message });

        setDone(false);

      } finally {

        setBusy(false);

      }

    }

  }

  function handlePanelChange(key, value) {

    setPanels(p => ({ ...p, [key]: value }));

  }

  async function handleDifficultyChange(next) {

    if (next === difficulty) return;

    if (!isTierUnlocked(next, scaffold?.tier_progress)) return;

    setDifficulty(next);

    setPanels(panelDefaultsForDifficulty(next));

    setConsequence(null);

    setBannerMessage(null);

    setBusy(true);

    try {

      await loadWorkspaceTemplate(next);

      setDone(false);

      setTermHistory([

        { type: 'output', text: `Switched to ${next} mode.` },

      ]);

    } finally {

      setBusy(false);

    }

  }

  async function handleRetry() {

    if (!scenarioId || busy) return;

    setBusy(true);

    clearWorkspaceState();

    try {

      const data = await advanceVariant(scenarioId);

      const { template: tpl, scaffold: sc } = splitTemplatePayload(data);

      await loadTemplate(tpl, { newSession: true, scaffoldData: sc, message: sc?.message });

      setTermHistory([{ type: 'output', text: sc?.message || "Let's try a fresh scenario." }]);

    } finally {

      setBusy(false);

    }

  }

  async function handleReset() {

    if (!template || busy) return;

    setBusy(true);

    clearWorkspaceState();

    setBannerMessage(null);

    try {

      await resetRepo(template);

      resetCommandCount();

      await startSession(scenarioId, template.id);

    } finally {

      setBusy(false);

    }

  }

  async function handleCommand(cmd) {

    if (done || busy) return;

    const prevState = repoState;

    setTermHistory(h => [...h, { type: 'command', text: cmd }]);

    const result = await runCommand(cmd);

    if (result.output) {

      setTermHistory(h => [...h, {

        type: result.error ? 'error' : 'output',

        text: result.output,

      }]);

    }

    const newCount = await recordCommand(cmd, result.valid);

    const hardCap = template?.hard_cap ?? 10;

    const targetAchieved = result.repoState && isComplete(template?.target_state, result.repoState);

    setConsequence(describeConsequence(prevState, result.repoState, {

      command: cmd,

      error: result.error,

      targetAchieved,

    }));

    if (newCount >= hardCap) {

      const sessionResult = await finishSession(targetAchieved, true, difficulty);

      setDone(true);

      const passed = sessionResult?.result === 'pass';

      if (passed) {

        setTermHistory(h => [...h, { type: 'success', text: 'Target state achieved!' }]);

      } else {

        setTermHistory(h => [...h, {

          type: 'error',

          text: `Command limit reached (${hardCap}).`,

        }]);

      }

      await handleScaffoldAction(sessionResult?.scaffold, sessionResult);

      return;

    }

    if (targetAchieved) {

      setDone(true);

      const sessionResult = await finishSession(true, false, difficulty);

      const passed = sessionResult?.result === 'pass';

      if (passed) {

        setTermHistory(h => [...h, { type: 'success', text: 'Target state achieved!' }]);

        await handleScaffoldAction(sessionResult?.scaffold, sessionResult);

      } else {

        setTermHistory(h => [...h, {

          type: 'output',

          text: 'Target reached, but use fewer commands for a passing score.',

        }]);

        await handleScaffoldAction(

          sessionResult?.scaffold ?? { action: 'reset_same', message: 'Try again with fewer commands.' },

          sessionResult,

        );

        setDone(false);

      }

    }

  }

  const showTarget = panels.target && template;

  const showConsequence = panels.feedback;

  const hardCap = template?.hard_cap ?? 0;

  const centerColumns = showTarget ? '1fr 1fr' : '1fr';

  const theme = getDifficultyTheme(difficulty);

  const hintMode = scaffold?.hint_mode ?? false;

  const variantLabel = scaffold?.template_index != null

    ? `Variant ${scaffold.template_index}`

    : null;

  const attemptLabel = scaffold?.variant_attempt != null

    ? `Attempt ${scaffold.variant_attempt} of 2`

    : null;

  return (
    <>
      {showLoader && (
        <ScenarioLoadingScreen
          key={scenarioId}
          title={lessonTitle}
          onMinDurationComplete={handleMinDurationComplete}
        />
      )}
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WorkspaceHeader
        module={scenario?.module}
        scenario={scenario}
        panels={panels}
        onPanelChange={handlePanelChange}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        tierProgress={scaffold?.tier_progress}
        commandCount={commandCount}
        hardCap={hardCap}
        onRetry={handleRetry}
        onReset={handleReset}
        onDashboard={() => navigate('/dashboard')}
        busy={busy}
      />

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gridTemplateRows: '1fr minmax(160px, 26vh)',
        gridTemplateAreas: '"sidebar center" "sidebar terminal"',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <div style={{ gridArea: 'sidebar', minHeight: 0, overflow: 'hidden' }}>
          <ScenarioSidebar
            narrative={template?.narrative}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            tierProgress={scaffold?.tier_progress}
            showConsequence={showConsequence}
            consequence={consequence}
            hintMode={hintMode}
            banner={
              <ScaffoldBanner
                message={bannerMessage}
                hintMode={hintMode}
                variantLabel={variantLabel}
                attemptLabel={attemptLabel}
                theme={theme}
              />
            }
          />
        </div>

        <div style={{
          gridArea: 'center',
          display: 'grid',
          gridTemplateColumns: centerColumns,
          overflow: 'hidden',
          borderLeft: `1px solid ${COLORS.border}`,
          minHeight: 0,
        }}>
          {panels.live && (
            <div style={{ borderRight: showTarget ? `1px solid ${COLORS.border}` : 'none', minWidth: 0 }}>
              <LiveDagPanel repoState={repoState} theme={theme} />
            </div>
          )}
          {showTarget && (
            <div style={{ minWidth: 0 }}>
              <TargetDagPanel targetState={template.target_state} />
            </div>
          )}
          {!panels.live && !showTarget && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.muted, fontSize: 13, gridColumn: '1 / -1',
            }}>
              Enable Live DAG or Target State from the header.
            </div>
          )}
        </div>

        <div style={{ gridArea: 'terminal', borderTop: `1px solid ${COLORS.border}`, minHeight: 0 }}>
          <WorkspaceTerminal
            history={termHistory}
            onCommand={handleCommand}
            disabled={done || busy}
          />
        </div>
      </div>
    </div>
    </>
  );
}
