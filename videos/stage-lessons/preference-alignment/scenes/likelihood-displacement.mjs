// Scene 19: Follow the ticket as the margin changes (Likelihood displacement: margin 0.7 -> 1.5 while ticket drops -0.6 below ref)
import {
  COSMOS,
  DISPLACE_DATA,
  aura,
  circle,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefLerp,
  prefLoss,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function likelihoodDisplacement(s, c) {
  const phase = s.value(0);
  const sStart = s.value(0);
  const sInputs = s.value(0);
  const sMove = s.value(0);
  const sGap = s.value(0);
  const sAnswer = s.value(0);

  const bgAura = aura(0, 20, 620, '#3c1b2a26', '#14385c22');
  const title = heroTitle(['Follow the Ticket as', 'the Margin Changes'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'LIKELIHOOD DISPLACEMENT · MARGIN CAN GROW WHILE CHOSEN FALLS',
  });

  // Reference-relative log ruler: range [-2.5, +1.0] across x in [-780, 780]
  const mapX = (v) => -780 + ((v + 2.5) / 3.5) * 1560;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const st = Math.max(0.75, sStart.value);
    const inp = sInputs.value;
    const mv = sMove.value;
    const gp = sGap.value;
    const an = sAnswer.value;

    const cScore = prefLerp(DISPLACE_DATA.chosen.before, DISPLACE_DATA.chosen.after, mv);
    const rScore = prefLerp(DISPLACE_DATA.rejected.before, DISPLACE_DATA.rejected.after, mv);
    const cRel = cScore - DISPLACE_DATA.chosen.ref; // +0.3 -> -0.6
    const rRel = rScore - DISPLACE_DATA.rejected.ref; // -0.4 -> -2.1
    const margin = cRel - rRel; // 0.7 -> 1.5
    const loss = prefLoss(DISPLACE_DATA.beta * margin);

    const rulerY = 48;
    const xZero = mapX(0);
    const xC = mapX(cRel);
    const xR = mapX(rRel);
    const xC0 = mapX(0.3);
    const xR0 = mapX(-0.4);

    const nodes = [
      // Top-left & top-right score tiles
      glassCell(-440, -155, 790, 118, cRel < 0 ? COSMOS.rose : COSMOS.emerald, {
        fill: cRel < 0 ? '#29101a' : '#0e2824',
        glow: 6,
        opacity: st,
      }),
      txt('A · TICKET (CHOSEN)', -805, -182, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `Policy ${cScore.toFixed(1)}  -  Ref ${DISPLACE_DATA.chosen.ref.toFixed(1)}  =  ${cRel >= 0 ? '+' : ''}${cRel.toFixed(1)}`,
        -805,
        -132,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(440, -155, 790, 118, COSMOS.cyan, { fill: '#0f2138', glow: 6, opacity: st }),
      txt('B · DIRECT GRANT (REJECTED)', 75, -182, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `Policy ${rScore.toFixed(1)}  -  Ref ${DISPLACE_DATA.rejected.ref.toFixed(1)}  =  ${rRel >= 0 ? '+' : ''}${rRel.toFixed(1)}`,
        75,
        -132,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      // Main reference-relative ruler (dashed ref line sits cleanly below Ticket label track)
      line([-800, rulerY], [800, rulerY], { stroke: COSMOS.rule, width: 3 }),
      line([xZero, rulerY - 30], [xZero, rulerY + 18], {
        stroke: COSMOS.gold,
        width: 3.2,
        dash: [6, 4],
      }),
      txt('0  (REF)', xZero, -68, 26, COSMOS.gold, 'mono'),
      ...[-2.0, -1.0, 0.0, 1.0].flatMap((tk) => {
        const tx = mapX(tk);
        return [
          line([tx, rulerY - 12], [tx, rulerY + 12], { stroke: COSMOS.muted, width: 2.2 }),
          txt(tk === 0 ? '0.0' : tk.toFixed(1), tx, rulerY + 62, 26, COSMOS.muted, 'mono'),
        ];
      }),

      // Ghost starting anchors once moving
      ...(mv > 0.05
        ? [
            circle(9, { fill: '#070910', stroke: COSMOS.emerald, width: 2.5 }).at(xC0, rulerY),
            circle(9, { fill: '#070910', stroke: COSMOS.cyan, width: 2.5 }).at(xR0, rulerY),
            glowingTrail(
              [
                [xC0, rulerY - 22],
                [xC, rulerY - 22],
              ],
              { color: COSMOS.rose, width: 3.5, glow: 8, opacity: mv },
            ),
            glowingTrail(
              [
                [xR0, rulerY + 22],
                [xR, rulerY + 22],
              ],
              { color: COSMOS.cyan, width: 3.5, glow: 8, opacity: mv },
            ),
          ]
        : []),

      // Active Ticket & Grant beads
      glowDot(xC, rulerY, { radius: 11, color: cRel < 0 ? COSMOS.rose : COSMOS.emerald, glow: 15 }),
      txt(
        `Ticket ${cRel >= 0 ? '+' : ''}${cRel.toFixed(1)}`,
        xC,
        rulerY - 56,
        28,
        cRel < 0 ? COSMOS.rose : COSMOS.emerald,
        'mono',
      ),

      glowDot(xR, rulerY, { radius: 11, color: COSMOS.cyan, glow: 14 }),
      txt(`Grant ${rRel.toFixed(1)}`, xR, rulerY + 104, 28, COSMOS.cyan, 'mono'),

      // Margin bracket between Grant and Ticket
      line([xR, 188], [xC, 188], { stroke: COSMOS.gold, width: 4.2 }).glow(7, COSMOS.gold),
      line([xR, 174], [xR, 196], { stroke: COSMOS.gold, width: 3 }),
      line([xC, 174], [xC, 196], { stroke: COSMOS.gold, width: 3 }),
      txt(
        `MARGIN = ${margin.toFixed(1)}   ·   LOSS (beta=0.1) = ${loss.toFixed(3)}`,
        (xR + xC) * 0.5,
        232,
        30,
        COSMOS.gold,
        'mono',
      ).glow(gp > 0.3 ? 8 * pulse : 4, COSMOS.gold),

      // Strictly withheld verdict banner
      glassCell(0, 344, 1620, 114, an > 0.5 ? COSMOS.rose : COSMOS.amber, {
        fill: an > 0.5 ? '#29101a' : '#1b1710',
        dash: an > 0.5 ? undefined : [10, 6],
        glow: 9 * pulse,
      }),
      txt(
        an > 0.5
          ? 'LESS LIKELY!  Ticket dropped -0.6 below ref (Grant just fell farther -> DPOP guards against this)'
          : inp > 0.2
            ? 'Margin grew 0.7 -> 1.5, loss fell 0.659 -> 0.621. Is the ticket MORE or LESS likely than ref?  [ ? ]'
            : 'Both marks start on the reference-relative log ruler: Ticket +0.3, Grant -0.4',
        0,
        346,
        26,
        an > 0.5 ? COSMOS.rose : COSMOS.amber,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqDisp = glowTex(
    'm = \\Delta_w - \\Delta_l, \\qquad \\Delta_y = \\ln\\pi_\\theta(y) - \\ln\\pi_{\\text{ref}}(y)',
    {
      x: 420,
      y: -348,
      size: 30,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqDisp);
  runPhase(s, c, phase, 14);

  c.on('displace-start', () =>
    s.play(sStart.to(1, { duration: remainDuration(c, 'displace-start', 0.45) })),
  );
  c.on('displace-inputs', () =>
    s.play(sInputs.to(1, { duration: remainDuration(c, 'displace-inputs', 0.45) })),
  );
  c.on('displace-move', () =>
    s.play(sMove.to(1, { duration: remainDuration(c, 'displace-move', 1.2) })),
  );
  c.on('displace-gap', () =>
    s.play(sGap.to(1, { duration: remainDuration(c, 'displace-gap', 0.5) })),
  );
  c.after('displace-answer', () =>
    s.play(sAnswer.to(1, { duration: remainAfterDuration(c, 'displace-answer', 0.5) })),
  );
}
