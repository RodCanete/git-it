/** Accent palette per workspace difficulty tier */
export const DIFFICULTY_THEMES = {
  easy: {
    accent: '#01C38D',
    accentDim: 'rgba(1,195,141,0.14)',
    accentGlow: 'rgba(1,195,141,0.28)',
    completed: '#01C38D',
  },
  medium: {
    accent: '#F5A623',
    accentDim: 'rgba(245,166,35,0.14)',
    accentGlow: 'rgba(245,166,35,0.28)',
    completed: '#01C38D',
  },
  hard: {
    accent: '#FF5A6A',
    accentDim: 'rgba(255,90,106,0.14)',
    accentGlow: 'rgba(255,90,106,0.28)',
    completed: '#01C38D',
  },
};

const TIER_ORDER = { easy: 0, medium: 1, hard: 2 };

export function getDifficultyTheme(difficulty) {
  return DIFFICULTY_THEMES[difficulty] ?? DIFFICULTY_THEMES.easy;
}

export function getTierStatus(tier, currentDifficulty, tierProgress = null) {
  if (tierProgress) {
    if (tier === 'easy' && tierProgress.easy_completed) return 'completed';
    if (tier === 'medium' && tierProgress.medium_completed) return 'completed';
    if (tier === 'hard' && tierProgress.hard_completed) return 'completed';
    if (tier === 'easy') return currentDifficulty === 'easy' ? 'current' : 'upcoming';
    if (tier === 'medium') {
      if (!tierProgress.easy_completed) return 'locked';
      return currentDifficulty === 'medium' ? 'current' : 'upcoming';
    }
    if (tier === 'hard') {
      if (!tierProgress.medium_completed) return 'locked';
      return currentDifficulty === 'hard' ? 'current' : 'upcoming';
    }
  }

  const current = TIER_ORDER[currentDifficulty] ?? 0;
  const tierIdx = TIER_ORDER[tier] ?? 0;
  if (tierIdx < current) return 'completed';
  if (tierIdx === current) return 'current';
  return 'upcoming';
}

export function isTierUnlocked(tier, tierProgress) {
  if (!tierProgress) return tier === 'easy';
  if (tier === 'easy') return true;
  if (tier === 'medium') return tierProgress.easy_completed;
  if (tier === 'hard') return tierProgress.medium_completed;
  return false;
}
