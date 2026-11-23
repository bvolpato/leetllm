export const REQUESTS = [
  {
    id: 1,
    method: 'server/discover',
    resource: 'capabilities',
  },
  {
    id: 2,
    method: 'tools/list',
    resource: 'catalog',
  },
  {
    id: 3,
    method: 'tools/call',
    resource: 'reranker-v17',
  },
];
export const RESPONSES = [
  {
    id: 3,
    result: {
      release: 'reranker-v17',
      state: 'healthy',
    },
  },
  {
    id: 1,
    result: {
      versions: ['2026-07-28'],
      capabilities: ['tools'],
    },
  },
  {
    id: 2,
    result: {
      tools: ['get_release_status', 'shift_traffic'],
    },
  },
];
export const PROTOCOL_VERSION = '2026-07-28';
export const VERSION_KEY = 'io.modelcontextprotocol/protocolVersion';
export const CAPABILITIES_KEY = 'io.modelcontextprotocol/clientCapabilities';
export const statusPayload = {
  release_id: 'reranker-v17',
  status: 'canary_clean',
  health: 'error_budget_ok',
};

// Minutes since midnight in the shift log. Observation times are source metadata.
export const readWindowMinutes = 5;
export const openingRead = { savedAt: 102, savedStatus: 'processing', now: 120 };
export function clockTime(minutes) {
  return [Math.floor(minutes / 60), minutes % 60].map((v) => String(v).padStart(2, '0')).join(':');
}

export const pauseRecord = Object.freeze({
  state: 'S7',
  principal: 'search-oncall',
  operation: 'rollback',
  target: statusPayload.release_id,
  expires: 130,
});
