export const ids = [
  'intro',
  'pools',
  'retention',
  'placement',
  'transfers',
  'timings',
  'quality',
  'synthesis',
];
export const receipt = {
  done: true,
  prompt: 1000,
  cached: 600,
  promptNs: 200000000,
  output: 80,
  outputNs: 2000000000,
};
export const outputs = {
  baseline: [
    'rollback --target v6 --confirm',
    'Which node ID should I inspect?',
    '{"severity":"critical"}',
    'Use the nonexistent runbook Z9.',
  ],
  candidate: [
    'rollback --target v6',
    'Which node ID should I inspect?',
    '{"severity":"critical"}',
    'Unknown runbook; request human review.',
  ],
};
export const tests = [
  {
    id: 'Rollback flags',
    critical: true,
    check: (value) => /^rollback --target v6 --confirm$/.test(value.trim()),
  },
  {
    id: 'Missing node',
    critical: false,
    check: (value) => /which node id/i.test(value),
  },
  {
    id: 'Alert severity',
    critical: false,
    check: (value) => {
      try {
        return JSON.parse(value).severity === 'critical';
      } catch {
        return false;
      }
    },
  },
  {
    id: 'Unknown runbook',
    critical: false,
    check: (value) => /unknown runbook/i.test(value) && /human review/i.test(value),
  },
];
export const extendedIds = [
  'hardware-contract',
  'bandwidth-batch',
  'weight-payload',
  'cache-formula',
  'workspace-contract',
  'worksheet-evidence',
  'flag-semantics',
  'allocation-evidence',
  'transfer-comparison',
  'runner-contract',
  'serving-comparison',
  'private-boundary',
  'network-controls',
  'inventory-evidence',
  'timing-contract',
  'diagnostic-replay',
  'fresh-admission',
];
export const sentenceCounts = {
  'hardware-contract': [4, 4, 4],
  'bandwidth-batch': [5, 5],
  'weight-payload': [3, 4],
  'cache-formula': [5, 3, 5],
  'workspace-contract': [4, 4],
  'worksheet-evidence': [4, 4],
  'flag-semantics': [3, 4],
  'allocation-evidence': [4, 5, 4],
  'transfer-comparison': [3, 4],
  'runner-contract': [3, 4, 5],
  'serving-comparison': [3, 4],
  'private-boundary': [5, 4],
  'network-controls': [5, 4, 4],
  'inventory-evidence': [4, 4],
  'timing-contract': [6, 5],
  'diagnostic-replay': [4, 4],
  'fresh-admission': [6, 5],
};
