// Scene 03: selector: 44 (0.82), 32 (0.70), 48 (0.95) -> predict winner? -> AFTER winner-moves reveal 48 steals return slot while 44 keeps true checkmark!
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  scored,
  txt,
} from '../parts.mjs';

export default function selector(s, c) {
  const showThird = s.value(0);
  const revealSteal = s.value(0); // strictly withheld until AFTER winner-moves!
  const showAudit = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['When a Learned Scorer Misfires:', 'Higher Score Can Pick a Worse Answer'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.err,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const th = showThird.value;
    const st = revealSteal.value;
    const au = showAudit.value;

    const barX = -460;
    const maxW = 760;

    const nodes = [
      txt(
        'BEST-OF-N RANKING BY LEARNED SCORER (TRUE COUNT = 44)',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    scored.forEach((row, idx) => {
      const y = -110 + idx * 105;
      const visible = idx < 2 || th > 0.3;
      const op = alpha * (visible ? 1 : 0.45);
      const isTrue = row.answer === 44;
      const isWinner = (st > 0.35 && idx === 2) || (st <= 0.35 && idx === 0);
      const col = idx === 2 ? ROLE.err : isTrue ? ROLE.ok : ROLE.draft;
      nodes.push(
        txt(
          `Ans ${row.answer}${isTrue ? ' [TRUE]' : ''}`,
          -855,
          y,
          28,
          col,
          'mono',
          'left',
        ).opacity(op),
        lumBar(barX, y, row.score * maxW, 42, col, { opacity: op, maxTrackW: maxW }),
        txt(
          `${row.score.toFixed(2)}${isWinner ? (st > 0.35 ? ' -> SENT (WRONG!)' : ' (best so far)') : ''}`,
          barX + maxW + 24,
          y,
          26,
          col,
          'mono',
          'left',
        ).opacity(op),
      );
    });

    nodes.push(
      chipPill(
        au > 0.35
          ? 'Compare budgets with an independent checker on returned outputs, never just scorer values!'
          : st > 0.35
            ? '48 takes the return slot (0.95 > 0.82) while 44 stays true -> coverage rose, accuracy dropped!'
            : 'Candidate 3 answers 48 and scores 0.95: if largest score wins, which count gets returned?',
        0,
        240,
        {
          w: 1620,
          h: 78,
          color: st > 0.35 ? ROLE.err : ROLE.gold,
          fill: st > 0.35 ? '#321420' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'scorer-ranking', (d) => s.play(showThird.to(0, { duration: d })));
  playCue(s, c, 'overrated-answer', (d) => s.play(showThird.to(1, { duration: d })));
  playCue(s, c, 'score-question', (d) => s.play(revealSteal.to(0, { duration: d })));
  // Strict prediction withholding: reveal 48 stealing return slot only after winner-moves!
  playCue(s, c, 'winner-moves', (d) => s.play(revealSteal.to(1, { duration: d })), { after: true });
  playCue(s, c, 'coverage-preserved', (d) => s.play(revealSteal.to(1, { duration: d })));
  playCue(s, c, 'selection-regression', (d) => s.play(showAudit.to(1, { duration: d })));
}
