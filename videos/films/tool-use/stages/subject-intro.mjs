import { filmClock } from '../clock.mjs';
import { authorize, observationTrace, validArgs } from '../model.mjs';

const trace = observationTrace();
const session = { reader: 'lena' };

function drawBook(ctx, api, book) {
  const { C } = api;
  api.rect(ctx, 124, 239, 455, 591, C.blue, undefined, 12);
  api.rect(ctx, 141, 245, 428, 574, C.ink, undefined, 6);
  api.rect(ctx, 120, 225, 445, 577, C.blue, undefined, 10);
  api.line(ctx, 157, 232, 157, 793, C.panel, 3);
  api.text(ctx, 'River', 195, 360, 98, C.bg, 'left', 'serif');
  api.text(ctx, 'Walk', 195, 455, 98, C.bg, 'left', 'serif');

  // The widening river runs down the book jacket to its lower edge.
  const banks = [[], []];
  for (let i = 0; i <= 54; i++) {
    const p = i / 54;
    const x = 370 + 61 * Math.sin(p * 9) - 75 * p;
    const y = 490 + 312 * p;
    const halfWidth = 2 + 53 * p * p;
    banks[0].push({ x: x - halfWidth, y });
    banks[1].push({ x: x + halfWidth, y });
  }
  api.path(ctx, [...banks[0], ...banks[1].reverse()], { closed: true, fill: C.ink, width: 0 });
  api.rect(ctx, 445, 702, 90, 67, C.panel, undefined, 4);
  api.text(ctx, book, 460, 750, 42, C.ink, 'left', 'mono');
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const { after, progress } = filmClock(scene, state);
  const book = trace.call.arguments.book_id;
  const allowed = validArgs(trace.call.arguments) && authorize(session, 'lookup', book);
  const counted = allowed && after('intro-dispatch') && after('intro-copies');
  const linked = counted && trace.observation && after('intro-link');
  const label = (value, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, String(value), x, y, size, color, 'left', font);

  // The brand precedes this shot. Put the jacket and the moving slip on its first frame.
  if (state.t < 0.35) ctx.globalAlpha = 1;
  drawBook(ctx, api, book);

  focus.target('intro-answer', () => {
    label('Lena’s app', 665, 325, 53, C.ink, 'serif');
    label('Copies available', 665, 423, 39);
    label(linked ? trace.observation.available_copies : '?', 1055, 435, 70, linked ? C.cyan : C.yellow);
    label('Call ID   ' + trace.call.call_id, 665, 516, 36, C.blue, 'mono');
    if (state.beat >= 2) {
      label('Reservation', 665, 593, 37);
      label('—', 1055, 593, 45, C.yellow);
    }
    api.rect(ctx, 650, 635, 495, 18, C.muted, undefined, 8);
  });

  focus.target('intro-shelf', () => {
    label('Library catalog', 1295, 325, 52, C.ink, 'serif');
    if (counted) {
      for (let i = 0; i < trace.serviceResult.available_copies; i++) {
        const x = 1335 + 118 * i;
        api.rect(ctx, x, 377, 98, 164, C.cyan, undefined, 5);
        api.line(ctx, x + 14, 384, x + 14, 528, C.bg, 3);
        label(book, x + 30, 485, 34, C.bg, 'mono');
      }
    }
    api.rect(ctx, 1285, 535, 510, 107, C.panel, C.muted, 6);
    api.rect(ctx, 1320, 558, 105, 60, C.ink, undefined, 2);
    label(book, 1348, 603, 38, C.bg, 'mono');
    api.line(ctx, 1520, 580, 1520, 596, C.muted, 5);
    api.line(ctx, 1520, 596, 1635, 596, C.muted, 5);
    api.line(ctx, 1635, 596, 1635, 580, C.muted, 5);
  });

  focus.target('intro-slip', () => {
    const outbound = allowed ? progress('intro-dispatch') : 0;
    const inbound = counted ? progress('intro-return') : 0;
    const x = 660 + 640 * (outbound - inbound);
    const emerge = 1 - Math.max(0, 1 - (state.t ?? 1.25) / 1.25) ** 2;
    const y = 651 + 100 * emerge;
    api.rect(ctx, x, y, 475, 153, C.ink, undefined, 5);
    api.rect(ctx, x, y, 13, 153, counted ? C.cyan : C.blue, undefined, 1);
    label(counted ? 'Tool reply' : 'Tool request', x + 35, y + 50, 34, C.bg);
    label(counted ? trace.serviceResult.call_id : trace.call.call_id, x + 300, y + 50, 34, C.bg, 'mono');
    api.line(ctx, x + 35, y + 71, x + 443, y + 71, C.muted, 2);
    label(counted ? trace.serviceResult.available_copies + ' copies available' : trace.call.tool + '(' + book + ')',
      x + 35, y + 126, 39, C.bg, counted ? 'sans' : 'mono');
  });
  if (after('intro-hold')) label('A hold needs permission to write.', 665, 998, 38, C.yellow);
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['intro-request', 'intro-count-question', 'intro-dispatch', 'intro-copies',
    'intro-return', 'intro-link', 'intro-hold-question', 'intro-hold'],
};
