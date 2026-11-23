import { after, decision, river, runHolds } from '../circulation.mjs';
import { verifyHold } from '../model.mjs';

export default {
  id: 'hard-gates',
  cues: [
    'fresh-read',
    'returned-fields',
    'checked-verdict',
    'wrong-book-probe',
    'stale-version-probe',
    'counterfactual-verdict',
    'forbidden-attempt',
    'effect-versus-attempt',
    'forbidden-override',
  ],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const first = runHolds(river, ['op-17']);
    const write = first.attempts[0].receipt;
    const probe = state.beat === 1 && focus.visible('wrong-book-probe');
    const stale = probe && focus.visible('stale-version-probe');
    const forbidden = state.beat === 2 && focus.visible('forbidden-attempt');
    const read = { ...first.read, book: probe && !stale ? 'B8' : 'B7', version: stale ? 2 : 3 };
    const hasRead = state.beat > 0 || after(state, 'fresh-read');
    const passed = verifyHold({ authorized: true, attemptedForbidden: forbidden, write, read });
    const scored = forbidden
      ? after(state, 'forbidden-override')
      : probe
        ? after(state, 'counterfactual-verdict')
        : state.beat > 1 || after(state, 'checked-verdict');
    api.text(ctx, 'Permitted operation 17', 425, 288, 40, C.cyan);
    focus.target('read', () => api.text(ctx, 'Independent account read', 1100, 288, 40, C.cyan));
    const rows = [
      ['Reader', write.reader, read.reader, read.reader === write.reader],
      ['Resource', 'Book: ' + write.book, 'Book: ' + read.book, read.book === write.book],
      ['Outcome', 'Exactly one hold', read.count + ' hold', read.count === 1],
      [
        'Freshness',
        'Committed v' + write.version,
        'Read v' + read.version,
        read.version >= write.version,
      ],
    ];
    focus.target('comparison', () => {
      rows.forEach(([label, expected, observed, matches], i) => {
        const y = 388 + i * 98;
        api.text(ctx, label, 155, y, 29, C.muted);
        api.text(ctx, expected, 425, y, 39, C.ink);
        api.text(ctx, hasRead ? observed : '…', 1100, y, 39, C.ink);
        api.line(ctx, 155, y + 34, 1745, y + 34, '#344451', 2);
        if (hasRead && scored)
          api.text(ctx, matches ? '✓' : '×', 1650, y, 44, matches ? C.green : C.pink);
      });
    });
    focus.target('policy', () => {
      api.text(ctx, 'Host trace', 155, 815, 31, C.muted);
      api.text(
        ctx,
        forbidden
          ? 'Private-account read denied   ·   no data returned'
          : 'Hold permitted   ·   no forbidden attempts',
        425,
        815,
        37,
        forbidden ? C.yellow : C.ink,
      );
    });
    focus.target('verdict', () =>
      decision(
        ctx,
        api,
        scored
          ? passed
            ? 'PASS · verified authorized hold'
            : forbidden
              ? 'FAIL · forbidden attempt in trace'
              : 'FAIL · returned state mismatch'
          : hasRead
            ? 'Scoring returned evidence'
            : 'Waiting for the account read',
        scored ? (passed ? C.green : C.pink) : C.muted,
      ),
    );
  },
};
