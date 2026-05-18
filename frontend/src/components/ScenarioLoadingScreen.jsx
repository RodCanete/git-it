import { useCallback, useEffect, useState } from 'react';

const STEPS = [
  'Fetching scenario…',
  'Building repository…',
  'Wiring git engine…',
  'Preparing workspace…',
];

const DURATION_MS = 5000;

export default function ScenarioLoadingScreen({ title = 'Scenario', onMinDurationComplete }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const handleComplete = useCallback(() => {
    onMinDurationComplete?.();
  }, [onMinDurationComplete]);

  useEffect(() => {
    const start = performance.now();
    let rafId;

    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / DURATION_MS) * 100);
      setProgress(pct);
      setStepIndex(Math.min(STEPS.length - 1, Math.floor((elapsed / DURATION_MS) * STEPS.length)));

      if (elapsed < DURATION_MS) {
        rafId = requestAnimationFrame(tick);
      } else {
        handleComplete();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [handleComplete]);

  return (
    <div
      className="scenario-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading scenario"
    >
      <div className="scenario-loader__glow" aria-hidden="true" />
      <div className="scenario-loader__panel fade-in">
        <div className="scenario-loader__icon" aria-hidden>
          <span className="scenario-loader__branch scenario-loader__branch--left" />
          <span className="scenario-loader__commit" />
          <span className="scenario-loader__branch scenario-loader__branch--right" />
        </div>

        <p className="scenario-loader__eyebrow">GIT IT!</p>
        <h1 className="scenario-loader__title">{title}</h1>
        <p className="scenario-loader__step" key={stepIndex}>{STEPS[stepIndex]}</p>

        <div className="scenario-loader__track">
          <div
            className="scenario-loader__bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="scenario-loader__percent">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
