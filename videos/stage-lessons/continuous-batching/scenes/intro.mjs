// Scene 01: intro: A finishes "return a + b" on step 2 -> D takes open seat on step 3 alongside B & C.
import {
  CONT_TRACE,
  COSMOS,
  REQ_COLOR,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const finishA = s.value(0);
  const admitD = s.value(0);
  const showTrace = s.value(0);
  const showSix = s.value(0);

  const bgAura = aura(0, 0, 740, '#14345c28', '#14383222');
  const title = heroTitle(['Who Gets the Next', 'Decode Turn?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.a,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fA = finishA.value;
    const ad = admitD.value;
    const tr = showTrace.value;
    const sx = showSix.value;
    const visibleSteps = sx > 0.3 ? 6 : ad > 0.3 ? 3 : 2;

    const nodes = [
      txt(
        'ACTIVE GPU DECODE SEATS (3 CONCURRENT STREAMS)',
        -855,
        -225,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      // 6-step seat grid
      txt('STEP:', -855, -155, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    ];

    for (let t = 0; t < 6; t++) {
      nodes.push(
        txt(
          `${t + 1}`,
          -580 + t * 185,
          -155,
          28,
          t < visibleSteps ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    for (let seat = 0; seat < 3; seat++) {
      const y = -70 + seat * 105;
      nodes.push(txt(`Seat ${seat + 1}`, -855, y, 28, COSMOS.ink, 'mono', 'left').opacity(alpha));
      for (let t = 0; t < 6; t++) {
        const cx = -580 + t * 185;
        const cell = CONT_TRACE[t].slots[seat];
        const revealed = t < visibleSteps;
        const isDSeat = seat === 0 && t >= 2;
        const label =
          revealed && cell ? `${cell.id}${cell.generated}` : isDSeat && ad < 0.3 ? '?' : '-';
        const color = revealed && cell ? REQ_COLOR[cell.id] : isDSeat ? ROLE.d : COSMOS.rule;
        const fill = revealed && cell ? '#12223c' : '#0d1426';
        nodes.push(
          rect(155, 76, {
            fill,
            stroke: color,
            width: tr > 0.3 && seat === 0 ? 3.2 : 2.2,
            radius: 10,
          })
            .at(cx, y)
            .opacity(alpha * (revealed ? 1 : 0.32)),
          txt(label, cx, y, 30, revealed ? color : COSMOS.dim, 'mono', 'center').opacity(
            alpha * (revealed ? 1 : 0.45),
          ),
        );
      }
    }

    // Bottom status: A's completion line + waiting D queue chip
    nodes.push(
      chipPill(fA > 0.3 ? 'A: return a + b  [EOS]' : 'A: return a + _', -520, 260, {
        w: 580,
        h: 74,
        color: fA > 0.3 ? ROLE.ok : ROLE.a,
        fill: fA > 0.3 ? '#0f2d24' : '#10182d',
        size: 28,
        glow: fA > 0.3 ? 10 : 6,
        opacity: alpha,
      }),
      chipPill(
        ad > 0.3 ? 'D admitted on Step 3 (Continuous!)' : 'Waiting Queue: D ready (needs 1 seat)',
        320,
        260,
        {
          w: 760,
          h: 74,
          color: ad > 0.3 ? ROLE.ok : ROLE.d,
          fill: ad > 0.3 ? '#0f2d24' : '#2a2110',
          size: 28,
          glow: 10,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mixed-requests', (d) => s.play(finishA.to(0.15, { duration: d })));
  playCue(s, c, 'finished-seat', (d) => s.play(finishA.to(1, { duration: d })));
  // Strict prediction withholding: reveal D joining Seat 1 only on admit-replacement!
  playCue(s, c, 'admit-replacement', (d) => s.play(admitD.to(1, { duration: d })), { after: true });
  playCue(s, c, 'generation-boundary', (d) => s.play(admitD.to(1, { duration: d })));
  playCue(s, c, 'three-seats', (d) => s.play(showTrace.to(1, { duration: d })));
  playCue(s, c, 'intro-six', (d) => s.play(showSix.to(1, { duration: d })));
}
