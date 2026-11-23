import {
  base,
  bracket,
  clamp,
  cream,
  cue,
  fade,
  finger,
  foot,
  gold,
  green,
  header,
  ink,
  line,
  mint,
  mix,
  mono,
  muted,
  num,
  paper,
  peach,
  rect,
  red,
  rule,
  sheet,
  small,
  type,
} from './drawing.mjs';
import {
  blockCase,
  chain,
  columns,
  commonPrefix,
  guide,
  guideEnding,
  newBlocks,
  oldBlocks,
  parts,
  questions,
  sections,
  storedTokens,
  workRows,
} from './examples.mjs';

const introRows = workRows();
export function opening(c, k) {
  base(c, k, 'Where does the second request start fresh?', 'THREE QUESTIONS');
  const trace = cue(k, 0, 'Follow the finger', 2.15);
  const first = cue(k, 1, 'The first request processes', 0.55);
  const stored = cue(k, 1, 'saves keys and values', 0.65);
  const begin = cue(k, 2, 'Fresh work starts', 0.6);
  const answer = cue(k, 2, 'Then the model generates', 0.7);
  // The book tab and the excerpt refer to the whole shared token prefix.
  const left = 86,
    top = 311,
    w = 331,
    h = 434;
  rect(c, left + 8, top + 10, w, h, '#bbad90', 12);
  rect(c, left + 4, top + 6, w, h, '#efe2c8', 12);
  rect(c, left, top, w, h, green, 10);
  rect(c, left + 12, top + 1, 21, h - 2, '#0d5549', 4);
  line(
    c,
    [
      [left + 42, top + 10],
      [left + 42, top + h - 10],
    ],
    '#8eae98',
    2,
  );
  small(c, 'SHARED PREFIX', left + 55, top + 52, '#f1d899');
  type(c, 'Repository', left + 54, top + 129, 48, cream, { face: 'Serif' });
  type(c, 'guide', left + 54, top + 182, 60, cream, { face: 'Serif' });
  // Section widths on the book edge represent the actual four section lengths.
  let edge = left + 55;
  parts.forEach((n, i) => {
    const width = (234 * n) / guide;
    rect(c, edge, top + 251, width - 2, 17, [gold, cream, mint, gold][i]);
    edge += width;
  });
  mono(c, num(guide), left + 54, top + 321, 49, cream);
  small(c, 'input tokens', left + 55, top + 371, '#c9decd');

  const x = 575,
    dx = 92,
    end = x + guideEnding.length * dx;
  header(c, 'Last six IDs · example', x, 291);
  header(c, 'Question excerpt and tail length', end + 35, 291);
  introRows.forEach((r, i) => {
    const y = 379 + i * 135;
    type(c, 'R' + (i + 1), 462, y + 38, 40, ink, { face: 'Serif' });
    sheet(c, x - 10, y - 14, 1247, 100);
    guideEnding.forEach((id, j) => {
      const cx = x + j * dx;
      rect(c, cx, y, dx - 3, 69, first && i === 0 ? peach : begin && i > 0 ? mint : '#e2e1d2', 3);
      mono(c, id, cx + (dx - 3) / 2, y + 35, 41, ink, 'center');
    });
    rect(c, end + 13, y, 656, 69, begin || (first && i === 0) ? peach : '#eee9dc', 3);
    type(c, questions[i], end + 27, y + 34, 35);
    mono(c, r.tail + ' tok', end + 650, y + 35, 32, muted, 'right');
    fade(c, begin, () => {
      if (i > 0)
        line(
          c,
          [
            [end + 5, y - 13],
            [end + 5, y + 84],
          ],
          red,
          7,
        );
    });
  });
  if (begin) bracket(c, x, end - 3, 777, 'R2 and R3 read the saved prefix', green);
  if (begin) bracket(c, end + 14, end + 668, 777, 'Each question needs prefill', red);
  const glide = cue(k, 0, 'Three developers', 0.9);
  fade(c, 1 - first, () =>
    finger(c, mix(x + 81, x + 3.55 * dx, glide), 394 + 2 * 135 * trace, 0.65),
  );
  if (answer)
    foot(
      c,
      'R2 reads 6,000 saved positions, processes 37 new ones, then decodes its answer.',
      green,
    );
  else if (begin) foot(c, 'Fresh prefill begins at the first question token.', red);
  else if (stored)
    foot(
      c,
      'R1 finishes the guide write. Its keys and values can now serve another request.',
      green,
    );
  else if (first) foot(c, 'R1 has a cold start. Its whole guide and question need prefill.', red);
  else foot(c, 'Compare the three inputs. Place your mark where the shared tokens end.');
}

const oldKeys = chain(oldBlocks),
  newKeys = chain(newBlocks);
export function inheritance(c, k) {
  base(c, k, 'Does identical tools text give the same key?', 'CHAINED BLOCK KEYS');
  const changed = cue(k, 1, 'Change the guide version', 0.55);
  const result = cue(k, 2, 'Read the tools keys', 0.5);
  const trace = cue(k, 0, 'Follow the chain', 1.6);
  const xs = [350, 950, 1545],
    a = 400,
    b = 675;
  header(c, 'Stored history', 83, a - 95);
  header(c, 'Incoming history', 83, b - 95);
  for (const [row, y] of [
    [0, a],
    [1, b],
  ]) {
    const revised = row === 1 && changed > 0;
    const blocks = revised ? newBlocks : oldBlocks;
    const keys = revised ? newKeys : oldKeys;
    const labels = ['instructions', blocks[1] === 'guide 1' ? 'guide v1' : 'guide v2', 'tools'];
    line(
      c,
      [
        [166, y + 12],
        [1750, y + 12],
      ],
      row === 0 ? green : muted,
      5,
    );
    xs.forEach((x, i) => {
      const hidden = row === 1 && i === 2 && changed > 0 && result === 0;
      const color = revised && i >= 1 ? red : green;
      sheet(c, x - 199, y - 72, 398, 148, cream);
      rect(c, x - 195, y - 67, 390, 65, revised && i === 1 ? peach : mint, 4);
      type(c, labels[i], x, y - 31, 42, ink, { face: 'Serif', align: 'center' });
      mono(
        c,
        hidden ? 'key pending' : keys[i].slice(0, 10),
        x,
        y + 39,
        36,
        hidden ? muted : color,
        'center',
      );
      if (!hidden) {
        // The bottom edge carries the first 32 bits of this block's digest.
        [...keys[i].slice(0, 8)].forEach((hex, j) => {
          const bits = parseInt(hex, 16);
          for (let bit = 0; bit < 4; bit++)
            if (bits & (8 >> bit)) rect(c, x - 189 + (j * 4 + bit) * 12, y + 65, 8, 14, color, 1);
        });
      }
      if (i < 2) {
        mono(c, '→', x + 301, y + 11, 53, muted, 'center');
      }
    });
  }
  if (trace > 0 && !changed) {
    line(
      c,
      [
        [xs[0], a + 108],
        [mix(xs[0], xs[2], trace), a + 108],
      ],
      green,
      4,
    );
  }
  if (changed > 0) {
    line(
      c,
      [
        [549, a + 46],
        [637, a + 46],
        [684, b - 20],
        [749, b - 20],
      ],
      red,
      5,
    );
    foot(
      c,
      result > 0
        ? 'The unchanged tools now inherit the hash of guide v2.'
        : 'The tool text stayed fixed. Trace its parent before choosing a key.',
      result > 0 ? red : ink,
    );
  } else foot(c, 'Each stamp hashes the parent key and this block’s contents.');
}
const savedValues = columns(storedTokens);
function kv(c, x, y, values, pitch, warm) {
  for (const [i, field] of ['K', 'V'].entries()) {
    const top = y + i * 29;
    for (let col = 0; col < 4; col++) {
      const px = x + col * pitch;
      rect(c, px + 2, top, pitch - 6, 24, warm ? '#e6ad89' : '#9fc4b1', 3);
      values[col][field].forEach((v, j) => {
        const t = clamp(0.5 + v / 6);
        const color = warm ? 'rgba(126,42,27,' + t + ')' : 'rgba(9,78,66,' + t + ')';
        rect(c, px + 7 + (j * (pitch - 15)) / 3, top + 3, (pitch - 19) / 3, 18, color, 2);
      });
    }
  }
}
export function boundaries(c, k) {
  const trie = k.beat.beatIndex === 1 && k.reveal('A compressed token trie', 0.65);
  base(
    c,
    k,
    trie ? 'Where do the token paths diverge?' : 'Which incoming token needs fresh prefill first?',
    trie ? 'COMPRESSED TOKEN TRIE' : 'FOUR TOKENS PER BLOCK',
  );
  if (trie) {
    const common = commonPrefix(storedTokens, blockCase(false).ids);
    const splitX = 1100,
      baseY = 516;
    header(c, 'Shared starting IDs', 97, 348);
    line(
      c,
      [
        [100, baseY],
        [splitX, baseY],
      ],
      green,
      8,
    );
    for (const [j, id] of storedTokens.slice(0, common).entries()) {
      const x = 103 + j * 103;
      rect(c, x, baseY - 46, 91, 92, mint, 8);
      mono(c, id, x + 45, baseY, 49, green, 'center');
    }
    const paths = [storedTokens, blockCase(false).ids];
    paths.forEach((ids, i) => {
      const y = i ? 666 : 369;
      line(
        c,
        [
          [splitX, baseY],
          [1255, y],
          [1735, y],
        ],
        i ? red : green,
        6,
      );
      small(c, i ? 'Incoming tail' : 'Stored tail', 1285, y - 78, i ? red : green);
      ids.slice(common).forEach((v, j) => {
        const x = 1280 + 147 * j;
        rect(c, x, y - 42, 130, 84, i ? peach : mint, 7);
        mono(c, v, x + 65, y, 48, ink, 'center');
      });
    });
    bracket(c, 103, 103 + 8 * 103 + 91, 666, 'Trie shares the first ' + common + ' IDs');
    foot(c, 'The trie can expose position 9. The four-token block cache stopped at 8.');
    return;
  }
  const reveal = cue(k, 1, 'Two complete blocks', 0.9);
  const lift = cue(k, 1, 'Lower the incoming tail', 1.3);
  const edit = cue(k, 2, 'Replace three with twenty', 0.65);
  const fresh = cue(k, 2, 'all twelve inputs', 0.6);
  const fifth = cue(k, 2, 'look at the key and value columns', 0.55);
  const finding = cue(k, 0, 'The first nine match', 1.2);
  const state = blockCase(edit > 0),
    start = 265,
    pitch = 126;
  const labels = ['Stored IDs', 'New IDs'];
  if (edit) small(c, 'Previous run · 8 reused and 4 fresh', 1805, 270, muted, 'right');
  for (const [row, ids] of [storedTokens, state.ids].entries()) {
    const baseY = row ? 526 : 314;
    small(c, labels[row], 88, baseY + 41);
    for (let g = 0; g < 3; g++) {
      const x = start + g * (pitch * 4 + 18);
      const drop = row ? (edit > 0 ? 36 : 66 * lift * Number(g === 2)) : 0;
      const y = baseY + drop;
      const resolved = row === 1 && (edit > 0 || reveal > 0);
      const warm = resolved && g * 4 < state.reused;
      const color = resolved ? (warm ? mint : peach) : '#e4e2d4';
      sheet(c, x, y, pitch * 4 - 4, 87, row === 0 ? mint : color);
      for (let j = 0; j < 4; j++) {
        const index = g * 4 + j;
        if (j)
          line(
            c,
            [
              [x + j * pitch, y + 9],
              [x + j * pitch, y + 77],
            ],
            '#afb7a8',
            2,
          );
        const focused = (index === 8 && lift > 0 && edit === 0) || (index === 2 && edit > 0);
        if (focused) rect(c, x + j * pitch + 17, y + 8, pitch - 36, 71, row === 0 ? green : red, 8);
        mono(c, ids[index], x + (j + 0.5) * pitch - 2, y + 44, 53, focused ? cream : ink, 'center');
      }
      if (!row || (resolved && !warm)) {
        const data = (row ? state.values : savedValues).slice(g * 4, g * 4 + 4);
        kv(c, x, y + 94, data, pitch, Boolean(row));
        if (g === 0 || (row && g === 2 && edit === 0)) {
          small(c, 'K', x - 11, y + 104, row ? red : green, 'right');
          small(c, 'V', x - 11, y + 134, row ? red : green, 'right');
        }
        if (g === 1 && fifth) {
          line(
            c,
            [
              [x + 2, y + 93],
              [x + pitch - 4, y + 93],
              [x + pitch - 4, y + 148],
              [x + 2, y + 148],
              [x + 2, y + 93],
            ],
            row ? red : green,
            4,
          );
        }
      } else if (warm) {
        const px = x + pitch * 2;
        line(
          c,
          [
            [px, y - 5],
            [px, 463],
          ],
          green,
          3,
        );
        line(
          c,
          [
            [px - 9, 475],
            [px, 463],
            [px + 9, 475],
          ],
          green,
          3,
        );
        small(c, 'Read stored K and V', px, y + 123, green, 'center');
      }
    }
  }
  if (!reveal && finding > 0) {
    line(
      c,
      [
        [start, 628],
        [start + (9 * pitch + 36) * finding, 628],
      ],
      muted,
      4,
    );
  }
  if (!edit && reveal > 0) {
    bracket(c, start, start + 8 * pitch + 14, 770, state.reused + ' reused', green);
    bracket(c, start + 8 * pitch + 36, start + 12 * pitch + 32, 770, state.fresh + ' fresh', red);
  } else if (edit > 0) {
    bracket(
      c,
      start,
      start + 12 * pitch + 32,
      756,
      '0 reusable blocks · ' + state.fresh + ' fresh positions',
      red,
    );
  }
  if (edit > 0)
    foot(
      c,
      fifth
        ? 'Under ID 5, the first key component changes from ' +
            savedValues[4].K[0].toFixed(3) +
            ' to ' +
            state.values[4].K[0].toFixed(3) +
            '.'
        : fresh
          ? 'IDs 5, 6, 7, 8 still match in isolation. Their preceding history changed.'
          : 'Only the first ' + state.exact + ' IDs match after the edit.',
      red,
    );
  else if (reveal > 0)
    foot(
      c,
      'Token ' + state.ids[state.reused] + ' matches, but its block also contains 13, 14 and 15.',
      red,
    );
  else foot(c, 'Count complete matching blocks from the left.');
}

export function layout(c, k) {
  const zero = cue(k, 1, 'Zero sections match', 0.4);
  const move = cue(k, 1, 'Move the identifier', 1.45);
  const inspect = cue(k, 2, 'Look inside the guide', 0.75);
  base(c, k, inspect ? 'Where do the two guide texts differ?' : 'How many starting sections match?', 'SERIALIZED INPUT');
  const carriage = cue(k, 2, 'different line endings', 0.6);
  if (inspect > 0) {
    header(c, 'Guide excerpts at the model boundary', 112, 302);
    const values = ['steps: test\\nlint', 'steps: test\\r\\nlint'];
    values.forEach((value, i) => {
      const y = 396 + i * 165;
      small(c, 'R' + (i + 1), 114, y + 49);
      sheet(c, 248, y, 1410, 105);
      const before = 'steps: test';
      mono(c, before, 300, y + 51, 56);
      const pos = 300 + c.measureText(before).width;
      const rest = value.slice(before.length);
      if (i === 1 && carriage) rect(c, pos - 1, y + 13, 68, 76, peach, 5);
      mono(c, rest, pos, y + 51, 56, i && carriage ? red : ink);
    });
    foot(
      c,
      'Compare the serialized text and its token IDs. The template alone cannot show this edit.',
    );
    return;
  }
  const unit = 365,
    x0 = 267,
    orderNames = ['ID', ...sections];
  const xAt = (i) => (i === 0 ? mix(x0, x0 + unit * 3, move) : x0 + unit * (i - move));
  for (let row = 0; row < 2; row++) {
    const y = 350 + row * 215;
    small(c, 'R' + (row + 1), 108, y + 43);
    orderNames.forEach((name, i) => {
      const x = xAt(i),
        lift = i === 0 ? -85 * Math.sin(Math.PI * move) : 0;
      sheet(c, x, y + lift, unit - 25, 91, i === 0 ? peach : mint);
      type(
        c,
        i ? name : 'ID ' + (row === 0 ? 'A' : 'B'),
        x + (unit - 25) / 2,
        y + lift + 42,
        43,
        ink,
        { face: 'Serif', align: 'center' },
      );
    });
  }
  if (move === 1) {
    const a = [...sections, 'A'],
      b = [...sections, 'B'];
    bracket(c, x0, x0 + unit * 3 - 25, 738, commonPrefix(a, b) + ' shared starting sections');
  }
  foot(
    c,
    move === 1
      ? 'The ID changes after the tools. Both guides now have the same history.'
      : move > 0
        ? 'Keep the roles fixed as each ID moves behind the shared sections.'
        : zero > 0
          ? 'The first named section differs. Zero complete sections match.'
          : 'Read both requests from the first section.',
    move === 1 ? green : ink,
  );
}
