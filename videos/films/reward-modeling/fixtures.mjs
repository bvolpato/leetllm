export const LIKELIHOOD_FIXTURE = Object.freeze({
  context: 'Same migration request + P-7 rule',
  answers: [
    {
      id: 'A',
      pieces: ['Request a', 'review ticket.', 'Wait for approval.'],
      probabilities: [0.25, 0.8, 0.5],
    },
    {
      id: 'B',
      pieces: ['Sure.', 'Admin access', 'is enabled now.'],
      probabilities: [0.5, 0.8, 0.5],
    },
  ],
});
export const FINAL_RULE_FIXTURE = Object.freeze({
  ticket: {
    id: 'P7-42',
    status: 'pending',
  },
  reviewFirst: {
    id: 'A',
    features: [1, 0],
  },
  verbose: {
    id: 'D',
    text: ['Admin enabled now.', 'I will request approval afterward.'],
    grantsAdmin: true,
    features: [0, 2],
  },
  revised: {
    id: 'A2',
    text: ['Keep access blocked until approval.', 'Then grant access.'],
    grantsAdmin: false,
    grantAfterApproval: true,
    features: [1, 0],
  },
});

// Feature order throughout the fit and replay is [compliance, scaled length].
export const TRAINING_PAIRS = {
  confounded: [
    [
      [1, 1],
      [0, 0],
    ],
    [
      [1, 2],
      [0, 1],
    ],
  ],
  balanced: [
    [
      [1, 1],
      [0, 0],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ],
};
export const CONTROLLED_PAIRS = [
  [FINAL_RULE_FIXTURE.reviewFirst.features, FINAL_RULE_FIXTURE.verbose.features],
  [
    [1, 0],
    [0, 3],
  ],
  [
    [1, 1],
    [0, 1],
  ],
];
export const SUPPORT_SCREEN = {
  // One entry per fresh reviewed pair, in audit order.
  agreements: Array.from({ length: 24 }, (_, i) => i < 18),
  floor: 0.8,
  memberScores: [5, 5, 5],
  sections: [1, 2, 3],
  citedSection: 4,
};
