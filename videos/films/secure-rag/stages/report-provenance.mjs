import { reportAdmission, secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { PRINCIPAL, SECURE_SOURCES } from '../fixtures.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

export function drawReportProvenance(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const revoked = done('sr-report-provenance-revoke');
  const both = done('report-membership');
  const rebuilt = done('report-rebuild');
  const principal = both ? { ...PRINCIPAL, groups: ['operations', 'security'] } : PRINCIPAL;
  const originals = SECURE_SOURCES.slice(0, 3).map(sourceRecord);
  const sources = originals.map((r) => (r.id === 'key' && revoked ? { ...r, grant: null } : r));
  const ops = originals.slice(0, 2);
  const right = rebuilt ? sources.filter((r) => secureEligibility(r, principal)) : originals;
  const known = rebuilt
    ? done('report-new-admit')
    : revoked
      ? done('report-held')
      : both
        ? done('report-both-admit')
        : done('report-first-decision');
  const label = (s, x, y, size, color = c.ink, align = 'left') =>
    drawText(ctx, api, s, x, y, size, color, align);

  api.focus.target('sources', () => {
    label('Reader in tenant A', 125, 267, 33, c.muted);
    label(principal.groups.join(' + '), 460, 269, 40, c.blue);
    label('Current source', 125, 380, 34, c.muted);
    label('Read grant', 510, 380, 34, c.muted);
    sources.forEach((r, i) => {
      const y = 411 + 140 * i;
      drawRectangle(ctx, api, 125, y, 740, 111, r.id === 'key' && revoked ? c.pink : c.blue);
      label(r.id === 'key' ? 'Key runbook' : r.title, 147, y + 47, 35);
      label('v' + r.revision + ' · tenant ' + r.tenant, 147, y + 87, 26, c.muted);
      label(
        r.grant === 'tenant' ? 'All staff in A' : (r.grant ?? 'no grant'),
        512,
        y + 66,
        34,
        r.grant === null ? c.pink : c.ink,
      );
    });
  });

  function reportColumn(x, refs, title, count, showDecision) {
    label(title, x + 205, 380, 36, c.ink, 'center');
    sources.forEach((r, i) => {
      const y = 411 + 140 * i;
      const index = refs.findIndex((ref) => r.id === ref.id);
      drawLine(ctx, api, x, y + 105, x + 410, y + 105, c.muted);
      if (index < 0 || index >= count) return;
      const matches = reportAdmission([refs[index]], sources, principal);
      const ink = showDecision ? (matches ? c.green : c.pink) : c.blue;
      drawRectangle(ctx, api, x + 36, y + 10, 336, 77, ink);
      label(refs[index].id + ' v' + refs[index].revision, x + 205, y + 62, 34, ink, 'center');
    });
    drawRectangle(
      ctx,
      api,
      x,
      850,
      410,
      97,
      showDecision ? (reportAdmission(refs, sources, principal) ? c.green : c.pink) : c.muted,
    );
    const verdict = reportAdmission(refs, sources, principal) ? 'Enter map' : 'Hold report';
    label(showDecision ? verdict : 'Awaiting check', x + 205, 912, 37, c.ink, 'center');
  }

  api.focus.target('reports', () => {
    reportColumn(
      900,
      ops,
      'Operations report',
      Math.ceil(cue('report-ops-list').progress * ops.length),
      done('report-first-decision') && (!revoked || done('report-held')),
    );
    reportColumn(
      1370,
      right,
      rebuilt ? 'Rebuilt report' : 'Mixed report',
      Math.ceil(cue('report-mixed-list').progress * right.length),
      known,
    );
  });
  if (revoked && !done('report-held'))
    label('Which report may still enter the map step?', 125, 1015, 36, c.yellow);
  else if (rebuilt) label('The old mixed report stays held.', 125, 1015, 34, c.muted);
}

export default {
  id: 'report-provenance',
  draw: drawReportProvenance,
  cues: [
    'report-ops-list',
    'report-mixed-list',
    'report-first-decision',
    'report-membership',
    'report-both-admit',
    'sr-report-provenance-revoke',
    'report-which',
    'report-held',
    'report-rebuild',
    'report-new-admit',
  ],
};
