const COMPLETE_TOOL_SCENES = new Set([
  'release-observation',
  'provider-linkage',
  'complete-batch',
  'strict-contract',
  'tool-choice',
  'scoped-read',
  'same-suite-reader',
  'promotion-policy',
  'intent-ledger',
  'parameter-boundaries',
  'error-classes',
  'repeated-proposal',
  'required-fan-in',
  'permission-before-ranking',
  'deferred-definitions',
  'trajectory-contract',
  'typed-release-evidence',
  'mcp-integration',
  'mcp-exposure',
  'fresh-comparison',
]);
export function drawUnrecognizedScene(ctx, scene, state, api) {
  COMPLETE_TOOL_SCENES.has(scene.id);
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  const route = (a, b, color = C.cyan, progress = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      gap: 15,
      width: 3,
    });
    c.particle({
      points: [r.from, r.to],
      progress,
      fill: color,
      radius: 8,
    });
  };
  throw new Error(`Unknown tool-use scene: ${scene.id}`);
}
