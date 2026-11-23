import assert from 'node:assert/strict';

const ticket = { id: 'R42', text: 'Add dark mode to settings' };
const choices = ['bug', 'feature', 'question'];
const returned = 'feature';
const exampleCompletion = 'Dark mode would add a display option.';

// A text-level trace of the two frontend operations in classify_and_explain.
function promptForExplanation(label) {
  if (!choices.includes(label)) return null;
  return [
    { role: 'system', content: 'Return concise, evidence-backed answers.' },
    { role: 'user', content: ticket.text },
    { role: 'assistant', content: 'Label: ' + label + '\nExplanation: ' },
  ];
}

function completeLine(text) {
  return text.split('\n', 1)[0];
}

const messages = promptForExplanation(returned);
const [labelLine, explanationLine] = messages[2].content.split('\n');
const prefix = labelLine.slice(0, -returned.length);
const answer = completeLine(exampleCompletion + '\n');

const beats = [
  {
    id: 'choice',
    say: 'Someone wants a dark mode for settings. The model gets three categories to choose from.',
    hold: 0.85,
  },
  {
    id: 'return',
    say: 'Feature. SGLang keeps that answer under the name label. A second call will explain the choice. Where does it get that word?',
    hold: 1.4,
  },
  {
    id: 'append',
    say: 'Follow the word. It lands right after Label, in the assistant’s text. On the next line the program writes Explanation.',
    hold: 0.95,
  },
  {
    id: 'submit',
    say: 'Here’s the prompt for the second call. The user’s ticket is still here. So is the category the model chose. Where will it start writing?',
    hold: 1.25,
  },
  {
    id: 'continue',
    say: 'Watch the cursor. Dark mode would add a display option. There’s the explanation, with the first answer still in view.',
    hold: 3.2,
  },
];

const C = {
  ink: '#251835', violet: '#5b32bc', selection: '#683cd5', paper: '#f2edf7',
  pale: '#ddd3ed', muted: '#6e617e', night: '#261442', milk: '#fff4d8',
  salmon: '#ffb198', lilac: '#ddc6ff',
};

const clamp = (v) => Math.max(0, Math.min(1, v));
function ease(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}
const between = (a, b, t) => a + (b - a) * t;

function phase(clock, index, motion) {
  if (clock.index !== index) return Number(clock.index > index);
  return motion(clock);
}

function font(ctx, size, family = 'Mono', weight = 400) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
}

function type(ctx, value, x, y, size, color, family, weight) {
  font(ctx, size, family, weight);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function line(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// This bitmap is the dark-mode illustration on the ticket. The warm edge is
// the lit rim of the crescent. Bayer dithering softens the edge in pixel steps.
const dither = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function moon(ctx) {
  const step = 11, ox = 60, oy = 157;
  for (let j = 0; j < 36; j++) {
    for (let i = 0; i < 43; i++) {
      const outer = Math.hypot(i - 22.3, j - 18.4);
      const cutout = Math.hypot(i - 29.4, j - 12.8);
      const noise = dither[j % 4][i % 4] / 16;
      const inside = outer < 14.8 && cutout > 13.1;
      let color;
      if (inside) {
        const light = clamp((j - i * 0.43 - 6) / 24);
        color = noise < light ? C.salmon : C.milk;
      } else if (outer < 18.4 && outer > 14.5 && noise < (18.4 - outer) / 10) {
        color = '#766198';
      } else if (noise < 0.1 && (i + 2 * j) % 3 === 0) {
        color = '#503768';
      }
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + i * step, oy + j * step, step, step);
      }
    }
  }
  for (const [x, y, r] of [[147, 228, 6], [469, 218, 9], [477, 446, 5], [126, 478, 4]]) {
    ctx.fillStyle = C.lilac;
    ctx.fillRect(x - r * 1.6, y - r / 2, r * 4.2, r);
    ctx.fillRect(x, y - r * 2.1, r, r * 4.2);
  }
}

function ticketFace(ctx, read) {
  const wash = ctx.createLinearGradient(0, 0, 605, 920);
  wash.addColorStop(0, '#382555');
  wash.addColorStop(0.57, C.night);
  wash.addColorStop(1, '#1d132e');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 605, 1080);
  ctx.fillStyle = C.paper;
  // Half-round cutouts run down the ticket at its join with the editor.
  for (let y = 31; y < 1080; y += 48) {
    ctx.beginPath();
    ctx.arc(605, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  type(ctx, 'User', 67, 110, 40, C.milk, 'Sans', 600);
  type(ctx, 'Ticket ' + ticket.id, 335, 110, 31, C.lilac);
  line(ctx, 67, 144, 538, 144, '#736482');
  moon(ctx);
  const splitAt = messages[1].content.indexOf(' to ');
  if (read > 0) {
    line(ctx, 44, 609, 44, between(609, 751, read), C.salmon, 4);
  }
  type(ctx, ticket.text.slice(0, splitAt), 64, 663, 73, C.milk, 'Serif');
  type(ctx, ticket.text.slice(splitAt + 1), 64, 750, 73, C.milk, 'Serif');
}

function callSite(ctx, name, variable, y) {
  font(ctx, 45);
  const x = 706;
  type(ctx, 'sgl.' + name + '(', x, y, 45, C.ink);
  const variableX = x + ctx.measureText('sgl.' + name + '(').width;
  const quoted = '"' + variable + '"';
  type(ctx, quoted, variableX, y, 45, C.violet);
  type(ctx, ', …)', variableX + ctx.measureText(quoted).width, y, 45, C.muted);
}

function selectionField(ctx, picked, travel, named, sourceX, sourceY) {
  ctx.save();
  ctx.globalAlpha = (1 - travel) * (1 - 0.17 * picked);
  type(ctx, choices[0], 763, sourceY, 66, C.muted);
  type(ctx, choices[2], 1430, sourceY, 66, C.muted);
  ctx.restore();
  if (named > 0 && travel < 1) {
    ctx.save();
    ctx.globalAlpha = named * (1 - travel);
    type(ctx, 'label', sourceX, sourceY - 102, 32, C.violet);
    line(ctx, sourceX - 13, sourceY - 113, sourceX - 27, sourceY - 113, C.violet, 2.5);
    line(ctx, sourceX - 27, sourceY - 113, sourceX - 27, sourceY - 65, C.violet, 2.5);
    ctx.restore();
  }
}

function selectedWord(ctx, x, y, progress) {
  const size = 66;
  font(ctx, size);
  const w = ctx.measureText(returned).width;
  type(ctx, returned, x, y, size, C.ink);
  if (progress <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 12, y - 74, (w + 26) * progress, 100);
  ctx.clip();
  const dye = ctx.createLinearGradient(x, y - 65, x + w, y + 12);
  dye.addColorStop(0, '#4c279d');
  dye.addColorStop(1, C.selection);
  ctx.fillStyle = dye;
  ctx.fillRect(x - 12, y - 65, w + 26, 84);
  type(ctx, returned, x, y, size, '#fffaff');
  ctx.restore();
  // Range endpoints remain attached to the same seven characters throughout.
  const r = x - 12 + (w + 26) * progress;
  line(ctx, x - 12, y - 72, x - 12, y + 19, C.selection, 3);
  line(ctx, r, y - 65, r, y + 25, C.selection, 3);
}

const answerSize = 60;
function writtenAnswer(ctx, progress, seconds, startX, baseline) {
  const size = answerSize, x = 707, maxX = 1832, step = 79;
  const chars = Math.floor(progress * answer.length);
  font(ctx, size);
  const space = ctx.measureText(' ').width;
  let pen = startX, y = baseline, index = 0;
  for (const word of answer.split(' ')) {
    const width = ctx.measureText(word).width;
    if (pen + width > maxX && chars >= index) {
      pen = x;
      y += step;
    }
    const visible = word.slice(0, Math.max(0, chars - index));
    type(ctx, visible, pen, y, size, C.ink);
    pen += ctx.measureText(visible).width;
    index += word.length;
    if (chars <= index) break;
    pen += space;
    index++;
  }
  if (progress < 1) {
    ctx.fillStyle = progress > 0 || seconds % 1.15 < 0.83 ? C.selection : '#b4a6c5';
    ctx.fillRect(pen + 2, y - 51, 6, 62);
  }
}

function draw(ctx, clock) {
  const picked = phase(clock, 0, c => ease((c.elapsed + 0.08) / 0.95));
  const named = phase(clock, 1, c => ease(c.reveal('Feature', 0.65)));
  const travel = phase(clock, 2, c => ease(c.reveal('Follow the word', 2.15)));
  const newline = phase(clock, 2, c => c.reveal('On the next line', 0.85));
  const send = phase(clock, 3, c => ease(c.elapsed / 0.95));
  const userRead = phase(clock, 3, c => ease(c.reveal('The user’s ticket', 0.65)));
  const assistantRead = phase(clock, 3, c => ease(c.reveal('So is the category', 0.9)));
  const writing = phase(clock, 4, c => c.reveal('Watch the cursor', 2.5));
  const bg = ctx.createLinearGradient(605, 0, 1920, 1080);
  bg.addColorStop(0, '#faf7fc');
  bg.addColorStop(1, '#e9e1f2');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1920, 1080);
  ticketFace(ctx, userRead);
  type(ctx, 'SGLang', 706, 110, 40, C.ink, 'Sans', 600);
  type(ctx, 'Frontend trace', 1494, 110, 32, C.muted);
  line(ctx, 706, 144, 1818, 144, '#c6b9d1');

  const sourceX = 1058, sourceY = 389;
  ctx.save();
  ctx.beginPath();
  ctx.rect(698, 173, 1135, 87);
  ctx.clip();
  callSite(ctx, 'select', 'label', 234 - 96 * send);
  if (send > 0) {
    callSite(ctx, 'gen', 'explanation', 234 + 96 * (1 - send));
  }
  ctx.restore();
  selectionField(ctx, picked, travel, named, sourceX, sourceY);
  // The editor closes the choice list and lifts the complete assistant span
  // into its place. The highlight stays attached as the view reframes.
  const baseline = between(637, 507, send);
  const roleY = baseline - 135;
  type(ctx, 'Assistant', 706, roleY, 35, C.muted, 'Sans', 600);
  if (assistantRead > 0) {
    // The ink wash ends at the exact end of each input line. As output grows
    // beyond it, the boundary between supplied and generated text stays put.
    ctx.fillStyle = C.pale;
    font(ctx, 66);
    ctx.fillRect(694, baseline - 69, (ctx.measureText(labelLine).width + 39) * assistantRead, 91);
    font(ctx, answerSize);
    ctx.fillRect(694, baseline + 70, (ctx.measureText(explanationLine).width + 13) * assistantRead, 84);
  }
  type(ctx, prefix.trimEnd(), 706, baseline, 66, C.ink);
  const destX = 706 + ctx.measureText(prefix).width + 8;
  if (travel < 1) {
    const blank = clamp(1 - travel * 1.45);
    ctx.save();
    ctx.globalAlpha = blank;
    line(ctx, destX - 10, baseline + 18, destX + 289, baseline + 18, '#c9b8da', 3);
    ctx.restore();
  }
  const wordX = between(sourceX, destX, travel);
  const wordY = between(sourceY, baseline, travel);
  selectedWord(ctx, wordX, wordY, picked);

  if (newline > 0) {
    const size = answerSize, y = baseline + 132;
    const visible = explanationLine.slice(0, Math.ceil(newline * explanationLine.length));
    type(ctx, visible, 707, y, size, C.muted);
    const startX = 707 + ctx.measureText(explanationLine).width;
    if (send > 0) writtenAnswer(ctx, writing, clock.seconds, startX, y);
  }

  if (send < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - send;
    line(ctx, 706, 833, 1818, 833, '#c6b9d1');
    type(ctx, 'gen("explanation")', 706, 893, 39, C.ink);
    type(ctx, newline === 1 ? 'ready' : travel === 1 ? 'building prompt' : 'waiting for label',
      1313, 893, 39, newline === 1 ? C.violet : C.muted, 'Sans', 600);
    ctx.restore();
  }
}

function check() {
  assert.equal(promptForExplanation(undefined), null);
  assert.equal(promptForExplanation('unresolved'), null);
  assert.deepEqual(messages.map(m => m.role), ['system', 'user', 'assistant']);
  assert.equal(messages[1].content, 'Add dark mode to settings');
  assert.equal(messages[2].content, 'Label: feature\nExplanation: ');
  assert.equal(promptForExplanation('bug')[2].content, 'Label: bug\nExplanation: ');
  assert.equal(labelLine.slice(prefix.length), returned);
  assert.equal(completeLine(exampleCompletion + '\nA second line.'), answer);
}

export default { title: 'SGLang: Where does the first answer go?', beats, draw, check };
