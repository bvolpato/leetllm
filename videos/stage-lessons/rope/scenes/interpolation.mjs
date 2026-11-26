// Scene 22: interpolation: 4x longer ruler contracts into trained range while adjacent angular spacing shrinks 4x.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowDot,
  glowTex,
  heroTitle,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-interpolation-0-0',
  'interpolation-position-interpolation-rule-b1-1',
  'rp-interpolation-0-1',
  'rp-interpolation-0-2',
  'interpolation-adjacent-interpolated-phase-b2-1',
  'rp-interpolation-1-0',
  'rp-interpolation-1-1',
  'rp-interpolation-1-2',
  'rp-interpolation-2-0',
  'rp-interpolation-2-1',
  'interpolation-compressed-position-2-b3-1',
  'rp-interpolation-2-2',
];

export default function interpolation(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(130, 22, ROLE.query);
  const stageAura = cinemaAura(420, 30, 560, '#5ce1e622', '#a78bfa16');

  const title = heroTitle(['A longer ruler changes', 'local spacing'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'POSITION INTERPOLATION (PI, s = 4)',
  });

  const eq = glowTex(
    String.raw`m' = \frac{m}{s} \quad\Longrightarrow\quad \Delta\theta' = \frac{\theta}{4}`,
    {
      x: 410,
      y: -380,
      size: 38,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  const live = dynamic(() => {
    const st = step.value;
    // Scale s smoothly contracts from 1 -> 4 between cues 1..4
    const sFactor = 1 + Math.max(0, Math.min(1, (st - 0.8) / 2.8)) * 3;
    const nodes = [];

    // Left: Contracting target ruler (0 .. 16k -> fits inside 0 .. 4k trained window)
    const rx0 = -830;
    const trainEnd = -420; // 4k mark
    const fullEnd = 120; // 16k mark before compression
    const curEnd = fullEnd - ((sFactor - 1) / 3) * (fullEnd - trainEnd);
    const rY = -120;

    nodes.push(
      txt('Trained range: 0 .. 4,096', rx0, rY - 96, 26, ROLE.score, 'mono', 'left'),
      rect(trainEnd - rx0, 42, { fill: '#102b27', stroke: ROLE.score, width: 2.2, radius: 8 })
        .at((rx0 + trainEnd) * 0.5, rY)
        .opacity(0.72),
      line([trainEnd, rY - 56], [trainEnd, rY + 94], {
        stroke: COSMOS.gold,
        width: 2.6,
        dash: [6, 6],
      }),
      txt('4k limit', trainEnd + 16, rY - 52, 26, COSMOS.gold, 'mono', 'left'),
      // Dynamic target ruler contracting from 16k into 4k
      line([rx0, rY + 78], [curEnd, rY + 78], { stroke: ROLE.query, width: 6.0 })
        .glow(10, ROLE.query)
        .set('blend', 'screen'),
      glowDot(rx0, rY + 78, { radius: 7, color: ROLE.query, glow: 10 }),
      glowDot(curEnd, rY + 78, { radius: 8, color: '#ffffff', glow: 14 }),
      txt(
        `16k ÷ ${sFactor.toFixed(2)} = ${Math.round(16384 / sFactor).toLocaleString('en-US')}`,
        curEnd,
        rY + 132,
        28,
        ROLE.query,
        'mono',
      ),
    );

    // Adjacent token ticks (pos 0, 1, 2, 3) crowding together as s -> 4
    const adjY = 175;
    const baseStep = 220;
    const curStep = baseStep / sFactor;
    nodes.push(
      txt(
        `Adjacent tokens (m = 0, 1, 2, 3): spacing ÷ ${sFactor.toFixed(2)}`,
        rx0,
        adjY - 62,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      line([rx0, adjY], [rx0 + baseStep * 3.1, adjY], { stroke: '#35456d', width: 2.6 }),
    );
    for (let m = 0; m <= 3; m++) {
      const mx = rx0 + m * curStep;
      const col = m <= 1 ? ROLE.query : COSMOS.violet;
      nodes.push(
        line([mx, adjY - 22], [mx, adjY + 22], { stroke: col, width: 3.4 }).glow(6, col),
        glowDot(mx, adjY, { radius: 6.5, color: col, glow: 10 }),
        txt(String(m), mx, adjY + 46, 26, col, 'mono'),
      );
    }

    // Right: Glowing dial showing adjacent token phase angle shrinking from 1.00 rad -> 0.25 rad
    const adjAng = 1.0 / sFactor;
    nodes.push(
      clockDial({
        cx: 505,
        cy: 55,
        radius: 195,
        queryAngle: 0,
        keyAngle: adjAng,
        showAxes: true,
        showAngleArc: true,
        queryColor: ROLE.query,
        keyColor: COSMOS.gold,
        projColor: ROLE.shift,
        title: `Adjacent phase Δθ' = ${adjAng.toFixed(2)} rad`,
        subtitle: `Scale s = ${sFactor.toFixed(2)}×`,
        titleColor: COSMOS.ink,
        subColor: ROLE.shift,
      }),
      txt(
        'Positions stay distinct, but fast local bands lose 4× angular resolution',
        -855,
        385,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live, eq);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
