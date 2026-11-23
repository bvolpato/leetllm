import { buildCat } from './cat.mjs';
import { opening, policy, practice, closed, fresh, holes, rows } from './model.mjs';
import { C, box, cap, txt, mono, line, headline, strip, cue, badge, ease } from './drawing.mjs';

const art = [buildCat(['open', 'open'], 0), buildCat(['open', 'closed'], 2)];
function cat(g, x, y, w, h, eyes) {
  box(g, x, y, w, h, '#b7cdd0');
  const cell = 40;
  for (let j = 0; j < h / cell; j++)
    for (let i = j % 2; i < w / cell; i += 2)
      box(
        g,
        x + i * cell,
        y + j * cell,
        Math.min(cell, w - i * cell),
        Math.min(cell, h - j * cell),
        '#c8dbda',
      );
  const scale = Math.floor(Math.min((w - 60) / 52, (h - 35) / 42));
  const ox = x + (w - 52 * scale) / 2,
    oy = y + (h - 42 * scale) / 2;
  for (const [tint, runs] of art[eyes[1] ? 1 : 0])
    for (const [rx, ry, len] of runs)
      box(g, ox + rx * scale, oy + ry * scale, scale * len, scale, tint);
}
function openingFrame(c) {
  const sent = cue(c, 0, 'Send a request'),
    move = cue(c, 0, 'move the caret down');
  const arrival = cue(c, 1, 'reply arrives'),
    result = cue(c, 2, 'Look at the two empty calls');
  return {
    state: result
      ? opening.tab
      : arrival
        ? opening.stale
        : move
          ? opening.moved
          : sent
            ? opening.first
            : opening.start,
    request: sent ? opening.first.request : null,
    event: result
      ? 'Tab  ·  0 inserted'
      : arrival
        ? '#16    ' + opening.firstAnswer.insert
        : sent
          ? 'Sent   #16   ·   left eye'
          : 'Editing',
    note: result
      ? 'The saved range belongs to the other eye. Both calls are unchanged.'
      : arrival
        ? 'Both lines are unchanged. What should Tab insert?'
        : move
          ? 'The caret moved. The request still carries the left eye’s range.'
          : sent
            ? 'The request captured the upper line.'
            : 'The caret is inside the left eye’s call.',
  };
}
function policyFrame(c) {
  const sent = cue(c, 0, 'Send a fresh request'),
    seen = cue(c, 0, 'paint its word');
  const changed = cue(c, 1, 'change the upload policy'),
    tab = cue(c, 2, 'The policy change cleared');
  return {
    state: tab
      ? policy.tab
      : changed
        ? policy.denied
        : seen
          ? policy.painted
          : sent
            ? policy.second
            : opening.stale,
    request: sent ? policy.second.request : null,
    event: tab
      ? 'Tab  ·  0 inserted'
      : changed
        ? 'Policy changed'
        : seen
          ? 'Ghost text'
          : sent
            ? 'Request in flight'
            : 'Editing',
    note: tab
      ? 'Tab rechecks the captured policy and range before writing.'
      : changed
        ? 'Same range and version. Compare the policy and counter before Tab.'
        : sent && !seen
          ? 'The saved and live ranges match while the request is in flight.'
          : seen
            ? 'The preview belongs to this range. The buffer still contains two empty calls.'
            : 'Capture the right eye’s range before the request leaves.',
  };
}
function practiceFrame(c) {
  const up = cue(c, 0, 'move up'),
    down = cue(c, 0, 'back down'),
    send = cue(c, 0, 'new request goes out');
  const arrives = cue(c, 1, 'new reply arrives'),
    late = cue(c, 1, 'old one arrives'),
    drop = cue(c, 2, 'Discarding twenty', 0.45),
    tab = cue(c, 2, 'The checked insertion');
  const match =
    c.beat.beatIndex === 2
      ? c.reveal('It matches the live snapshot', 0.45, { captionStart: 'Use reply twenty-three' })
      : 0;
  const replayTest = cue(c, 2, 'with the replies delivered in either order');
  const state = tab
    ? practice.applied
    : late
      ? practice.oldReply
      : arrives
        ? practice.newReply
        : send
          ? practice.latest
          : down
            ? practice.back
            : up
              ? practice.away
              : practice.old;
  return {
    state,
    savedRange: practice.old.request.saved.cursor,
    sharedRange: Boolean(send),
    checked: tab ? practice.oldReply.live : null,
    coverGhost: arrives && match < 1,
    replies: [
      {
        request: send ? practice.latest.request : null,
        reply: arrives ? practice.answer23 : null,
        progress: match,
      },
      {
        request: practice.old.request,
        reply: late ? practice.answer20 : null,
        progress: drop,
      },
    ],
    event: tab
      ? 'Tab  ·  inserted'
      : match === 1
        ? 'Fresh ghost'
        : late
          ? 'Both replies here'
          : arrives
            ? 'First reply arrived'
            : 'Request in flight',
    note: tab
      ? replayTest
        ? 'Reverse the arrival order. Only the right eye should still close.'
        : 'Tab rechecked the snapshot. The right eye now has an argument.'
      : drop === 1
        ? 'The late reply leaves the matching preview in place.'
        : match === 1
          ? 'The matching reply supplies pale text at the caret.'
          : late
            ? 'Both offer the same text. Which reply can Tab use?'
            : send
              ? 'Both requests saved the same file, version, range, and policy.'
              : 'Follow the live counter as the caret leaves the right eye and comes back.',
  };
}

function replyComparison(g, f) {
  const live = f.checked ?? f.state.live;
  const cardY = 686;
  const cardH = 143;
  const panelX = [94, 702, 1310];
  const panelW = 516;
  const linkY = cardY + 96;
  box(g, panelX[1], cardY, panelW, cardH, C.sky, 14);
  cap(g, f.checked ? 'COUNTER CHECKED AT TAB' : 'LIVE COUNTER', panelX[1] + 30, cardY + 42, C.blue);
  mono(g, '#' + live.epoch, panelX[1] + 30, cardY + 113, 52, C.blue);
  mono(g, 'policy ' + live.policy, panelX[1] + 225, cardY + 113, 36, C.blue);

  f.replies.forEach(({ request, reply, progress }, i) => {
    if (!request) return;
    const x = panelX[i * 2];
    const matches = reply && fresh(reply.saved, live);
    const settled = progress === 1;
    const ink = settled ? (matches ? C.green : C.red) : C.ink;
    const heading = reply ? (i === 0 ? 'FIRST ARRIVAL' : 'SECOND ARRIVAL') : 'REQUEST IN FLIGHT';
    box(g, x, cardY, panelW, cardH, C.sheet, 14);
    cap(g, heading, x + 30, cardY + 42);
    mono(g, '#' + (reply ?? request).saved.epoch, x + 30, cardY + 113, 52, ink);
    if (reply) mono(g, reply.insert, x + 191, cardY + 113, 43);
    if (settled) {
      txt(g, matches ? 'Matches' : 'Stale', x + panelW - 24, cardY + 42, 37, ink, {
        weight: 700,
        align: 'right',
      });
    }
    if (progress > 0) {
      const from = i === 0 ? x + panelW : x;
      const to = i === 0 ? panelX[1] : panelX[1] + panelW;
      const end = from + (to - from) * ease(progress);
      line(g, from, linkY, end, linkY, settled ? ink : C.blue, 5);
      box(g, end - 5, linkY - 5, 10, 10, settled ? ink : C.blue, 5);
    }
  });
}

export function paintEditor(g, c) {
  const id = c.beat.chapterId;
  const replay = id === 'c09';
  const f = replay ? practiceFrame(c) : id === 'c05' ? policyFrame(c) : openingFrame(c);
  const s = f.state,
    current = s.live;
  const editorY = 255;
  const editorHeight = replay ? 424 : 531;
  const bottom = editorY + editorHeight - 16;
  headline(g, c, replay ? 'SPRITE EDITOR   /   REPLAY' : 'SPRITE EDITOR   /   LIVE PREVIEW');
  box(g, 88, editorY + 11, 1744, editorHeight - 1, '#aea9a2', 24);
  box(g, 88, editorY, 1744, editorHeight, '#414458', 24);
  box(g, 104, editorY + 16, 1712, editorHeight - 32, C.sheet, 14);
  cap(g, 'wink.py', 140, 339);
  mono(g, 'v' + current.version, 925, 340, 32, C.muted);
  cap(g, 'Rendered sprite', 1190, 339);
  line(g, 106, 367, 1814, 367);
  line(g, 1141, 270, 1141, bottom - 1);
  cat(g, 1144, 369, 670, bottom - 373, closed(s));
  const lines = rows(s),
    row = current.cursor <= lines[0].length ? 0 : 1;
  const font = 52;
  g.font = '400 ' + font + 'px "Lesson Mono"';
  const unit = g.measureText('M').width;
  for (const [i, source] of lines.entries()) {
    const y = 470 + i * 111,
      hole = source.indexOf('(') + 1;
    if (row === i) box(g, 106, y - 65, 1033, 89, '#e7ebf6');
    mono(g, i + 1, 141, y, 32, C.muted);
    mono(g, source.slice(0, hole), 205, y, font);
    const gx = 205 + hole * unit;
    const covered = f.coverGhost && i === row;
    if (covered) {
      badge(g, 'Preview covered', gx + 8, y - 46, 361, C.sheet, C.muted);
    } else {
      const ink = s.ghost && i === row ? s.ghost.insert : '';
      mono(g, ink, gx, y, font, '#7d7493');
      mono(g, source.slice(hole), gx + ink.length * unit, y, font);
    }
    if (row === i) {
      const start = i ? lines[0].length + 1 : 0;
      box(g, 205 + (current.cursor - start) * unit - 4, y - 50, 6, 63, C.blue);
    }
    if (f.request?.saved.cursor === holes[i]) {
      line(g, gx - 3, y + 21, gx + 48, y + 21, C.orange, 5);
      txt(g, 'sent here', gx + 62, y + 30, 26, C.muted);
    }
    if (f.savedRange === holes[i]) {
      line(g, gx, y + 18, gx, y + 39, C.orange, 5);
      txt(g, f.sharedRange ? 'Same saved range' : 'Saved range', gx + 18, y + 54, 35, C.muted);
    }
  }
  if (replay) {
    replyComparison(g, f);
  } else {
    line(g, 136, 634, 1107, 634);
    const compact = (t) => '#' + t.epoch + '   policy ' + t.policy;
    cap(g, 'SAVED', 145, 685);
    mono(g, f.request ? compact(f.request.saved) : '···', 145, 737, 35, C.muted);
    cap(g, 'LIVE', 560, 685);
    mono(g, compact(current), 560, 737, 35, C.blue);
  }
  badge(g, f.event, 1460, 285, 328, f.checked ? C.mint : C.sky);
  strip(g, f.note);
}
