// Scene 08: Screen the wording of C5 (Sliding 5-word overlap caliper over C5 + paraphrase blind spot)
import {
  COPY_SCREEN,
  COSMOS,
  PARAPHRASE_SCREEN,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function overlap(s, c) {
  const phase = s.value(0);
  const sWinStart = s.value(0);
  const sWinSlideHint = s.value(0);
  const sQuestion = s.value(0);
  const winIdx = s.value(0);
  const sHit = s.value(0);
  const sReject = s.value(0);
  const sParaMode = s.value(0);
  const paraPos = s.value(0);
  const sNoSpan = s.value(0);

  const bgAura = aura(0, 15, 680, '#13375c28', '#331a4018');

  const title = heroTitle(['Screen the Wording', 'of Candidate C5'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'BENCHMARK DECONTAMINATION · 5-WORD NORMALIZED WINDOW',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const para = sParaMode.value > 0.5;
    const report = para ? PARAPHRASE_SCREEN : COPY_SCREEN;
    const curStart = para ? paraPos.value : winIdx.value;
    const hit = !para && sHit.value > 0.5;
    const rej = !para && sReject.value > 0.5;
    const noHit = para && sNoSpan.value > 0.5;
    const qAsk = !para && sQuestion.value > 0.3 && sHit.value < 0.5;

    const tileW = 196;
    const leftX = -755;
    const posX = (idx) => leftX + idx * tileW;

    const drawRibbon = (tokens, y, indent, winStart, label, accentCol, highlightMatch) => {
      const out = [txt(label, leftX - 88, y - 78, 26, accentCol, 'mono', 'left')];
      tokens.forEach((tok, i) => {
        const cx = posX(indent + i);
        const inWin = winStart !== null && i >= winStart - 0.15 && i <= winStart + 4.15;
        out.push(
          glassCell(cx, y, tileW - 14, 78, inWin ? accentCol : COSMOS.rule, {
            fill: inWin ? (highlightMatch ? '#2a121c' : '#12223d') : '#0c1222',
            glow: inWin ? (highlightMatch ? 8 * pulse : 5) : 0,
            opacity: inWin ? 0.96 : 0.78,
          }),
          txt(tok, cx, y + 2, 28, inWin ? COSMOS.ink : COSMOS.muted, 'mono'),
        );
      });
      if (winStart !== null) {
        const x1 = posX(indent + winStart) - (tileW - 14) * 0.5;
        const x2 = posX(indent + winStart + 4) + (tileW - 14) * 0.5;
        const by = y + 54;
        out.push(
          line([x1, by], [x2, by], { stroke: accentCol, width: 4.4 }).glow(8, accentCol),
          line([x1, by - 14], [x1, by], { stroke: accentCol, width: 4.4 }),
          line([x2, by - 14], [x2, by], { stroke: accentCol, width: 4.4 }),
        );
      }
      return out;
    };

    const refWin = !para && curStart >= 0.8 ? Math.max(0, curStart - 1) : null;
    const candCol = hit ? COSMOS.rose : para ? COSMOS.cyan : COSMOS.gold;

    const nodes = [
      ...drawRibbon(
        report.referenceTokens,
        -105,
        1,
        refWin,
        'RESERVED EVALUATION TASK (PRIVATE INDEX · LOWERCASE, NO PUNCTUATION)',
        COSMOS.blue,
        hit,
      ),
      ...drawRibbon(
        report.tokens,
        138,
        0,
        curStart,
        para
          ? 'NEXT CANDIDATE (PARAPHRASE · SAME 5-WORD SCREEN)'
          : 'GENERATED CANDIDATE C5 (5-WORD WINDOW)',
        candCol,
        hit,
      ),
    ];

    // Match laser rails linking matched 5-word span
    if (hit) {
      const mIdx = Math.min(COPY_SCREEN.matches.length - 1, Math.max(0, Math.round(curStart - 1)));
      const midX = posX(1 + mIdx + 2);
      nodes.push(
        line([midX, -42], [midX, 82], { stroke: COSMOS.rose, width: 4, dash: [8, 6] }).glow(
          10,
          COSMOS.rose,
        ),
        glowDot(midX, 20, { radius: 8, color: COSMOS.rose }),
      );
    }

    // Bottom status bar (strictly withholds "the" until c.after('span-hit'))
    let footerMsg = '5-word window starts at "please"   ·   lowercase normalized tokens';
    let footerCol = COSMOS.cyan;
    if (qAsk) {
      footerMsg = 'PREDICT: Move 1 word right -> which word is at the right edge?';
      footerCol = COSMOS.gold;
    }
    if (hit && !rej) {
      footerMsg = 'MATCH: "fetch every page with the" (3 matching 5-word spans)';
      footerCol = COSMOS.rose;
    }
    if (rej) {
      footerMsg = 'C5 REJECTED · 3 matching 5-word spans -> keep exam copy out of training';
      footerCol = COSMOS.rose;
    }
    if (para && !noHit) {
      footerMsg = 'Scanning paraphrase with identical 5-word screen...';
      footerCol = COSMOS.cyan;
    }
    if (noHit) {
      footerMsg = '0 matching 5-word spans · same meaning! Add semantic retrieval for paraphrases';
      footerCol = COSMOS.amber;
    }

    nodes.push(
      glassCell(0, 355, 1690, 96, footerCol, { fill: '#10182b', glow: 7 }),
      glowDot(-805, 355, { radius: 7, color: footerCol }),
      txt(footerMsg, -770, 357, 28, footerCol, 'mono', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('window-start', () => s.play(sWinStart.to(1, { duration: 0.4 })));
  c.on('window-slide', () => s.play(sWinSlideHint.to(1, { duration: 0.4 })));
  c.on('span-question', () => s.play(sQuestion.to(1, { duration: 0.4 })));
  c.on('align-windows', () => s.play(winIdx.to(1, { duration: 0.65 })));
  c.after('span-hit', () => s.play(sHit.to(1, { duration: 0.35 })));
  c.on('following-windows', () => s.play(winIdx.to(3, { duration: 1.0 })));
  c.after('copy-outcome', () => s.play(sReject.to(1, { duration: 0.35 })));
  c.on('paraphrase-start', () => s.play(sParaMode.to(1, { duration: 0.35 })));
  c.on('paraphrase-scan', () =>
    s.play(paraPos.to(PARAPHRASE_SCREEN.tokens.length - 5, { duration: 1.4 })),
  );
  c.after('no-shared-span', () =>
    s.play(sNoSpan.to(1, { duration: remainDuration(c, 'no-shared-span', 0.4) })),
  );
}
