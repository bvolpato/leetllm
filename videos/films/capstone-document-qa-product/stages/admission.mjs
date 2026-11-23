import { LAB_POLICY, publicationRecords } from '../fixtures.mjs';
import { publicationDecision } from '../model.mjs';

export function drawAdmission(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const sources = publicationRecords.map((record, i) =>
    i === 0 && p('admission-edit') === 1
      ? { ...record, text: LAB_POLICY.replace('may be', 'may not be') }
      : record,
  );
  const rows = sources.map(publicationDecision);
  const edited = sources[0].text !== LAB_POLICY;
  const showDecision = p('admission-initial') === 1 && (!edited || p('admission-reject') === 1);

  const columns = [112, 700, 1292];
  ['Parser output', 'Controlled registry', 'Index on this build'].forEach((name, i) =>
    api.text(ctx, name, columns[i], 267, 35, C.muted),
  );
  rows.forEach((row, i) => {
    const y = 372 + i * 172;
    api.line(ctx, 112, y - 58, 1798, y - 58, C.panel, 3);
    focus.target('parsed-records', () => {
      api.text(ctx, row.record.id, columns[0], y, 38, C.ink);
      api.text(
        ctx,
        row.actual.slice(0, 12),
        columns[0],
        y + 58,
        31,
        edited && i === 0 ? C.yellow : C.blue,
        'left',
        'mono',
      );
    });
    focus.target('registry-records', () => {
      api.text(ctx, row.registry ? 'Published · US' : 'No grant', columns[1], y, 37, C.ink);
      if (row.registry)
        api.text(
          ctx,
          row.registry.textSha256.slice(0, 12),
          columns[1],
          y + 58,
          31,
          C.blue,
          'left',
          'mono',
        );
    });
    focus.target('index-rows', () => {
      const decided = showDecision || (i !== 0 && p('admission-initial') === 1);
      const label = !decided
        ? 'Compare'
        : row.admitted
          ? 'Admit'
          : row.grant
            ? 'Reject edit'
            : 'Exclude';
      api.text(
        ctx,
        label,
        columns[2],
        y + 16,
        46,
        !decided ? C.muted : row.admitted ? C.green : C.pink,
      );
    });
  });
  focus.target('source-edit', () => {
    const message =
      p('admission-edit') > 0
        ? 'Access policy edit     “may be restored”  →  “may not be restored”'
        : 'SHA-256 prefixes identify the text supplied to this build.';
    api.text(ctx, message, 112, 905, 36, edited ? C.yellow : C.ink);
  });
  if (p('admission-reject') === 1)
    api.text(ctx, 'Retained v3 still contains the original passage.', 112, 982, 32, C.blue);
}

export default {
  id: 'admission',
  draw: drawAdmission,
  cues: [
    'admission-parse',
    'admission-registry',
    'admission-initial',
    'admission-edit',
    'admission-reject',
  ],
};
