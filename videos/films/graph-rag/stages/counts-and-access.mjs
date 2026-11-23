import { blockedDescendants, reportAudience } from '../model.mjs';
import { card, connector, line, text } from '../defaults.mjs';

const id = 'counts-and-access';
const versions = {
  'Publisher edge': ['B / v1'],
  'Child report': ['Publisher edge'],
  'Parent report': ['Child report'],
  'Travel report': ['Travel notes'],
};
const reports = [
  {
    name: 'Public report',
    sources: 'A + B',
    readers: [
      ['staff', 'security'],
      ['staff', 'security'],
    ],
  },
  {
    name: 'Mixed report',
    sources: 'A + B + R',
    readers: [['staff', 'security'], ['staff', 'security'], ['security']],
  },
];

export function drawCountsAndAccess(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const after = (name) => cue(name)?.phase === 'after';
  const seen = (name) => (cue(name)?.progress ?? 0) > 0;
  const write = (s, x, y, size, color, align = 'left') =>
    text(ctx, api, id, s, x, y, size, color, align);
  if (state.beat < 3) {
    const reader = seen('reader') ? 'security' : 'staff';
    const showResult = reader === 'security' ? after('security-reads') : after('public-only');
    api.focus.target(id + '-sources', () => {
      write('Current reader', 126, 292, 32, C.muted);
      write(reader === 'staff' ? 'Staff reader' : 'Security reader', 126, 390, 54, C.ink);
      line(ctx, api, 126, 435, 735, 435, C.blue, 3);
      write('A + B', 126, 535, 43, C.ink);
      write('Staff and security', 126, 594, 34, C.blue);
      write('R', 126, 728, 43, C.ink);
      write('Security only', 126, 787, 34, C.blue);
    });
    api.focus.target(id + '-reports', () => {
      write('Reports for the map step', 895, 290, 38, C.ink);
      reports.forEach((report, i) => {
        const y = 351 + i * 236;
        const ok = reportAudience(report.readers).includes(reader);
        const color = showResult ? (ok ? C.green : C.pink) : C.muted;
        api.rect(ctx, 891, y, 900, 196, C.panel, color, 9);
        write(report.name, 928, y + 66, 45, C.ink);
        write(report.sources, 928, y + 140, 37, C.blue);
        write(
          showResult ? (ok ? 'Admit' : 'Withhold') : 'Pending',
          1748,
          y + 139,
          39,
          color,
          'right',
        );
      });
      write(
        showResult
          ? 'Check every contributing source before mapping.'
          : 'Which report can this reader use?',
        960,
        952,
        42,
        showResult ? C.ink : C.yellow,
        'center',
      );
    });
  } else {
    const changed = after('corrected');
    const blocked = new Set(blockedDescendants(changed ? ['B / v1'] : [], versions));
    api.focus.target(id + '-versions', () => {
      write('Publisher record B', 128, 300, 47, C.ink);
      write(changed ? 'Version 2 is current' : 'Version 1 is current', 128, 380, 37, C.blue);
      const chain = ['B / v1', 'Publisher edge', 'Child report', 'Parent report'];
      chain.forEach((name, i) => {
        const x = 115 + i * 449;
        const color = blocked.has(name) ? C.pink : C.blue;
        card(ctx, api, id, name, x, 510, 342, 102, color, 36);
        write(blocked.has(name) ? 'Blocked' : 'Current', x + 171, 680, 35, color, 'center');
        if (i < chain.length - 1) connector(ctx, api, x + 355, 561, x + 437, 561, 1, color);
      });
      line(ctx, api, 115, 756, 1804, 756, C.muted, 2);
      write('Travel report', 128, 865, 39, C.ink);
      write('Independent travel notes', 705, 865, 35, C.muted);
      write('Current', 1600, 865, 38, C.green);
    });
  }
}
export default {
  id,
  draw: drawCountsAndAccess,
  cues: ['readers', 'public-only', 'reader', 'security-reads', 'corrected'].map(
    (name) => id + '-' + name,
  ),
};
