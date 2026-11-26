// Scene 10: output: Same dw=0.05 weight error: predict x=0.1 vs x=2.0 -> AFTER quiet-output / large-output reveal 0.005 vs 0.100 (20x larger!).
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

export default function output(s, c) {
  const showQuiet = s.value(0); // withheld until quiet-output!
  const showActive = s.value(0); // withheld until large-output!

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Activation Amplification:', 'How Input Size Scales Rounding Error'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const q = showQuiet.value;
    const act = showActive.value;

    const barX = -400;
    const maxW = 920;

    const nodes = [
      txt(
        'FIXED WEIGHT ROUNDING ERROR:  dw = 0.05  |  OUTPUT SHIFT:  dy = dw · x',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Quiet channel x = 0.1
      txt('Quiet channel (x = 0.1)', -855, -95, 28, ROLE.grid, 'mono', 'left').opacity(alpha),
      lumBar(barX, -95, q > 0.35 ? maxW * 0.05 : 22, 46, ROLE.grid, {
        opacity: alpha * (0.48 + 0.52 * q),
        maxTrackW: maxW,
      }),
      txt(
        q > 0.35 ? 'dy = 0.005' : 'dy = ?  (predict)',
        barX + maxW + 28,
        -95,
        28,
        q > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // Active channel x = 2.0
      txt('Active channel (x = 2.0)', -855, 55, 28, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, 55, act > 0.35 ? maxW * 1.0 : 22, 46, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * act),
        maxTrackW: maxW,
      }),
      txt(
        act > 0.35 ? 'dy = 0.100  (20x!)' : 'dy = ?  (predict)',
        barX + maxW + 28,
        55,
        28,
        act > 0.35 ? ROLE.err : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill(
        act > 0.35
          ? 'Same 0.05 weight shift causes 20x more output error on x = 2.0 -> accuracy depends on real inputs!'
          : 'With identical weight error dw = 0.05, which activation moves the output more: x = 0.1 or x = 2.0?',
        0,
        235,
        {
          w: 1620,
          h: 78,
          color: act > 0.35 ? ROLE.err : ROLE.gold,
          fill: act > 0.35 ? '#321420' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'linear-product', (d) => s.play(showQuiet.to(0, { duration: d })));
  playCue(s, c, 'input-error', (d) => s.play(showQuiet.to(0, { duration: d })));
  playCue(s, c, 'quiet-input', (d) => s.play(showQuiet.to(0.25, { duration: d })));
  playCue(s, c, 'quiet-output', (d) => s.play(showQuiet.to(1, { duration: d })), { after: true });
  playCue(s, c, 'active-input', (d) => s.play(showActive.to(0.25, { duration: d })));
  playCue(s, c, 'large-output', (d) => s.play(showActive.to(1, { duration: d })), { after: true });
}
