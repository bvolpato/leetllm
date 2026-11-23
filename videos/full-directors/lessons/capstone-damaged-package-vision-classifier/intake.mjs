import { C, cameraPrint, exposure } from './studio.mjs';
import {
  rows,
  row,
  route,
  traces,
  label,
  fixed,
  atLimit,
  checkedRoute,
  visionStencil,
} from './records.mjs';

function inspection(s) {
  const open = s.cue(1, 'dark carton', 0.9);
  const lit = s.cue(1, 'the mailer', 0.9);
  const first = route('R-406-a'),
    second = route('R-404-a');
  const selected = s.cue(3, 'Inspect the mailer');
  s.title('Returns intake', 'One inspection slot');
  if (s.cue(1, 'Both clear'))
    s.text('Damage cutoff ' + fixed(first.damage_threshold), 1210, 145, 36, C.muted, 'Mono', 630);
  [
    [first, 'dark', 80, open],
    [second, 'mailer', 1000, lit],
  ].forEach(([r, kind, x, t], i) => {
    const photoY = 244 + 32 * (1 - t);
    cameraPrint(s, x, photoY, 836, 418, kind, null, { mark: i === 1 && !!selected });
    s.text(r.photo_id, x, photoY - 22, 34, C.muted, 'Mono');
    if (t)
      s.text('Damage  ' + fixed(r.damage_probability), x + 425, photoY - 22, 35, C.ink, 'Mono');
    if (s.b >= 2) {
      s.gauge(x, 750, 455, r.brightness, 0.2, 'Brightness', 'Minimum 0.20');
      if ((i === 1 && selected) || (i === 0 && s.cue(3, 'ask for a retake'))) {
        s.band(x + 488, 796, 348, label[r.action], i ? C.sea : C.red);
      }
    }
  });
}

function authority(s) {
  if (s.b === 1) {
    s.title('Review policy', 'Who handles the photo? Who decides the return?');
    cameraPrint(s, 80, 263, 625, 313, 'dark', 'R-406-a');
    s.note(80, 701, 'Recipient', 'Uploader');
    s.text('Retake in better light', 80, 852, 37, C.red);
    if (s.cue(1, 'Normal and priority')) {
      cameraPrint(s, 761, 263, 625, 313, 'mailer', 'R-404-a');
      s.note(761, 701, 'Recipient', 'Specialist');
      s.text('Inspect the parcel', 761, 852, 37, C.sea);
    }
    if (s.cue(1, 'separate order policy')) {
      s.box(1442, 255, 398, 495, C.sky);
      s.text('Order policy', 1474, 346, 56, C.blue, 'Serif');
      s.line(1474, 382, 1808, 382, C.blue, 4);
      s.text('Refund', 1474, 472, 48, C.ink);
      s.text('Replacement', 1474, 567, 48, C.ink);
      s.text('Restocking', 1474, 662, 48, C.ink);
    }
  } else if (s.b === 2) {
    s.title('Supplied records', 'What can these cases establish?');
    for (const [id, x, turn, cue] of [
      ['R-401-a', 90, 0, 'point nine one'],
      ['R-401-b', 610, 0.035, 'point eight eight'],
    ]) {
      cameraPrint(s, x, 300, 470, 235, 'crushed', id, { turn });
      if (s.cue(2, cue)) {
        const score = fixed(row(id).output.damage_probability);
        s.text('Damage score ' + score, x, 668, 51, C.ink, 'Sans', 470);
      }
    }
    s.note(1180, 325, 'Training group', '1 damaged case', C.ink, 625);
    if (s.cue(2, 'validation set'))
      s.band(90, 760, 1560, 'Validation has zero usable damaged cases', C.red);
  } else {
    s.title('Permitted photographs', 'What can leave the review room?');
    cameraPrint(s, 88, 286, 955, 478, 'mailer', 'Portfolio copy');
    if (s.cue(3, 'remove personal')) s.box(666, 417, 215, 150, C.night);
    s.note(1135, 330, 'Photo access', 'Permission + scope', C.sea, 690);
    if (s.cue(3, 'model card')) {
      s.table(
        1135,
        555,
        [660],
        ['Model card'],
        [['Evaluated uses'], ['Thresholds'], ['Errors by case group']],
        { step: 88 },
      );
    }
  }
}

function guide(s) {
  s.title('Annotation guide', 'Visible external damage');
  exposure(s, 80, 230, 900, 630, 'mailer', {
    crop: [12, 19, 169, 118],
    mark: Boolean(s.cue(1, 'torn seam')),
  });
  if (s.b === 1) {
    s.note(1060, 287, 'Folded seam', 'Split visible');
    s.note(1060, 494, 'Inside the parcel', 'Contents hidden', C.muted);
    if (s.cue(1, 'uncertain judgments'))
      s.text('Unusable view → damage unknown', 1060, 790, 40, C.red, 'Sans', 770);
  } else {
    s.table(
      1050,
      310,
      [350, 460],
      ['Evidence', 'Review action'],
      [
        ['Poor view', 'Retake'],
        ['Accepted / low', 'Normal'],
        ['Accepted / high', 'Priority'],
      ],
      { step: 117, size: 36 },
    );
    if (s.cue(2, 'disagreement'))
      s.note(1050, 780, 'Ambiguous seam', 'Record disagreement', C.red, 780);
  }
}

function siblings(s) {
  s.title('Physical case R-401', 'Two views share one parcel');
  const gather = s.cue(2, 'Group alternate views', 1.25);
  const x = 1045 - 530 * gather;
  s.box(76, 275, 830, 540, C.mint);
  s.box(1008, 275, 832, 540, C.sky);
  s.text('TRAIN', 105, 330, 31, C.sea, 'Mono');
  s.text('EVALUATION', 1040, 330, 31, C.blue, 'Mono');
  cameraPrint(s, 118, 418, 365, 183, 'crushed', 'R-401-a');
  cameraPrint(s, x, 418, 365, 183, 'crushed', 'R-401-b', { turn: 0.045 });
  if (gather === 1) s.text('1 physical group', 123, 748, 46, C.sea, 'Serif');
  if (s.b === 1 && s.cue(1, 'Splitting the photographs'))
    s.text('The same crease appears on both sides.', 85, 927, 44, C.red);
  if (s.cue(2, 'Exact file hashes'))
    s.text('Different file hashes can belong to one physical case.', 85, 927, 41, C.muted);
}

function manifest(s) {
  if (s.b <= 3) {
    s.title('Capture manifest', 'Count uploads, then count parcels');
    const grouped = s.cue(2, 'Training has two photos');
    const col = 510;
    ['train', 'validation', 'test'].forEach((split, i) => {
      const list = rows.filter((r) => r.photo.split === split),
        ids = [...new Set(list.map((r) => r.photo.case_id))];
      const x = 95 + i * 600;
      s.text(split.toUpperCase(), x, 267, 33, C.sea, 'Mono');
      ids.forEach((id, j) => {
        const photos = list.filter((r) => r.photo.case_id === id);
        const y = 310 + j * 77;
        s.box(x, y, col, 63, C.white, grouped ? C.sea : C.line, 2);
        s.text(id, x + 14, y + 45, 34, C.ink, 'Mono');
        s.text(
          photos.map((r) => r.photo.photo_id.slice(-1)).join('   +   '),
          x + 275,
          y + 45,
          34,
          C.blue,
          'Mono',
        );
      });
      if (grouped)
        s.text(
          list.length + ' photos / ' + ids.length + ' ' + (ids.length === 1 ? 'case' : 'cases'),
          x,
          866,
          38,
          C.ink,
          'Serif',
        );
    });
    if (s.b === 3)
      s.text(
        'Per upload     URI · byte hash · capture day · source · packaging · reviewer · guideline',
        95,
        960,
        32,
        C.muted,
        'Mono',
        1740,
      );
  } else {
    const decided = s.cue(5, 'Quarantine both views');
    s.title('New physical case', 'Can either view enter historical training?');
    const x = (d) => 200 + (d - 7) * 200;
    s.line(x(7), 555, x(15), 555, C.muted, 7);
    s.line(x(10), 295, x(10), 728, C.red, 5);
    s.text('Day 10 cutoff', x(10) - 135, 275, 38, C.red);
    [
      [8, 'View A'],
      [13, 'View B'],
      [14, 'Label ready'],
    ].forEach(([d, name], i) => {
      s.dot(x(d), 555, 17, i === 2 ? C.red : C.sea);
      s.text(name, x(d) - 75, i === 1 ? 675 : 485, 36, C.ink);
      s.text('Day ' + d, x(d) - 58, 610, 29, C.muted, 'Mono');
    });
    if (decided) {
      s.band(180, 788, 835, 'Quarantine both views');
      s.band(1060, 788, 650, 'Label unavailable on day 10', C.red);
    }
  }
}

function channels(s) {
  s.title(
    'Input contract',
    s.b === 3 ? 'Which channel reaches the router?' : 'Validate the record before routing',
  );
  if (s.b === 3) {
    [
      ['Capture record', 'R-406-a', 'Router'],
      ['Model output', '0.94 / 0.12 light', 'Router'],
      ['Human label', 'Unusable', 'Offline evaluation'],
    ].forEach(([name, val, dest], i) => {
      const y = 330 + i * 193;
      const col = i === 2 ? C.red : C.sea;
      s.text(name, 90, y, 39, C.muted);
      s.text(val, 490, y, 47, C.ink, 'Mono');
      s.line(1000, y - 15, 1260, y - 15, col, 6);
      s.path(
        [
          [1260, y - 29],
          [1282, y - 15],
          [1260, y - 1],
        ],
        col,
      );
      s.text(dest, 1320, y, 43, col, 'Serif');
    });
  } else if (s.b === 1) {
    s.table(
      95,
      293,
      [445, 500, 780],
      ['Field', 'Valid example', 'Contract'],
      [
        ['Case ID', 'R-404', 'Nonblank, trimmed string'],
        ['Capture day', '5', 'Positive integer'],
        ['Damage if usable', 'true / false', 'Observed Boolean label'],
        ['Damage if unusable', 'unknown', 'Preserve missing label'],
      ],
      { step: 127, size: 40 },
    );
  } else {
    s.table(
      95,
      297,
      [550, 470, 740],
      ['Output', 'Example', 'Validation'],
      [
        ['Damage score', '0.94', 'Accept finite value in [0, 1]'],
        ['Damage score', 'True', 'Reject Boolean'],
        ['Blur score', '∞', 'Reject nonfinite value'],
        ['Parcel visible', 'true', 'Accept Boolean'],
      ],
      { step: 124, size: 39, colors: [C.ink, C.red, C.red, C.ink] },
    );
  }
}

export function reading(s) {
  const t = s.cue(2, 'reported brightness', 1.2);
  return 0.12 + (0.3 - 0.12) * t;
}
function quality(s) {
  const empty = s.b === 4;
  const br = empty ? 0.74 : reading(s);
  const tr = route(empty ? 'R-409-a' : 'R-406-a', { brightness: br });
  s.title(
    'Capture quality',
    empty ? 'Is there a parcel to inspect?' : 'Change the reading. Keep the pixels.',
  );
  cameraPrint(s, 84, 277, 1030, 515, empty ? 'empty' : 'dark', tr.photo_id);
  s.gauge(1210, 274, 550, br, 0.2, 'Reported brightness', 'Minimum 0.20');
  s.text('Damage   ' + fixed(tr.damage_probability), 1210, 567, 42, C.ink, 'Mono');
  s.text('Visible   ' + (tr.box_visible ? 'yes' : 'no'), 1210, 638, 40, C.ink, 'Mono');
  if (
    s.b !== 2 &&
    (s.b !== 4 || s.cue(4, 'uploader needs')) &&
    (s.b !== 1 || s.cue(1, 'router requests'))
  )
    s.band(1210, 713, 548, label[tr.action], empty || s.b === 1 ? C.red : C.sea);
  if (!empty && s.cue(1, 'human also marked'))
    s.text('Human review     Unusable image', 85, 942, 39, C.red);
}

function stencil(s, reduced) {
  const scale = reduced && s.cue(1, 'Halve every intensity') ? 0.5 : 1;
  const v = visionStencil(scale);
  const second = !reduced && s.cue(3, 'step across');
  const sweep = reduced ? 0 : s.cue(4, 'Repeat that operation', 2.4);
  const full = reduced ? !!s.cue(1, 'signed responses') : sweep === 1;
  const visited = sweep > 0 ? 2 + Math.floor(sweep * 7) : 0;
  const x = 97,
    y = 276,
    d = 106;
  s.title(
    'Parcel edge · signed Laplacian',
    reduced ? 'What changes when contrast is halved?' : 'Slide the cross across a sharp edge',
  );
  v.pixels.forEach((line, j) =>
    line.forEach((px, i) => {
      const bright = px === 1 ? '#fffbea' : px === 0.5 ? '#9ea59d' : '#233539';
      s.box(x + i * d, y + j * d, d - 2, d - 2, bright, C.line, 1);
      s.text(String(px), x + i * d + 25, y + j * d + 67, 39, px === 0 ? C.white : C.ink, 'Mono');
    }),
  );
  if (!reduced && !full) {
    const ix = visited ? 1 + (visited % 3) : second ? 2 : 1;
    const iy = visited ? 1 + Math.floor(visited / 3) : 1;
    for (const [cx, cy] of [
      [ix, iy - 1],
      [ix - 1, iy],
      [ix, iy],
      [ix + 1, iy],
      [ix, iy + 1],
    ])
      s.box(x + cx * d + 3, y + cy * d + 3, d - 7, d - 7, null, C.gold, 8);
    s.text('Neighbor sum − 4 × center', 87, 906, 36, C.ink, 'Mono');
  }
  s.text('Signed responses', 804, 285, 46, C.ink, 'Serif');
  const count = full
    ? 9
    : visited
      ? visited
      : second && s.cue(3, 'Three minus four')
        ? 2
        : s.cue(3, 'first response is plus one')
          ? 1
          : 0;
  v.responses.forEach((a, i) => {
    const xx = 818 + (i % 3) * 116,
      yy = 344 + Math.floor(i / 3) * 116;
    s.box(xx, yy, 106, 106, i < count ? C.mint : C.white, C.line, 2);
    if (i < count)
      s.text(
        a === 0 ? '0' : (a > 0 ? '+' : '−') + Math.abs(a),
        xx + 13,
        yy + 66,
        39,
        C.ink,
        'Mono',
        80,
      );
  });
  if (full && (reduced ? s.b >= 2 : s.cue(4, 'average to zero')))
    s.note(1330, 334, 'Mean', '0', C.ink, 420);
  if (reduced ? s.cue(2, 'one sixth') : s.cue(5, 'two thirds')) {
    s.note(1330, 555, 'Population variance', reduced ? '1.5 / 9 = 1/6' : '6 / 9 = 2/3', C.sea, 490);
    s.text(reduced ? '6 squares of 0.25' : '6 squares of 1', 1315, 708, 33, C.muted);
    if (reduced && s.b === 2)
      s.text('Same region and border    Var(cL) = c² Var(L)', 89, 924, 39, C.ink, 'Mono');
    if (reduced && s.b === 3)
      s.text(
        'Larger router scores mean more blur.     Maximum 0.45 on the supplied scale.',
        89,
        924,
        35,
        C.red,
        'Sans',
        1740,
      );
  } else if (!full) {
    const idx = visited ? visited : second ? 1 : 0;
    const center = v.pixels[1 + Math.floor(idx / 3)][1 + (idx % 3)];
    const sum = v.responses[idx] + 4 * center;
    s.text(sum + ' − 4 × ' + center, 1280, 516, 47, C.sea, 'Mono');
  }
}

function detail(s) {
  s.title(
    'Camera measurements',
    s.b < 3 ? 'Measure exposure inside the parcel' : 'Can a four-pixel tear survive resizing?',
  );
  if (s.b < 3) {
    cameraPrint(s, 84, 282, 870, 435, 'dark', 'Dark parcel · example pixel region');
    s.path(
      [
        [610, 498],
        [698, 504],
        [698, 560],
        [609, 552],
      ],
      '#fff6d9',
    );
    for (let i = 0; i < 14; i++)
      s.line(618 + i * 5, 509 + i * 0.35, 618 + i * 5, 539 + i * 0.35, C.ink, 2);
    s.box(307, 465, 109, 85, null, C.gold, 5);
    const pixels = [0, 0, 0, 1, 1, 0, 0, 1, 1, 2, 0, 1, 2, 2, 3, 0, 0, 0, 1, 4];
    const tones = ['#19262a', '#4d5a5b', '#818b89', '#b9bcb2', '#fff8e6'];
    const counts = tones.map((_, i) => pixels.filter((v) => i === v).length);
    pixels.forEach((v, i) =>
      s.box(311 + (i % 5) * 20, 469 + Math.floor(i / 5) * 19, 20, 19, tones[v]),
    );
    if (s.cue(1, 'Enlarge twenty')) {
      s.line(415, 465, 612, 325, C.gold, 3);
      pixels.forEach((v, i) =>
        s.box(613 + (i % 5) * 59, 325 + Math.floor(i / 5) * 59, 58, 58, tones[v]),
      );
      s.box(612, 324, 296, 237, null, C.gold, 4);
    }
    s.text('Example region · 20 samples', 1060, 280, 38, C.muted);
    counts.forEach((v, i) => {
      const x = 1080 + i * 142;
      s.box(x, 677 - v * 30, 95, v * 30, i === 0 ? C.red : C.sea);
      s.text(v, x + 24, 659 - v * 30, 36, C.ink, 'Mono');
      s.text(['0', '¼', '½', '¾', '1'][i], x + 19, 733, 38, C.muted, 'Mono');
    });
    s.text('Normalized pixel intensity', 1070, 806, 38, C.ink);
    if (s.cue(1, 'Ten of twenty'))
      s.text('Clipped   (9 + 1) / 20 = 50%', 88, 888, 39, C.ink, 'Mono');
    if (s.b === 2) s.text('Lux requires a calibrated sensor.', 1050, 924, 40, C.red);
  } else {
    const ratio = 224 / 1024;
    s.text('Input width  1024 px', 95, 285, 40, C.muted, 'Mono');
    s.text('Output width  224 px', 1145, 285, 40, C.muted, 'Mono');
    const drawStrip = (xx, yy, width) => {
      const h = width / 2;
      s.box(xx, yy, width, h, '#cda579');
      s.line(xx, yy + h * 0.32, xx + width, yy + h * 0.26, '#a77f56', width / 1024);
      s.path(
        [
          [xx + width * 0.22, yy + h * 0.3],
          [xx + width * 0.27, yy + h * 0.39],
          [xx + width * 0.3, yy + h * 0.37],
          [xx + width * 0.35, yy + h * 0.47],
        ],
        null,
        '#664333',
        (width * 4) / 1024,
      );
    };
    drawStrip(95, 340, 920);
    drawStrip(1145, 440, 920 * ratio);
    s.line(1030, 570, 1120, 570, C.muted, 5);
    s.text('4 px across the defect', 95, 892, 41, C.ink);
    if (s.cue(3, 'point eight seven five'))
      s.text('4 × 224 / 1024 = ' + 4 * ratio + ' px', 1115, 694, 40, C.sea, 'Mono', 715);
    if (s.b === 4)
      s.text('Compare crops on labeled small defects.', 1115, 833, 36, C.ink, 'Sans', 710);
  }
}

function gates(s) {
  s.title(
    'Ordered router',
    s.b === 5 ? 'Seven test uploads' : 'Can this record enter priority review?',
  );
  if (s.b === 5) {
    const actions = ['priority_damage_review', 'normal_review', 'request_new_photo'];
    actions.forEach((action, i) => {
      const x = 92 + i * 598;
      const list = traces.filter((t) => t.action === action);
      s.note(x, 292, label[action], String(list.length) + ' photos', C.ink, 565);
      list.forEach((t, j) => {
        s.box(x, 451 + j * 93, 478, 76, C.white, C.line);
        s.text(t.photo_id, x + 26, 504 + j * 93, 39, C.ink, 'Mono');
      });
    });
    return;
  }
  const invalid = !!s.cue(3, 'Boolean value True');
  const out = { ...atLimit, damage_probability: invalid ? true : 0.7 };
  const result = checkedRoute(out);
  s.table(
    93,
    320,
    [360, 310, 480],
    ['Input', 'Value', 'Rule'],
    [
      ['Visible', 'true', 'Must be true'],
      ['Brightness', '0.20', '≥ 0.20'],
      ['Blur', '0.45', '≤ 0.45'],
      [
        'Damage',
        invalid ? 'True' : fixed(out.damage_probability),
        'Numeric · test score ≥ ' + fixed(atLimit.damage_probability),
      ],
    ],
    { step: 116, colors: [C.ink, C.ink, C.ink, invalid && s.b >= 4 ? C.red : C.ink] },
  );
  s.note(1280, 325, 'First checkpoint', 'Validate types', C.ink, 555);
  const verdict = invalid
    ? s.cue(4, 'Input validation rejects')
    : s.cue(2, 'Damage at the threshold');
  if (verdict) {
    s.band(1258, 558, 567, result, invalid ? C.red : C.sea);
    s.text(invalid ? 'No route recorded' : 'All quality gates passed', 1260, 718, 35, C.muted);
  }
}
export const intake = [
  inspection,
  authority,
  guide,
  siblings,
  manifest,
  channels,
  quality,
  (s) => stencil(s, false),
  (s) => stencil(s, true),
  detail,
  gates,
];
