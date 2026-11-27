// Scene 05: A quality rule chooses what remains: Score cutoff sweep across 5 records + prose rule prediction.
import {
  COSMOS,
  aura,
  corpus,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  laserRail,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function filter(s, c) {
  const cutoff = s.value(0.2);
  const labelPulse = s.value(0);
  const rulePrompt = s.value(0);
  const proseRuleOn = s.value(0);

  const bgAura = aura(0, 0, 660, '#16254a28', '#ff6b8b14');
  const title = heroTitle(['Quality Cutoffs', '& Domain Rules'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'QUALITY FILTERING · 5 RECORDS BEFORE DEDUP',
  });

  // Staggered non-overlapping positions for the 5 records above the score laser rail
  const layout = {
    D: { boxX: -620, y: -95, tag: 'Menu' },
    C: { boxX: 115, y: -165, tag: 'Code' },
    E: { boxX: 280, y: -12, tag: 'Prose' },
    A: { boxX: 655, y: -165, tag: 'Mirror 1' },
    B: { boxX: 655, y: -12, tag: 'Mirror 2' },
  };

  const live = guardedDynamic(s.value(1), () => {
    const cut = cutoff.value;
    const lp = labelPulse.value;
    const rp = rulePrompt.value;
    const pr = proseRuleOn.value > 0.5;

    const railX0 = -760;
    const railX1 = 760;
    const railY = 175;
    const scoreX = (v) => railX0 + (railX1 - railX0) * v;
    const cx = scoreX(cut);

    const kept = corpus.filter(
      (r) => r.score >= cut - 1e-9 && (!pr || (r.source === 'Prose' && r.tokens >= 200)),
    );
    const keptTokens = kept.reduce((acc, r) => acc + r.tokens, 0);
    const meanScore =
      keptTokens > 0 ? kept.reduce((acc, r) => acc + r.tokens * r.score, 0) / keptTokens : 0;

    const nodes = [...laserRail(railX0, railX1, railY, { activeFrom: cut })];

    // Glowing cutoff laser (starts below record boxes so it never slashes across text)
    nodes.push(
      glowingTrail(
        [
          [cx, 62],
          [cx, railY + 75],
        ],
        { color: COSMOS.gold, width: 4.5, glow: 12 },
      ),
      txt(`CUTOFF ${cut.toFixed(2)}`, cx, railY + 118, 34, COSMOS.gold, 'mono').glow(
        8,
        COSMOS.gold,
      ),
    );

    // 5 floating record nodes
    corpus.forEach((rec) => {
      const cfg = layout[rec.id];
      const rx = scoreX(rec.score);
      const alive = kept.some((k) => k.id === rec.id);
      const isCode = rec.source === 'Code';
      const baseCol = isCode ? COSMOS.violet : rec.id === 'D' ? COSMOS.rose : COSMOS.cyan;
      const col = alive ? baseCol : COSMOS.dim;
      const boxX = cfg.boxX;

      nodes.push(
        glassCell(boxX, cfg.y, 280, 98, col, {
          fill: alive ? '#111930' : '#0a0d17',
          glow: alive ? 7 + lp * 3 : 0,
          opacity: alive ? 0.95 : 0.36,
          dash: alive ? undefined : [8, 6],
        }),
        txt(`${rec.id} · ${cfg.tag}`, boxX, cfg.y - 20, 26, col, 'mono'),
        txt(
          `${rec.tokens} tok · ${rec.score.toFixed(2)}`,
          boxX,
          cfg.y + 22,
          28,
          alive ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
        glowDot(rx, railY, {
          radius: alive ? 10 : 6,
          color: col,
          glow: alive ? 12 : 0,
          opacity: alive ? 1 : 0.45,
        }),
      );
    });

    // Live floating telemetry at top-right (well above row y = -165)
    nodes.push(
      txt('RETAINED TOKENS', 60, -425, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${keptTokens}`, 60, -356, 62, COSMOS.cyan, 'mono', 'left').glow(8, COSMOS.cyan),
      txt('WEIGHTED MEAN', 480, -425, 26, COSMOS.muted, 'mono', 'left'),
      txt(meanScore.toFixed(3), 480, -356, 62, COSMOS.gold, 'mono', 'left').glow(6, COSMOS.gold),
    );

    // Bottom status / prediction prompt
    if (rp > 0.05 && !pr) {
      nodes.push(
        txt(
          'Policy: cutoff 0.50 + Prose source + >= 200 tokens · which record drops?',
          0,
          410,
          34,
          COSMOS.gold,
          'serif',
        )
          .glow(6, COSMOS.gold)
          .opacity(rp),
      );
    } else if (pr) {
      nodes.push(
        txt(
          'C drops out (Code · 120 tok) -> 680 prose tokens survive (A, B, E)',
          0,
          410,
          34,
          COSMOS.rose,
          'sans',
        ).glow(6, COSMOS.rose),
      );
    } else {
      nodes.push(
        txt(
          'Raising cutoff drops lower scores and lifts survivor mean',
          0,
          410,
          32,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('filter-b1-1', () =>
    s.play(labelPulse.to(1, { duration: remainDuration(c, 'filter-b1-1', 0.6) })),
  );
  c.on('filter-threshold-rise', () =>
    s.play(cutoff.to(0.69, { duration: remainDuration(c, 'filter-threshold-rise', 1.1) })),
  );
  c.on('filter-b2-1', () =>
    s.play(cutoff.to(0.76, { duration: remainDuration(c, 'filter-b2-1', 0.8) })),
  );
  c.on('filter-b2-2', () =>
    s.play(cutoff.to(0.85, { duration: remainDuration(c, 'filter-b2-2', 0.9) })),
  );

  // Beat 2: snap cutoff back to 0.50 cleanly and ask prediction question
  c.onBeat(2, () => {
    s.play(cutoff.to(0.5, { duration: 0.04 }));
  });
  c.on('filter-rule-question', () =>
    s.play(rulePrompt.to(1, { duration: remainDuration(c, 'filter-rule-question', 0.5) })),
  );
  // Strict prediction withholding: drop C only after "C drops out"
  c.after('filter-b3-1', () =>
    s.play(proseRuleOn.to(1, { duration: remainAfterDuration(c, 'filter-b3-1', 0.4) })),
  );
}
