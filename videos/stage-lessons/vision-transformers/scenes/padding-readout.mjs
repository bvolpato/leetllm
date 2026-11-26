// Scene 18: padding-readout: Unmasked zero keys steal softmax mass ([1.606, 0.406] -> [0.913, 0.231] -> restored).
import {
  COSMOS,
  PAD_0,
  PAD_MASKED,
  PAD_UNMASKED,
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

export default function paddingReadout(s, c) {
  const stage = s.value(0); // 0=valid 2, 1=append 4 unmasked, 2=mask before softmax
  const showFooter = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a142622');
  const title = heroTitle(['A Zero Value Still Changes', 'the Attention Denominator'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(stage.value);
    const ft = showFooter.value;
    const cur = st === 0 ? PAD_0 : st === 1 ? PAD_UNMASKED : PAD_MASKED;
    const statusColor = st === 1 ? ROLE.warn : ROLE.ok;
    const barX = -320;
    const maxW = 720;

    const nodes = [
      txt(
        'KEY SLOTS SEEN BY SOFTMAX (e^0 = 1 UNLESS MASKED TO -INF)',
        -855,
        -220,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),

      // 2 Valid slots + 4 zero-pad slots
      chipPill('Valid 0', -755, -135, { w: 195, h: 70, color: ROLE.ok, size: 28, opacity: alpha }),
      chipPill('Valid 1', -535, -135, { w: 195, h: 70, color: ROLE.ok, size: 28, opacity: alpha }),
    ];

    for (let i = 0; i < 4; i++) {
      const cx = -270 + i * 220;
      const active = st >= 1;
      const masked = st >= 2;
      nodes.push(
        chipPill(masked ? 'MASKED' : 'Zero Pad', cx, -135, {
          w: 195,
          h: 70,
          color: masked ? ROLE.ok : active ? ROLE.warn : COSMOS.rule,
          fill: masked ? '#102921' : active ? '#321622' : '#0e1526',
          size: 26,
          glow: active ? 8 : 0,
          opacity: alpha * (active ? 1 : 0.3),
        }),
      );
    }

    // Readout bars (coord 0 & coord 1)
    nodes.push(
      txt(
        st === 0
          ? '2 VALID PATCHES ONLY (BASELINE)'
          : st === 1
            ? '4 UNMASKED ZERO KEYS APPENDED: PROBABILITY MASS STOLEN!'
            : '4 ZERO KEYS MASKED BEFORE SOFTMAX: EXACT READOUT RESTORED!',
        -855,
        -10,
        28,
        statusColor,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Readout x0', -855, 80, 30, statusColor, 'mono', 'left').opacity(alpha),
      lumBar(barX, 80, (cur.output[0] / 2.0) * maxW, 38, statusColor, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(cur.output[0].toFixed(3), barX + maxW + 30, 80, 36, statusColor, 'mono', 'left')
        .glow(8, statusColor)
        .opacity(alpha),

      txt('Readout x1', -855, 175, 30, ROLE.patch, 'mono', 'left').opacity(alpha),
      lumBar(barX, 175, (cur.output[1] / 2.0) * maxW, 38, ROLE.patch, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(cur.output[1].toFixed(3), barX + maxW + 30, 175, 36, ROLE.patch, 'mono', 'left').opacity(
        alpha,
      ),

      txt(
        ft > 0.3
          ? 'Also strip padded query outputs from pooling/bridge; reject all-masked inputs'
          : 'Zero-valued key has finite score 0 -> exp(0) = 1 enters the denominator',
        0,
        305,
        28,
        ft > 0.3 ? ROLE.pos : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'padding-readout-beat-0', (d) => s.play(stage.to(0, { duration: d })));
  playCue(s, c, 'padding-readout-beat-1', (d) => s.play(stage.to(0, { duration: d })));
  playCue(s, c, 'padding-append', (d) => s.play(stage.to(1, { duration: d })));
  playCue(s, c, 'padding-repair', (d) => s.play(stage.to(2, { duration: d })));
  playCue(s, c, 'padding-readout-beat-2', (d) => s.play(showFooter.to(1, { duration: d })));
}
