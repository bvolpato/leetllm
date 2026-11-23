import { budgetSnapshot } from '../construction.mjs';
import { card, foot, text, visualFocus } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  const route = (a, b, color = themeColors.cyan, progress = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      gap: 15,
      width: 3,
    });
    components.particle({
      points: [r.from, r.to],
      progress,
      fill: color,
      radius: 8,
    });
  };
  {
    if (beat !== 1) {
      const names = [
        'Proposal read-7',
        'Valid book B7',
        'Lena: lookup',
        'Library read',
        '3 copies',
      ];
      teaching.flowGraph({
        nodes: names.map((label, i) => ({
          focusTarget: 'transfer-call-' + i,
          id: `n${i}`,
          label,
          x: 130 + i * 345,
          y: 470,
          width: 290,
          height: 110,
          color: [
            themeColors.blue,
            themeColors.cyan,
            themeColors.yellow,
            themeColors.green,
            themeColors.pink,
          ][i],
          fontSize: 27,
        })),
        edges: names.slice(1).map((_, i) => ({
          from: `n${i}`,
          to: `n${i + 1}`,
          progress: beat === 0 ? q : 1,
        })),
      });
      visualFocus(ctx, api, 'transfer-observed-answer', () =>
        card(
          ctx,
          api,
          'read-7 · B7 · library service · just now\nRiver Walk has 3 copies available.',
          430,
          750,
          1060,
          themeColors.cyan,
          120,
          30,
        ),
      );
      foot(ctx, api, 'Call identity, admission and independently observed result remain linked');
    } else {
      const s = budgetSnapshot(progress2, state.cues);
      text(
        ctx,
        api,
        'Constructed runtime budget · reads have no write effect',
        960,
        270,
        34,
        themeColors.yellow,
        'center',
      );
      [
        ['attempts', `${s.attempts} / ${s.limit.attempts} attempts`],
        ['clock', `${Math.round(s.elapsed)} / ${s.limit.ms} ms`],
        ['spending', `$${s.spend.toFixed(2)} / $${s.limit.spend.toFixed(2)}`],
      ].forEach(([id, label], i) =>
        visualFocus(ctx, api, 'transfer-' + id, () =>
          card(
            ctx,
            api,
            label,
            170 + 590 * i,
            320,
            450,
            s.stopped ? themeColors.pink : themeColors.cyan,
            85,
            31,
          ),
        ),
      );
      visualFocus(ctx, api, 'transfer-first-attempt', () =>
        card(
          ctx,
          api,
          'read-7 · lookup B7 · ' +
            (s.firstFailed
              ? 'transport failed · 400 ms'
              : s.reserved
                ? 'attempt reserved → dispatched'
                : 'waiting for reservation'),
          220,
          455,
          1480,
          s.firstFailed ? themeColors.pink : themeColors.blue,
          75,
          28,
        ),
      );
      visualFocus(ctx, api, 'transfer-timeout-state', () =>
        card(
          ctx,
          api,
          'read-8 · ' +
            (s.stopped
              ? 'timed out · stop; third attempt blocked'
              : s.second
                ? 'reserved → running; late replies excluded'
                : 'not dispatched'),
          220,
          550,
          1480,
          s.stopped ? themeColors.pink : themeColors.yellow,
          75,
          28,
        ),
      );
      if (s.reads)
        text(ctx, api, 'Separate scheduling examples', 960, 665, 26, themeColors.muted, 'center');
      if (s.reads) {
        text(ctx, api, 'Independent authorized reads', 520, 700, 29, themeColors.cyan, 'center');
        const a = visualFocus(ctx, api, 'transfer-parallel-reads', () =>
            card(ctx, api, 'Availability B7', 160, 750, 370, themeColors.blue, 80, 28),
          ),
          z = visualFocus(ctx, api, 'transfer-parallel-reads', () =>
            card(ctx, api, 'Library hours', 160, 865, 370, themeColors.blue, 80, 28),
          ),
          join = visualFocus(ctx, api, 'transfer-parallel-reads', () =>
            card(ctx, api, 'Join results', 660, 805, 250, themeColors.cyan, 80, 27),
          );
        visualFocus(ctx, api, 'transfer-parallel-reads', () => {
          route(a, join, themeColors.cyan, 1);
          route(z, join, themeColors.cyan, 1);
        });
      }
      if (s.writes) {
        text(ctx, api, 'Dependent writes · same hold', 1430, 700, 29, themeColors.yellow, 'center');
        const a = visualFocus(ctx, api, 'transfer-ordered-writes', () =>
            card(ctx, api, 'Create hold B7', 1040, 805, 320, themeColors.green, 85, 27),
          ),
          z = visualFocus(ctx, api, 'transfer-ordered-writes', () =>
            card(ctx, api, 'Cancel that hold', 1460, 805, 320, themeColors.pink, 85, 27),
          );
        visualFocus(ctx, api, 'transfer-ordered-writes', () => route(a, z, themeColors.yellow, 1));
      }
      text(
        ctx,
        api,
        s.stopped
          ? 'Budget exhausted · attempts and failures retained'
          : 'Reserve before dispatch · retain every attempted call',
        960,
        1030,
        29,
        s.stopped ? themeColors.pink : themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-beat-1-focus-1',
    'transfer-beat-2-focus-1',
    'transfer-reserve-attempt',
    'transfer-count-failure',
    'transfer-timeout',
    'transfer-independent-reads',
    'transfer-order-writes',
    'transfer-beat-3-focus-1',
  ],
};
