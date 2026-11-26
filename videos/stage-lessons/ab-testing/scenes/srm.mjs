// Scene 10 (srm): "Did the planned split reach the table?"
// 1650 vs 2350 against expected 2000/2000 -> chi2 = 122.5 > 10.83 (SRM HALT!) -> second table 1900 vs 2100 prediction hold -> chi2 = 10.0 < 10.83 (NO ALERT)!
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  srm,
  srmChiSquare,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function srmScene(s, c) {
  const phase = s.value(0);
  const showObs = s.value(0);
  const showSq = s.value(0);
  const showStat = s.value(0);
  const showAlert = s.value(0);
  const toNewTable = s.value(0);
  const showAsk = s.value(0);
  const showSmall = s.value(0);
  const showBelow = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a183b32', '#133a4a20');
  const title = heroTitle(['Sample Ratio Mismatch:', 'Check the Split First'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: BAD_COLOR,
    eyebrow: 'ALLOCATION INTEGRITY · χ² GATE (10.83)',
  });

  const eqChi = glowTex('\\chi^2 = \\frac{(O_c - 2000)^2}{2000} + \\frac{(O_t - 2000)^2}{2000}', {
    x: 430,
    y: -155,
    size: 32,
    color: WARN_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const tNew = toNewTable.value;
    const ctrlN = Math.round(srm.control + (1900 - srm.control) * tNew);
    const trtN = Math.round(srm.treatment + (2100 - srm.treatment) * tNew);
    const chi2 = (ctrlN - 2000) ** 2 / 2000 + (trtN - 2000) ** 2 / 2000;

    const bL = -635;
    const bMax = 570;
    const xN = (n) => bL + (n / 2500) * bMax;
    const expX = xN(2000);

    const nodes = [
      txt(
        'DISTINCT ENROLLED INCIDENT IDs (PLANNED 50/50 OF 4,000)',
        -855,
        -245,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),
      line([expX, -190], [expX, 65], { stroke: WARN_COLOR, width: 3.5, dash: [9, 6] }).glow(
        7,
        WARN_COLOR,
      ),
      txt('Expected 2,000', expX, -210, 26, WARN_COLOR, 'mono'),

      txt('Control:', -855, -110, 28, CTRL_COLOR, 'mono', 'left'),
      lumBar(
        bL + ((xN(ctrlN) - bL) * (0.35 + 0.65 * showObs.value)) / 2,
        -110,
        (xN(ctrlN) - bL) * (0.35 + 0.65 * showObs.value),
        52,
        {
          color: CTRL_COLOR,
          fillOpacity: 0.65,
          glow: 8,
        },
      ),
      txt(`${ctrlN.toLocaleString()}`, bL + 22, -110, 30, COSMOS.ink, 'mono', 'left'),

      txt('Treatment:', -855, 0, 28, TRT_COLOR, 'mono', 'left'),
      lumBar(
        bL + ((xN(trtN) - bL) * (0.35 + 0.65 * showObs.value)) / 2,
        0,
        (xN(trtN) - bL) * (0.35 + 0.65 * showObs.value),
        52,
        {
          color: TRT_COLOR,
          fillOpacity: 0.65,
          glow: 8,
        },
      ),
      txt(`${trtN.toLocaleString()}`, bL + 22, 0, 30, COSMOS.ink, 'mono', 'left'),

      rule(-855, 95, 855, 95, COSMOS.cyan, 2.2).opacity(0.6),
      txt(
        'SRM PROTOCOL: count distinct randomized IDs → test χ² vs 10.83 (p = 0.001) → halt if exceeded',
        -855,
        365,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    // Right-side chi2 readout (withheld during table-2 prediction hold!)
    const showTable1Stat = showStat.value * Math.max(0, 1 - toNewTable.value * 2.6);
    if (showTable1Stat > 0.02) {
      nodes.push(
        txt(`χ² = ${srmChiSquare.toFixed(1)}  >>  10.83`, 430, -35, 42, BAD_COLOR, 'mono')
          .glow(10, BAD_COLOR)
          .opacity(showTable1Stat),
        txt(
          showAlert.value > 0.5 ? 'SRM ALERT: HALT & TRACE IDS!' : 'Cutoff: 10.83 (p = 0.001)',
          430,
          30,
          28,
          BAD_COLOR,
          'mono',
        ).opacity(showTable1Stat),
      );
    }

    // Strict withholding for second table (1900 vs 2100)
    const askOp = showAsk.value * Math.max(0, 1 - showSmall.value * 2.6);
    if (askOp > 0.02) {
      nodes.push(
        txt('1,900 vs 2,100 (each off by 100)', 430, -45, 30, WARN_COLOR, 'mono').opacity(askOp),
        txt(
          'Does this split trigger the χ² > 10.83 alert?',
          -855,
          225,
          34,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(askOp),
      );
    }

    const smOp = Math.max(0, (showSmall.value - 0.45) / 0.55);
    if (smOp > 0.02) {
      nodes.push(
        txt(`χ² = 5 + 5 = ${chi2.toFixed(1)}  <  10.83`, 430, -35, 42, GOOD_COLOR, 'mono')
          .glow(10, GOOD_COLOR)
          .opacity(smOp),
        txt('NO ALLOCATION ALERT', 430, 30, 30, GOOD_COLOR, 'mono').opacity(
          Math.max(0.2, showBelow.value) * smOp,
        ),
        txt(
          'Still audit outcome completeness; count distinct incident IDs (never raw message rows)',
          -855,
          225,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(Math.max(0.2, showBelow.value) * smOp),
      );
    }

    if (showAlert.value > 0.02 && toNewTable.value < 0.35) {
      nodes.push(
        txt(
          'Trace incident IDs through assignment, eligibility filters & event joins BEFORE reading lift',
          -855,
          225,
          28,
          BAD_COLOR,
          'sans',
          'left',
        ).opacity(showAlert.value * (1 - toNewTable.value * 2.6)),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'observed', showObs, 1, { duration: 0.5 });
  c.show('square', eqChi);
  tweenCue(s, c, 'square', showSq, 1, { duration: 0.45 });
  tweenCue(s, c, 'statistic', showStat, 1, { duration: 0.45 });
  tweenCue(s, c, 'alert', showAlert, 1, { duration: 0.45 });

  tweenCue(s, c, 'new', toNewTable, 1, { duration: 0.7 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'small', showSmall, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'below', showBelow, 1, { duration: 0.45 });
}
