import { done, sentence } from '../construction.mjs';

const gpu = [250, 446];
const relay = [590, 446];
const nicA = [665, 723];
const nicB = [1255, 723];
const destination = [1670, 446];
const direct = [gpu, [250, 723], nicA, nicB, [1670, 723], destination];
const pxn = [gpu, relay, [590, 723], nicA, nicB, [1670, 723], destination];

function packetPosition(points, p) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = p * lengths.reduce((a, b) => a + b, 0);
  for (const [i, length] of lengths.entries()) {
    if (left <= length) {
      const t = left / length;
      return points[i].map((v, j) => v + t * (points[i + 1][j] - v));
    }
    left -= length;
  }
  return points.at(-1);
}

export function drawNetworkPath(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('nc-network-path-mechanism', () => {
    const viaPeer = state.beat === 1;
    const route = viaPeer ? pxn : direct;
    const travel = viaPeer ? sentence(state, scene.id, 1, 1) : sentence(state, scene.id, 0, 2);
    for (const [x, name] of [
      [112, 'Host A'],
      [1145, 'Host B'],
    ]) {
      api.rect(ctx, x, 285, 654, 552, C.panel, C.muted, 12);
      api.text(ctx, name, x + 38, 348, 42, C.ink);
    }
    api.line(ctx, ...gpu, ...relay, C.muted, 3);
    for (let i = 1; i < route.length; i++) api.line(ctx, ...route[i - 1], ...route[i], C.cyan, 5);
    const nodes = [
      [gpu, 'GPU R2'],
      [relay, 'Peer GPU'],
      [nicA, 'NIC'],
      [nicB, 'NIC'],
      [destination, 'GPU R3'],
    ];
    for (const [[x, y], name] of nodes) {
      api.circle(ctx, x, y, 13, C.bg, C.ink, 3);
      api.text(ctx, name, x, y - 28, 33, C.ink, 'center');
    }
    api.text(ctx, 'Local GPU fabric', 420, 501, 30, viaPeer ? C.cyan : C.muted, 'center');
    api.text(ctx, 'PCIe', viaPeer ? 550 : 289, 637, 32, C.cyan, viaPeer ? 'right' : 'left');
    api.text(ctx, 'PCIe', 1624, 637, 32, C.cyan, 'right');
    api.text(ctx, 'IB or RoCE', 960, 681, 34, C.ink, 'center');
    const packet = packetPosition(route, travel);
    api.circle(ctx, ...packet, 18, C.yellow, C.bg, 3);
    api.text(ctx, '●  Slot 2    3333', 152, 963, 40, C.yellow);
    const detail =
      viaPeer && done(state, scene.id, 1, 2)
        ? 'GPUDirect RDMA on this path'
        : viaPeer
          ? 'Sender reaches the NIC through its peer'
          : 'Illustrative two-host route';
    api.text(ctx, detail, 1730, 963, 37, C.ink, 'right');
  });
}
export default {
  id: 'network-path',
  draw: drawNetworkPath,
  cues: [
    'nc-network-path-b0-s0',
    'nc-network-path-b0-s1',
    'nc-network-path-b0-s2',
    'nc-network-path-b0-s3',
    'nc-network-path-b1-s0',
    'nc-network-path-b1-s1',
    'nc-network-path-b1-s2',
    'nc-network-path-b1-s3',
  ],
};
