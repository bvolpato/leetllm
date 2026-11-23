import {
  freshSecureState,
  reportAdmission,
  secureRepairTransfer,
  sourceRecord,
} from '../arithmetic.mjs';
import { SECURE_SOURCES } from '../fixtures.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

const describe = (ref) => ref.id + ' v' + ref.revision;
const list = (refs) => refs.map(describe).join(' + ');

export function drawFreshRelease(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const began = (id) => cue(id).phase !== 'before';
  const model = freshSecureState();
  const initial = SECURE_SOURCES.slice(0, 3).map(sourceRecord);
  const revoked = done('sr-fresh-release-changes');
  const sources = initial.map((r) => {
    if (r.id === 'checklist' && (done('fresh-version') || revoked)) return model.current[0];
    if (r.id === 'FAQ' && revoked) return model.current[1];
    return r;
  });
  const label = (s, x, y, size, color = c.ink, align = 'left') =>
    drawText(ctx, api, s, x, y, size, color, align);

  if (state.beat < 2) {
    api.focus.target('live-records', () => {
      label('Tenant A   /   operations + security', 115, 258, 38, c.blue);
      label('Current source', 115, 376, 34, c.muted);
      sources.forEach((r, i) => {
        const y = 465 + 115 * i;
        drawLine(ctx, api, 115, y + 60, 710, y + 60, c.muted);
        label(describe(r), 115, y + 27, 37);
        const grant = r.grant === 'tenant' ? 'all staff' : (r.grant ?? 'no read grant');
        label(grant, 412, y + 26, 31, r.grant === null ? c.pink : c.blue);
      });
      if (done('sr-fresh-release-token'))
        label('Task and policy snapshot valid', 115, 834, 30, c.blue);
    });

    api.focus.target('old-copies', () => {
      const held = done('sr-fresh-release-hold');
      const copies = [
        {
          name: 'Saved report',
          refs: model.oldReport,
          visible: began('sr-fresh-release-report'),
          explain: done('fresh-report-reason'),
          allowed: model.oldReportAllowed,
        },
        {
          name: 'Buffered draft',
          refs: model.oldDraft,
          visible: began('sr-fresh-release-draft'),
          explain: done('fresh-draft-reason'),
          allowed: model.oldDraftAllowed,
        },
      ];
      copies.forEach(({ name, refs, visible, explain, allowed }, index) => {
        const x = 757 + 528 * index;
        drawRectangle(ctx, api, x, 309, 498, 552, c.muted);
        label(name, x + 23, 372, 38);
        if (!visible) return;
        const heading = (index ? 'context: ' : '') + list(refs);
        label(heading, x + 23, 424, 26, c.muted);
        sources.forEach((src, row) => {
          const ref = refs.find((r) => r.id === src.id);
          const y = 465 + 115 * row;
          if (!ref) return;
          const pass = reportAdmission([ref], sources, model.principal);
          const color = explain ? (pass ? c.green : c.pink) : c.blue;
          drawRectangle(ctx, api, x + 22, y - 9, 454, 74, color);
          label(describe(ref), x + 38, y + 39, 34, color);
          const note =
            index === 1
              ? ref.id === 'key'
                ? 'cited'
                : 'uncited'
              : explain
                ? ref.revision !== src.revision
                  ? 'older revision'
                  : !pass
                    ? 'grant lost'
                    : ''
                : '';
          if (note) label(note, x + 455, y + 39, 26, color, 'right');
        });
        label(
          held ? (allowed ? 'May leave' : 'Hold') : 'Awaiting decision',
          x + 24,
          826,
          34,
          held ? (allowed ? c.green : c.pink) : c.muted,
        );
      });
    });
    if (done('sr-fresh-release-token') && !done('sr-fresh-release-hold'))
      label('Which old copy may leave now?', 115, 970, 42, c.yellow);
    else if (done('fresh-draft-reason'))
      label('One uncited source is enough to hold the whole draft.', 115, 970, 39);
    return;
  }

  if (state.beat === 2) {
    const moving = secureRepairTransfer(cue('sr-fresh-release-rebuild').progress);
    api.focus.target('new-manifest', () => {
      label('Held report', 125, 256, 29, c.pink);
      label(list(model.oldReport), 350, 256, 31, c.muted);
      label('Held draft', 960, 256, 29, c.pink);
      label('context: ' + list(model.oldDraft), 1165, 256, 31, c.muted);
      drawLine(ctx, api, 125, 297, 1795, 297);
      label('Current sources in tenant A', 125, 384, 38);
      const column = (i) => 125 + i * 573;
      sources.forEach((r, i) => {
        const x = column(i);
        drawRectangle(ctx, api, x, 425, 520, 107, r.grant === null ? c.pink : c.blue);
        label(describe(r), x + 25, 492, 37);
        label(r.grant ?? 'no grant', x + 485, 491, 29, r.grant === null ? c.pink : c.blue, 'right');
      });
      model.replacement.forEach((ref, i) => {
        const x = column(sources.findIndex((r) => r.id === ref.id));
        const arrived = i < moving.settled;
        const travelling = moving.active && i === moving.index;
        drawLine(ctx, api, x, 801, x + 520, 801);
        if (!arrived && !travelling) return;
        const progress = arrived ? 1 : api.ease(moving.local);
        const y = 547 + 146 * progress;
        drawRectangle(ctx, api, x + 15, y, 490, 82, c.green);
        label(ref.tenant + ':' + describe(ref), x + 40, y + 55, 36, c.green);
      });
      label('Replacement report manifest', 125, 895, 38);
      if (done('sr-fresh-release-report-admit'))
        label(
          'Report predicate: ' + (model.replacementAllowed ? 'ADMIT' : 'HOLD'),
          1175,
          895,
          38,
          model.replacementAllowed ? c.green : c.pink,
        );
      if (done('fresh-new-draft'))
        label('New draft uses the same two current sources.', 125, 981, 33, c.blue);
    });
    return;
  }

  api.focus.target('quote-check', () => {
    const corrected = done('fresh-correct');
    const checked = corrected ? done('fresh-match') : done('fresh-mismatch');
    const output = corrected ? model.replacementOutput : model.proposedOutput;
    const matches = corrected ? model.quoteMatches : model.proposedQuoteMatches;
    const ink = checked ? (matches ? c.green : c.pink) : c.blue;
    function sentence(value, y, color) {
      const [subject, verb, rest] = value.split(/\b(reviews|approves)\b/);
      label(subject.trim(), 160, y, 44);
      drawRectangle(ctx, api, 550, y - 62, 239, 84, color);
      label(verb, 574, y, 44, color);
      label(rest.trim(), 822, y, 44);
    }
    label('Key runbook v7   /   example source passage', 125, 293, 32, c.blue);
    drawRectangle(ctx, api, 125, 324, 1670, 128, c.blue);
    sentence(model.excerpt.sentence, 407, c.blue);
    label('Buffered reply to the requesting reader', 125, 549, 32, c.muted);
    drawRectangle(ctx, api, 125, 579, 1670, 128, c.muted);
    sentence((corrected ? model.draft : model.proposed).split(' [source:')[0], 661, ink);
    label('[source:key]', 1460, 661, 32, c.blue);
    if (done('fresh-local-checks') && output.allow)
      label('Context, privacy, clearance and citation ID pass.', 125, 810, 34, c.green);
    if (checked)
      label(
        matches ? 'Exact sentence in key v7' : 'Hold the draft. The source promises a review.',
        125,
        883,
        37,
        ink,
      );
    else if (!corrected && began('fresh-support-question'))
      label('Would you send this sentence as written?', 125, 935, 42, c.yellow);
    if (done('fresh-send'))
      label(
        model.release ? 'Send this reply' : 'Hold this reply',
        125,
        1001,
        50,
        model.release ? c.green : c.pink,
      );
  });
}

export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'sr-fresh-release-reader',
    'sr-fresh-release-report',
    'sr-fresh-release-draft',
    'fresh-version',
    'sr-fresh-release-changes',
    'sr-fresh-release-token',
    'fresh-question',
    'sr-fresh-release-hold',
    'fresh-report-reason',
    'fresh-draft-reason',
    'sr-fresh-release-rebuild',
    'sr-fresh-release-report-admit',
    'fresh-new-draft',
    'fresh-local-checks',
    'fresh-support-question',
    'fresh-mismatch',
    'fresh-correct',
    'fresh-match',
    'fresh-send',
  ],
};
