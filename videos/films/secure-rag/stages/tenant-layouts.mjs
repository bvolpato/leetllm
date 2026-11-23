import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { PRINCIPAL } from '../fixtures.mjs';
import { secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { voice } from '../voice.mjs';

const pages = [
  { tenant: 'A', title: 'Escalation', grant: 'operations' },
  { tenant: 'A', title: 'Rotation', grant: 'security' },
  { tenant: 'B', title: 'Escalation', grant: 'operations' },
].map(sourceRecord);

export function drawTenantLayouts(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const began = (id) => cue(id).phase !== 'before';
  const done = (id) => cue(id).phase === 'after';
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);
  const box = (x, y, w, h, color) => drawRectangle(ctx, api, x, y, w, h, color);

  if (state.beat === 2) {
    api.focus.target('infrastructure', () => {
      label('Separate collections', 130, 293, 39);
      box(130, 330, 690, 195, c.blue);
      label('Shared cluster', 155, 384, 31, c.blue);
      for (const [i, tenant] of ['A', 'B'].entries()) {
        const x = 155 + i * 332;
        box(x, 415, 310, 79, c.muted);
        label('Collection ' + tenant, x + 20, 466, 31);
      }
      if (!began('layout-infrastructure')) return;
      label('Dedicated clusters', 130, 641, 39);
      for (const [i, tenant] of ['A', 'B'].entries()) {
        const x = 130 + i * 360;
        box(x, 682, 330, 128, c.blue);
        label('Cluster ' + tenant, x + 25, 758, 36, c.blue);
      }
      if (done('layout-infrastructure'))
        label('Each cluster needs provisioning and upkeep.', 130, 893, 30);
    });
    api.focus.target('controls', () => {
      label('Controls in either layout', 960, 293, 39);
      drawLine(ctx, api, 960, 328, 1790, 328);
      if (began('layout-controls')) {
        label('Storage', 960, 415, 31, c.blue);
        label('Encrypt data at rest', 1260, 415, 31);
        label('Ingestion', 960, 488, 31, c.blue);
        label('Verify incoming documents', 1260, 488, 31);
        label('Shared resources', 960, 561, 29, c.blue);
        label('Check for timing leaks', 1260, 561, 31);
      }
      if (began('layout-service')) {
        drawLine(ctx, api, 960, 628, 1790, 628);
        label('SOC 2', 960, 705, 31, c.blue);
        label('Service controls', 1260, 705, 31);
      }
      if (began('layout-safeguards')) {
        label('HIPAA', 960, 795, 31, c.blue);
        label('Administrative, physical and', 1260, 795, 31);
        label('technical safeguards', 1260, 842, 31);
      }
    });
    return;
  }

  const shared = began('layout-shared');
  const routed = done('layout-route');
  const requestedTenant = done('layout-missing') ? null : done('layout-mismatch') ? 'B' : 'A';
  const validScope = requestedTenant === PRINCIPAL.tenant;
  api.focus.target('reader', () => {
    label('Verified reader', 130, 277, 31, c.muted);
    label(
      'Tenant ' + PRINCIPAL.tenant + '  /  ' + PRINCIPAL.groups.join(' + '),
      390,
      278,
      42,
      c.blue,
    );
    label('Requested tenant', 1065, 277, 31, c.muted);
    label(requestedTenant ?? '(empty)', 1410, 278, 42, validScope ? c.blue : c.pink);
    drawLine(ctx, api, 130, 330, 1790, 330);
  });
  api.focus.target('stored-pages', () => {
    label(shared ? 'Shared index' : 'Per-tenant namespaces', 130, 421, 40, c.blue);
    label('Tenant', 170, 505, 29, c.muted);
    label('Page', 395, 505, 29, c.muted);
    label('Readers', 740, 505, 29, c.muted);
    if (shared) {
      box(130, 540, 960, 346, c.blue);
    } else {
      box(130, 540, 960, 215, c.blue);
      box(130, 775, 960, 111, c.muted);
    }
    pages.forEach((page, index) => {
      const y = 610 + index * 115;
      const color = routed && page.tenant !== PRINCIPAL.tenant ? c.muted : c.ink;
      label(page.tenant, 170, y, 40, color);
      label(page.title, 395, y, 40, color);
      label(page.grant, 740, y, 36, color);
    });
  });
  api.focus.target('decisions', () => {
    label('Read decision', 1190, 505, 31, c.muted);
    if (!validScope) {
      if (done('layout-stop')) {
        label('Search stopped', 1190, 611, 48, c.pink);
        label(requestedTenant ? 'Requested B, verified A' : 'Missing tenant scope', 1190, 686, 34);
      }
      return;
    }
    pages.forEach((page, index) => {
      const y = 610 + index * 115;
      const local = page.tenant === PRINCIPAL.tenant;
      const checked = secureEligibility(page, PRINCIPAL);
      if (local && !done(checked ? 'layout-allow' : 'layout-hold')) return;
      if (!local && !routed) return;
      const message = local
        ? checked
          ? 'Return to reader'
          : 'Requires security'
        : 'Outside tenant A';
      label(message, 1190, y, 39, checked ? c.green : c.pink);
    });
  });
  if (validScope && began('layout-question') && !done('layout-allow'))
    label('Which page can the operations reader open?', 130, 982, 39, c.yellow);
}

export default {
  id: 'tenant-layouts',
  draw: drawTenantLayouts,
  cues: [
    'layout-pages',
    'layout-reader',
    'layout-route',
    'layout-shared',
    'layout-question',
    'layout-allow',
    'layout-hold',
    'layout-mismatch',
    'layout-stop',
    'layout-missing',
    'layout-infrastructure',
    'layout-controls',
    'layout-service',
    'layout-safeguards',
  ],
};
