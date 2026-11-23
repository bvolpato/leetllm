import { cueProgress } from '../construction.mjs';
import { compressionFixture, encodeChunks } from '../model.mjs';
import { detailText } from '../defaults.mjs';
export function drawPqEncode(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (i) =>
    currentBeat < i
      ? 0
      : currentBeat > i
        ? 1
        : api.focus.progress('pq-encode-b' + (i + 1), api.phase(progress, 0.08, 0.7));
  const target = 'pq-encode-mechanism';
  api.focus.target(target, () => {
    if (currentBeat === 0) {
      const f = encodeChunks([1.8, 0.2, 0.1, 1.7]);
      const split = cueProgress(state, 'pq-split-chunks');
      const books = cueProgress(state, 'pq-codebooks');
      const reconstructed = state.cues?.['pq-reconstruct']?.phase === 'after';
      const original = f.chunks.map((chunk) => chunk.values.join(', ')).join('  |  ');
      let heading = split > 0 ? 'Four coordinates in two chunks' : 'Four original coordinates';
      if (split === 1) heading = 'Original vector    [' + original + ']';
      if (reconstructed) {
        heading = 'Code [' + f.ids.join(', ') + ']   →   [' + f.reconstructed.join(', ') + ']     Squared error ' + f.error2.toFixed(2);
      }
      detailText(
        ctx,
        api,
        heading,
        960,
        285,
        36,
        reconstructed ? themeColors.green : themeColors.yellow,
        'center',
      );
      if (split < 1) {
        const original = f.chunks.flatMap((chunk) => chunk.values);
        original.forEach((value, i) => {
          const pair = Math.floor(i / 2);
          const center = 410 + pair * 900;
          const x = api.lerp(524 + i * 270, center + (i % 2 ? 90 : -90), split);
          const color = split === 0 ? themeColors.ink : (pair ? themeColors.pink : themeColors.blue);
          detailText(ctx, api, String(value), x, 620, 69, color, 'center');
          api.line(ctx, x - 82, 665, x + 82, 665, color, 3);
        });
        detailText(ctx, api, 'One stored vector', 930, 827, 41, themeColors.muted, 'center');
        return;
      }
      f.chunks.forEach((chunk, j) => {
        const selected = state.cues?.[j === 0 ? 'pq-left-id' : 'pq-selected-ids']?.phase === 'after';
        const reach = cueProgress(state, j === 0 ? 'pq-left-link' : 'pq-selected-ids');
        const color = j ? themeColors.pink : themeColors.blue,
          x = 230 + j * 900,
          plot = api.teaching.axes({
            x,
            y: 414,
            width: 360,
            height: 360,
            equalUnits: true,
            xDomain: [-0.3, 2.3],
            yDomain: [-0.3, 2.3],
            xTicks: [0, 1, 2],
            yTicks: [0, 1, 2],
            fontSize: 23,
          });
        detailText(
          ctx,
          api,
          `Chunk ${j + 1}: [${chunk.values.join(', ')}]`,
          x + 180,
          380,
          33,
          color,
          'center',
        );
        const pt = plot.point(...chunk.values);
        api.circle(ctx, pt.x, pt.y, 11, themeColors.yellow);
        if (books > 0)
          compressionFixture().books[j].forEach((centroid, k) => {
            const z = plot.point(...centroid),
              chosen = selected && k === chunk.id,
              offset = [
                [-50, 70],
                [25, 70],
                [-35, -22],
                [25, -22],
              ][k];
            api.circle(ctx, z.x, z.y, 9, chosen ? themeColors.green : color);
            detailText(
              ctx,
              api,
              'c' + k,
              z.x + offset[0],
              z.y + offset[1],
              25,
              chosen ? themeColors.green : color,
            );
            if (k === chunk.id && reach > 0)
              api.line(
                ctx,
                pt.x,
                pt.y,
                api.lerp(pt.x, z.x, reach),
                api.lerp(pt.y, z.y, reach),
                chosen ? themeColors.green : themeColors.yellow,
                4,
              );
          });
        detailText(
          ctx,
          api,
          books > 0 ? 'Distance² to centroid' : 'Centroids appear next',
          x + 540,
          450,
          27,
          themeColors.muted,
          'center',
        );
        if (books > 0)
          chunk.distances.forEach((d, k) =>
            detailText(
              ctx,
              api,
              `c${k}: ${d.toFixed(2)}`,
              x + 540,
              510 + k * 70,
              30,
              selected && k === chunk.id ? themeColors.green : themeColors.muted,
              'center',
            ),
          );
        if (selected) {
          api.rect(ctx, x + 45, 824, 270, 80, themeColors.panel, themeColors.green, 6);
          detailText(
            ctx,
            api,
            'stored ID ' + chunk.id,
            x + 180,
            876,
            35,
            themeColors.green,
            'center',
          );
        }
      });
    } else if (currentBeat === 1) {
      const size = cueProgress(state, 'pq-code-budget') >= 1,
        oneByte = cueProgress(state, 'pq-byte-index') >= 1,
        shared = cueProgress(state, 'pq-shared-books') >= 1;
      detailText(
        ctx,
        api,
        'Separate real-size budget: 768 dimensions / 96 chunks',
        960,
        275,
        36,
        themeColors.yellow,
        'center',
      );
      for (let i = 0; i < 8; i++) {
        const x = 400 + i * 105;
        api.rect(ctx, x, 350, 85, 60, themeColors.panel, themeColors.blue, 2, 4);
        detailText(ctx, api, 'x' + i, x + 42.5, 390, 25, themeColors.blue, 'center');
      }
      detailText(ctx, api, 'One chunk: 8 coordinates', 960, 465, 32, themeColors.blue, 'center');
      if (oneByte) {
        for (let i = 0; i < 96; i++) {
          const x = 210 + (i % 16) * 95,
            y = 535 + Math.floor(i / 16) * 55;
          api.rect(ctx, x, y, 75, 40, themeColors.panel, themeColors.cyan, 1, 3);
          detailText(ctx, api, String(i), x + 37.5, y + 28, 20, themeColors.cyan, 'center');
        }
        detailText(
          ctx,
          api,
          'Byte slots 0…95 · centroid values depend on the trained codebooks',
          960,
          905,
          27,
          themeColors.muted,
          'center',
        );
      }
      detailText(
        ctx,
        api,
        size
          ? '3,072 raw bytes / 96 code bytes = 32×'
          : '256 possible centroid IDs → one byte per chunk',
        960,
        975,
        38,
        size ? themeColors.green : themeColors.ink,
        'center',
      );
      if (shared)
        detailText(
          ctx,
          api,
          'Shared codebooks: 96 × 256 × 8 × 4 = 768 KiB',
          960,
          1030,
          29,
          themeColors.yellow,
          'center',
        );
    } else {
      const angle = (Math.PI / 4) * cue(2),
        u = [2, 0],
        v = [0, 2],
        rotate = ([x, y]) => [
          Math.cos(angle) * x - Math.sin(angle) * y,
          Math.sin(angle) * x + Math.cos(angle) * y,
        ],
        U = rotate(u),
        V = rotate(v),
        P = ([x, y]) => ({
          x: 850 + x * 160,
          y: 760 - y * 160,
        });
      const origin = P([0, 0]),
        a = P(U),
        d = P(V);
      api.line(ctx, 350, 760, 1510, 760, themeColors.muted, 3);
      api.line(ctx, 850, 900, 850, 330, themeColors.muted, 3);
      api.arrow(ctx, origin.x, origin.y, a.x, a.y, themeColors.blue, 5);
      api.arrow(ctx, origin.x, origin.y, d.x, d.y, themeColors.pink, 5);
      api.line(ctx, a.x, a.y, d.x, d.y, themeColors.green, 4);
      detailText(
        ctx,
        api,
        'Square orthogonal rotation preserves L2 distance',
        960,
        270,
        36,
        themeColors.yellow,
        'center',
      );
      detailText(
        ctx,
        api,
        'Distance remains ' + Math.hypot(U[0] - V[0], U[1] - V[1]).toFixed(3),
        960,
        980,
        42,
        themeColors.green,
        'center',
      );
    }
  });
}
export default {
  id: 'pq-encode',
  draw: drawPqEncode,
  cues: [
    'pq-split-chunks',
    'pq-codebooks',
    'pq-left-link',
    'pq-left-id',
    'pq-selected-ids',
    'pq-reconstruct',
    'pq-encode-b2',
    'pq-eight-coordinates',
    'pq-byte-index',
    'pq-code-budget',
    'pq-shared-books',
    'pq-encode-b3',
  ],
};
