import {
  C,
  arrow,
  band,
  bird,
  cue,
  disc,
  label,
  mix,
  mono,
  paper,
  path,
  rect,
  serif,
  socket,
  stage,
  title,
} from './drawing.mjs';
import {
  openingRead,
  clockTime,
  readWindowMinutes,
  REQUESTS,
  RESPONSES,
  PROTOCOL_VERSION,
  CAPABILITIES_KEY,
} from '../../../films/tool-protocol/fixtures.mjs';
import { correlateResponses, discoveryFixture } from '../../../films/tool-protocol/model.mjs';

const TAU = Math.PI * 2;
function dial(c, x, y, r, minutes, windowProgress, observationColor) {
  disc(c, x, y, r + 19, C.face, C.grid, 5);
  disc(c, x, y, r, C.paper, C.gold, 5);
  function polar(m, rad) {
    const a = (m / 60) * TAU - Math.PI / 2;
    return [x + Math.cos(a) * rad, y + Math.sin(a) * rad];
  }
  for (let m = 0; m < 60; m++) {
    path(
      c,
      [polar(m, r - 12), polar(m, r - (m % 5 ? 23 : 39))],
      m % 5 ? C.rule : C.ink,
      m % 5 ? 2 : 5,
    );
  }
  for (let n = 1; n <= 12; n++) serif(c, n, ...polar(n * 5, r - 68), 38, C.ink, 'center');
  if (windowProgress) {
    c.beginPath();
    c.arc(
      x,
      y,
      r - 6,
      -Math.PI / 2 - ((windowProgress * readWindowMinutes) / 60) * TAU,
      -Math.PI / 2,
    );
    c.strokeStyle = C.teal;
    c.lineWidth = 15;
    c.stroke();
  }
  disc(c, ...polar(openingRead.savedAt, r - 10), 12, observationColor, C.white, 3);
  path(c, [[x, y], polar(minutes / 12, r * 0.45)], C.ink, 13);
  path(c, [[x, y], polar(minutes, r * 0.75)], C.teal, 9);
  disc(c, x, y, 11, C.gold, C.ink, 3);
}

function statusExchange(c, t) {
  const send = cue(t, 2, 'sends a status request', 1.1);
  const checkAccess = cue(t, 2, 'Deployments checks her access');
  const receive = cue(t, 2, 'The new observation', 1.4);
  const x = 141, hostY = 245, serverY = 596;

  mono(c, 'STATUS READ', 94, 83, 28, C.mint);
  path(c, [[x, hostY], [x, serverY]], C.grid, 5);
  serif(c, 'Host', 204, hostY, 67, C.white);
  label(c, 'Checks read permission', 205, hostY + 68, 38, { color: C.light });
  serif(c, 'Deployments', 204, serverY, 67, C.white);
  if (checkAccess)
    label(c, 'Checks access to v17', 205, serverY + 68, 38, { color: C.light });

  if (receive) {
    arrow(c, x, serverY - 27, x, mix(serverY - 27, hostY + 27, receive), C.mint, 7);
    mono(c, 'Status reply', 203, 436, 37, C.mint);
  } else if (send) {
    arrow(c, x, hostY + 27, x, mix(hostY + 27, serverY - 27, send), C.gold, 7);
    mono(c, 'Status request', 203, 436, 37, C.gold);
  }
  socket(c, x, hostY, true);
  socket(c, x, serverY, checkAccess);
}

export function opening(c, t) {
  stage(c, true);
  const m = Math.round(
    mix(openingRead.savedAt, openingRead.now, cue(t, 1, 'report is due at two', 1.05)),
  );
  const sw = cue(t, 1, 'Sweep back five minutes', 1.15);
  const ageShown = cue(t, 2, 'eighteen minutes old');
  const observationColor = ageShown ? C.red : C.ink;
  const exchange = t.beat.beatIndex === 1 && cue(t, 2, 'The host checks');
  const { lift, filed } = t.pictureData;
  const filing = t.beat.beatIndex === 0 && t.elapsed < filed;
  const u = filing ? Math.max(0, (t.elapsed - lift) / (filed - lift)) : 1;
  const stampLeft = mix(290, 840, 1 - (1 - u) ** 2);
  if (exchange) {
    statusExchange(c, t);
  } else {
    mono(c, 'DEPLOYMENTS   /   CANARY CLOCK', 94, 83, 28, C.mint);
    dial(c, 390, 434, 279, m, sw, observationColor);
    // Leave a gap between the fixed digits and the left edge of the moving slip.
    if (stampLeft - 16 >= 490 + 24) mono(c, clockTime(m), 390, 790, 67, C.white, 'center');
  }
  const resultClause = cue(t, 2, 'says the canary is clean');
  const fresh = resultClause && (t.beat.beatIndex > 1 || t.elapsed >= t.speechDuration);
  paper(c, 774, 140, 710, 522);
  mono(c, 'reranker-v17', 839, 205, 35);
  bird(c, 1360, 201, 0.72);
  path(
    c,
    [
      [839, 259],
      [1418, 259],
    ],
    C.rule,
    3,
  );
  const stamp = clockTime(openingRead.savedAt);
  if (filing) {
    // Lift a copy from the clock and file it beside the release's status.
    const y = mix(790, 338, u * u);
    const size = mix(67, 51, u);
    rect(c, stampLeft - 16, y - size * 0.65, 3 * size + 32, 1.3 * size, C.white);
    mono(c, stamp, stampLeft, y, size, C.ink);
  } else {
    mono(c, stamp, 840, 338, 51, observationColor);
  }
  if (t.beat.beatIndex > 0 || t.elapsed >= t.pictureData.status)
    serif(c, openingRead.savedStatus, 1060, 335, 54);
  if (ageShown) mono(c, '18 min before report', 841, 397, 29, C.red);
  if (sw === 1) {
    mono(c, 'REPORT WINDOW', 838, 475, 25, C.secondary);
    serif(c, '01:55   to   02:00', 836, 541, 53, C.teal);
  }
  if (fresh) {
    rect(c, 811, 575, 634, 70, C.teal);
    mono(c, '02:00   canary_clean', 842, 610, 42, C.white);
  }
  if (t.beat.beatIndex === 2) {
    mono(c, 'Host', 805, 749, 29, C.white);
    arrow(c, 926, 748, 1045, 748, C.mint);
    mono(c, 'Client', 1060, 749, 29, C.white);
    arrow(c, 1198, 748, 1270, 748, C.mint);
    mono(c, 'Server', 1292, 749, 29, C.white);
    if (cue(t, 3, 'operations console'))
      label(c, 'Incident assistant  /  Operations console  /  IDE', 802, 822, 29, {
        color: C.light,
      });
  }
}

const hosts = ['Incident assistant', 'Operations console', 'IDE'];
const services = ['Status', 'Policy', 'Telemetry', 'Traffic'];
export function integrationState(t) {
  const n = Math.round(12 * cue(t, 1, 'Count one custom adapter', 1.8));
  const shared = !!cue(t, 1, 'Now give each host');
  return {
    n,
    shared,
    denied: !!cue(t, 3, 'permission to shift traffic away'),
    implementations: shared ? hosts.length + services.length : n,
  };
}
export function integration(c, t) {
  stage(c, true);
  if (t.beat.beatIndex === 3) {
    title(c, 'INSIDE ONE HOST', 'One client library, four connections', true);
    rect(c, 110, 256, 790, 485, C.face, C.light, 2, 16);
    serif(c, 'IDE', 158, 331, 58, C.white);
    mono(c, 'Shared client library', 157, 497, 35, C.gold);
    const show = cue(t, 4, 'one client instance');
    services.forEach((name, i) => {
      const y = 334 + i * 113;
      path(
        c,
        [
          [596, 497],
          [652, 497],
          [652, y],
          [1231, y],
        ],
        C.grid,
        5,
      );
      socket(c, 1235, y, true);
      mono(c, name, 1296, y, 31, C.white);
      if (show) {
        socket(c, 773, y, true, C.gold);
        mono(c, 'client', 817, y - 26, 23, C.light);
      }
    });
    if (show) mono(c, 'Traffic connection open   /   IDE write held', 112, 812, 34, C.gold);
    return;
  }
  title(c, 'RELEASE ENGINEERING', 'Wiring three hosts to four services', true);
  const s = integrationState(t),
    xs = services.map((_, i) => 540 + i * 211),
    ys = hosts.map((_, i) => 340 + i * 142);
  hosts.forEach((h, i) => {
    label(c, h, 78, ys[i], 32, { color: C.white, width: 285 });
    path(
      c,
      [
        [390, ys[i]],
        [1250, ys[i]],
      ],
      C.grid,
      6,
    );
    socket(c, 400, ys[i], s.shared);
  });
  services.forEach((v, i) => {
    mono(c, v, xs[i], 222, 32, C.light, 'center');
    path(
      c,
      [
        [xs[i], 258],
        [xs[i], 680],
      ],
      C.grid,
      6,
    );
    socket(c, xs[i], 261, s.shared, C.gold);
  });
  for (let j = 0; j < s.n; j++) {
    const row = Math.floor(j / 4),
      col = j % 4,
      x = xs[col],
      y = ys[row];
    if (s.shared) {
      disc(c, x, y, 11, s.denied && j === 11 ? C.coral : C.light);
    } else {
      rect(c, x - 32, y - 21, 64, 42, C.gold, null, 1, 7);
      path(
        c,
        [
          [x - 20, y],
          [x + 19, y],
        ],
        C.ink,
        4,
      );
    }
  }
  if (s.denied) {
    path(
      c,
      [
        [xs[3] - 15, ys[2] - 15],
        [xs[3] + 15, ys[2] + 15],
      ],
      C.navy,
      5,
    );
    mono(c, 'write held', xs[3] + 30, ys[2] + 49, 24, C.coral);
  }
  const result = s.shared
    ? cue(t, 2, 'Three plus four')
      ? '3 + 4 = ' + s.implementations + ' implementations'
      : '3 host integrations   +   4 servers'
    : s.n + ' pair-specific adapters';
  serif(c, result, 100, 778, 55, C.white, 'left', 910);
  if (s.shared) mono(c, '12 possible pairs', 1440, 783, 34, C.mint, 'right');
}

export function boundaries(c, t) {
  stage(c, true);
  const base = 78,
    edge = 824;
  title(c, 'INCIDENT ASSISTANT', 'Three clients share one host policy', true);
  rect(c, base, 220, edge - base, 529, C.face, C.light, 2, 18);
  mono(c, 'HOST', 118, 264, 27, C.light);
  mono(c, 'DISPATCH', edge - 24, 265, 25, C.gold, 'right');
  const fail = cue(t, 2, 'policy lookup times out'),
    read = cue(t, 3, 'Send the status read', 1.0),
    reply = cue(t, 3, 'returns the clean canary reading'),
    held = cue(t, 3, 'Hold the traffic shift');
  const lanes = [
    ['Read v17', 'Deployments'],
    ['Clearance', 'Policy'],
    ['Shift traffic', 'Rollouts'],
  ];
  lanes.forEach(([what, who], i) => {
    const y = 375 + i * 144;
    mono(c, what, 117, y - 24, 34, C.white);
    mono(c, 'client', 562, y - 24, 25, C.light);
    path(
      c,
      [
        [120, y + 22],
        [edge, y + 22],
        [1300, y + 22],
      ],
      C.grid,
      5,
    );
    socket(c, 586, y + 22, true);
    socket(c, 1301, y + 22, true);
    label(c, who, 1100, y - 28, 38, { color: C.white });
    if (i === 0 && read) {
      path(
        c,
        [
          [587, y + 22],
          [mix(588, 1301, read), y + 22],
        ],
        C.mint,
        6,
      );
      if (reply) mono(c, 'canary_clean', 878, y + 64, 26, C.mint);
    }
    if (i === 1 && fail) {
      path(
        c,
        [
          [587, y + 22],
          [1042, y + 22],
        ],
        C.gold,
        6,
      );
      mono(c, 'timeout', 913, y + 62, 27, C.gold);
    }
    if (i === 2 && held) {
      path(
        c,
        [
          [586, y + 22],
          [edge - 24, y + 22],
        ],
        C.coral,
        7,
      );
      path(
        c,
        [
          [edge - 22, y + 1],
          [edge - 22, y + 43],
        ],
        C.coral,
        8,
      );
      mono(c, 'held for policy', 900, y + 62, 29, C.coral);
    }
  });
  if (t.beat.beatIndex === 1) serif(c, 'Which proposal can leave?', 94, 817, 52, C.gold);
}

function replyProgress(t, beat, phrase, duration = 0) {
  if (!cue(t, beat, phrase)) return 0;
  if (t.beat.beatIndex + 1 > beat) return 1;
  const elapsed = t.elapsed - t.wordCue(phrase).end;
  return duration ? Math.max(0, Math.min(1, elapsed / duration)) : Number(elapsed >= 0);
}

export function correlation(c, t) {
  stage(c, false);
  title(c, 'JSON-RPC 2.0', 'A return address for each reply');
  const firstArrived = replyProgress(t, 2, 'Here comes reply three');
  const movement = [
    replyProgress(t, 3, 'Close the status call', 0.6),
    replyProgress(t, 3, 'Reply one', 0.8),
    replyProgress(t, 3, 'Reply two', 0.8),
  ];
  const rowY = (i) => 320 + i * 135;
  const slotX = 885;
  const paired = correlateResponses(
    REQUESTS,
    RESPONSES.filter((_, i) => movement[i] === 1),
  );
  paper(c, 103, 239, 921, 456);
  REQUESTS.forEach((r, i) => {
    const y = rowY(i);
    mono(c, '#' + r.id, 170, y, 48, C.teal);
    mono(c, r.method, 312, y, 40);
    const hit = paired.matched.find((v) => v.id === r.id);
    if (hit) {
      disc(c, slotX, y, 34, C.teal);
      mono(c, hit.id, slotX, y, 34, C.white, 'center');
    } else disc(c, slotX, y, 34, null, C.rule, 3);
    if (i < REQUESTS.length - 1)
      path(
        c,
        [
          [162, y + 65],
          [960, y + 65],
        ],
        C.rule,
        2,
      );
  });
  if (t.beat.beatIndex === 0) return;

  const replyX = 1300;
  const replyY = mix(rowY(0), rowY(1), 0.5);
  mono(c, 'REPLY ID', replyX, 275, 34, C.secondary, 'center');
  RESPONSES.forEach((reply, i) => {
    const progress = movement[i];
    if (progress === 1 || (!progress && (i !== 0 || !firstArrived))) return;
    const align = Math.min(1, 2 * progress);
    const dock = Math.max(0, 2 * progress - 1);
    const targetY = rowY(REQUESTS.findIndex(({ id }) => id === reply.id));
    // Line up outside the request card before crossing into the matching row.
    const x = mix(mix(replyX, 1110, align), slotX, dock);
    const y = mix(replyY, targetY, align);
    disc(c, x, y, mix(64, 34, progress), C.gold);
    mono(c, reply.id, x, y, mix(65, 34, progress), C.ink, 'center');
  });
  const count = paired.matched.length;
  if (count) {
    mono(c, 'MATCHED', replyX, 652, 30, C.secondary, 'center');
    serif(c, count + ' of ' + REQUESTS.length, replyX, 718, 65, C.teal, 'center');
  }
  if (t.beat.beatIndex === 1 && cue(t, 2, 'Which request'))
    serif(c, 'Which slot?', replyX, 658, 51, C.ink, 'center');
  if (cue(t, 3, 'A notification'))
    mono(c, 'Notification   /   no reply', 122, 789, 37, C.secondary);
}

const discovery = discoveryFixture();
export function capabilities(c, t) {
  stage(c, false);
  title(c, 'SERVER DISCOVERY', 'A form depends on the current request');
  const show = cue(t, 2, 'each request carries');
  const discover = cue(t, 1, 'discovery reply');
  const result = (phrase) => {
    if (t.beat.beatIndex !== 2) return Number(t.beat.beatIndex > 2);
    const { start, end } = t.wordCue(phrase);
    return t.reveal(phrase, end - start, { captionStart: phrase });
  };
  const formReply = result('Forty-one does');
  const missingReply = result('the server reports the missing capability in the reply to forty-two');
  mono(c, 'server/discover', 104, 255, 43, C.teal);
  if (discover) {
    const [version] = discovery.discovery.supportedVersions;
    const capability = Object.keys(discovery.discovery.capabilities)[0];
    mono(c, version + '   /   ' + capability, 620, 255, 40);
  }
  if (!show) {
    path(
      c,
      [
        [116, 338],
        [1450, 338],
      ],
      C.rule,
      4,
    );
    serif(c, 'Which features can this server offer?', 108, 454, 58, C.secondary);
    return;
  }
  mono(c, 'params._meta   /   io.modelcontextprotocol/', 107, 298, 26, C.secondary);
  discovery.requests.forEach((r, i) => {
    if (i && !cue(t, 2, 'Request forty-two')) return;
    const x = 104 + i * 706;
    paper(c, x, 329, 653, 421);
    mono(c, 'Request ' + r.id, x + 48, 386, 38);
    mono(c, PROTOCOL_VERSION, x + 48, 456, 31, C.secondary);
    path(
      c,
      [
        [x + 46, 495],
        [x + 597, 495],
      ],
      C.rule,
      3,
    );
    mono(c, 'clientCapabilities', x + 48, 541, 28);
    const form = !!r.params._meta[CAPABILITIES_KEY]?.elicitation?.form;
    disc(c, x + 69, 616, 16, form ? C.ink : C.white, C.ink, 3);
    mono(c, form ? 'elicitation.form' : '{ }', x + 103, 616, 33);
    const progress = i ? missingReply : formReply;
    if (progress > 0) {
      const color = i ? C.red : C.teal;
      path(c, [[x + 48, 656], [x + 48 + 550 * progress, 656]], color, 4);
    }
    if (progress !== 1) return;
    const reply = i ? discovery.missingReply : discovery.formReply;
    const outcome = i ? 'error ' + reply.error.code : reply.result.resultType;
    mono(c, 'Reply ' + reply.id + '  /  ' + outcome, x + 48, 683, 33, i ? C.red : C.teal);
    if (i) {
      mono(c, 'requiredCapabilities', x + 48, 710, 24, C.secondary);
      mono(c, JSON.stringify(reply.error.data.requiredCapabilities), x + 48, 736, 26);
    } else {
      const formRequest = reply.result.inputRequests.rollback_reason;
      mono(c, 'inputRequests: ' + formRequest.method, x + 48, 727, 26, C.secondary, 'left', 554);
    }
  });
}
const primitives = [
  ['Tool', 'Model proposes', 'get_release_status', 'tools/call'],
  ['Resource', 'App attaches', 'release runbook', 'resources/read'],
  ['Prompt', 'User chooses', 'readiness review', 'prompts/get'],
];
export function roles(c, t) {
  stage(c, true);
  title(c, 'HOST WORKSPACE', 'Who brings this into the conversation?', true);
  if (cue(t, 3, 'Follow the status tool')) {
    mono(c, 'DEPLOYMENTS CATALOG', 108, 260, 32, C.mint);
    paper(c, 101, 309, 657, 350);
    mono(c, 'tools/list', 151, 367, 30, C.secondary);
    mono(c, 'get_release_status', 149, 454, 41);
    mono(c, 'inputSchema', 148, 535, 27, C.secondary);
    mono(c, 'release_id  ·  string', 150, 601, 33);
    if (cue(t, 3, 'translates its input schema')) {
      arrow(c, 767, 481, 864, 481, C.gold, 5);
      mono(c, 'PROVIDER FUNCTION', 903, 263, 30, C.gold);
      mono(c, 'get_release_status', 904, 376, 38, C.white);
      mono(c, 'release_id  ·  string', 905, 454, 29, C.light);
    }
    if (cue(t, 3, 'model proposes'))
      mono(c, 'release_id = "reranker-v17"', 905, 560, 31, C.white, 'left', 575);
    if (cue(t, 3, 'host checks')) mono(c, 'Host checks caller + target', 108, 755, 34, C.mint);
    if (cue(t, 3, 'client sends')) {
      arrow(c, 708, 755, 850, 755, C.mint);
      mono(c, 'tools/call  →  deployments', 900, 755, 31, C.white);
    }
    return;
  }
  const vis = [1, cue(t, 2, 'A resource'), cue(t, 2, 'A prompt')];
  primitives.forEach(([name, owner, obj, method], i) => {
    if (!vis[i]) return;
    const x = 92 + i * 486;
    mono(c, owner, x + 4, 254, 31, C.mint);
    if (i === 0) {
      rect(c, x, 333, 362, 155, C.face, C.light, 3, 75);
      disc(c, x + 79, 412, 48, C.gold);
      path(
        c,
        [
          [x + 55, 412],
          [x + 103, 412],
        ],
        C.ink,
        7,
      );
      mono(c, 'CALL', x + 181, 412, 39, C.white);
    } else if (i === 1) {
      rect(c, x + 10, 345, 336, 152, C.gold);
      rect(c, x, 328, 336, 152, C.paper);
      path(
        c,
        [
          [x + 35, 366],
          [x + 276, 366],
        ],
        C.ink,
        5,
      );
      path(
        c,
        [
          [x + 35, 406],
          [x + 238, 406],
        ],
        C.rule,
        5,
      );
      path(
        c,
        [
          [x + 35, 445],
          [x + 190, 445],
        ],
        C.rule,
        5,
      );
    } else {
      paper(c, x, 328, 362, 159);
      for (let k = 0; k < 3; k++) {
        rect(c, x + 40, 353 + 37 * k, 18, 18, null, C.ink);
        path(
          c,
          [
            [x + 78, 363 + 37 * k],
            [x + 291, 363 + 37 * k],
          ],
          C.rule,
          3,
        );
      }
    }
    serif(c, name, x, 560, 64, C.white);
    mono(c, method, x, 629, 32, C.gold);
    label(c, obj, x, 690, 34, { color: C.light });
  });
}
