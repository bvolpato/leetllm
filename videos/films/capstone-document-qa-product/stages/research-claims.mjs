import { sha } from '../arithmetic.mjs';
import { managerClaim, securityClaim, reportSources, reportWordCheck } from '../report-fixture.mjs';

export function drawResearchClaims(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const done = (id) => p(id) === 1;
  const us = reportSources.us;
  const eu = reportSources.eu;
  if (state.beat === 0) {
    const rows = [
      [
        us,
        [
          'Identity verification is required.',
          'Manager approval is required before',
          'privileged scopes are queued.',
        ],
      ],
      [eu, ['Identity verification is required for', 'access restores in the EU region.']],
    ];
    rows.forEach(([source, lines], i) => {
      const x = 112 + i * 865;
      focus.target('report-spans', () => {
        api.text(ctx, source.id, x, 271, 33, C.blue, 'left', 'mono');
        api.line(ctx, x, 309, x + 780, 309, C.blue, 3);
        api.text(ctx, lines.join('\n'), x, 387, 37, C.ink, 'left', 'serif');
        if (p('claim-span') > 0) {
          api.text(
            ctx,
            `[0, ${[...source.text].length})   SHA-256 ${sha(source.text).slice(0, 10)}…`,
            x,
            600,
            29,
            C.blue,
            'left',
            'mono',
          );
        }
      });
    });
    focus.target('report-claims', () => {
      if (p('claim-char') > 0 && p('claim-identity') === 0) {
        const chars = [...'café'];
        api.text(ctx, 'Python character offsets', 112, 718, 29, C.muted);
        chars.forEach((ch, i) => {
          const x = 112 + 105 * i;
          const selected = i === 3 && p('claim-slice') > 0;
          api.text(ctx, String(i), x + 25, 780, 27, C.muted, 'center');
          api.text(ctx, ch, x + 25, 865, 55, selected ? C.yellow : C.ink, 'center', 'mono');
          api.line(ctx, x, 897, x + 54, 897, selected ? C.yellow : C.panel, 4);
        });
        if (p('claim-slice') > 0) api.text(ctx, '[3, 4)', 580, 862, 40, C.yellow, 'left', 'mono');
        if (p('claim-bytes') === 1) {
          const bytes = new TextEncoder().encode(chars.slice(3, 4).join(''));
          const hex = Array.from(bytes, (byte) => byte.toString(16).toUpperCase()).join('  ');
          api.text(ctx, 'UTF-8 bytes sent to the hash', 1000, 718, 29, C.muted);
          api.text(ctx, hex, 1000, 865, 55, C.cyan, 'left', 'mono');
        }
        return;
      }
      api.text(ctx, 'Claim in the report', 112, 732, 30, C.muted);
      api.text(ctx, 'Bound sources', 1280, 732, 30, C.muted);
      if (p('claim-identity') > 0) {
        api.text(ctx, 'Identity verification is required.', 112, 818, 38, C.ink);
        api.text(ctx, 'US + EU', 1280, 818, 36, C.cyan);
      }
      if (p('claim-manager') > 0) {
        api.text(ctx, 'Privileged scopes require manager approval in the US.', 112, 920, 38, C.ink);
        api.text(ctx, 'US', 1280, 920, 36, C.cyan);
      }
    });
    return;
  }
  const privateSource = state.beat === 1 && (p('claim-note') > 0 || p('claim-private') > 0);
  const unknown =
    !privateSource && state.beat === 1 && (p('claim-security') > 0 || p('claim-unknown') > 0);
  const claim = privateSource ? 'Immediate access' : unknown ? securityClaim : managerClaim;
  focus.target('report-pair', () => {
    api.text(
      ctx,
      privateSource ? 'Proposed source   /   workspace note' : 'Admitted source   /   ' + us.id,
      112,
      255,
      31,
      C.blue,
    );
    api.text(
      ctx,
      privateSource ? 'The note has no publication grant.' : us.text.split('. ')[1],
      112,
      332,
      43,
      C.ink,
      'left',
      'serif',
    );
    api.line(ctx, 112, 378, 1808, 378, C.blue, 3);
    api.text(ctx, 'Proposed report claim', 112, 468, 30, C.muted);
    api.text(ctx, claim, 112, 552, 43, C.ink, 'left', 'serif');
  });
  focus.target('report-receipt', () => {
    const label = privateSource
      ? 'entailed'
      : unknown
        ? 'unknown'
        : done('claim-wrong-label')
          ? 'entailed'
          : 'contradicted';
    api.text(ctx, 'Long-word check', 112, 690, 29, C.muted);
    api.text(ctx, 'Fixture judgment', 680, 690, 29, C.muted);
    api.text(ctx, 'Report gate', 1310, 690, 29, C.muted);
    if (privateSource) api.text(ctx, 'Unadmitted source', 112, 774, 37, C.ink);
    else if (done('claim-smoke') || state.beat === 2)
      api.text(ctx, String(reportWordCheck(claim, us.text)), 112, 774, 45, C.ink, 'left', 'mono');
    const revealLabel = privateSource
      ? p('claim-private') > 0
      : unknown
        ? p('claim-unknown') > 0
        : p('claim-block') > 0;
    if (revealLabel || state.beat === 2) api.text(ctx, label, 680, 774, 45, C.ink);
    const released = state.beat === 2 && done('wrong-judgment');
    const blocked =
      state.beat === 2
        ? p('claim-wrong-label') === 0
        : privateSource
          ? done('claim-private')
          : unknown
            ? done('claim-unknown')
            : done('claim-block');
    api.text(
      ctx,
      released ? 'PASS' : blocked ? 'BLOCK' : '?',
      1310,
      774,
      50,
      released ? C.yellow : blocked ? C.pink : C.muted,
    );
    let note = '';
    if (privateSource && done('claim-private'))
      note = 'Source admission: false → BLOCK before report release';
    else if (unknown && done('claim-unknown')) note = 'Semantic receipt: unknown → BLOCK';
    else if (released) note = 'The stored judgment changed. The source and claim still disagree.';
    else if (!privateSource && !unknown && done('claim-smoke'))
      note = '“not” has three letters. The word check skips it.';
    if (note) api.text(ctx, note, 112, 944, 37, C.ink);
  });
}

export default {
  id: 'research-claims',
  draw: drawResearchClaims,
  cues: [
    'claim-span',
    'claim-char',
    'claim-slice',
    'claim-bytes',
    'claim-identity',
    'claim-manager',
    'claim-smoke',
    'claim-block',
    'claim-security',
    'claim-unknown',
    'claim-note',
    'claim-private',
    'claim-wrong-label',
    'wrong-judgment',
  ],
};
