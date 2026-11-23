const departure = { hour: 17, minute: 30 };
const stable = { id: 'R1', clock: 12, model: 'travel-v1' };
const current = { ...stable, id: 'R2', clock: 24 };

function printedTime({ clock }) {
  const { hour, minute } = departure;
  const minutes = String(minute).padStart(2, '0');
  if (clock === 24) return hour + ':' + minutes;
  return (hour % 12 || 12) + ':' + minutes + (hour < 12 ? ' AM' : ' PM');
}

export function drawOpening(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.cue(id)?.phase === 'after';
  const progress = (id) => focus.progress(id, 0);
  const inFeed = (id) => focus.cue(id)?.phase === 'during';
  const source = done('revert-template') ? stable : current;
  const loaded = done('load-stable') ? stable : current;
  const firstReprint = done('reveal-current');
  const finalReprint = done('reveal-stable');
  const waitingForInk =
    ((inFeed('print-again') || done('print-again')) && !firstReprint) ||
    ((inFeed('print-stable') || done('print-stable')) && !finalReprint);
  // A ticket is already emerging when the brand lead ends.
  const feed = inFeed('print-again')
    ? progress('print-again')
    : inFeed('print-stable')
      ? progress('print-stable')
      : Math.min(1, state.t / 1.25);
  const top = 256 + 118 * feed;
  const lastPrint = finalReprint ? stable : current;
  const write = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);

  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  focus.target('ticket-printer', () => {
    const left = 178,
      right = 1066,
      bottom = top + 334;
    api.rect(ctx, left, top, right - left, bottom - top, C.ink, undefined, 20);
    api.rect(ctx, left, top + 38, 15, 255, C.blue, undefined, 0);
    const seam = 892;
    for (let y = top + 22; y < bottom - 14; y += 26)
      api.line(ctx, seam, y, seam, y + 12, C.muted, 3);
    api.circle(ctx, seam, top, 13, C.bg);
    api.circle(ctx, seam, bottom, 13, C.bg);

    // The stub carries the railway symbol. The departure stays on the main ticket.
    const x = 979,
      y = top + 148;
    api.rect(ctx, x - 38, y - 54, 76, 97, C.bg, undefined, 14);
    api.rect(ctx, x - 27, y - 38, 54, 36, C.ink, undefined, 5);
    api.circle(ctx, x - 19, y + 19, 6, C.ink);
    api.circle(ctx, x + 19, y + 19, 6, C.ink);
    api.line(ctx, x - 18, y + 45, x - 39, y + 76, C.bg, 7);
    api.line(ctx, x + 18, y + 45, x + 39, y + 76, C.bg, 7);
    api.line(ctx, x - 27, y + 60, x + 27, y + 60, C.bg, 6);

    write('TRAIN DEPARTURE', 243, top + 102, 36, C.bg);
    write(waitingForInk ? '…' : printedTime(lastPrint), 239, top + 245, 123, C.bg);
    api.rect(ctx, 133, 232, 980, 78, C.panel, C.muted, 16);
    api.line(ctx, 172, 292, 1074, 292, C.bg, 11);
    api.circle(ctx, 1072, 258, 7, C.green);
  });
  focus.target('release-state', () => {
    write('Template in Git', 1220, 302, 37, C.muted);
    write(source.clock + '-hour', 1215, 396, 75, C.yellow);
    api.line(ctx, 1220, 470, 1785, 470, C.muted, 2);
    write('Running worker', 1220, 546, 37, C.muted);
    write('Release ' + loaded.id, 1215, 640, 70, C.blue);
    write('Model   ' + loaded.model, 1220, 708, 32, C.muted);
  });
  focus.target('serving-trace', () => {
    if (!firstReprint) return;
    api.line(ctx, 140, 803, 1785, 803, C.muted, 2);
    write('Serving trace', 150, 907, 38, C.muted);
    write(current.id + '   ' + printedTime(current), 547, 921, 67);
    if (finalReprint) write(stable.id + '   ' + printedTime(stable), 1206, 921, 67, C.blue);
  });
  ctx.restore();
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'revert-template',
    'print-again',
    'reveal-current',
    'load-stable',
    'print-stable',
    'reveal-stable',
    'read-trace',
  ],
};
