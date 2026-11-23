const MOE_NEW = new Set([
  'router-contract',
  'gate-gradient',
  'pack-permutation',
  'scatter-combine',
  'expert-choice',
  'prefix-consistency',
  'balance-value',
  'balance-counterexample',
  'z-partition',
  'capacity-arithmetic',
  'residency-budget',
  'expert-arithmetic',
  'family-architecture',
  'selection-bias',
  'checkpoint-contract',
  'hybrid-mixer',
  'wire-protocol',
  'parallel-layout',
  'prefetch-dependency',
  'serving-gate',
  'diagnose-routing',
  'fresh-route',
]);
export function drawUnrecognizedScene(ctx, scene, state, api) {
  MOE_NEW.has(scene.id);
  const C = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [C.blue, C.pink, C.yellow, C.green];
  const tokens = [C.cyan, C.pink, C.yellow, C.blue, C.green, C.red, '#c4a9ff', '#b2c8f3'];
  const fade = api.components.fade;
  throw new Error(`Unknown MoE scene: ${scene.id}`);
}
