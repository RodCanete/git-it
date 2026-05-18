import { useRef, useState } from 'react';
import { createSession, endSession, logCommand } from '../api/queries';

export default function useSession() {
  const sessionIdRef = useRef(null);
  const countRef = useRef(0);
  const [commandCount, setCommandCount] = useState(0);

  async function startSession(scenarioId, templateId) {
    const session = await createSession({ scenario: scenarioId, template: templateId });
    sessionIdRef.current = session.id;
    countRef.current = 0;
    setCommandCount(0);
    return session;
  }

  async function recordCommand(command, wasValid) {
    if (!sessionIdRef.current) return 0;
    countRef.current += 1;
    setCommandCount(countRef.current);
    await logCommand(sessionIdRef.current, { command, was_valid: wasValid });
    return countRef.current;
  }

  function getCommandCount() {
    return countRef.current;
  }

  function resetCommandCount() {
    countRef.current = 0;
    setCommandCount(0);
  }

  async function finishSession(targetAchieved, terminatedByCap = false, difficultyTier = 'easy') {
    if (!sessionIdRef.current) return null;
    const result = await endSession(sessionIdRef.current, {
      commands_used: countRef.current,
      target_achieved: targetAchieved,
      terminated_by_cap: terminatedByCap,
      difficulty_tier: difficultyTier,
    });
    sessionIdRef.current = null;
    return result;
  }

  return { startSession, recordCommand, finishSession, commandCount, getCommandCount, resetCommandCount };
}
