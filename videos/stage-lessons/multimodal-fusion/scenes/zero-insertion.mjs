// Scene 12: zero-insertion: Shared-softmax zero dilution (2 -> 1 -> masked 2) vs Flamingo residual gate (intact -> +0.336*A).
import { fadeIn } from 'vizmatic/stage';
import {
  ATTN_OPEN,
  ATTN_ZERO,
  COSMOS,
  ROLE,
  TEXT_STATE,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function zeroInsertion(s, c) {
  const showInsert = s.value(0);
  const showNorm = s.value(0);
  const showHalved = s.value(0);
  const showMask = s.value(0);
  const openGate = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#2a163826');
  const title = heroTitle(['Where Does the', 'Zero Enter?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const eq = glowTex(String.raw`\frac{e^0}{e^0 + e^0} = \frac{1}{2}`, {
    x: 420,
    y: -395,
    size: 38,
    color: ROLE.gold,
    glow: 7,
  }).opacity(0);

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ins = showInsert.value;
    const nrm = showNorm.value;
    const hlv = showHalved.value;
    const msk = showMask.value;
    const opg = openGate.value;

    const textW = msk > 0.4 ? 1.0 : nrm > 0.4 ? 0.5 : 1.0;
    const visW = msk > 0.4 ? 0.0 : nrm > 0.4 ? 0.5 : 0.0;
    const readVal = msk > 0.4 ? 2.0 : hlv > 0.4 ? 1.0 : null;

    const nodes = [
      // Left side: Shared-softmax zero-K/V insertion (MPnP)
      txt('1. SHARED SOFTMAX (MPnP)', -455, -245, 28, ROLE.warn, 'mono', 'center').opacity(alpha),
      chipPill('Text Pos: score 0, V = 2.0', -455, -160, {
        w: 740,
        h: 66,
        color: ROLE.text,
        size: 26,
        opacity: alpha,
      }),
      chipPill(
        msk > 0.4
          ? 'Visual Pos: MASKED (-inf -> weight 0)'
          : ins > 0.2
            ? 'Visual Pos: K = 0, V = 0 (score 0, unmasked)'
            : 'Visual Pos: none inserted yet',
        -455,
        -75,
        {
          w: 740,
          h: 66,
          color: msk > 0.4 ? ROLE.ok : ins > 0.2 ? ROLE.warn : '#384c76',
          fill: msk > 0.4 ? '#0f2d24' : ins > 0.2 ? '#2c1422' : '#10182d',
          size: 26,
          glow: ins > 0.2 ? 10 : 4,
          opacity: alpha * (0.55 + 0.45 * ins),
        },
      ),

      // Softmax weight split bars (strictly withheld until mm-zero-normalize!)
      txt(
        nrm > 0.4
          ? msk > 0.4
            ? 'Weights: text 1.00 | visual 0.00 (masked)'
            : 'Weights: e^0 / (1 + 1) = 0.50 each!'
          : 'Unmasked zero key enters denominator -> ?',
        -825,
        15,
        26,
        msk > 0.4 ? ROLE.ok : nrm > 0.4 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-825, 70, nrm > 0.4 ? textW * 520 : 120, 32, ROLE.text, {
        opacity: alpha * (0.45 + 0.55 * nrm),
        maxTrackW: 520,
      }),
      txt(
        nrm > 0.4 ? `w_t=${textW.toFixed(1)}` : 'w_t=?',
        -280,
        70,
        26,
        ROLE.text,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-825, 122, nrm > 0.4 ? Math.max(8, visW * 520) : 120, 32, ROLE.warn, {
        opacity: alpha * (msk > 0.4 ? 0.3 : 0.45 + 0.55 * nrm),
        maxTrackW: 520,
      }),
      txt(
        nrm > 0.4 ? `w_v=${visW.toFixed(1)}` : 'w_v=?',
        -280,
        122,
        26,
        ROLE.warn,
        'mono',
        'left',
      ).opacity(alpha),

      // Output read pill (strictly withheld until mm-shared-result!)
      chipPill(
        readVal === null
          ? 'New Read = ?'
          : msk > 0.4
            ? 'Masked Read = 2.0 (restored!)'
            : '0.5(2) + 0.5(0) = 1.0  (HALVED!)',
        -455,
        225,
        {
          w: 740,
          h: 74,
          color: msk > 0.4 ? ROLE.ok : readVal === 1 ? ROLE.warn : ROLE.gold,
          fill: msk > 0.4 ? '#0f2d24' : readVal === 1 ? '#2c1422' : '#10182d',
          size: 28,
          glow: readVal !== null ? 14 : 6,
          opacity: alpha,
        },
      ),

      // Right side: Flamingo Separate Residual Gate
      txt('2. SEPARATE RESIDUAL GATE (FLAMINGO)', 455, -245, 28, ROLE.ok, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        opg > 0.2
          ? 'Gate alpha = 0.35 -> tanh = 0.336'
          : 'Gate alpha = 0.00 -> base text survives intact',
        455,
        -180,
        26,
        opg > 0.2 ? ROLE.ok : ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),

      ...TEXT_STATE.flatMap((base, idx) => {
        const y = -95 + idx * 104;
        const add = Math.tanh(0.35 * opg) * ATTN_ZERO.attended[idx];
        const bw = base * 480;
        const aw = add * 480;
        const fused = base + add;
        return [
          txt(`h${idx + 1}`, 95, y, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          rect(480, 38, { fill: '#10182d', stroke: '#27385f', width: 1.5, radius: 6 })
            .at(165 + 240, y)
            .opacity(alpha * 0.68),
          rect(bw, 36, { fill: ROLE.text, stroke: null, radius: 6 })
            .at(165 + bw * 0.5, y)
            .opacity(alpha),
          ...(aw > 3
            ? [
                rect(aw, 36, { fill: ROLE.ok, stroke: null, radius: 6 })
                  .at(165 + bw + aw * 0.5, y)
                  .glow(10, ROLE.ok)
                  .opacity(alpha),
              ]
            : []),
          txt(
            opg > 0.2 ? fused.toFixed(3) : base.toFixed(2),
            670,
            y,
            26,
            opg > 0.2 ? ROLE.ok : ROLE.text,
            'mono',
            'left',
          ).opacity(alpha),
        ];
      }),

      chipPill(
        opg > 0.3
          ? `Fused: [${ATTN_OPEN.fused.map((v) => v.toFixed(3)).join(', ')}]`
          : 'Separate softmax: zero gate never dilutes text',
        455,
        225,
        {
          w: 740,
          h: 74,
          color: ROLE.ok,
          fill: opg > 0.3 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: opg > 0.3 ? 12 : 5,
          opacity: alpha,
        },
      ),

      txt(
        'Subtract max score before exp() for stability; watch which denominator holds the zero',
        0,
        330,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'mm-insert-position', (d) => s.play(showInsert.to(1, { duration: d })));
  // Strict prediction withholding: reveal 0.5/0.5 weights, 1/2 eq, and halved 1.0 read only after Beat 1 cues!
  playCue(
    s,
    c,
    'mm-zero-normalize',
    (d) => {
      s.play(showNorm.to(1, { duration: d }));
      s.play(fadeIn(eq, { duration: d }));
    },
    { after: true },
  );
  playCue(s, c, 'mm-shared-result', (d) => s.play(showHalved.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'mm-mask-repair', (d) => s.play(showMask.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'mm-residual-open', (d) => s.play(openGate.to(1, { duration: d })), { dur: 0.9 });
}
