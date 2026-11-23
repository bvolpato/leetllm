import { ARTICLE_RECORD, SHADOW_ROWS } from '../fixtures.mjs';
import { cueProgress } from '../arithmetic.mjs';

export function drawRouteOrder(ctx, scene, state, api) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat < 2) {
    const pre = state.beat === 0;
    const steps = pre
      ? ['Permission', 'Trusted route', 'Candidate score']
      : ['Record scope', 'Clock < expiry', 'Score check'];
    const rows = pre
      ? [
          ['Unknown route', 'Access revoked', ['Denied', '—', '—']],
          ['Live incident', 'Access current', ['Allowed', 'Bypass live', '—']],
        ]
      : [
          ['At expiry', 'Clock = 4,600 s', ['Matches', 'Expired', '—']],
          ['One second earlier', 'Clock = 4,599 s', ['Matches', 'Fresh', 'Invalid score']],
        ];
    const first =
      cueProgress(state, pre ? 0 : 1, pre ? 'deny-first' : 'sc-record-expired', 0.15, 0.34) > 0;
    const second =
      cueProgress(state, pre ? 0 : 1, pre ? 'live-bypass' : 'sc-record-invalid-score', 0.5, 0.7) >
      0;
    txt(
      pre
        ? 'Two valid request objects'
        : 'Admitted policy record    ·    Active retrieval policy and scope',
      112,
      251,
      38,
      C.ink,
    );
    const xs = [670, 1105, 1540];
    for (const [j, s] of steps.entries()) txt(s, xs[j], 371, 36, C.muted, 'center');
    api.line(ctx, 112, 399, 1808, 399, C.panel, 4);
    focus.target('gate-trace', () => {
      for (const [i, [request, input, values]] of rows.entries()) {
        const y = 486 + 211 * i;
        txt(request, 112, y + 18, 43);
        txt(input, 112, y + 77, 31, C.muted);
        for (const [j, value] of values.entries()) {
          const visible = i === 0 ? first : second;
          const blocked = ['Denied', 'Expired', 'Invalid score'].includes(value);
          const color =
            value === '—'
              ? C.muted
              : blocked
                ? C.pink
                : value === 'Bypass live'
                  ? C.yellow
                  : C.cyan;
          txt(visible ? value : '?', xs[j], y + 43, 43, visible ? color : C.muted, 'center');
        }
      }
    });
    txt(
      pre
        ? 'A dash marks a check the request never reached.'
        : 'Both inputs supply NaN. Both use the same reviewed record and the same expiry.',
      960,
      961,
      35,
      C.muted,
      'center',
    );
    return;
  }
  const exception = SHADOW_ROWS[4];
  const revealed = cueProgress(state, 2, 'sc-structural-wrong', 0.32, 0.56) > 0;
  txt('In-scope public-policy read    ·    Current permission and review', 112, 249, 32, C.muted);
  txt('Can I restore a revoked API key?', 112, 378, 62);
  api.line(ctx, 112, 434, 1808, 434, C.panel, 4);
  focus.target('score-result', () => {
    txt('Similarity', 112, 525, 33, C.muted);
    txt(exception.score.toFixed(4) + '   ≥   0.990', 112, 630, 70, C.cyan);
    txt('Candidate answer', 910, 525, 33, C.muted);
    txt(ARTICLE_RECORD.response.replace('in audit logs', '\nin audit logs'), 910, 608, 45);
  });
  if (revealed) {
    txt('Shadow decision', 112, 815, 32, C.muted);
    txt('Propose reuse', 112, 915, 55, C.yellow);
    txt('Offline review', 910, 815, 32, C.muted);
    txt('Restoration rule missing', 910, 915, 55, C.pink);
  }
}
export default {
  id: 'route-order',
  draw: drawRouteOrder,
  cues: [
    'deny-first',
    'live-bypass',
    'sc-record-expired',
    'sc-record-invalid-score',
    'sc-structural-wrong',
  ],
};
