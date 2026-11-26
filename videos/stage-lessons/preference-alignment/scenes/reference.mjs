// Scene 12: The two replies have the same policy score (Reference-relative ruler: -4.0 -> -3.4 (+0.6), -3.0 -> -3.4 (-0.4), margin +1.0)
import {
  COSMOS,
  DPO_WORKED,
  EXAMPLE,
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
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function reference(s, c) {
  const phase = s.value(0);
  const sTie = s.value(0);
  const sTicket = s.value(0);
  const sDetour = s.value(0);
  const sMargin = s.value(0);

  const bgAura = aura(0, 20, 620, '#123e3626', '#2b184418');
  const title = heroTitle(['The Two Replies Have', 'the Same Policy Score'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'REFERENCE-RELATIVE LOG RATIOS · WHY FROZEN PI_REF BREAKS THE TIE',
  });

  // Number line from -4.5 to -2.5 across x in [-760, 760]
  const mapX = (v) => -760 + ((v + 4.5) / 2.0) * 1520;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ti = Math.max(0.75, sTie.value);
    const tk = sTicket.value;
    const dt = sDetour.value;
    const mg = sMargin.value;

    const rulerY = 50;
    const xPol = mapX(EXAMPLE.chosen.policy); // -3.4
    const xRefA = mapX(EXAMPLE.chosen.reference); // -4.0
    const xRefB = mapX(EXAMPLE.rejected.reference); // -3.0

    const nodes = [
      txt(
        'WHOLE-RESPONSE LOG PROBABILITY RULER  ln pi(y | x)',
        -855,
        -210,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Main log-prob axis
      line([-800, rulerY], [800, rulerY], { stroke: COSMOS.rule, width: 3 }),
      ...[-4.5, -4.0, -3.5, -3.0, -2.5].flatMap((tick) => {
        const tx = mapX(tick);
        return [
          line([tx, rulerY - 14], [tx, rulerY + 14], { stroke: COSMOS.muted, width: 2.2 }),
          txt(tick.toFixed(1), tx, rulerY + 46, 26, COSMOS.muted, 'mono'),
        ];
      }),

      // Tied current policy marker at -3.4
      line([xPol, -140], [xPol, 175], { stroke: COSMOS.gold, width: 2.6, dash: [7, 5] }).opacity(
        ti,
      ),
      glowDot(xPol, rulerY, { radius: 11, color: COSMOS.gold, glow: 14, opacity: ti }),
      txt('CURRENT POLICY: BOTH A & B = -3.4', xPol, -166, 28, COSMOS.gold, 'mono').opacity(ti),

      // Reply A reference anchor (-4.0) and displacement arrow (+0.6)
      circle(10, { fill: '#0e2624', stroke: COSMOS.emerald, width: 3 })
        .at(xRefA, -66)
        .opacity(Math.max(0.4, tk)),
      txt('ref A = -4.0', xRefA, -112, 26, COSMOS.emerald, 'mono').opacity(Math.max(0.4, tk)),
      ...(tk > 0.05
        ? [
            glowingTrail(
              [
                [xRefA, -66],
                [prefLerp(xRefA, xPol, tk), -66],
              ],
              { color: COSMOS.emerald, width: 5.5, glow: 11, opacity: tk },
            ),
            glowDot(prefLerp(xRefA, xPol, tk), -66, {
              radius: 8.5,
              color: COSMOS.emerald,
              opacity: tk,
            }),
            txt(
              `A GAINED  +${DPO_WORKED.chosenRatio.toFixed(1)}`,
              (xRefA + xPol) * 0.5,
              -104,
              28,
              COSMOS.emerald,
              'mono',
            )
              .glow(6, COSMOS.emerald)
              .opacity(tk),
          ]
        : []),

      // Reply B reference anchor (-3.0) and displacement arrow (-0.4)
      circle(10, { fill: '#28101a', stroke: COSMOS.rose, width: 3 })
        .at(xRefB, 148)
        .opacity(Math.max(0.4, dt)),
      txt('ref B = -3.0', xRefB + 22, 148, 26, COSMOS.rose, 'mono', 'left').opacity(
        Math.max(0.4, dt),
      ),
      ...(dt > 0.05
        ? [
            glowingTrail(
              [
                [xRefB, 148],
                [prefLerp(xRefB, xPol, dt), 148],
              ],
              { color: COSMOS.rose, width: 5.5, glow: 11, opacity: dt },
            ),
            glowDot(prefLerp(xRefB, xPol, dt), 148, {
              radius: 8.5,
              color: COSMOS.rose,
              opacity: dt,
            }),
            txt(
              `B DROPPED  ${DPO_WORKED.rejectedRatio.toFixed(1)}`,
              (xRefB + xPol) * 0.5,
              198,
              28,
              COSMOS.rose,
              'mono',
            )
              .glow(6, COSMOS.rose)
              .opacity(dt),
          ]
        : []),

      // Margin readout card (strictly withheld until c.after('ref-margin'))
      glassCell(0, 344, 1280, 114, mg > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: mg > 0.5 ? '#221c0e' : '#12182b',
        dash: mg > 0.5 ? undefined : [10, 6],
        glow: mg > 0.5 ? 10 * pulse : 4,
      }),
      txt(
        mg > 0.5
          ? `DPO MARGIN:   (+0.6) - (-0.4) = +${DPO_WORKED.margin.toFixed(1)}   (NOT A TIE!)`
          : 'Compare each reply to its own ref: what is the margin?  [ ? ]',
        0,
        346,
        30,
        mg > 0.5 ? COSMOS.gold : COSMOS.amber,
        'mono',
      ),
    ];

    return group(...nodes);
  });

  const eqRef = glowTex(
    'm = \\ln\\frac{\\pi_\\theta(A)}{\\pi_{\\text{ref}}(A)} - \\ln\\frac{\\pi_\\theta(B)}{\\pi_{\\text{ref}}(B)}',
    {
      x: 420,
      y: -348,
      size: 34,
      color: COSMOS.cyan,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqRef);
  runPhase(s, c, phase, 14);

  c.on('ref-tie', () => s.play(sTie.to(1, { duration: remainDuration(c, 'ref-tie', 0.5) })));
  c.on('ref-ticket', () =>
    s.play(sTicket.to(1, { duration: remainDuration(c, 'ref-ticket', 0.75) })),
  );
  c.on('ref-detour', () =>
    s.play(sDetour.to(1, { duration: remainDuration(c, 'ref-detour', 0.75) })),
  );
  c.after('ref-margin', () =>
    s.play(sMargin.to(1, { duration: remainAfterDuration(c, 'ref-margin', 0.5) })),
  );
}
