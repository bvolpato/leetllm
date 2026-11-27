// Scene 34: Let the failure choose the next comparison: Controlled sweep matrix -> flat loss vs overfitting diagnosis -> targeted repair checklist.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function diagnosePolicy(s, c) {
  const showTable = s.value(1);
  const showDiag = s.value(0);
  const hlPath = s.value(0);
  const hlOverfit = s.value(0);
  const showRecord = s.value(0);

  const bgAura = aura(0, 10, 620, '#ffd1661c', '#ff6b8b18');
  const title = heroTitle(['Let the Failure Choose', 'the Next Comparison'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'CONTROLLED ABLATION & DIAGNOSTICS',
  });

  // Part 1: Controlled sweep table (change one knob at a time)
  const partTable = guardedDynamic(showTable, (a) => {
    const rows = [
      { knob: 'Rank r (at fixed α / r)', v1: '8', v2: '16' },
      { knob: 'Learning rate', v1: '1e−4', v2: '2e−4' },
      { knob: 'Dropout', v1: '0.0', v2: '0.05' },
      { knob: 'Target modules', v1: 'Q + V', v2: 'all-linear' },
    ];

    const nodes = [
      txt(
        'SAME SUPERVISED TOKENS · SAME EVALUATION CASES',
        855,
        -380,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),
      txt('SETTING', -820, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('BASELINE RUN', 120, -210, 26, COSMOS.gold, 'mono').opacity(a),
      txt('NEXT COMPARISON', 600, -210, 26, COSMOS.cyan, 'mono').opacity(a),
    ];

    rows.forEach((row, i) => {
      const y = -115 + i * 118;
      nodes.push(
        txt(row.knob, -820, y, 30, COSMOS.ink, 'sans', 'left').opacity(a),
        glassCell(120, y, 360, 82, COSMOS.gold, { fill: '#221c10', glow: 8, opacity: a }),
        txt(row.v1, 120, y, 32, COSMOS.gold, 'mono').opacity(a),
        glassCell(600, y, 360, 82, COSMOS.cyan, { fill: '#102135', glow: 8, opacity: a }),
        txt(row.v2, 600, y, 32, COSMOS.cyan, 'mono').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 365, 1660, 114, COSMOS.emerald, { fill: '#0e2428', glow: 7, opacity: a }),
      txt(
        'Change one knob at a time · hold α / r constant during rank sweeps',
        0,
        365,
        28,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Failure shape curves + diagnostic branches
  const partDiag = guardedDynamic(showDiag, (a) => {
    const hp = hlPath.value;
    const ho = hlOverfit.value;
    const rec = showRecord.value;

    const px = -805;
    const py = -165;
    const pw = 740;
    const ph = 420;
    const flatPts = Array.from({ length: 30 }, (_, i) => [px + (i / 29) * pw, py + 150]);
    const trainPts = Array.from({ length: 30 }, (_, i) => {
      const u = i / 29;
      return [px + u * pw, py + 60 + 290 * u];
    });
    const valPts = Array.from({ length: 30 }, (_, i) => {
      const u = i / 29;
      return [px + u * pw, py + 140 + 70 * u - 195 * u * u];
    });

    const nodes = [
      // Left plot
      line([px, py], [px, py + ph], { stroke: '#4c6294', width: 3 }).opacity(a),
      line([px, py + ph], [px + pw, py + ph], { stroke: '#4c6294', width: 3 }).opacity(a),
      txt(
        ho > 0.3 ? 'TRAIN IMPROVES · HELD-OUT WORSENS' : 'FLAT TRAINING LOSS',
        px + pw * 0.5,
        py - 32,
        26,
        ho > 0.3 ? COSMOS.rose : COSMOS.blue,
        'mono',
      ).opacity(a),
    ];

    if (ho < 0.3) {
      nodes.push(glowingTrail(flatPts, { color: COSMOS.blue, width: 5, glow: 10 }).opacity(a));
    } else {
      nodes.push(
        glowingTrail(trainPts, { color: COSMOS.blue, width: 5, glow: 10 }).opacity(a),
        glowingTrail(valPts, { color: COSMOS.rose, width: 5, glow: 10 }).opacity(a),
      );
    }

    // Right diagnostic actions
    const branches = [
      {
        title: '1. FLAT LOSS -> CHECK PATH FIRST',
        desc: 'Formatting, supervised masks, targets, grads',
        col: COSMOS.gold,
        active: hp > 0.2,
      },
      {
        title: '2. UNDERFITTING -> WIDEN COVERAGE',
        desc: 'Move Q/V -> all-linear before buying high rank',
        col: COSMOS.cyan,
        active: hp > 0.2,
      },
      {
        title: '3. OVERFITTING -> REGULARIZE & DATA',
        desc: 'Data diversity, dropout, epochs, regression set',
        col: COSMOS.rose,
        active: ho > 0.2,
      },
    ];
    branches.forEach((b, i) => {
      const y = -115 + i * 142;
      nodes.push(
        glassCell(430, y, 810, 118, b.active ? b.col : '#334268', {
          fill: b.active ? '#141d34' : '#10172b',
          glow: b.active ? 10 : 3,
          opacity: a,
        }),
        glowDot(60, y - 22, { radius: 6, color: b.col, opacity: a }),
        txt(b.title, 90, y - 22, 26, b.col, 'mono', 'left').opacity(a),
        txt(b.desc, 90, y + 24, 26, COSMOS.ink, 'sans', 'left').opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 355, 1660, 122, rec > 0.2 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2428',
        glow: rec > 0.2 ? 10 : 3,
        opacity: a,
      }),
      txt(
        rec > 0.2
          ? 'Record task + regression outcomes beside val loss, peak memory, latency · pick the fix that reaches the failure'
          : 'Diagnose which weights can actually move the failing behavior',
        0,
        355,
        26,
        rec > 0.2 ? COSMOS.emerald : COSMOS.ink,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, partTable, partDiag);

  c.on('diagnose-policy-1', () => s.play(showTable.to(1, { duration: 0.2 })));
  c.on('diagnose-policy-2', () => {
    s.play(
      par(showTable.to(0, { duration: 0.16 }), delay(showDiag.to(1, { duration: 0.2 }), 0.16)),
    );
  });
  c.on('diagnose-path', () => s.play(hlPath.to(1, { duration: 0.4 })));
  c.on('diagnose-overfit', () => s.play(hlOverfit.to(1, { duration: 0.45 })));
  c.on('diagnose-policy-3', () =>
    s.play(showRecord.to(1, { duration: remainDuration(c, 'diagnose-policy-3', 0.45) })),
  );
}
