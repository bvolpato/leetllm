import { ARTICLE_RECORD } from '../fixtures.mjs';
import { answerDigest } from '../model.mjs';
import { cueProgress } from '../arithmetic.mjs';

const reviewed = answerDigest();
const longerAnswer = {
  ...ARTICLE_RECORD,
  response: ARTICLE_RECORD.response.replace('30 days', '90 days'),
};
const longerLifetime = { ...ARTICLE_RECORD, expires_at: 8200 };

export function drawAdmission(ctx, scene, state, api) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left', font = 'sans') =>
    api.text(ctx, s, x, y, size, color, align, font);
  const started = (beat, id, start, end) => cueProgress(state, beat, id, start, end) > 0;
  const edited = started(1, 'edit-answer', 0.06, 0.24);
  const extended = started(2, 'extend-expiry', 0.42, 0.62);
  const reset = started(3, 'restore-original', 0.34, 0.52);
  const revoked = started(3, 'revoke-approval', 0.6, 0.78);
  const record = reset
    ? ARTICLE_RECORD
    : extended
      ? longerLifetime
      : edited
        ? longerAnswer
        : ARTICLE_RECORD;
  const fingerprint = answerDigest(record);
  const checked =
    extended && !reset
      ? started(3, 'expiry-verdict', 0, 0.16)
      : edited && !extended
        ? started(2, 'text-verdict', 0, 0.16)
        : started(0, 'bind-review', 0.52, 0.68);
  const expected = revoked ? undefined : reviewed;
  const matches = expected === fingerprint;
  const duration = (r) => r.response.match(/\d+ days/)[0];

  for (const [i, r] of [ARTICLE_RECORD, record].entries()) {
    const x = i ? 1030 : 112;
    const diff = i && r.response !== ARTICLE_RECORD.response;
    const expiryChanged = i && r.expires_at !== ARTICLE_RECORD.expires_at;
    const color = i ? C.cyan : C.blue;
    txt(i ? 'Record on this read' : 'Record the reviewer approved', x, 249, 38, color);
    api.line(ctx, x, 272, x + 750, 272, color, 3);
    txt('Revoked API keys remain visible\nin audit logs for', x, 364, 43);
    focus.target('record-value', () => txt(duration(r), x, 548, 82, diff ? C.pink : C.ink));
    focus.target('record-expiry', () => {
      txt('Expires at', x, 640, 30, C.muted);
      txt(
        r.expires_at.toLocaleString('en-US') + ' s',
        x + 205,
        644,
        42,
        expiryChanged ? C.pink : C.ink,
      );
    });
    txt(i ? 'Computed SHA-256 prefix' : 'Reviewed SHA-256 prefix', x, 741, 30, C.muted);
    focus.target('record-digest', () =>
      txt(
        i && !checked ? '?' : (i ? fingerprint : reviewed).slice(0, 16),
        x,
        810,
        43,
        i && checked && fingerprint !== reviewed ? C.pink : color,
        'left',
        'mono',
      ),
    );
  }
  api.line(ctx, 112, 864, 1808, 864, C.panel, 3);
  focus.target('approval-state', () =>
    txt(
      revoked ? 'Review withdrawn' : 'Same active review ID',
      112,
      956,
      37,
      revoked ? C.pink : C.blue,
    ),
  );
  focus.target('read-verdict', () => {
    const verdict = !checked
      ? 'Does this review cover the record?'
      : matches
        ? 'Record check passes'
        : revoked
          ? 'Exact and semantic reads both stop'
          : 'Digest mismatch   ·   Bypass this record';
    txt(verdict, 1798, 956, 41, !checked ? C.yellow : matches ? C.green : C.pink, 'right');
  });
}
export default {
  id: 'admission',
  draw: drawAdmission,
  cues: [
    'bind-review',
    'edit-answer',
    'text-verdict',
    'extend-expiry',
    'expiry-verdict',
    'restore-original',
    'revoke-approval',
  ],
};
