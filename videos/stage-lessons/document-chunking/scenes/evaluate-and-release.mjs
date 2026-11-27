// Scene 8: Choose the smallest chunk that can answer (Release cap = 10 words, 3-field coverage gate)
import {
  COSMOS,
  RELEASE_ROWS,
  RELEASE_WORD_CAP,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function evaluateAndRelease(s, c) {
  const showCutoff = s.value(0);
  const showChecks = s.value(0);
  const showChoice = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Choose the Smallest', 'Chunk That Answers'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: `CANDIDATE SELECTION · WORD CAP <= ${RELEASE_WORD_CAP} · ALL 3 REQUIRED FIELDS`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const sCut = showCutoff.value;
    const sChk = showChecks.value;
    const sCh = showChoice.value;

    const nodes = [
      txt(
        'CANDIDATE CHUNKS TESTED AGAINST LABELED QUERY (CAP = 10 WORDS)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    RELEASE_ROWS.forEach((row, i) => {
      const y = -102 + i * 136;
      const revealed = sChk > 0.4;
      const picked = sCh > 0.4 && row.releasable;
      const col = picked
        ? COSMOS.emerald
        : revealed
          ? row.releasable
            ? COSMOS.emerald
            : COSMOS.rose
          : COSMOS.cyan;
      const badge = !revealed
        ? `${row.wordCount} words  |  verdict: ?`
        : row.releasable
          ? `${row.wordCount}w <= 10  |  3/3 FIELDS (WINNER!)`
          : !row.withinCap
            ? `${row.wordCount}w > 10   |  OVER CAP + NO TRIGGER`
            : `${row.wordCount}w <= 10  |  MISSING TIME & ID`;
      nodes.push(
        glassCell(0, y, 1680, 112, col, {
          fill: picked ? '#0e2824' : revealed && !row.releasable ? '#26111a' : '#10182d',
          glow: picked ? 11 : sCut > 0.3 ? 5 : 2,
        }),
        txt(`${i + 1}. ${row.id}`, -815, y - 24, 26, col, 'mono', 'left'),
        txt(row.text, -815, y + 18, 26, COSMOS.ink, 'sans', 'left'),
        txt(badge, 815, y - 24, 26, col, 'mono', 'right'),
      );
    });

    nodes.push(
      glowDot(-840, 345, { radius: 6, color: sCh > 0.4 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sCh > 0.4
          ? 'Selected: 10-word complete rule + locator incident-runbook-v3.pdf, page 7'
          : 'Which candidate stays within 10 words AND contains trigger, deadline, and deploy ID?',
        -812,
        347,
        28,
        sCh > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('release-query-cutoff-b1-1', () => s.play(showCutoff.to(0.5, { duration: 0.35 })));
  c.on('release-ten-word-cutoff-b1-2', () => s.play(showCutoff.to(1, { duration: 0.4 })));
  c.after('release-fragment-check-b2-1', () => s.play(showChecks.to(0.5, { duration: 0.4 })));
  c.on('release-complete-rule-b2-2', () => s.play(showChecks.to(0.8, { duration: 0.35 })));
  c.on('release-all-fields-b2-3', () => s.play(showChecks.to(1, { duration: 0.35 })));
  c.on('release-cutoff-choice-b3-1', () => s.play(showChoice.to(0.6, { duration: 0.4 })));
  c.on('release-source-span-b3-2', () =>
    s.play(showChoice.to(1, { duration: remainDuration(c, 'release-source-span-b3-2', 0.45) })),
  );
}
