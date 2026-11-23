import { openingRead, readWindowMinutes, clockTime, statusPayload } from '../fixtures.mjs';
import { filmPainter } from '../defaults.mjs';

function drawSubjectIntro(ctx, scene, state, api) {
  const { C } = api;
  const { label, line, dot, chip, target, started, finished, progress } = filmPainter(ctx, api);
  if (state.beat === 2) {
    const hosts = ['Incident assistant', 'Operations console', 'IDE'];
    const visible = started('intro-hosts') ? hosts : hosts.slice(0, 1);
    target('client-paths', () => {
      visible.forEach((host, i) => {
        const y = 365 + i * 160;
        label(host, 165, y, 42, C.ink, 'left');
        chip('own client', 685, y - 48, 270, C.blue, 68, 31);
        line(955, y - 14, 1245, y - 14, C.blue, 3);
      });
    });
    target('server-tool', () => {
      line(1245, 351, 1245, 351 + (visible.length - 1) * 160, C.cyan, 4);
      line(1245, 351, 1310, 351, C.cyan, 4);
      label('Deployments server', 1320, 295, 36, C.cyan, 'left');
      label('get_release_status', 1320, 370, 36, C.ink, 'left');
      label(statusPayload.release_id, 1320, 446, 35, C.ink, 'left');
      label(statusPayload.status, 1320, 510, 35, C.green, 'left');
    });
    label('Each host applies its own action policy.', 165, 862, 36, C.muted, 'left');
    return;
  }

  const { savedAt, savedStatus, now } = openingRead;
  if (state.beat === 0) ctx.globalAlpha = 1;
  const sweepEnd = api.focus.cue('intro-window')?.start ?? 4;
  const sweep = state.beat === 0 ? api.clamp(state.t / sweepEnd) : 1;
  const minute = savedAt + (now - savedAt) * sweep;
  const cx = 490,
    cy = 525,
    radius = 238;
  function point(minutes, r) {
    const angle = (minutes / 60) * Math.PI * 2;
    return [cx + Math.sin(angle) * r, cy - Math.cos(angle) * r];
  }
  api.circle(ctx, cx, cy, radius + 14, C.panel, C.muted, 4);
  for (let m = 0; m < 60; m++) {
    const major = m % 5 === 0;
    line(...point(m, radius - (major ? 26 : 12)), ...point(m, radius), C.muted, major ? 5 : 2);
  }
  line(cx, cy, ...point(minute / 12, 114), C.ink, 15);
  line(cx, cy, ...point(minute, radius - 35), C.ink, 9);
  dot(cx, cy, C.ink, 14);
  label(clockTime(Math.floor(minute)), cx, 887, 76, C.ink);

  label('Deployments  /  ' + statusPayload.release_id, 897, 344, 40, C.ink, 'left');
  line(897, 380, 1720, 380, C.muted, 2);
  target('saved-reading', () => {
    dot(...point(savedAt, radius), C.blue, 14);
    label(clockTime(savedAt) + '   Saved status', 897, 467, 42, C.blue, 'left');
    label(savedStatus, 897, 572, 80, C.ink, 'left');
    if (finished('intro-age')) {
      label(now - savedAt + ' minutes old', 1720, 466, 35, C.blue, 'right');
    }
  });
  target('read-window', () => {
    if (started('intro-window')) {
      const first = now - readWindowMinutes;
      const extent = readWindowMinutes * progress('intro-window');
      for (let offset = 0; offset < extent; offset += 0.25)
        line(
          ...point(now - offset, radius),
          ...point(now - Math.min(offset + 0.25, extent), radius),
          C.yellow,
          15,
        );
      label('Required: ' + clockTime(first) + ' to ' + clockTime(now), cx, 961, 37, C.yellow);
    }
  });
  target('current-reading', () => {
    if (started('intro-read')) {
      line(897, 652, 1720, 652, C.muted, 2);
      if (finished('intro-current')) {
        dot(...point(now, radius), C.green, 14);
        label(clockTime(now) + '   Fresh status', 897, 740, 42, C.green, 'left');
        label(statusPayload.status, 897, 840, 70, C.green, 'left');
      } else {
        label('get_release_status', 897, 740, 46, C.cyan, 'left');
        label('Incident assistant', 897, 870, 34, C.blue, 'left');
        label('Deployments server', 1720, 870, 34, C.cyan, 'right');
        const tip = 897 + 823 * progress('intro-read');
        line(897, 803, tip, 803, C.cyan, 5);
        dot(tip, 803, C.cyan, 11);
      }
    }
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'intro-saved',
    'intro-window',
    'intro-age',
    'intro-read',
    'intro-current',
    'intro-hosts',
    'intro-tool',
    'intro-policy',
  ],
};
