// Scene 12: How much did the mirror cost?: Fixed 1,000-token proportional ribbon through filter & dedup + 700-token target gap.
import {
  COSMOS,
  INV_FIXTURE,
  aura,
  corpus,
  glassCell,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function inventory(s, c) {
  const phase = s.value(0);
  const dropD = s.value(0);
  const askFrac = s.value(0);
  const dropB = s.value(0);
  const showTarget = s.value(0);
  const showGap = s.value(0);

  const bgAura = aura(0, 0, 640, '#16274e28', '#ffd16614');
  const title = heroTitle(['Proportional Token', 'Survival Funnel'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'INVENTORY ACCOUNTING · 1,000-TOKEN FIXED SCALE',
  });

  const order = ['A', 'B', 'C', 'E', 'D'];
  const recMap = Object.fromEntries(corpus.map((r) => [r.id, r]));

  const live = guardedDynamic(s.value(1), () => {
    const dd = dropD.value;
    const af = askFrac.value;
    const db = dropB.value;
    const st = showTarget.value;
    const sg = showGap.value;

    const scaleLeft = -760;
    const scaleW = 1500;
    const pxPerTok = scaleW / INV_FIXTURE.counts[0].tokens; // 1.5 px/token
    const activeY = -55;
    const droppedY = 148;

    const nodes = [
      // Scale ruler ticks 0..1000
      glowingTrail(
        [
          [scaleLeft, -185],
          [scaleLeft + scaleW, -185],
        ],
        { color: '#455780', width: 2.5, glow: 0, core: false },
      ),
    ];
    for (const tick of [0, 200, 400, 600, 800, 1000]) {
      const tx = scaleLeft + tick * pxPerTok;
      nodes.push(txt(String(tick), tx, -216, 26, COSMOS.dim, 'mono'));
    }

    // Compute animated x/y positions for each record so C and E smoothly close the gap when B drops
    let curX = scaleLeft;
    const survivingCount =
      db > 0.5
        ? INV_FIXTURE.counts[2].tokens
        : dd > 0.5
          ? INV_FIXTURE.counts[1].tokens
          : INV_FIXTURE.counts[0].tokens;

    order.forEach((id) => {
      const rec = recMap[id];
      const w = rec.tokens * pxPerTok;
      const isD = id === 'D';
      const isB = id === 'B';
      const baseCol =
        id === 'C' ? COSMOS.violet : isD ? COSMOS.rose : isB ? COSMOS.amber : COSMOS.cyan;

      let xCenter;
      let yCenter;
      let op = 0.96;
      let dash;

      if (isD) {
        xCenter = scaleLeft + 800 * pxPerTok + w * 0.5;
        yCenter = activeY + (droppedY - activeY) * dd;
        op = 0.96 - 0.52 * dd;
        if (dd > 0.5) dash = [8, 6];
      } else if (isB) {
        const dropPhase = Math.min(1, db * 2.2);
        xCenter = scaleLeft + 240 * pxPerTok + w * 0.5;
        yCenter = activeY + (droppedY - activeY) * dropPhase;
        op = 0.96 - 0.52 * dropPhase;
        if (dropPhase > 0.5) dash = [8, 6];
      } else {
        // Drop B down first, then slide C and E left to close the gap cleanly
        const slidePhase = Math.max(0, (db - 0.5) / 0.5);
        const startTok = id === 'A' ? 0 : id === 'C' ? 480 : 600;
        const shiftedTok = id === 'A' ? 0 : startTok - 240 * slidePhase;
        xCenter = scaleLeft + shiftedTok * pxPerTok + w * 0.5;
        yCenter = activeY;
      }

      const highlightB = isB && af > 0.5 && db < 0.5;
      nodes.push(
        glassCell(xCenter, yCenter, w - 10, 146, highlightB ? COSMOS.gold : baseCol, {
          fill: highlightB ? '#241e12' : '#0f182c',
          glow: highlightB ? 12 : op > 0.7 ? 7 : 0,
          opacity: op,
          dash,
        }),
        txt(id, xCenter, yCenter - 36, 34, highlightB ? COSMOS.gold : baseCol, 'mono').opacity(op),
        txt(`${rec.tokens}`, xCenter, yCenter + 12, 30, COSMOS.ink, 'mono').opacity(op),
        txt(
          isB ? 'mirror' : rec.source.toLowerCase(),
          xCenter,
          yCenter + 48,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(op),
      );
      curX += w;
    });

    // Top-right live telemetry
    nodes.push(
      txt('SURVIVING TOKENS', 430, -425, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${survivingCount} / 1000`, 430, -356, 56, COSMOS.cyan, 'mono', 'left').glow(
        8,
        COSMOS.cyan,
      ),
    );

    // 700-token presentation target laser line
    if (st > 0.02) {
      const targetX = scaleLeft + 700 * pxPerTok;
      const survX = scaleLeft + 560 * pxPerTok;
      nodes.push(
        glowingTrail(
          [
            [targetX, -180],
            [targetX, 65],
          ],
          { color: COSMOS.gold, width: 4.5, glow: 12, opacity: st },
        ),
        txt('BUDGET: 700', targetX, 102, 30, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(st),
      );
      if (sg > 0.02) {
        nodes.push(
          glassCell((survX + targetX) * 0.5, activeY, targetX - survX - 8, 146, COSMOS.amber, {
            fill: '#231710',
            glow: 10,
            opacity: sg,
            dash: [10, 6],
          }),
          txt('-140', (survX + targetX) * 0.5, activeY - 12, 38, COSMOS.amber, 'mono')
            .glow(6, COSMOS.amber)
            .opacity(sg),
          txt('shortfall', (survX + targetX) * 0.5, activeY + 34, 26, COSMOS.amber, 'sans').opacity(
            sg,
          ),
        );
      }
    }

    // Bottom narrative status (withholding 30% until B drops in beat 1!)
    const bottomText =
      sg > 0.5
        ? '560 unique tokens vs 700 budgeted -> 140 shortfall (add sources or schedule repeats)'
        : st > 0.5
          ? 'Target budget: 700 token presentations across 3 surviving records'
          : db > 0.5
            ? 'Mirror B was 240 / 800 = 30% · 560 tokens survive in A, C, E (B lineage -> A)'
            : af > 0.5
              ? '800 tokens remain · what fraction does mirror B (240 tok) occupy?'
              : 'Drop menu D (-200 tokens) at cutoff 0.50 -> 800 tokens remain';
    nodes.push(
      txt(
        bottomText,
        0,
        380,
        32,
        sg > 0.5 ? COSMOS.amber : db > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ).glow(6, sg > 0.5 ? COSMOS.amber : COSMOS.gold),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pt-inventory-filter', () =>
    s.play(dropD.to(1, { duration: remainDuration(c, 'pt-inventory-filter', 0.8) })),
  );
  c.on('pt-inventory-question', () =>
    s.play(askFrac.to(1, { duration: remainDuration(c, 'pt-inventory-question', 0.5) })),
  );
  // Strict prediction withholding: reveal 30% & drop mirror B only on/after beat 1 merge cue
  c.after('pt-inventory-merge', () =>
    s.play(dropB.to(1, { duration: remainAfterDuration(c, 'pt-inventory-merge', 0.9) })),
  );
  c.on('pt-inventory-target', () =>
    s.play(showTarget.to(1, { duration: remainDuration(c, 'pt-inventory-target', 0.6) })),
  );
  c.after('pt-inventory-gap', () =>
    s.play(showGap.to(1, { duration: remainAfterDuration(c, 'pt-inventory-gap', 0.5) })),
  );
}
