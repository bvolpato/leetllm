import { mpClamp } from '../arithmetic.mjs';
import { parallelRectangle, parallelText } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawUlyssesLayout(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-ulysses-layout-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q;
  api.focus.target('mp-ulysses-layout-mechanism', () => {
    const returning = currentBeat > 0,
      qp = returning ? Q('return', 1) : Q('transpose', 0),
      position = Math.min(32, qp * 32),
      settled = Math.floor(position),
      fraction = position - settled;
    parallelText(
      ctx,
      api,
      'Toy layout: 8 tokens × 4 heads on 4 existing ranks',
      960,
      300,
      31,
      themeColors.ink,
      'center',
    );
    parallelText(
      ctx,
      api,
      returning ? 'Sequence output ownership' : 'Local projected sequence slices',
      180,
      355,
      29,
      themeColors.blue,
    );
    parallelText(ctx, api, 'Full-sequence head slices', 1130, 355, 29, themeColors.cyan);
    const box = (token, head, left) => {
      const rank = left ? Math.floor(token / 2) : head,
        col = left ? (token % 2) * 4 + head : token;
      return {
        x: (left ? 180 : 1125) + col * 78,
        y: 450 + rank * 150,
        width: 67,
        height: 74,
      };
    };
    const atoms = Array.from(
        {
          length: 32,
        },
        (_, i) => ({
          token: Math.floor(i / 4),
          head: i % 4,
        }),
      ),
      obstacles = [];
    atoms.forEach(({ token, head }, index) => {
      for (const left of [true, false]) {
        const z = box(token, head, left),
          source = returning ? !left : left,
          visible = source ? index >= settled : index < settled,
          id = (left ? 'seq' : 'head') + '-' + index;
        parallelRectangle(
          ctx,
          api,
          z.x,
          z.y,
          z.width,
          z.height,
          [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][head],
          themeColors.bg,
        );
        if (visible && !(index === settled && fraction > 0))
          parallelText(
            ctx,
            api,
            't' + token + 'h' + head,
            z.x + z.width / 2,
            z.y + 47,
            20,
            [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][head],
            'center',
          );
        if (!(index === settled))
          obstacles.push({
            id,
            bounds: z,
          });
      }
    });
    if (settled < 32 && fraction > 0) {
      const atom = atoms[settled],
        source = box(atom.token, atom.head, !returning),
        target = box(atom.token, atom.head, returning),
        col = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][atom.head];
      const route = api.teaching.routedTransfer({
        id: 'ulysses-' + (returning ? 'return' : 'forward') + '-' + settled,
        source: {
          id: 'origin',
          shape: source,
          opacity: 1,
          side: 'top',
        },
        target: {
          id: 'destination',
          shape: target,
          opacity: 1,
          side: 'top',
        },
        corridor: {
          x: 145,
          y: 375,
          width: 1640,
          height: 640,
        },
        obstacles,
        color: col,
        width: 3,
        margin: 3,
        progress: fraction,
        marker: {
          radius: 31,
          fill: themeColors.bg,
          stroke: col,
          strokeWidth: 2,
        },
      });
      const at = route.positionAt(fraction);
      parallelText(ctx, api, 't' + atom.token + 'h' + atom.head, at.x, at.y + 7, 18, col, 'center');
    }
    parallelText(
      ctx,
      api,
      returning
        ? 'Attention stays head-local, then outputs transpose back'
        : 'All-to-all changes token/head ownership without dropping coordinates',
      960,
      1008,
      23,
      themeColors.yellow,
      'center',
    );
    parallelText(
      ctx,
      api,
      currentBeat === 2
        ? 'Nonduplicating layouts must divide the query and smaller KV-head counts.'
        : 'The moving coordinate retains the same token/head identity across its ownership change.',
      960,
      1045,
      24,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'ulysses-layout',
  draw: drawUlyssesLayout,
  cues: [
    'mp-ulysses-layout-0',
    'mp-ulysses-layout-project',
    'mp-ulysses-layout-transpose',
    'mp-ulysses-layout-1',
    'mp-ulysses-layout-attend',
    'mp-ulysses-layout-return',
    'mp-ulysses-layout-2',
    'mp-ulysses-layout-heads',
  ],
};
