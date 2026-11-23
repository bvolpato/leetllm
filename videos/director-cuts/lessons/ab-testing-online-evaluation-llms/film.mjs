import assert from 'node:assert/strict';

const beats = [
  {
    id: 'idle-pointer',
    say: "Watch the headline on Jo's poster. Two new words, and her pointer hasn't moved. Who made that edit?",
    hold: 1.8,
  },
  {
    id: 'both-seats',
    say: "Let's replay it from both seats. We're testing two prompts for the writing assistant. A coin picked one for each editor. Jo got the current prompt. Mara got the new one, which asks for shorter headlines.",
    hold: 0.6,
  },
  {
    id: 'one-edit',
    say: "Over on the right, Mara likes the suggestion. She clicks to use it. See her name beside the new headline on Jo's screen? They share a file.",
    hold: 1.1,
  },
  {
    id: 'export',
    say: "Jo can export that version straight away. Her export would go in the group for prompt A, even though prompt B helped her finish. That's how an edit spills over between groups.",
    hold: 1.1,
  },
  {
    id: 'draw-by-club',
    say: 'For a fresh test, find swim clubs whose editors and posters all stay within their own workspace. Draw a prompt at random for each club. Both editors at East Pool get the same one.',
    hold: 1.1,
  },
  {
    id: 'deadline',
    say: 'Give each club an hour from when it starts its poster. East Pool exports after eighteen minutes and sends a revision a little later. How many clubs just met the deadline?',
    hold: 1.7,
  },
  {
    id: 'club-result',
    say: 'One. Those two exports belong to East Pool. Once the hour is up for every club, compare the share of clubs that exported in time under each prompt.',
    hold: 2.6,
  },
];

const original = 'Swimming after sundown';
const suggestion = 'Night Swim';
const jo = { name: 'Jo', prompt: 'A', file: 'north-poster' };
const mara = { name: 'Mara', prompt: 'B', file: 'north-poster' };
const edit = { file: mara.file, prompt: mara.prompt, title: suggestion };
function headline(editor, applied) {
  return applied && editor.file === edit.file ? edit.title : original;
}

// Each club draws once at enrollment. Export times are minutes since it started.
const deadline = 60;
const clubs = [
  { name: 'East Pool', editors: ['Kit', 'Lou'], draw: 0.31, exports: [18, 32], warm: true },
  { name: 'West Pool', editors: ['Pia', 'Eli'], draw: 0.84, exports: [41], warm: false },
];
const clubPrompt = (club) => (club.draw < 0.5 ? 'A' : 'B');
const exportsBy = (club, minute) => club.exports.filter((t) => t <= minute);
const metDeadline = (club) => exportsBy(club, deadline).length > 0;

function check() {
  assert.notEqual(jo.prompt, edit.prompt);
  assert.equal(headline(jo, false), original);
  assert.equal(headline(jo, true), headline(mara, true));
  assert.equal(headline({ ...jo, file: 'separate-file' }, true), original);
  assert.deepEqual(clubs.map(clubPrompt), ['A', 'B']);
  assert.deepEqual(exportsBy(clubs[0], 17), []);
  assert.deepEqual(exportsBy(clubs[0], 32), [18, 32]);
  assert.deepEqual(clubs.map(metDeadline), [true, true]);
  assert.equal(Number(metDeadline(clubs[0])), 1);
  assert.equal(metDeadline({ exports: [deadline + 1] }), false);
  assert.equal(metDeadline({ exports: [deadline] }), true);
}

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const ink = '#192342';
const purple = '#684598';
const blue = '#175f8b';

function word(ctx, value, x, y, size, color = ink, weight = 500, family = 'Sans') {
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function box(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}
function disk(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}
function stroke(ctx, color, width, path) {
  ctx.beginPath();
  path();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function polygon(ctx, color, points) {
  ctx.beginPath();
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// A two-ink pool poster. The ladder, coping and reflected light are fixed
// landmarks in both editors' views while the headline changes.
function poster(ctx, title, pool, warm, selection = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 774, 367);
  ctx.clip();
  const sky = warm ? '#f3ad88' : '#24345e';
  const light = warm ? '#682d54' : '#fff1c2';
  const water = warm ? '#68c7c7' : '#499eb6';
  const shade = warm ? '#258eab' : '#287597';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 774, 367);
  disk(ctx, 602, 81, 41, warm ? '#fbecb7' : '#ffe3a4');
  if (!warm) {
    for (const [x, y, s] of [
      [485, 43, 2],
      [524, 92, 2],
      [677, 45, 3],
      [734, 74, 2],
      [434, 112, 2],
      [704, 117, 1.8],
    ]) {
      polygon(ctx, '#e5d8af', [
        [x, y - s * 2],
        [x + s * 0.55, y - s * 0.45],
        [x + s * 1.6, y],
        [x + s * 0.5, y + s * 0.4],
        [x, y + s * 2],
        [x - s * 0.5, y + s * 0.4],
        [x - s * 1.6, y],
        [x - s * 0.5, y - s * 0.45],
      ]);
    }
  }

  // Distant tiled wall, then the plane of water below its lip.
  polygon(ctx, warm ? '#a65e6a' : '#39456d', [
    [0, 194],
    [774, 134],
    [774, 172],
    [0, 231],
  ]);
  for (let i = 0; i < 26; i++) {
    const x = i * 32;
    const y = 194 - (x * 60) / 774;
    stroke(ctx, warm ? '#d88d85' : '#556187', 1.4, () => {
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 37);
    });
  }
  polygon(ctx, '#f4d6a7', [
    [0, 222],
    [774, 162],
    [774, 171],
    [0, 232],
  ]);
  polygon(ctx, water, [
    [0, 232],
    [774, 171],
    [774, 367],
    [0, 367],
  ]);

  for (let i = 0; i < 42; i++) {
    const x = ((i * 167) % 810) - 28;
    const horizon = 232 - (x * 61) / 774;
    const y = horizon + 8 + ((i * 37) % 135);
    const w = 27 + ((i * 23) % 84);
    ctx.fillStyle = i % 4 === 0 ? '#abdccc' : shade;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + w * 0.3, y + 3, x + w * 0.6, y - 7, x + w, y - 3);
    ctx.bezierCurveTo(x + w * 0.6, y - 3, x + w * 0.33, y + 10, x, y);
    ctx.fill();
  }
  // Pool-floor grout bends where the surface catches the light.
  ctx.save();
  ctx.globalAlpha = 0.23;
  for (let i = 0; i < 14; i++) {
    const x = i * 75 - 170;
    const y = 232 - (x * 61) / 774;
    stroke(ctx, shade, 2.5, () => {
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 11, y + 53, x + 55, y + 42, x + 53, y + 81);
      ctx.bezierCurveTo(x + 60, y + 113, x + 95, y + 126, x + 103, y + 204);
    });
  }
  ctx.restore();
  // A reflected patch breaks up into broader ripples towards the viewer.
  for (let i = 0; i < 10; i++) {
    const x = 551 + Math.sin(i * 2.2) * (11 + i * 3);
    const y = 193 + i * 14;
    polygon(ctx, '#dce4bd', [
      [x, y],
      [x + 40 + i * 3, y - 3],
      [x + 57 + i * 4, y - 2],
      [x + 21, y + 3],
    ]);
  }

  // Each rail rises from the coping, curls over, then descends to the rungs.
  function rail(x, y, color, thickness) {
    stroke(ctx, color, thickness, () => {
      ctx.moveTo(x, y + 30);
      ctx.lineTo(x, y + 8);
      ctx.bezierCurveTo(x, y - 22, x + 31, y - 29, x + 31, y + 3);
      ctx.lineTo(x + 31, y + 112);
    });
  }
  ctx.lineCap = 'round';
  for (let j = 0; j < 3; j++) {
    stroke(ctx, '#214c73', 12, () => {
      ctx.moveTo(650, 195 + j * 27);
      ctx.lineTo(719, 190 + j * 27);
    });
    stroke(ctx, '#f2dfb9', 6, () => {
      ctx.moveTo(650, 192 + j * 27);
      ctx.lineTo(719, 187 + j * 27);
    });
  }
  for (const [x, y] of [
    [619, 147],
    [688, 141.7],
  ]) {
    rail(x + 2, y + 3, '#265078', 12);
    rail(x, y, '#f7dfad', 7);
  }

  const lines = title === original ? ['Swimming after', 'sundown'] : [title];
  const size = lines.length === 2 ? 59 : 75;
  for (const [i, line] of lines.entries())
    word(ctx, line, 32, 78 + i * 59, size, light, 500, 'Serif');
  if (selection > 0) {
    ctx.save();
    ctx.globalAlpha = selection;
    const w = lines.length === 2 ? 448 : 403;
    const h = lines.length === 2 ? 138 : 90;
    stroke(ctx, '#febfcf', 2.5, () => ctx.rect(22, 8, w, h));
    for (const x of [22, 22 + w])
      for (const y of [8, 8 + h]) {
        ctx.fillStyle = '#fff0e4';
        ctx.fillRect(x - 4, y - 4, 8, 8);
      }
    ctx.restore();
  }
  // A small signature is part of the poster and identifies the shared file.
  box(ctx, 21, 311, 204, 40, 0, '#f9e7c3');
  word(ctx, pool.toUpperCase(), 33, 339, 24, '#233858', 700);
  ctx.restore();
}

function person(ctx, name, x, y, tagColor, r = 25) {
  disk(ctx, x, y, r, tagColor);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.clip();
  const flip = name === 'Mara' || name === 'Lou' || name === 'Pia' ? -1 : 1;
  ctx.translate(x, y);
  ctx.scale((r / 25) * flip, r / 25);
  disk(ctx, 1, -4, 10, '#f2cda9');
  polygon(ctx, '#f2cda9', [
    [6, -8],
    [14, -1],
    [9, 0],
    [6, 5],
  ]);
  ctx.fillStyle = '#ecd8c5';
  ctx.fillRect(-4, 2, 9, 12);
  ctx.fillStyle = '#edf2e7';
  ctx.beginPath();
  ctx.ellipse(-1, 25, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#283651';
  ctx.beginPath();
  ctx.arc(0, -7, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function promptLabel(ctx, prompt, reveal = 1) {
  if (!reveal) return;
  ctx.save();
  ctx.globalAlpha *= reveal;
  const color = prompt === 'A' ? blue : purple;
  box(ctx, 597, 14, 192, 52, 26, prompt === 'A' ? '#e2f1f4' : '#eee5f5');
  word(ctx, `Prompt ${prompt}`, 619, 51, 34, color, 700);
  ctx.restore();
}

function pointer(ctx, x, y, color, press) {
  ctx.save();
  ctx.translate(x, y);
  if (press > 0 && press < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - press;
    stroke(ctx, color, 4, () => ctx.arc(0, 0, 12 + press * 41, 0, 2 * Math.PI));
    ctx.restore();
  }
  const s = 1 - 0.13 * Math.sin(press * Math.PI);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4, 31);
  ctx.lineTo(12, 22);
  ctx.lineTo(18, 35);
  ctx.lineTo(25, 32);
  ctx.lineTo(18, 19);
  ctx.lineTo(31, 17);
  ctx.closePath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function frame(ctx) {
  ctx.save();
  ctx.shadowColor = 'rgba(39,51,82,0.15)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 9;
  box(ctx, 0, 0, 810, 547, 12, '#fffdf6');
  ctx.restore();
}

function editorView(ctx, editor, state) {
  frame(ctx);
  person(ctx, editor.name, 46, 40, editor.prompt === 'A' ? blue : purple);
  word(ctx, editor.name, 87, 54, 37, ink, 700);
  promptLabel(ctx, editor.prompt);
  ctx.save();
  ctx.translate(18, 81);
  poster(ctx, headline(editor, state.changed), 'North Pool', false, state.selected);
  if (state.offer > 0) {
    ctx.save();
    ctx.globalAlpha *= state.offer;
    box(ctx, 30, 183, 345, 64, 10, '#fffdf8');
    word(ctx, 'Use “Night Swim”', 49, 226, 33, purple, 700);
    ctx.restore();
  }
  ctx.restore();
  if (state.byline > 0) {
    ctx.save();
    ctx.globalAlpha *= state.byline;
    ctx.fillStyle = purple;
    ctx.fillRect(432, 97, 4, 83);
    box(ctx, 432, 178, 110, 44, 6, purple);
    word(ctx, 'Mara', 444, 211, 30, '#fffdf6', 700);
    ctx.restore();
  }
  word(ctx, state.exported ? 'Export logged for A' : 'Shared poster', 29, 507, 34, ink, 500);
  box(ctx, 617, 468, 169, 59, 8, state.exported ? '#e0ebeb' : ink);
  word(
    ctx,
    state.exported ? 'Exported' : 'Export',
    state.exported ? 633 : 651,
    508,
    32,
    state.exported ? ink : '#fffdf6',
    700,
  );
  const x = editor === jo ? mix(747, 713, state.move) : mix(361, 286, state.move);
  const y = editor === jo ? mix(517, 498, state.move) : mix(360, 300, state.move);
  pointer(ctx, x, y, editor.prompt === 'A' ? blue : purple, state.press);
}

// The drawing pulls back from Jo's view to reveal the other editor of the same file.
function editors(ctx, clock) {
  const i = clock.index;
  const pull = i === 0 ? 0 : i === 1 ? ease(clock.reveal("Let's replay", 1.25)) : 1;
  const firstChange = i === 0 && clock.elapsed >= 0.95;
  const click = i === 2 ? clock.reveal('She clicks', 0.85) : 0;
  const accepted = i >= 3 || (i === 2 && click > 0.16);
  const synced = i >= 3 || (i === 2 && click > 0.72);
  const exported = i === 3 ? clock.reveal('export that version', 0.55) : 0;
  const reach = i === 2 ? ease(clock.reveal('Mara likes', 0.8)) : Number(i >= 3);
  const hover = i === 1 ? clock.reveal('shorter headlines', 0.45) : Number(i >= 2);
  const scale = mix(1.43, 1, pull);
  const x = mix((1920 - 810 * scale) / 2, 102, pull);
  const y = mix(134, 245, pull);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const restarting = i === 1 && pull < 0.48;
  editorView(ctx, jo, {
    changed: firstChange || restarting || synced,
    byline: i === 2 && synced ? ease((click - 0.72) / 0.28) : i === 3 ? 1 - exported : 0,
    selected: i === 0 ? clamp(2.2 - clock.elapsed) : i === 2 ? Math.sin(click * Math.PI) : 0,
    move: i === 3 ? ease(clock.reveal('Jo can', 0.65)) : 0,
    press: exported,
    exported: exported > 0.3,
    offer: 0,
  });
  ctx.restore();
  if (pull > 0) {
    ctx.save();
    ctx.globalAlpha = pull;
    ctx.translate(mix(1940, 1008, pull), y);
    ctx.scale(scale, scale);
    editorView(ctx, mara, {
      changed: accepted || restarting,
      selected: i === 2 ? Math.sin(click * Math.PI) : 0,
      byline: 0,
      move: reach,
      press: click,
      exported: false,
      offer: hover * (1 - Number(accepted)),
    });
    ctx.restore();
  }
}

function teamView(ctx, club, assigned, minute, result) {
  frame(ctx);
  word(ctx, club.name, 26, 55, 38, ink, 700);
  promptLabel(ctx, clubPrompt(club), assigned);
  ctx.save();
  ctx.translate(18, 81);
  poster(ctx, club.warm ? 'Morning Dip' : 'Moon Pool', club.name, club.warm);
  ctx.restore();
  const exports = exportsBy(club, minute);
  if (minute === 0) {
    for (const [j, name] of club.editors.entries()) {
      const x = 49 + j * 212;
      person(
        ctx,
        name,
        x,
        497,
        assigned > 0.5 ? (clubPrompt(club) === 'A' ? blue : purple) : '#68758c',
        23,
      );
      word(ctx, name, x + 36, 509, 33, ink, 600);
    }
    return;
  }
  const x0 = 34,
    x1 = 505,
    y = 502;
  stroke(ctx, '#c4cbd3', 4, () => {
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  });
  const timeX = (t) => mix(x0, x1, t / deadline);
  stroke(ctx, blue, 4, () => {
    ctx.moveTo(x0, y);
    ctx.lineTo(timeX(minute), y);
  });
  for (const t of exports) {
    const x = timeX(t);
    disk(ctx, x, y, 8, ink);
    word(ctx, `${t}m`, x - 21, y - 16, 27, ink, 600);
  }
  word(
    ctx,
    result && metDeadline(club)
      ? '1 club'
      : `${exports.length} ${exports.length === 1 ? 'export' : 'exports'}`,
    547,
    512,
    38,
    ink,
    700,
  );
}

function trial(ctx, clock) {
  const i = clock.index;
  const assigned = i === 4 ? ease(clock.reveal('Draw a prompt', 0.55)) : 1;
  let minute = 0;
  if (i === 5) {
    const first = ease(clock.reveal('East Pool exports', 1.0));
    const second = ease(clock.reveal('sends a revision', 0.95));
    minute = 18 * first + 14 * second;
  }
  if (i === 6) minute = 32 + 28 * ease(clock.reveal('Once the hour', 1.1));
  for (const [j, club] of clubs.entries()) {
    ctx.save();
    ctx.translate(j === 0 ? 102 : 1008, 245);
    teamView(ctx, club, assigned, minute, i === 6 && (j === 0 || minute >= deadline));
    ctx.restore();
  }
  if (minute > 0) {
    word(ctx, `${Math.floor(minute)} / ${deadline} min`, 107, 877, 38, ink, 500, 'Mono');
  }
}

function draw(ctx, clock) {
  const wash = ctx.createLinearGradient(0, 0, 1920, 1080);
  wash.addColorStop(0, '#f1efea');
  wash.addColorStop(0.65, '#e7e9f1');
  wash.addColorStop(1, '#dae3ef');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 1080);
  // The quiet pasteboard gives the actual poster edges room to read.
  ctx.fillStyle = '#cbd1dc';
  for (let x = 19; x < 1920; x += 35)
    for (let y = 18; y < 1080; y += 35) ctx.fillRect(x, y, 1.6, 1.6);
  const i = clock.index;
  const venue =
    i === 0 ? 'North Pool' : i < 4 ? 'North Pool   /   Replay' : 'New trial   /   Club workspaces';
  word(ctx, venue, 102, 95, 44, ink, 600);
  if (i < 4) editors(ctx, clock);
  else trial(ctx, clock);
}

export default { title: 'Who changed Jo’s headline?', beats, draw, check };
