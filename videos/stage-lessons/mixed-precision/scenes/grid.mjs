// Scene 02: The two neighbors of one.
// Asymmetric FP16 power-of-two rounding cell around 1.0 + strict prediction withholding + IEEE-754 formula.
import {
  COSMOS,
  FP16_ABOVE,
  FP16_BELOW,
  FP16_HALF_DOWN,
  FP16_HALF_UP,
  FP16_MID_DOWN,
  FP16_MID_UP,
  FP16_MINUS_GRID,
  FP16_PLUS_GRID,
  GRID_DELTA,
  ONE,
  aura,
  beatRemainDuration,
  fade,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function grid(s, c) {
  const phase = s.value(0);
  const travel = s.value(0);
  const landDown = s.value(0);
  const landUp = s.value(0);
  const showFormula = s.value(0);

  const bgAura = aura(0, -10, 660, '#ff6b8b1e', '#60a5fa14');

  const title = heroTitle(['The Two Neighbors', 'of One'], {
    x: -855,
    y: -445,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.rose,
    eyebrow: 'FP16 POWER-OF-TWO BOUNDARY',
  });

  // Value -> X mapping centered so 1.0 sits cleanly left of center, revealing 2x wider gap to the right!
  const xOne = -100;
  const pxPerUnit = 860000;
  const xAt = (v) => xOne + (v - ONE) * pxPerUnit;

  const ySub = -115;
  const yAdd = 155;

  const formulaTex = glowTex(
    String.raw`x = (-1)^s \cdot 2^{e - b} \cdot \left(1 + \frac{m}{2^f}\right)`,
    { x: 260, y: 405, size: 42, color: COSMOS.gold, glow: 7 },
  ).opacity(0);

  const live = guardedDynamic(1, () => {
    const tr = travel.value;
    const ld = landDown.value;
    const lu = landUp.value;
    const sf = showFormula.value;
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.6);

    const xBelow = xAt(FP16_BELOW);
    const xAbove = xAt(FP16_ABOVE);
    const xMidDown = xAt(FP16_MID_DOWN);
    const xMidUp = xAt(FP16_MID_UP);

    const nodes = [
      // Top-right asymmetric midpoint legend
      txt(
        `Halfway down: ${FP16_HALF_DOWN.toFixed(6)}`,
        xMidDown,
        -285,
        26,
        COSMOS.rose,
        'mono',
      ).glow(5, COSMOS.rose),
      txt(`Halfway up: ${FP16_HALF_UP.toFixed(6)}`, xMidUp, -285, 26, COSMOS.rose, 'mono').glow(
        5,
        COSMOS.rose,
      ),

      // Vertical power-of-two seam at 1.0 (ends cleanly above tick labels)
      line([xOne, -235], [xOne, 184], { stroke: COSMOS.gold, width: 2.2, dash: [8, 8] }).opacity(
        0.55,
      ),
      // Asymmetric rose midpoint beams
      line([xMidDown, -245], [xMidDown, 184], {
        stroke: COSMOS.rose,
        width: 2.6,
        dash: [6, 6],
      })
        .glow(6 * pulse, COSMOS.rose)
        .opacity(0.75),
      line([xMidUp, -245], [xMidUp, 184], {
        stroke: COSMOS.rose,
        width: 2.6,
        dash: [6, 6],
      })
        .glow(6 * pulse, COSMOS.rose)
        .opacity(0.75),
    ];

    const lanes = [
      {
        label: 'SUBTRACT',
        delta: -GRID_DELTA,
        y: ySub,
        dest: FP16_MINUS_GRID,
        land: ld,
        landColor: COSMOS.emerald,
        resultTag: `${FP16_MINUS_GRID.toFixed(6)} (moved!)`,
      },
      {
        label: 'ADD',
        delta: GRID_DELTA,
        y: yAdd,
        dest: FP16_PLUS_GRID,
        land: lu,
        landColor: COSMOS.rose,
        resultTag: '1.0 (unchanged)',
      },
    ];

    for (const lane of lanes) {
      const y = lane.y;
      const reqVal = ONE + lane.delta * tr;
      const reqX = xAt(reqVal);
      const destX = xAt(lane.dest);

      nodes.push(
        txt(lane.label, -855, y - 16, 30, COSMOS.ink, 'mono', 'left'),
        txt(
          lane.delta < 0 ? '1 - 0.0003' : '1 + 0.0003',
          -855,
          y + 26,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ),
        // Main FP16 rail
        line([xBelow - 45, y], [xAbove + 45, y], { stroke: '#35486e', width: 4 }),
        // Three FP16 ticks
        line([xBelow, y - 22], [xBelow, y + 22], { stroke: COSMOS.blue, width: 6 }).glow(
          6,
          COSMOS.blue,
        ),
        line([xOne, y - 24], [xOne, y + 24], { stroke: COSMOS.gold, width: 6 }).glow(
          7,
          COSMOS.gold,
        ),
        line([xAbove, y - 22], [xAbove, y + 22], { stroke: COSMOS.blue, width: 6 }).glow(
          6,
          COSMOS.blue,
        ),
        // Rose midpoint ticks
        line([xMidDown, y - 16], [xMidDown, y + 16], { stroke: COSMOS.rose, width: 5 }).glow(
          6,
          COSMOS.rose,
        ),
        line([xMidUp, y - 16], [xMidUp, y + 16], { stroke: COSMOS.rose, width: 5 }).glow(
          6,
          COSMOS.rose,
        ),
      );

      // Tick labels under bottom rail only so middle stays crystal clear
      if (lane.delta > 0) {
        nodes.push(
          txt(FP16_BELOW.toFixed(6), xBelow, y + 58, 26, COSMOS.muted, 'mono'),
          txt('1.0', xOne, y + 58, 30, COSMOS.gold, 'mono'),
          txt(FP16_ABOVE.toFixed(6), xAbove, y + 58, 26, COSMOS.muted, 'mono'),
        );
      }

      // Requested travel beam
      if (tr > 0.01) {
        nodes.push(
          glowingTrail(
            [
              [xOne, y - 46],
              [reqX, y - 46],
            ],
            { color: COSMOS.gold, width: 4.2, glow: 8, core: false },
          ),
        );
      }

      // Requested yellow photon
      nodes.push(glowDot(reqX, y - 46, { radius: 9, color: COSMOS.gold, glow: 12 }));

      // Landing trajectory + result label (strictly withheld until round-down / round-up!)
      if (lane.land > 0.02) {
        const lx = reqX + (destX - reqX) * lane.land;
        const ly = y - 46 + 46 * lane.land;
        nodes.push(
          glowingTrail(
            [
              [reqX, y - 46],
              [lx, ly],
            ],
            { color: lane.landColor, width: 4, glow: 9, opacity: lane.land },
          ),
          glowDot(lx, ly, { radius: 11, color: lane.landColor, glow: 14, opacity: lane.land }),
          txt(lane.resultTag, xAbove + 95, y - 62, 28, lane.landColor, 'mono', 'right')
            .glow(6, lane.landColor)
            .opacity(lane.land),
        );
      } else {
        nodes.push(txt('Stored: ?', xAbove + 95, y - 62, 28, COSMOS.dim, 'mono', 'right'));
      }
    }

    // Bottom zone: prediction prompt before Beat 2, then IEEE-754 decomposition + gap readout
    if (sf > 0.02) {
      nodes.push(
        txt('EXPONENT DOUBLES GAP AT 1.0', -855, 365, 26, COSMOS.cyan, 'mono', 'left').opacity(sf),
        txt(
          `Below: 2⁻¹¹ (${(ONE - FP16_BELOW).toFixed(6)})  ·  Above: 2⁻¹⁰ (${(FP16_ABOVE - ONE).toFixed(6)})`,
          -855,
          418,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(sf),
      );
    } else if (ld < 0.02 && lu < 0.02) {
      nodes.push(
        txt(
          'Predict: which direction crosses its rose midpoint and changes the weight?',
          0,
          415,
          30,
          COSMOS.gold,
          'sans',
        ),
      );
    } else {
      nodes.push(
        txt(
          'Compare step magnitude to half the gap in its direction (ties go to even)',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live, formulaTex);
  runPhase(s, c, phase, 14);

  c.on('both-directions', () => s.play(travel.to(1, { duration: 1.2 })));
  c.after('round-down', () =>
    s.play(landDown.to(1, { duration: remainDuration(c, 'round-down', 0.4, 0.35, true) })),
  );
  c.after('round-up', () =>
    s.play(landUp.to(1, { duration: remainDuration(c, 'round-up', 0.4, 0.35, true) })),
  );
  c.onBeat(2, () => {
    const dur = beatRemainDuration(c, 2, 0.55);
    s.play(showFormula.to(1, { duration: dur }));
    s.play(fade(formulaTex, 1, { duration: dur }));
  });
}
