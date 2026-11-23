import { sentence } from '../construction.mjs';

const devices = ['GPU0', 'GPU1', 'GPU2', 'GPU3', 'NIC0', 'NIC1'];
// The article's illustrative topology excerpt covers the four GPU rows.
const paths = [
  ['X', 'NV4', 'SYS', 'SYS', 'PIX', 'SYS'],
  ['NV4', 'X', 'SYS', 'SYS', 'PIX', 'SYS'],
  ['SYS', 'SYS', 'X', 'NV4', 'SYS', 'PIX'],
  ['SYS', 'SYS', 'NV4', 'X', 'SYS', 'PIX'],
];

export function drawTopologyMatrix(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('nc-topology-matrix-mechanism', () => {
    const b = state.beat;
    const p = (i) => sentence(state, scene.id, 0, i);
    const showingPCI = b === 0 && p(2) > 0 && p(3) === 0;
    const showingSYS = b === 0 && p(3) > 0;
    const col = showingPCI ? 4 : showingSYS ? 2 : 1;
    const x = (j) => 488 + 219 * j;
    const y = (i) => 423 + 102 * i;
    api.text(ctx, 'nvidia-smi topo -m', 178, 258, 39, C.ink, 'left', 'mono');
    api.text(ctx, 'Illustrative host', 1772, 258, 32, C.muted, 'right');
    devices.forEach((d, j) =>
      api.text(ctx, d, x(j), 343, 37, col === j ? C.yellow : C.muted, 'center'),
    );
    paths.forEach((row, i) => {
      api.text(ctx, devices[i], 320, y(i) + 15, 38, i === 0 ? C.ink : C.muted, 'right');
      row.forEach((v, j) => {
        const active = i === 0 && j === col;
        api.rect(ctx, x(j) - 100, y(i) - 40, 200, 80, C.panel, active ? C.yellow : C.muted, 6);
        api.text(ctx, v, x(j), y(i) + 15, 42, active ? C.yellow : C.ink, 'center', 'mono');
      });
    });
    const path = showingPCI
      ? 'GPU0 → NIC0   ·   at most one PCIe switch'
      : showingSYS
        ? 'GPU0 → GPU2   ·   crosses a NUMA boundary'
        : 'GPU0 → GPU1   ·   four bonded NVLinks';
    api.text(ctx, path, 960, 875, 42, C.yellow, 'center');
    const next =
      b === 0
        ? showingPCI
          ? 'PXB crosses multiple PCIe switches. PHB crosses a host bridge.'
          : showingSYS
            ? 'NODE stays within one NUMA node.'
            : 'Path class reported by the driver'
        : b === 1
          ? 'Achieved bandwidth: unmeasured'
          : 'Inventory: GPU identity, driver, CUDA, NCCL, host, rank mapping';
    api.text(ctx, next, 960, 984, 34, C.muted, 'center');
  });
}
export default {
  id: 'topology-matrix',
  draw: drawTopologyMatrix,
  cues: [
    'nc-topology-matrix-b0-s0',
    'nc-topology-matrix-b0-s1',
    'nc-topology-matrix-b0-s2',
    'nc-topology-matrix-b0-s3',
    'nc-topology-matrix-b1-s0',
    'nc-topology-matrix-b1-s1',
    'nc-topology-matrix-b1-s2',
    'nc-topology-matrix-b1-s3',
    'nc-topology-matrix-b2-s0',
    'nc-topology-matrix-b2-s1',
    'nc-topology-matrix-b2-s2',
  ],
};
