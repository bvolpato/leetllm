// Scene 18: effort-cutoff: Hard output cap (64 tokens) consumed entirely by hidden reasoning -> status=incomplete, empty text, billed 64 tok vs completed-but-wrong (5000 != 12000!).
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function effortCutoff(s, c) {
  const showCap = s.value(0);
  const showWrong = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Output Caps & Status Fields:', 'Incomplete Empty vs Complete Wrong'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cp = showCap.value;
    const wr = showWrong.value;

    const barX = -480;
    const maxW = 760;

    const nodes = [
      txt(
        'REASONING EFFORT GUIDES THINKING; HARD MAX_OUTPUT_TOKENS CAP CAN CUT IT OFF!',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      // Request 1: 64/64 hidden tokens -> incomplete
      txt('Req 1 (cap 64 tok)', -855, -95, 28, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, -95, (0.2 + 0.8 * cp) * maxW, 44, ROLE.err, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        cp > 0.35 ? '64/64 hidden -> INCOMPLETE!' : 'filling 64-tok cap',
        barX + maxW + 24,
        -95,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha),

      // Request 2: completed, answered 5000 instead of 12000
      txt('Req 2 (completed)', -855, 45, 28, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * wr),
      ),
      lumBar(barX, 45, maxW * 0.62, 44, ROLE.gold, {
        opacity: alpha * (0.48 + 0.52 * wr),
        maxTrackW: maxW,
      }),
      txt(
        wr > 0.35 ? 'Returned 5,000 (TRUE: 12,000!)' : 'status = completed',
        barX + maxW + 24,
        45,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * wr)),

      chipPill(
        wr > 0.35
          ? 'status=completed only proves generation finished, NOT correctness: always run the task verifier!'
          : 'Empty reply at cap=64 still bills 64 tokens -> inspect status before retrying, escalating, or stopping',
        0,
        225,
        {
          w: 1620,
          h: 78,
          color: wr > 0.35 ? ROLE.gold : ROLE.err,
          fill: wr > 0.35 ? '#261e10' : '#321420',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-effort-cutoff-0', (d) => s.play(showCap.to(0.2, { duration: d })));
  playCue(s, c, 'tt-effort-cutoff-1', (d) => s.play(showCap.to(0.6, { duration: d })));
  playCue(s, c, 'tt-hidden-cap', (d) => s.play(showCap.to(1, { duration: d })));
  playCue(s, c, 'tt-effort-cutoff-2', (d) => s.play(showWrong.to(0.5, { duration: d })));
  playCue(s, c, 'tt-completed-wrong', (d) => s.play(showWrong.to(1, { duration: d })));
}
