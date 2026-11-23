export const contracts = [
  {
    scene: 'earned-transfer',
    beat: 1,
    cue: 'fresh-context-answer',
    phrase: 'The combined context can establish the rule',
    has: (a) => a.labels.some((l) => l.text === 'Combined context: complete evidence'),
  },
  {
    scene: 'earned-transfer',
    beat: 1,
    cue: 'fresh-insufficient-result',
    phrase:
      'Keeping only the deadline and identifier fails evidence sufficiency, even though the retained hit still points to the right runbook',
    has: (a) => a.labels.some((l) => l.text === 'Condition omitted · insufficient retained text'),
  },
  {
    scene: 'earned-transfer',
    beat: 1,
    cue: 'fresh-parent-result',
    phrase:
      'Repair the same case by selecting a complete permitted parent that fits the available budget, or abstain when no sufficient context fits',
    has: (a) =>
      a.labels.some((l) => l.text === 'Complete permitted parent fits → evidence restored'),
  },
];
