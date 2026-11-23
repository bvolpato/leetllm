import { book, enc } from '../fixtures.mjs';
import { codesFrame, dist, vqGradientSnapshot } from '../model.mjs';
import { box, cueProgress, equation, text } from '../defaults.mjs';
export function drawCodes(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    F = components.fade;
  const vector = (values) => '[' + values.map((value) => Number(value.toFixed(4))).join(', ') + ']';
  const transfer = (
    source,
    target,
    progress,
    color = themeColors.green,
    particleRadius = 8,
    clearTip = false,
  ) => {
    if (!clearTip)
      return teaching.transfer({
        source: {
          shape: source,
          opacity: 1,
        },
        target: {
          shape: target,
          opacity: 1,
        },
        progress,
        color,
        width: 4,
        margin: 4,
        particle: {
          radius: 8,
          fill: color,
        },
      });
    const route = teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      progress: 1,
      color,
      width: 4,
      margin: 4,
      particle: {
        radius: 8,
        fill: color,
      },
    });
    const amount = api.clamp(progress);
    if (amount > 0 && amount < 1) {
      const length = Math.hypot(route.to.x - route.from.x, route.to.y - route.from.y);
      const safeProgress = Math.max(0, 1 - (particleRadius + 14) / length);
      const particleProgress = Math.min(amount, safeProgress);
      const opacity = amount <= safeProgress ? 1 : api.clamp((1 - amount) / (1 - safeProgress));
      F(opacity, () =>
        components.particle({
          points: [route.from, route.to],
          progress: particleProgress,
          radius: particleRadius,
          fill: color,
        }),
      );
    }
    return route;
  };
  {
    const current = codesFrame(currentBeat, progress2, state.cues);
    if (currentBeat === 1) {
      const snapshot = vqGradientSnapshot();
      text(
        ctx,
        api,
        '2D gradient toy · D(e) = θ ⊙ e · u is the encoder proposal',
        960,
        250,
        30,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        'θ = [1, 1] · target = [0.50, 0.10] · commitment = 0.25 · step = 0.1',
        960,
        310,
        27,
        themeColors.muted,
        'center',
      );
      const routes = [
        {
          id: 'vq-reconstruction-route',
          cue: 'vq-reconstruction-path',
          label: 'Reconstruction',
          loss: String.raw`\tfrac12\|D(e)-t\|^2`,
          color: themeColors.green,
          result: [
            'straight-through encoder gradient ' + vector(snapshot.reconstructionGradient),
            'decoder-weight gradient ' + vector(snapshot.decoderGradient),
          ],
        },
        {
          id: 'vq-codebook-route',
          cue: 'vq-codebook-path',
          label: 'Codebook loss',
          loss: String.raw`\|\operatorname{sg}[u]-e\|^2`,
          color: themeColors.cyan,
          result: [
            'selected-entry gradient ' + vector(snapshot.codebookGradient),
            'entry 1 → ' + vector(snapshot.nextEntry),
          ],
        },
        {
          id: 'vq-commitment-route',
          cue: 'vq-commitment-path',
          label: 'Commitment',
          loss: String.raw`0.25\|u-\operatorname{sg}[e]\|^2`,
          color: themeColors.yellow,
          result: [
            'encoder gradient adds ' + vector(snapshot.commitmentGradient),
            'commitment-only proposal → ' + vector(snapshot.commitmentOnlyEncoder),
            'combined encoder step → ' + vector(snapshot.nextEncoder),
          ],
        },
      ];
      routes.forEach((row, i) =>
        api.focus.target(row.id, () => {
          const y = 350 + i * 210,
            amount = cueProgress(ctx, api, row.cue, 0);
          const source = box(ctx, api, [], 180, y, 420, 145, row.color, 30);
          text(ctx, api, row.label, 390, y + 44, 31, row.color, 'center');
          equation(ctx, api, row.loss, 390, y + 111, 28, row.color, 'center');
          const target = box(
            ctx,
            api,
            amount === 1 ? row.result : ['gradient destination', '?'],
            850,
            y,
            920,
            145,
            row.color,
            30,
          );
          transfer(source, target, amount, row.color, 5, true);
        }),
      );
      text(
        ctx,
        api,
        'sg stops gradients · only the selected codebook entry changes',
        960,
        1010,
        29,
        themeColors.muted,
        'center',
      );
    } else if (current.mode === 'spatial') {
      text(ctx, api, 'Spatial stride = 8', 960, 235, 36, themeColors.ink, 'center');
      components.panel({
        x: 130,
        y: 290,
        width: 650,
        height: 405,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        padding: 20,
      });
      components.panel({
        x: 1140,
        y: 290,
        width: 650,
        height: 405,
        fill: themeColors.panel,
        stroke: themeColors.green,
        padding: 20,
      });
      text(ctx, api, '8×8 input positions', 455, 355, 30, themeColors.cyan, 'center');
      text(
        ctx,
        api,
        'Local crop of the 64×64 latent grid',
        1465,
        355,
        29,
        themeColors.green,
        'center',
      );
      const tileCell = 31,
        tileGap = 4,
        tileX = 308,
        tileY = 405,
        latentCell = 23,
        latentGap = 7,
        latentX = 1349,
        latentY = 405,
        selectedCell = 3 * 8;
      api.focus.target('input-position-patch', () => {
        for (let i = 0; i < 64; i++) {
          const active = i < current.revealedPatchPositions,
            row = Math.floor(i / 8),
            column = i % 8;
          const alpha = Math.round(255 * (1 - 0.8 * current.transportProgress))
              .toString(16)
              .padStart(2, '0'),
            color = themeColors.cyan + alpha;
          api.rect(
            ctx,
            tileX + column * (tileCell + tileGap),
            tileY + row * (tileCell + tileGap),
            tileCell,
            tileCell,
            active ? color : themeColors.panel,
            active ? themeColors.cyan : themeColors.border,
            3,
          );
        }
      });
      api.focus.target('latent-position-grid', () => {
        for (let i = 0; i < 64; i++) {
          const row = Math.floor(i / 8),
            column = i % 8,
            active = i === selectedCell && current.targetPositionVisible;
          api.rect(
            ctx,
            latentX + column * (latentCell + latentGap),
            latentY + row * (latentCell + latentGap),
            latentCell,
            latentCell,
            active ? themeColors.green : themeColors.panel,
            themeColors.green,
            1.5,
          );
        }
      });
      const selectedRow = Math.floor(selectedCell / 8),
        selectedColumn = selectedCell % 8;
      const target = {
          x: latentX + selectedColumn * (latentCell + latentGap),
          y: latentY + selectedRow * (latentCell + latentGap),
        },
        start = {
          x: 602,
          y: 545,
        },
        end = {
          x: target.x - 4,
          y: target.y + latentCell / 2,
        },
        amount = current.transportProgress;
      if (amount > 0)
        api.arrow(
          ctx,
          start.x,
          start.y,
          api.lerp(start.x, end.x, amount),
          api.lerp(start.y, end.y, amount),
          themeColors.green,
          6,
        );
      api.focus.target('spatial-patch-correspondence', () => {
        const side = api.lerp(8 * tileCell + 7 * tileGap, latentCell, amount),
          x = api.lerp(tileX, target.x, amount),
          y = api.lerp(tileY, target.y, amount);
        api.rect(
          ctx,
          x,
          y,
          side,
          side,
          amount > 0 && !current.targetPositionVisible ? '#8cdeb522' : '#00000000',
          themeColors.green,
          4,
        );
        if (amount > 0 && !current.targetPositionVisible) {
          for (let i = 1; i < 8; i++) {
            api.line(
              ctx,
              x + (i * side) / 8,
              y,
              x + (i * side) / 8,
              y + side,
              '#8cdeb588',
              2 * (1 - amount),
            );
            api.line(
              ctx,
              x,
              y + (i * side) / 8,
              x + side,
              y + (i * side) / 8,
              '#8cdeb588',
              2 * (1 - amount),
            );
          }
        }
      });
      text(ctx, api, 'one latent position', 1465, 665, 27, themeColors.muted, 'center');
      if (current.countVisible || current.costVisible)
        components.panel({
          x: 335,
          y: 750,
          width: 1250,
          height: 250,
          fill: themeColors.panel,
          stroke: themeColors.border,
          padding: 18,
        });
      if (current.countVisible)
        api.focus.target('spatial-position-count', () => {
          equation(
            ctx,
            api,
            String.raw`512\times512\longrightarrow64\times64`,
            960,
            830,
            52,
            themeColors.green,
            'center',
          );
          text(ctx, api, '64× fewer spatial positions', 960, 890, 32, themeColors.green, 'center');
        });
      if (current.costVisible)
        api.focus.target('spatial-cost-caveat', () =>
          text(
            ctx,
            api,
            'Channel width and numeric precision still set cost per position.',
            960,
            950,
            27,
            themeColors.muted,
            'center',
          ),
        );
    } else {
      const { compared, selected, snap } = current;
      const q = teaching.axes({
        x: 260,
        y: 380,
        width: 800,
        height: 400,
        xDomain: [-1.2, 1.2],
        yDomain: [-0.6, 1.2],
        equalUnits: true,
        xTicks: [-1, 0, 1],
        yTicks: [0, 1],
        xLabel: 'code coordinate 1',
        yLabel: 'code coordinate 2',
        fontSize: 34,
      });
      api.focus.target('codebook-entries', () =>
        teaching.scatter({
          plot: q,
          points: book.map((v) => ({
            x: v[0],
            y: v[1],
          })),
          color: themeColors.blue,
          radius: 14,
        }),
      );
      const at = q.point(api.lerp(enc[0], book[1][0], snap), api.lerp(enc[1], book[1][1], snap));
      api.focus.target('encoder-proposal', () =>
        api.circle(ctx, at.x, at.y, 9, themeColors.yellow),
      );
      text(ctx, api, 'encoder point = [0.72, −0.10]', 1410, 300, 30, themeColors.yellow, 'center');
      book.forEach((code, i) => {
        const color = selected && i === 1 ? themeColors.green : themeColors.blue,
          start = q.point(enc[0], enc[1]),
          end = q.point(code[0], code[1]),
          amount = api.clamp(compared - i);
        text(ctx, api, String(i), end.x + 20, end.y - 18, 28, color);
        if (amount > 0) {
          api.line(
            ctx,
            start.x,
            start.y,
            api.lerp(start.x, end.x, amount),
            api.lerp(start.y, end.y, amount),
            color,
            4,
          );
        }
        text(
          ctx,
          api,
          `entry ${i}  [${code.map((v) => v.toFixed(2)).join(', ')}]`,
          1160,
          405 + i * 120,
          29,
          color,
        );
        const term = (v) => (v < 0 ? `(${v})` : String(v));
        api.focus.target('codebook-distance-' + i, () =>
          equation(
            ctx,
            api,
            amount === 1
              ? `(${enc[0]}-${term(code[0])})^2+(${term(enc[1])}-${term(code[1])})^2=${dist[i].toFixed(4)}`
              : String.raw`d_${i}^2=?`,
            1160,
            455 + i * 120,
            27,
            color,
          ),
        );
      });
      api.circle(ctx, at.x, at.y, 9, themeColors.yellow);
      api.focus.target('nearest-code', () =>
        text(
          ctx,
          api,
          selected ? 'minimum distance → entry 1' : 'decoder entry = ?',
          1410,
          790,
          34,
          selected ? themeColors.green : themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'codes',
  draw: drawCodes,
  cues: [
    'code-compare',
    'code-snap',
    'vq-reconstruction-path',
    'vq-codebook-path',
    'vq-commitment-path',
    'latent-patch-b3-1',
    'latent-position-count-b3-2',
    'spatial-cost-caveat-b3-3',
  ],
};
