export function panelDefaultsForDifficulty(difficulty) {
  const map = {
    easy: { live: true, target: true, feedback: true },
    medium: { live: true, target: true, feedback: false },
    hard: { live: true, target: false, feedback: false },
  };
  return map[difficulty] ?? map.easy;
}
