import { policyScore } from '../model.mjs';

const limit = 5;
const passages = [
  { label: 'troubleshooting', score: 2 + 3 - 6, cue: 'troubleshooting-score' },
  { label: 'password reset', score: 0, cue: 'reset-score' },
  { label: 'governing rule', score: policyScore(10, true), cue: 'rule-seven' },
  { label: 'audit export', score: 2, cue: 'export-score' },
];
const scoreOrder = [...passages].sort((a, b) => b.score - a.score);

export function drawPhraseScorer(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.progress(id, 0) === 1;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    api.text(ctx, 'Day 10    /    service account    /    audit logging on', 140, 255, 41, C.ink);
    const terms = ['endpoint +2', 'service account +1', 'within 14 days +2', 'audit on +2'];
    focus.target('scores', () => {
      const zero = 777,
        unit = 95;
      api.text(ctx, 'Hand-written relevance score', 590, 355, 32, C.muted);
      for (const [i, passage] of passages.entries()) {
        const y = 438 + 94 * i;
        const color = i === 2 ? C.green : C.blue;
        api.text(ctx, passage.label, 140, y + 12, 40, color);
        api.circle(ctx, zero, y, 5, C.muted);
        if (!done(passage.cue)) continue;
        const x = zero + unit * passage.score;
        if (passage.score) api.line(ctx, zero, y, x, y, color, 9);
        api.circle(ctx, x, y, 11, color);
        api.text(
          ctx,
          String(passage.score),
          x + (passage.score < 0 ? -31 : 26),
          y + 12,
          35,
          color,
          passage.score < 0 ? 'right' : 'left',
        );
      }
    });
    focus.target('terms', () => {
      api.text(ctx, 'Governing rule   /   AUTH-14 earns', 140, 865, 33, C.green);
      terms.forEach((label, i) => {
        if (
          focus.progress(
            ['endpoint-points', 'actor-points', 'window-points', 'audit-points'][i],
            0,
          ) > 0
        )
          api.text(ctx, label, 140 + i * 415, 944, 36, C.ink);
      });
    });
    return;
  }

  if (beat === 1) {
    focus.target('order', () => {
      api.text(ctx, 'Search order', 140, 322, 37, C.muted);
      api.text(ctx, 'Highest score first', 1260, 322, 37, C.green);
      const placed = focus.progress('sort-fixture', 0) * passages.length;
      const rowY = (index) => 386 + 98 * index;
      for (const [rank, passage] of scoreOrder.entries()) {
        const source = rowY(passages.indexOf(passage));
        const dest = rowY(rank);
        const progress = Math.min(1, Math.max(0, placed - rank));
        // Change rows in the empty middle column, then slide into the settled rank.
        const leg = (index) => Math.min(1, Math.max(0, 3 * progress - index));
        const x = 140 + 560 * leg(0) + 560 * leg(2);
        const y = source + (dest - source) * leg(1);
        const color = passage.score >= limit ? C.green : C.blue;
        api.rect(ctx, x, y, 485, 78, C.panel, color, 6);
        api.text(ctx, passage.label, x + 22, y + 51, 36, color);
        api.text(ctx, String(passage.score), x + 452, y + 51, 37, color, 'right');
      }
    });
    focus.target('slots', () => {
      api.text(
        ctx,
        done('admission-five') ? `Context slot 1   /   score ≥ ${limit}` : 'Context slot 1',
        140,
        856,
        32,
        C.muted,
      );
      api.text(ctx, 'Context slot 2', 1000, 856, 32, C.muted);
      api.text(
        ctx,
        done('admission-five') ? 'AUTH-14  ·  api-auth-v2' : '…',
        140,
        935,
        43,
        C.green,
      );
      api.text(ctx, done('one-context') ? 'Empty' : '…', 1000, 935, 43, C.muted);
    });
    return;
  }

  const changed = done('day-fifteen');
  focus.target('rule', () => {
    api.text(
      ctx,
      'AUTH-14    /    fictional rule for service accounts',
      140,
      255,
      34,
      C.green,
      'left',
      'mono',
    );
    api.text(
      ctx,
      'Within 14 days of deprecation when audit logging is enabled.',
      140,
      351,
      46,
      C.ink,
    );
  });
  focus.target('requests', () => {
    const cols = [140, 412, 687, 1055, 1430];
    ['Request', 'Audit log', 'Score', 'Pack rule?', 'Allow use?'].forEach((v, i) =>
      api.text(ctx, v, cols[i], 503, 34, C.muted),
    );
    api.line(ctx, 140, 539, 1750, 539, C.muted, 2);
    const cases = [{ day: 10, audit: true }];
    if (changed) cases.push({ day: 15, audit: true });
    if (done('audit-off')) cases.push({ day: 10, audit: false });
    for (const [i, { day, audit }] of cases.entries()) {
      const y = 624 + 130 * i,
        score = policyScore(day, audit);
      const showScore = i === 0 || done('still-five');
      const showDecision = i === 0 || done('policy-denial');
      const allowed = day >= 0 && day <= 14 && audit;
      const values = [
        'Day ' + day,
        audit ? 'On' : 'Off',
        showScore ? score + ' ≥ ' + limit : '?',
        showScore ? (score >= limit ? 'Yes' : 'No') : '?',
        showDecision ? (allowed ? 'Yes' : 'No') : '?',
      ];
      values.forEach((v, j) =>
        api.text(
          ctx,
          v,
          cols[j],
          y,
          47,
          j === 3 && showScore ? C.green : j === 4 && showDecision && !allowed ? C.yellow : C.ink,
        ),
      );
    }
  });
}
export default {
  id: 'phrase-scorer',
  draw: drawPhraseScorer,
  cues: [
    'endpoint-points',
    'actor-points',
    'window-points',
    'audit-points',
    'rule-seven',
    'export-score',
    'reset-score',
    'troubleshooting-score',
    'sort-fixture',
    'admission-five',
    'one-context',
    'day-fifteen',
    'still-five',
    'policy-denial',
    'audit-off',
  ],
};
