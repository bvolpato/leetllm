// Scene 9: context-tier - One extra input token can change the entire price row
// Dramatic orbiting 3D stepped cost cliff at 272,000 tokens + live retroactive repricing bar:
// 272,000 ($0.680000) -> +1 token -> 272,001 ($1.360005) -> 300,000 + 1,000 output ($1.522500).
import { gridPlane3d, group, line3d, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  contextTierPrice,
  dashedRule,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  fmtInt,
  glowBar,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function contextTier(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = rate row jump, 1 = 272,000 -> 272,001 cliff, 2 = 300k + 1k output
  const p0 = s.value(0);
  const crossProg = s.value(0); // 0 -> 1 on `te-context-tier-1`
  const longOutProg = s.value(0); // 0 -> 1 on `te-context-tier-2`

  const pShort = contextTierPrice(272000);
  const pCliff = contextTierPrice(272001);
  const pFull = contextTierPrice(300000, 1000);

  const header = cinemaHeader(
    'LONG-CONTEXT TARIFF CLIFF',
    'One token crosses',
    'the 272,000 cliff',
    {
      x: -860,
      y: -415,
      accent: ROLE.breach,
      size: 52,
    },
  );

  const sceneAura = aura(320, 10, 620, '#ff6b8b26', '#5ce1e61c');

  // Orbiting 3D stepped cliff landscape on the right
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.0,
    unit: 116,
    focus: [0, 0, 1.2],
  }).at(360, 10);

  view3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Short-context plateau (cyan, height 1.15)
  addBox3D(view3d, -2.8, -1.1, 0.04, 2.55, 2.2, 1.15, ROLE.input, ROLE.input, {
    faceOpacity: 0.82,
    edgeGlow: 7,
  });

  // Glowing 272,000 threshold laser plane
  view3d.add(
    line3d([-0.15, -1.5, 0.02], [-0.15, 1.5, 0.02], { color: ROLE.cached, width: 3.0, glow: 9 }),
    line3d([-0.15, -1.5, 2.8], [-0.15, 1.5, 2.8], { color: ROLE.cached, width: 3.0, glow: 9 }),
    line3d([-0.15, -1.5, 0.02], [-0.15, -1.5, 2.8], { color: ROLE.cached, width: 2.6, glow: 8 }),
    line3d([-0.15, 1.5, 0.02], [-0.15, 1.5, 2.8], { color: ROLE.cached, width: 2.6, glow: 8 }),
  );

  // Long-context elevated cliff plateau (rose, height 2.30 = 2x!)
  addBox3D(view3d, 0.05, -1.1, 0.04, 2.75, 2.2, 2.3, ROLE.breach, ROLE.breach, {
    faceOpacity: 0.84,
    edgeGlow: 9,
  });

  // Retroactive rose shroud rising over the left plateau when +1 token crosses 272,000!
  const retroactiveRise = hideNodes(
    addBox3D(view3d, -2.8, -1.1, 1.22, 2.55, 2.2, 1.12, ROLE.breach, ROLE.cached, {
      faceOpacity: 0.78,
      edgeWidth: 2.4,
      edgeGlow: 10,
    }),
  );

  // Left-side dynamic readouts (clean non-overlapping mode crossfades)
  const leftMode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const u = p0.value;
      const rows = [
        { name: 'Ordinary input', lo: '$2.50', hi: '$5.00', mult: '2.0x', y: -120 },
        { name: 'Cached input', lo: '$0.25', hi: '$0.50', mult: '2.0x', y: 30 },
        { name: 'Output', lo: '$15.00', hi: '$22.50', mult: '1.5x', y: 180 },
      ];
      const nodes = [
        txt(
          'GPT-5.4 FULL-SESSION THRESHOLD  (> 272,000)',
          -860,
          -210,
          26,
          ROLE.cached,
          'mono',
          'left',
        ).opacity(a),
      ];
      rows.forEach((r) => {
        nodes.push(
          txt(r.name, -860, r.y, 28, COSMOS.ink, 'sans', 'left').opacity(a),
          txt(
            `${r.lo}  ->  ${r.hi} / 1M`,
            -860,
            r.y + 46,
            30,
            u > 0.3 ? ROLE.breach : ROLE.input,
            'mono',
            'left',
          )
            .glow(u > 0.3 ? 6 : 0, ROLE.breach)
            .opacity(a),
          txt(r.mult, -210, r.y + 46, 30, ROLE.cached, 'mono', 'right').opacity(a),
          glowBar(-860, r.y + 92, 650, 14, 0.5 + 0.5 * u, {
            fill: u > 0.3 ? ROLE.breach : ROLE.input,
            glow: 7,
            opacity: a,
          }),
        );
      });
      nodes.push(
        txt(
          'New row applies retroactively to the full session',
          -860,
          355,
          28,
          ROLE.cached,
          'sans',
          'left',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  const leftMode12 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const isBeat2 = mode.value > 1.5;
      const crossed = isBeat2 || crossProg.value > 0.5;
      const tokens = isBeat2 ? 300000 : crossed ? 272001 : 272000;
      const price = isBeat2 ? pFull : crossed ? pCliff : pShort;
      const barColor = price.long ? ROLE.breach : ROLE.input;
      const barX = -860;
      const barW = 670;
      const threshX = barX + barW * (272000 / 300000);

      const nodes = [
        txt(`INPUT: ${fmtInt(tokens)} TOKENS`, -860, -185, 32, barColor, 'mono', 'left')
          .glow(6, barColor)
          .opacity(a),
        glowBar(barX, -110, barW, 44, tokens / 300000, { fill: barColor, glow: 9, opacity: a }),
        dashedRule(threshX, -148, threshX, -62, ROLE.cached, { width: 2.6, opacity: a }),
        txt('272k wall', threshX - 18, -42, 26, ROLE.cached, 'mono', 'right').opacity(a),

        txt(
          price.long ? 'ENTIRE PROMPT REPRICED AT $5.00 / 1M' : 'SHORT ROW: $2.50 / 1M',
          -860,
          36,
          28,
          barColor,
          'mono',
          'left',
        ).opacity(a),

        // Dollar readout
        txt('FULL CALL CHARGE', -860, 128, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(`$${price.cost.toFixed(6)}`, -860, 198, 54, ROLE.cached, 'mono', 'left')
          .glow(9, ROLE.cached)
          .opacity(a),
      ];

      if (isBeat2) {
        const op = longOutProg.value;
        nodes.push(
          txt('300,000 x $5.00/M = $1.500000', -860, 276, 26, ROLE.breach, 'mono', 'left').opacity(
            a,
          ),
          txt(
            '+ 1,000 output x $22.50/M = $0.022500',
            -860,
            324,
            26,
            ROLE.output,
            'mono',
            'left',
          ).opacity(Math.max(0.3, op) * a),
          txt(
            'Choose the row first at every growing turn',
            -860,
            392,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(a),
        );
      } else {
        nodes.push(
          txt(
            crossed
              ? '+1 token jumped cost from $0.68 to $1.360005'
              : 'At 272,000 tokens: exactly $0.68',
            -860,
            290,
            28,
            crossed ? ROLE.breach : ROLE.input,
            'sans',
            'left',
          ).opacity(a),
          txt(
            'Overflow-only pricing is wrong',
            -860,
            355,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(a),
        );
      }
      return group(...nodes);
    },
  );

  // 3D captions framing the cliff landscape
  const captions3d = group(
    txt('<= 272k  ($2.50/M)', 135, 405, 26, ROLE.input, 'mono'),
    txt('> 272k  ($5.00/M · 2x)', 575, 405, 26, ROLE.breach, 'mono').glow(6, ROLE.breach),
    rect(260, 44, { fill: '#2a2210', stroke: ROLE.cached, width: 2.0, radius: 10 }).at(360, -405),
    txt('272,000 BOUNDARY', 360, -405, 26, ROLE.cached, 'mono'),
  );

  s.add(sceneAura, view3d, header, captions3d, leftMode0, leftMode12);
  orbitScene(s, c, view3d, { theta: -0.34, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-context-tier-0', () => {
    const t = c.cue('te-context-tier-0').start;
    s.play(p0.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-context-tier-1', () => {
    const t = c.cue('te-context-tier-1').start;
    s.play(crossProg.to(1, { duration: clampDur(c, t, 0.5) }));
    fadeInNodes(s, c, t, retroactiveRise, 0.45);
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-context-tier-2', () => {
    const t = c.cue('te-context-tier-2').start;
    s.play(longOutProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
}
