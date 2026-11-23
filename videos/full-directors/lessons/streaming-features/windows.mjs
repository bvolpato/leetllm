import { countPublications, countWindow } from '../../../films/streaming-features/fixtures.mjs';
import { eventRoute, publishWindow } from '../../../films/streaming-features/arithmetic.mjs';
import {
  C,
  board,
  box,
  line,
  path,
  dot,
  wave,
  type,
  mono,
  ticket,
  screen,
  rule,
  bracket,
  answer,
  after,
  progress,
  hh,
  heading,
} from './instrument.mjs';
const [first, revised, retry] = countPublications;
export const countAt = (minute) =>
  countPublications.filter((p) => p.time <= minute).reduce(publishWindow, null);
const captureTime = 743;
const capture = countAt(captureTime);

function timeStrip(g, x, y, w, h, lo, hi) {
  box(g, x, y, w, h, C.paper, 5);
  for (let u = x + 11; u < x + w - 4; u += 17) {
    box(g, u, y + 5, 6, 4, '#938e79', 1);
    box(g, u, y + h - 9, 6, 4, '#938e79', 1);
  }
  return (t) => x + 32 + ((t - lo) / (hi - lo)) * (w - 64);
}
function rulerPair(g, wm, event, { windowGap, state, recordGap, route }) {
  const end = countWindow.end;
  const x = rule(g, 93, 244, 765, 660, 755, [
    [660, '11:00'],
    [690, '11:30'],
    [720, '12:00'],
    [750, '12:30'],
  ]);
  heading(g, 'WINDOW', 51, 121);
  box(g, x(660), 144, x(end) - x(660), 48, '#466663', 2);
  box(g, x(end), 144, x(end + countWindow.allowance) - x(end), 48, '#735c41', 2);
  mono(g, 'Count the hour', x(690), 168, 18, C.cream, 'center');
  mono(g, 'Retain state', x(735), 168, 16, C.cream, 'center');
  for (const [top, bottom] of [
    [124, 143],
    [193, 215],
    [245, 315],
  ])
    line(g, x(wm), top, x(wm), bottom, C.amber, 2);
  mono(g, 'Watermark ' + hh(wm), x(wm), 101, 17, C.amber, 'center');
  bracket(g, x(end), x(wm), 214, windowGap ? wm - end + ' min' : '', C.amber, true);
  dot(g, x(event), 300, 7, C.green);
  mono(g, 'Sent ' + hh(event), x(event), 351, 16, C.green, 'center');
  bracket(g, x(event), x(wm), 300, '', C.green);
  if (recordGap)
    mono(g, wm - event + ' min behind', (x(event) + x(wm)) / 2, 317, 17, C.green, 'center');
  if (state) type(g, 'State retained', 58, 396, 30, C.cream, 'left', 'Serif');
  if (route) {
    const replay = eventRoute(event, wm) === 'replay';
    type(
      g,
      replay ? 'Send to replay' : 'Accept late record',
      895,
      396,
      30,
      replay ? C.amber : C.green,
      'right',
      'Serif',
    );
  }
  mono(g, 'Window allowance   30 min', 58, 432, 16, C.muted);
  mono(g, 'Record limit   45 min', 895, 432, 16, C.muted, 'right');
}
export function watermarks(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b === 1
      ? 'Slice the pulse train'
      : b === 2
        ? 'Estimate event-time progress'
        : 'Two distances to the watermark',
    'EVENT TIME',
  );
  if (b >= 3) {
    rulerPair(g, 725, countWindow.replayEvent, {
      windowGap: afterPhrase(k, 3, 'five minutes past noon'),
      state: afterPhrase(k, 3, 'thirty minutes past its end'),
      recordGap: afterPhrase(k, 4, 'Sixty minutes'),
      route: afterPhrase(k, 4, 'forty-five minutes'),
    });
    return;
  }
  if (b === 1) {
    const labels = ['Tumbling', 'Sliding', 'Session'];
    labels.forEach((s, i) => {
      mono(g, s, 42, 168 + 121 * i, 21);
      const y = 141 + 121 * i;
      const x = timeStrip(g, 222, y, 679, 67, 0, 60);
      [4, 9, 15, 23, 44, 48, 55].forEach((v, j) =>
        wave(g, 'ABC'[j % 3], x(v) - 8, y + 34, 19, 11, C.teal),
      );
      if (!i) {
        for (const t of [0, 20, 40, 60]) line(g, x(t), y + 9, x(t), y + 57, C.rust, 2);
      }
      if (i === 1) {
        for (const [j, t] of [0, 10, 20].entries())
          bracket(g, x(t), x(t + 30), y + 15 + j * 15, '', C.rust);
      }
      if (i === 2) {
        bracket(g, x(4), x(23), y + 52, '', C.rust);
        bracket(g, x(44), x(55), y + 52, '', C.rust);
      }
    });
    return;
  }
  const x = rule(g, 136, 300, 698, 690, 750, [
    [690, '11:30'],
    [705, '11:45'],
    [720, '12:00'],
    [735, '12:15'],
    [750, '12:30'],
  ]);
  const wm = 740 - 15;
  dot(g, x(740), 296, 9, C.green);
  mono(g, 'Max seen 12:20', x(740), 234, 20, C.green, 'center');
  if (after(k, 2, 'With a')) {
    bracket(g, x(wm), x(740), 192, '15 min', C.amber);
    line(g, x(wm), 201, x(wm), 300, C.amber, 3);
  }
  if (after(k, 2, '$end'))
    answer(g, 'SIMPLIFIED ESTIMATE', '12:20 − 15 min = ' + hh(wm), 50, 392, 858);
}
export function groupSessions(events, gap) {
  const groups = [];
  for (const t of [...events].sort((a, b) => a - b)) {
    if (!groups.length || t - groups.at(-1).at(-1) > gap) groups.push([]);
    groups.at(-1).push(t);
  }
  return groups;
}

export const sessionExample = {
  pulses: [660, 670, 690, 700],
  latePulse: 680,
  inactivityGap: 15,
};

function afterPhrase(k, beat, phrase, startCaption = false) {
  const b = k.beat.beatIndex + 1;
  if (b !== beat) return b > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: startCaption ? phrase : false }) === 1;
}

function sessionMerge(g, k) {
  const { pulses, latePulse, inactivityGap } = sessionExample;
  const original = groupSessions(pulses, inactivityGap);
  const merged = groupSessions([...pulses, latePulse], inactivityGap);
  const left = original[0].at(-1);
  const right = original[1][0];
  const arrival = progress(k, 3, 'Now an eleven', 0.65);
  const answerPhrase = 'One session, five heartbeats';
  const ready = afterPhrase(k, 4, answerPhrase);
  const join = ready
    ? Math.min(1, Math.max(0, (k.elapsed - k.wordCue(answerPhrase).end) / 0.75))
    : 0;
  const measured = afterPhrase(k, 4, 'only ten minutes');
  const x = timeStrip(g, 62, 158, 836, 110, 657, 703);
  const pulseY = 207;
  heading(g, 'INACTIVITY GAP    ' + inactivityGap + ' MIN', 65, 115);
  for (const t of pulses) {
    wave(g, 'A', x(t) - 23, pulseY, 46, 17, C.teal);
    mono(g, hh(t), x(t), 242, 18, C.ink, 'center');
  }
  if (arrival > 0) {
    const y = pulseY - 24 * (1 - arrival);
    wave(g, 'A', x(latePulse) - 23, y, 46, 17, C.rust);
    if (arrival === 1) mono(g, hh(latePulse), x(latePulse), 242, 18, C.rust, 'center');
  }

  if (arrival < 1 && after(k, 3, 'Eleven ten to eleven thirty')) {
    bracket(g, x(left), x(right), 290, right - left + ' min', C.amber, true);
  } else if (arrival === 1) {
    bracket(g, x(left), x(latePulse), 290, measured ? latePulse - left + ' min' : '', C.amber, true);
    bracket(g, x(latePulse), x(right), 290, measured ? right - latePulse + ' min' : '', C.amber, true);
  }

  const sessionY = 357;
  if (join === 1) {
    const [session] = merged;
    const label = merged.length + ' session  ·  ' + session.length + ' heartbeats';
    bracket(g, x(session[0]), x(session.at(-1)), sessionY, label, C.green, true);
  } else {
    for (const session of original) {
      const label = arrival === 1 ? '' : session.length + ' heartbeats';
      const color = arrival === 1 && !ready ? C.muted : C.green;
      bracket(g, x(session[0]), x(session.at(-1)), sessionY, label, color, true);
    }
    if (ready) {
      line(
        g,
        x(latePulse + (left - latePulse) * join),
        sessionY,
        x(latePulse + (right - latePulse) * join),
        sessionY,
        C.green,
      );
    }
  }

  if (after(k, 4, 'A sink that already published both pairs')) {
    const published = afterPhrase(k, 4, 'publishes the merged session');
    heading(g, 'SINK TOTALS', 64, 398);
    for (const [i, session] of original.entries()) {
      const column = 220 + i * 260;
      mono(g, i === 0 ? 'First pair' : 'Second pair', column, 415, 19, C.muted, 'center');
      const total = session.length + (published ? ' retired' : '');
      mono(g, total, column, 436, 20, published ? C.amber : C.cream, 'center');
    }
    if (published) {
      mono(g, 'Merged session', 740, 415, 19, C.muted, 'center');
      mono(g, merged[0].length, 740, 436, 20, C.green, 'center');
    }
  } else if (arrival === 1 && !ready) {
    type(g, 'How many sessions now?', 65, 423, 26, C.cream, 'left', 'Serif');
  }
}

export function geometry(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b <= 2
      ? 'Where does the 11:20 pulse belong?'
      : b <= 4
        ? 'Measure the quiet gaps'
        : 'An hour can fire again',
    'WINDOWS',
  );
  if (b <= 2) {
    const x = (t) => 183 + (t - 660) * 8;
    heading(g, 'FIXED HOUR', 43, 118);
    box(g, x(660), 144, 480, 48, '#416762');
    box(g, x(720) + 2, 144, 190, 48, C.metal);
    mono(g, '11:00 to noon', x(695), 169, 19, C.cream, 'center');
    if (after(k, 1, 'Now start')) {
      heading(g, 'SLIDING', 43, 230);
      [660, 665, 670, 675].forEach((t, i) => {
        const y = 218 + i * 58;
        box(g, x(t), y, 480, 45, '#375755', 3, C.lip);
        mono(g, hh(t) + ' to ' + hh(t + 60), x(t + 60) - 12, y + 23, 16, C.cream, 'right');
      });
    }
    line(g, x(680), 118, x(680), b === 1 && !after(k, 1, 'Now start') ? 194 : 440, C.amber, 3);
    mono(g, '11:20', x(680), 102, 18, C.amber, 'center');
    return;
  }
  if (b <= 4) {
    sessionMerge(g, k);
    return;
  }
  const x = rule(g, 93, 287, 757, 660, 750, [
    [660, '11:00'],
    [720, '12:00'],
    [750, '12:30'],
  ]);
  box(g, x(660), 187, x(720) - x(660), 66, C.metal);
  mono(g, 'Eleven-to-noon count', x(690), 220, 20, C.cream, 'center');
  if (after(k, 5, 'fires the main')) {
    line(g, x(725), 159, x(725), 282, C.amber, 3);
    mono(g, 'Watermark 12:05', x(725), 136, 18, C.amber, 'center');
    if (after(k, 5, 'the state stays'))
      bracket(g, x(720), x(750), 348, 'Retain for 30 min', C.green, true);
  }
  if (after(k, 5, 'Flink defaults'))
    mono(
      g,
      'Default allowance   0 min     ·     Configure a side output for expired records.',
      46,
      448,
      15,
      C.muted,
    );
}
export function trackWatermark(g, k) {
  const b = k.beat.beatIndex + 1;
  board(
    g,
    k,
    b === 1
      ? 'The last millisecond'
      : b === 2
        ? 'The slower active input sets the clock'
        : 'A window and a record reach two gates',
    'WATERMARK',
  );
  if (b === 1) {
    const subtractBound = afterPhrase(k, 1, 'takes us to twelve oh five');
    const periodic = afterPhrase(k, 1, 'subtracts one more millisecond');
    chassisClock(
      g,
      periodic ? '12:04:59.999' : subtractBound ? '12:05:00.000' : '12:20:00.000',
      periodic
        ? 'Periodic Flink watermark'
        : subtractBound
          ? 'Subtract the 15 min bound'
          : 'Greatest event time',
    );
  } else if (b === 2) {
    const idle = after(k, 2, 'A can advance');
    const water = [740, 710];
    for (let i = 0; i < 2; i++) {
      const y = 165 + i * 96;
      heading(g, 'INPUT ' + (i ? 'B' : 'A'), 47, y);
      const end = idle && i ? C.lip : C.green;
      line(g, 220, y, i ? 536 : 794, y, end, 8);
      dot(g, i ? 536 : 794, y, 8, end);
      mono(
        g,
        hh(water[i]) + (idle && i ? '   idle' : ''),
        i ? 536 : 794,
        y + 32,
        19,
        end,
        'center',
      );
    }
    answer(g, 'MINIMUM ACTIVE WATERMARK', hh(idle ? water[0] : Math.min(...water)), 47, 393, 860);
  } else {
    const fresh = afterPhrase(k, 5, 'was sent at eleven fifty');
    const event = fresh ? countWindow.members[2].event : countWindow.replayEvent;
    rulerPair(g, countWindow.watermark, event, {
      windowGap: afterPhrase(k, 4, 'Twenty minutes have passed'),
      state: afterPhrase(k, 4, 'the window still has its state'),
      recordGap: fresh
        ? afterPhrase(k, 6, 'thirty minutes behind the watermark')
        : afterPhrase(k, 4, 'seventy-five minutes'),
      route: fresh
        ? afterPhrase(k, 6, 'Accept it')
        : afterPhrase(k, 4, 'Send the heartbeat to replay'),
    });
  }
}
function chassisClock(g, val, caption) {
  screen(g, 109, 154, 742, 154);
  mono(g, val, 480, 233, 77, C.green, 'center');
  type(g, caption, 480, 394, 29, C.cream, 'center', 'Serif');
}
function wholeStrip(g, y, r, tag, conflict = false, showCount = true) {
  const x = timeStrip(g, 49, y, 729, 86, 660, 720);
  mono(g, tag, 66, y + 35, 18, C.ink);
  mono(g, hh(r.time), 66, y + 60, 15, C.grey);
  if (conflict) {
    type(g, 'Claimed total', 386, y + 46, 22, C.rust);
  } else
    for (const m of r.members) {
      const pos = 280 + (m.event - 672) * 10;
      wave(g, m.id, pos - 31, y + 34, 62, 17, m.id === 'C' ? C.rust : C.teal);
      mono(g, m.id + '  ' + hh(m.event), pos, y + 64, 15, C.ink, 'center');
    }
  mono(g, 'v' + r.revision, 852, y + 24, 17, C.muted, 'center');
  mono(g, showCount ? r.count : '?', 852, y + 57, 36, C.cream, 'center');
}
export function counts(g, k) {
  const b = k.beat.beatIndex + 1;
  board(g, k, 'Eleven to noon, by pulse identity', jobWindow());
  const second = after(k, 2, 'It includes');
  const replaced = after(k, 4, 'with three');
  const stale = b === 5 && after(k, 5, 'Now the first');
  const conflict = b === 5 && after(k, 5, 'Try a different');
  const current = countAt(replaced ? 744 : 742);
  const captured = after(k, 1, 'Keep that request');
  if (b === 6) {
    heading(g, 'INCREMENT CONTRACT', 50, 123);
    heading(g, 'WHOLE-WINDOW CONTRACT', 498, 123);
    ticket(g, 49, 161, 405, 99, 'NEW RECORD   C · 11:50', '+1 pulse');
    ticket(g, 498, 161, 408, 99, 'REVISION 2   A + B + C', '3 pulses');
    type(g, 'Remember the event ID.', 51, 310, 21);
    type(g, 'Replace the earlier revision.', 499, 310, 21);
    ticket(g, 49, 398, 360, 79, '12:23   CAPTURE', 'v1    2 pulses');
    ticket(g, 454, 398, 455, 79, 'PUBLISHED   /   ' + jobWindow(), 'v2    3 pulses', C.teal);
    return;
  }
  wholeStrip(g, 121, first, 'First total');
  if (second) {
    const insertion = progress(k, 2, 'It includes', 0.8);
    g.save();
    g.beginPath();
    g.rect(0, 245, 960, 91);
    g.clip();
    wholeStrip(
      g,
      246 + 87 * (1 - insertion),
      conflict ? { ...revised, count: 4, time: 746 } : stale ? retry : revised,
      conflict ? 'Conflict' : stale ? 'Retry' : 'Revised',
      conflict,
      replaced || after(k, 3, '$end'),
    );
    g.restore();
    if (!stale && insertion === 1)
      for (const m of first.members) {
        const x = 280 + (m.event - 672) * 10;
        line(g, x, 208, x, 245, C.muted, 1.8);
      }
  }
  if (after(k, 3, '$end') && !replaced)
    mono(g, 'Adding the whole strips: 2 + 3 = 5', 49, 365, 18, C.red);
  else if (conflict && after(k, 5, '$end'))
    mono(g, 'Equal revision · different count · reject write', 49, 365, 18, C.red);
  else if (conflict) mono(g, 'Same revision     ·     incoming 4, stored 3', 49, 365, 18, C.amber);
  else if (stale && !conflict) mono(g, 'Incoming v1     <     stored v2', 49, 365, 18, C.amber);
  else if (replaced) mono(g, 'Replace by job, window and revision', 49, 365, 18, C.green);
  if (captured)
    ticket(
      g,
      49,
      398,
      360,
      79,
      '12:23   CAPTURE',
      'v' + capture.revision + '    ' + capture.count + ' pulses',
    );
  if (after(k, 1, 'It arrives'))
    ticket(
      g,
      454,
      398,
      455,
      79,
      'PUBLISHED   /   ' + jobWindow(),
      'v' + current.revision + '    ' + current.count + ' pulses',
      C.teal,
    );
}
function jobWindow() {
  return 'J-204   /   11:00–12:00';
}
export function diagnoseCount(g, k) {
  board(g, k, 'Trace the extra pulse', jobWindow());
  const open = after(k, 2, 'Open the publication');
  const wrong = afterPhrase(k, 3, 'The replay read the twelve twenty-four count');
  const slide = progress(k, 3, 'Slide its cutoff', 0.85);
  const fixed = afterPhrase(k, 3, 'Now both rows count two', true);
  const cutoff = revised.time + (captureTime - revised.time) * slide;
  const compare = countAt(fixed ? captureTime : revised.time);
  const replaying = slide > 0 && !fixed;
  if (open) {
    const x = (time) => 200 + (time - first.time) * 280;
    const railY = 224;
    line(g, 75, railY, 887, railY, C.lip, 2);
    const publication = (message) => {
      const pos = x(message.time);
      screen(g, pos - 114, 120, 228, 83);
      const label = hh(message.time) + '  ·  v' + message.revision;
      mono(g, label, pos, 140, 20, C.cream, 'center');
      message.members.forEach((member, i) => {
        const markX = pos - 68 + i * 68;
        const color = member.id === 'C' ? C.amber : C.green;
        wave(g, member.id, markX - 22, 166, 44, 10, color);
        mono(g, member.id, markX, 188, 16, color, 'center');
      });
      line(g, pos, 203, pos, railY, C.green, 2);
      dot(g, pos, railY, 6, C.green);
    };
    if (afterPhrase(k, 2, 'the store held A and B')) publication(first);
    if (afterPhrase(k, 2, 'Put the request at twelve twenty-three')) {
      line(g, x(captureTime), 176, x(captureTime), railY, C.amber, 3);
      mono(g, hh(captureTime) + ' request', x(captureTime), 157, 19, C.amber, 'center');
    }
    if (afterPhrase(k, 2, 'the store added C')) publication(revised);
    if (wrong) {
      const pos = x(cutoff);
      const color = fixed ? C.green : C.blue;
      line(g, pos, railY, pos, 291, color, 3);
      mono(g, 'Replay cutoff', pos, 314, 20, color, 'center');
      if (!replaying) {
        const selectedX = x(compare.time);
        dot(g, selectedX, railY, 9, color);
        if (fixed) {
          line(g, selectedX, railY, selectedX, 291, color, 2);
          line(g, selectedX, 291, pos, 291, color, 2);
          path(
            g,
            [[selectedX + 8, 285], [selectedX, 291], [selectedX + 8, 297]],
            color,
            2,
          );
        }
      }
    }
  } else {
    screen(g, 51, 119, 855, 164);
    mono(g, jobWindow(), 80, 161, 22, C.green);
    mono(g, 'Same request    ·    different counts', 80, 223, 23, C.cream);
  }
  ticket(
    g,
    49,
    346,
    385,
    88,
    'CAPTURE   ' + hh(captureTime),
    'v' + capture.revision + '   ' + capture.count + ' pulses',
  );
  const replayLabel = fixed
    ? 'REPLAY   ≤ ' + hh(captureTime)
    : wrong && !replaying
      ? 'REPLAY   used ' + hh(revised.time)
      : 'TRAINING REPLAY';
  const replayCount = (wrong ? 'v' + compare.revision + '   ' : '') + compare.count + ' pulses';
  ticket(
    g,
    469,
    346,
    438,
    88,
    replayLabel,
    replaying ? 'Replaying' : replayCount,
    fixed ? C.teal : C.rust,
  );
}
