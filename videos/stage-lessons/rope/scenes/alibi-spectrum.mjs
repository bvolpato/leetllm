// Scene 20: alibi-spectrum: 8 geometric slopes, 3-head non-power-of-two schedule, and odds vs share at Δ=10.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  alibiSlopes,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  glowTex,
  heroTitle,
  shareStrip,
  softmax,
  txt,
} from '../parts.mjs';

const SLOPES8 = alibiSlopes(8);
const SLOPES3 = alibiSlopes(3);
const ALL_CUES = [
  'rp-alibi-spectrum-0-0',
  'rp-alibi-spectrum-0-1',
  'rp-alibi-spectrum-0-2',
  'rp-alibi-spectrum-1-0',
  'rp-alibi-spectrum-1-1',
  'rp-alibi-spectrum-1-2',
  'rp-alibi-spectrum-1-3',
  'rp-alibi-spectrum-2-0',
  'rp-alibi-spectrum-2-1',
  'rp-alibi-spectrum-2-2',
  'rp-alibi-spectrum-2-3',
];

export default function alibiSpectrum(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 20, ROLE.alibi);
  const stageAura = cinemaAura(0, 30, 700, '#fb923c1e', '#a78bfa14');

  const title = heroTitle(['A head slope gives', 'an odds penalty'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.alibi,
    eyebrow: 'ALiBi GEOMETRIC SLOPES & ODDS',
  });

  const eq = glowTex(
    String.raw`m_h = 2^{-8h/H},\quad \frac{w_{\text{far}}}{w_{\text{self}}} = e^{-m\Delta}`,
    {
      x: 345,
      y: -380,
      size: 36,
      color: COSMOS.gold,
      glow: 5,
    },
  );

  const live = dynamic(() => {
    const st = step.value;
    const show3 = Math.max(0, Math.min(1, st - 3.2));
    const showOdds = Math.max(0, Math.min(1, st - 7.0));
    const addThird = Math.max(0, Math.min(1, st - 9.2));

    const nodes = [];

    // Left: 8-head geometric spectrum (1/2 .. 1/256)
    const barLeft = -830;
    const barTop = -175;
    nodes.push(
      txt('H = 8 heads (1/2 to 1/256)', barLeft, barTop - 44, 26, ROLE.alibi, 'mono', 'left'),
    );
    SLOPES8.forEach((sl, i) => {
      const y = barTop + i * 54;
      // Log-scaled glowing bar so all 8 geometric steps remain crystal-clear
      const w = Math.max(26, (9 - i) * 52);
      const col = i === 0 ? ROLE.danger : i === 7 ? ROLE.score : ROLE.alibi;
      nodes.push(
        txt(`h${i + 1}`, barLeft, y, 26, COSMOS.dim, 'mono', 'left'),
        rect(w, 24, { fill: col, stroke: null, radius: 5 })
          .at(barLeft + 60 + w * 0.5, y)
          .opacity(0.84)
          .glow(6, col)
          .set('blend', 'screen'),
        txt(`1/${Math.round(1 / sl)}`, barLeft + 80 + w, y, 26, col, 'mono', 'left'),
      );
    });

    // Upper-right: H = 3 non-power-of-two construction [1/16, 1/256, 1/4]
    const rx = 120;
    const op3 = 0.35 + 0.65 * show3;
    nodes.push(
      txt('H = 3 heads: base(2) + 1st of 4-head', rx, -219, 26, ROLE.shift, 'mono', 'left').opacity(
        op3,
      ),
    );
    SLOPES3.forEach((sl, i) => {
      const cx = rx + 115 + i * 240;
      const isAppended = i === 2;
      const col = isAppended ? ROLE.danger : COSMOS.blue;
      nodes.push(
        rect(206, 76, { fill: '#11192e', stroke: col, width: isAppended ? 3 : 2, radius: 12 })
          .at(cx, -135)
          .opacity(op3),
        txt(`1/${Math.round(1 / sl)}`, cx, -135, 32, col, 'mono').opacity(op3),
      );
    });
    nodes.push(
      txt(
        'Steepest (1/4) sits last because appended',
        rx,
        -62,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(op3),
    );

    // Lower-right: Odds vs normalized share at Δ = 10, m = 1/2 (e^-5 = 0.0067)
    const w2 = softmax([0, -5]);
    const w3 = softmax([0, 0, -5]);
    const opOdds = 0.35 + 0.65 * showOdds;
    nodes.push(
      txt(
        'Δ = 10, m = 1/2 → penalty −5 (odds e⁻⁵ ≈ 0.0067)',
        rx,
        45,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(opOdds),
      txt(
        `2 keys: older = ${(w2[1] * 100).toFixed(2)}%`,
        rx,
        108,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(opOdds),
      shareStrip({
        x: rx,
        y: 162,
        width: 710,
        height: 44,
        shares: [w2[0], Math.max(0.04, w2[1])],
        colors: [ROLE.query, ROLE.danger],
        labels: [`self ${(w2[0] * 100).toFixed(2)}%`, ''],
      }).opacity(opOdds),
      txt(
        `3 keys: older = ${(w3[2] * 100).toFixed(2)}%  (odds ratio unchanged!)`,
        rx,
        245,
        28,
        addThird > 0.2 ? ROLE.score : COSMOS.dim,
        'mono',
        'left',
      ).opacity(opOdds),
      shareStrip({
        x: rx,
        y: 298,
        width: 710,
        height: 44,
        shares: [w3[0], w3[1], Math.max(0.03, w3[2])],
        colors: [ROLE.query, COSMOS.blue, ROLE.danger],
        labels: ['self', 'peer', ''],
      }).opacity(0.25 + 0.75 * addThird),
      line([rx, 365], [rx + 710, 365], { stroke: '#2c3a5e', width: 1.6 }).opacity(opOdds),
      txt(
        'Ratio w_old / w_self = 0.0067 in both rows',
        rx,
        405,
        26,
        ROLE.score,
        'mono',
        'left',
      ).opacity(opOdds),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
