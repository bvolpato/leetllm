import {
  label,
  mid,
  num,
  title,
  rect,
  oval,
  polygon,
  line,
  sheet,
  rows,
  ground,
  cue,
  beat,
  signed,
  ease,
  ink,
  mute,
  teal,
  rust,
  plum,
  paper,
  gray,
  ruler,
  arrow,
} from './drawing.mjs';
import {
  bytes,
  hash,
  RS_ARTIFACT_HASHES,
  talk,
  ledger,
  negative,
  result,
  reportedInterval,
  controlStep,
} from './study.mjs';

const exporterCommand = 'uv run run_study.py';
const illustrationsPrompt = 'illustrations/  $ ' + exporterCommand;

function folio(c, x, y, w, h, name) {
  sheet(c, x, y, w, h);
  polygon(
    c,
    [
      [x + w - 60, y],
      [x + w, y + 60],
      [x + w - 60, y + 60],
    ],
    '#d9d2bc',
  );
  label(c, name, x + 37, y + 76, 54, ink, 'Serif', 500, 'left', w - 90);
  line(c, x + 37, y + 134, x + w - 37, y + 134, gray, 2);
}
export function provenance(c, k) {
  ground(c, 'desk');
  const ext = beat(k) > 0;
  title(c, ext ? 'An outside dataset needs an origin' : 'Rebuild a generated dataset');
  folio(c, 125, 249, 905, 605, ext ? 'Input record' : 'Generator record');
  rows(
    c,
    171,
    464,
    808,
    ext
      ? [
          ['Origin', 'dataset URL, version, license'],
          ['Retrieval', 'date + original file checksum'],
          ['Processing', 'command and filter arguments'],
          ['Exclusions', 'record the IDs removed'],
        ]
      : [
          ['Generator', 'reward_shaping_study.py'],
          ['Worked seeds', '0 … 23'],
          ['Transition', '7 states · slip below 0.15'],
          ['Rollout', '12 moves per trip'],
        ],
    ext ? 3 : 2,
    93,
  );
  arrow(c, 1047, 584, 1216, 584, teal, 6);
  label(c, ext ? 'Exclusion log' : 'Retained table', 1251, 425, 57, ink, 'Serif');
  if (ext) {
    label(c, 'Source row', 1251, 535, 38, mute);
    num(c, 'row 108', 1251, 603, 44);
    arrow(c, 1283, 652, 1283, 710, teal, 4);
    label(c, 'Excluded by a filter', 1251, 775, 36, rust);
    label(c, 'Keep row ID and reason.', 1250, 861, 36, teal);
  } else {
    ['seed', 'sparse', 'shaped'].forEach((v, i) => label(c, v, 1254 + 170 * i, 548, 32, mute));
    for (let i = 0; i < 3; i++) {
      const r = ledger[i];
      [r.seed, r.sparse + '/30', r.shaped + '/30'].forEach((v, j) =>
        num(c, v, 1256 + 170 * j, 629 + 63 * i, 32),
      );
    }
    label(c, 'primary_seed_rows.csv', 1250, 859, 32, teal);
    if (cue(k, 0, 'command on screen')) {
      label(c, 'Separate checkout', 147, 949, 40, teal);
      num(c, illustrationsPrompt, 555, 949, 39);
    }
  }
}
export function manifest(c, k) {
  ground(c, 'desk');
  const b = beat(k);
  title(c, 'Which bytes did the study run?');
  folio(c, 122, 241, 1677, 655, 'Artifact manifest');
  const sets = [
    [
      ['Tracked commit', 'version of the tracked tree'],
      ['Executed code fence', RS_ARTIFACT_HASHES.code.slice(0, 24) + '…'],
      ['Compare with', 'separately retained source bytes'],
      ['Dirty or untracked files', 'capture actual working tree'],
    ],
    [
      ['Python', '3.12.8'],
      ['NumPy', '2.2.6'],
      ['Operating system', 'Linux   /   x86_64'],
      ['Also retain', 'lock, build, generator and call sequence'],
    ],
    [
      ['Seed table', RS_ARTIFACT_HASHES.rows.slice(0, 24) + '…'],
      ['Result JSON', RS_ARTIFACT_HASHES.result.slice(0, 24) + '…'],
      ['Configuration', 'retain bytes and plan history'],
      ['Producer identity', 'unsigned · needs separate evidence'],
    ],
  ];
  rows(c, 184, 456, 1538, sets[b], b === 0 ? 1 : b === 1 ? 2 : 3, 111);
}
export function digests(c, k) {
  ground(c, 'desk');
  const b = beat(k);
  const numeric = !b && cue(k, 0, 'With a tolerance');
  title(
    c,
    b
      ? 'A self-reported checksum'
      : numeric
        ? 'Compare the named numerical field'
        : 'Same values, different bytes',
  );
  if (b) {
    const f = '{"success": 1.0}',
      sha = hash(f).slice(0, 18);
    folio(c, 135, 306, 750, 485, 'Invented output');
    num(c, f, 186, 584, 49);
    arrow(c, 907, 559, 1029, 559, teal, 6);
    folio(c, 1055, 306, 725, 485, 'Its own manifest');
    num(c, sha + '…', 1105, 582, 40);
    label(c, 'The bytes agree. Who ran this experiment?', 158, 904, 48, rust, 'Serif');
    return;
  }
  const payload = numeric
    ? [bytes[0], JSON.stringify({ seed: 0, success: 0.500009 }, null, 2)]
    : bytes;
  for (const [i, content] of payload.entries()) {
    const x = 126 + i * 846;
    folio(
      c,
      x,
      282,
      801,
      505,
      numeric
        ? i
          ? 'Separate rerun'
          : 'Retained reference'
        : i
          ? 'Indented JSON'
          : 'Compact JSON',
    );
    content.split('\n').forEach((s, j) => num(c, s, x + 44, 487 + j * 46, 38));
    num(c, 'SHA-256   ' + hash(content).slice(0, 13) + '…', x + 43, 737, 31, mute);
  }
  if (numeric) num(c, 'Rerun field error   0.000009 ≤ 0.000010', 132, 904, 47, teal);
}
export function exporter(c, k) {
  ground(c, 'desk');
  const b = beat(k);
  title(
    c,
    [
      'From the experiment to the figure',
      'Keep the reference before rerunning',
      'What completes the research package?',
    ][b],
  );
  if (!b) {
    folio(c, 111, 283, 625, 533, 'One named code fence');
    num(c, 'reward_shaping_study.py', 153, 476, 35);
    label(c, 'run_study.py', 153, 582, 44, teal);
    label(c, 'extracts and executes it', 154, 662, 36, mute);
    if (cue(k, 0, 'executes it')) arrow(c, 752, 550, 873, 550, teal, 6);
    const outputNames = ['primary_seed_rows.csv', 'study_results.json', 'artifact_manifest.json'];
    if (cue(k, 0, 'writes the seed CSV'))
      outputNames.forEach((v, i) => {
        const y = 339 + i * 179;
        rect(c, 898, y, 554, 120, i === 1 ? '#d7e6d6' : paper, gray);
        num(c, v, 924, y + 60, 35);
      });
    if (cue(k, 0, 'The figure reads')) {
      arrow(c, 1460, 577, 1545, 577, teal, 5);
      const y = 594;
      line(c, 1562, y, 1792, y, ink, 3);
      ledger.forEach((r, j) =>
        rect(
          c,
          1564 + j * 9.3,
          Math.min(y, y - r.gain * 4),
          6,
          Math.abs(r.gain * 4),
          r.gain < 0 ? rust : teal,
        ),
      );
      mid(c, 'Figure', 1672, 737, 39);
    }
    return;
  }
  if (b === 1) {
    const wrote = cue(k, 1, 'It writes the CSV');
    for (let i = 0; i < 2; i++) {
      const x = 137 + i * 834;
      folio(c, x, 304, 775, 456, i ? 'Separate checkout' : 'Retained reference');
      if (i) num(c, illustrationsPrompt, x + 39, 511, 31, teal);
      else label(c, 'Read-only original', x + 39, 511, 43, plum);
      if (i && wrote) rect(c, x + 26, 574, 723, 80, '#d7e6d6');
      num(c, 'illustrations/primary_seed_rows.csv', x + 39, 614, 33);
      if (i && wrote) label(c, 'Written by this run', x + 39, 702, 36, teal);
    }
    if (cue(k, 1, 'Compare those files')) {
      mid(c, 'Compare the two outputs under the declared rule.', 960, 891, 45);
    } else if (cue(k, 1, 'Which table') && !wrote) {
      mid(c, 'Which table will this command write?', 960, 891, 45);
    }
    return;
  }
  folio(c, 134, 245, 1654, 656, 'Research release');
  rows(
    c,
    190,
    459,
    1534,
    [
      ['Rebuild', 'clean command and dependency lock'],
      ['Study history', 'frozen plan and amendments'],
      ['Diagnosis', 'transition traces and deviations'],
      ['Reuse', 'license, CITATION.cff and archived release DOI'],
    ],
    3,
    106,
  );
}
export function failed(c, k) {
  ground(c, 'plot');
  const b = beat(k);
  if (!b) {
    title(c, 'Two failures you can repair');
    sheet(c, 133, 280, 1646, 566);
    const m = controlStep(true, true);
    rows(
      c,
      189,
      390,
      1521,
      [
        ['Zero Φ    /    sparse Q(1, ·)', m.sparse.map((v) => v.toFixed(3)).join('     ')],
        ['Faulty candidate', m.zero.map((v) => v.toFixed(3)).join('     ')],
        ['First mismatch', 'right action credited to left'],
        ['Clean clone stops', 'restore dependency and retain failure log'],
      ],
      cue(k, 0, 'missing dependency') ? 3 : 2,
      124,
    );
    return;
  }
  if (b <= 2) {
    title(c, 'A valid run can miss its target');
    const low = cue(k, 1, 'mean falls'),
      fin = cue(k, 1, 'final interval leaves');
    label(c, fin ? 'Final difference' : 'Early difference', 132, 328, 58, ink, 'Serif');
    ruler(
      c,
      fin
        ? {
            y: 557,
            min: -4,
            max: 4,
            ticks: [-4, -2, 0, 2, 4],
            band: [-2, 2],
            low: -3,
            mean: 0.5,
            high: 1.5,
          }
        : {
            y: 557,
            min: -5,
            max: 25,
            ticks: [-5, 0, 5, 10, 15, 20, 25],
            guide: 10,
            low: low ? 2 : -1,
            high: low ? 16 : 23,
            mean: low ? 9 : 12,
          },
    );
    label(
      c,
      fin
        ? 'Lower limit outside the band'
        : low
          ? 'Mean below ten points'
          : 'Interval crosses zero',
      148,
      836,
      48,
      rust,
    );
    return;
  }
  title(c, 'Keep seed 6 in the table');
  const r = ledger[6];
  num(c, 'Sparse    ' + r.sparse + ' / 30', 144, 326, 56, plum);
  num(c, 'Shaped    ' + r.shaped + ' / 30', 962, 326, 56, rust);
  folio(c, 135, 440, 1647, 415, 'Trace needed to test the explanation');
  ['Intended action', 'Slip draw', 'Successor square'].forEach((s, i) => {
    const x = 195 + 509 * i;
    label(c, s, x, 655, 40, mute);
    num(c, '?', x, 762, 51);
  });
  if (b > 3)
    label(c, 'Fresh runs can test whether early slips explain the misses.', 141, 935, 40, teal);
}
export function branching(c, k) {
  ground(c, 'desk');
  const p = ease(cue(k, 0, 'Open a side passage', 1.65));
  title(c, 'A new environment');
  const x0 = 325,
    cy = 448,
    size = 165,
    jx = x0 + 3 * size;
  // Reveal the actual branch floor by removing its wooden cover. Both exits stay unmarked.
  const cell = (x, y, v) => {
    rect(c, x - size / 2 + 3, y - size / 2 + 3, size - 6, size - 6, '#f4dcad', '#ac8f69', 3);
    if (v !== undefined) num(c, v, x, y, 44, ink, 'center');
  };
  for (let i = 0; i < 7; i++) cell(x0 + i * size, cy, i);
  const top = cy + size / 2;
  if (p) {
    c.save();
    c.beginPath();
    c.rect(jx - size / 2, top, size, p * size * 2);
    c.clip();
    cell(jx, cy + size);
    cell(jx, cy + 2 * size);
    c.restore();
  }
  const wall = top + size * 2 * p;
  rect(c, jx - size / 2 + 3, wall - 7, size - 6, 14, '#896749');
  line(c, x0 - 67, cy + 63, jx - size / 2 - 4, cy + 63, '#9a7656', 3); // Track lip ends before the junction.
  const flagX = x0 + 6 * size + 48;
  line(c, flagX, cy - 54, flagX, cy - 179, ink, 5);
  polygon(
    c,
    [
      [flagX, cy - 183],
      [flagX + 54, cy - 158],
      [flagX, cy - 133],
    ],
    teal,
  );
  label(c, 'Start', x0 - 49, cy - 134, 38, mute);
  if (p === 1) {
    label(c, 'Untested routes', 1280, 652, 51, ink, 'Serif');
    label(c, 'New grid, fresh paired runs', 1280, 723, 34, teal);
  }
  if (beat(k) > 0)
    label(
      c,
      beat(k) === 1
        ? 'Other comparisons   /   learner, potential, learning rate'
        : 'Measure early goals and final greedy success again.',
      129,
      932,
      39,
    );
}
export function milestones(c, k) {
  ground(c, 'desk');
  const b = beat(k),
    stage = b <= 1 ? b : b === 2 && !cue(k, 2, 'At the fourth') ? 2 : 3;
  const cases = [
    [
      'Review the plan',
      'Before confirmatory output',
      [
        ['Trace', 'Ng et al. · shaping equation'],
        ['Predict', 'early gain, final similarity'],
        ['Reject if', 'lower early limit ≤ 0 or a rule fails'],
      ],
    ],
    [
      'Exercise the pilot',
      'Before fresh collection',
      [
        ['Observe', 'state 1 · right choice · slip to 0'],
        ['Control', 'zero Φ writes Q(1, right)'],
        ['Rerun', 'one clean command with a lock'],
      ],
    ],
    [
      'Recompute the figure',
      'With all seed rows',
      [
        ['Retain', '24 pairs and 10,000 draw means'],
        ['Recompute', '103 / 720 = +14.3 points'],
        ['Replay', 'one identified seed pair'],
      ],
    ],
    [
      'Hand off a clean clone',
      'At independent review',
      [
        ['Run', 'clean clone → primary table'],
        ['Challenge', 'a tie can hide weak policies'],
        ['Record', b === 3 ? 'amend before the next confirmation' : 'license, report and defense'],
      ],
    ],
  ];
  const [name, when, items] = cases[stage];
  title(c, name);
  folio(c, 146, 242, 1626, 637, when);
  rows(c, 204, 456, 1500, items, stage === 2 ? 1 : 2, 138);
}
export function defend(c, k) {
  ground(c, 'work');
  const b = beat(k);
  title(c, 'Ten minutes to defend the result');
  const x = 145,
    w = 1624,
    y = 372,
    colors = [
      '#557c83',
      '#91aaa0',
      '#9b8da4',
      '#657d93',
      '#d99664',
      '#7f9787',
      '#bca481',
      '#e2c062',
    ];
  let elapsed = 0;
  const names = [
    'Problem',
    'Paper',
    'Prediction',
    'Design',
    'Evidence',
    'Checks',
    'Limits',
    'Questions',
  ];
  for (const [i, v] of talk.entries()) {
    const xx = x + (elapsed / 600) * w,
      ww = (v / 600) * w;
    rect(c, xx, y, ww - 2, 103, colors[i]);
    num(c, v + 's', xx + ww / 2, y + 51, 32, ink, 'center', ww - 8);
    mid(c, names[i], xx + ww / 2, y + 153, 30, ink, ww - 5);
    elapsed += v;
  }
  num(c, '0:00', x, y - 71, 40, mute);
  num(c, '8:00', x + w * 0.8, y - 71, 40, ink, 'center');
  num(c, '10:00', x + w, y - 71, 40, mute, 'right');
  line(c, x + w * 0.8, y - 39, x + w * 0.8, y + 113, ink, 4);
  if (b === 0) num(c, '480 seconds of evidence   +   120 seconds for questions', 146, 775, 47);
  else if (b === 2) {
    const [low, high] = reportedInterval.map((v) => signed(100 * v, 1));
    label(c, 'Figure caption', 151, 633, 57, ink, 'Serif');
    label(c, `Shaping reduced early success on ${negative.length} of ${ledger.length} seeds.`, 152, 732, 45);
    label(c, `The mean gain was ${result.points.toFixed(1)} percentage points.`, 152, 805, 45);
    label(c, `The 90% paired interval (${low} to ${high} points) includes gains below ten.`, 152, 878, 45, teal);
  } else {
    const q = cue(k, 1, 'equal final scores')
      ? 3
      : cue(k, 1, 'Did shaping change')
        ? 2
        : cue(k, 1, 'Why can five')
          ? 1
          : 0;
    const qs = [
      'Why this seed budget?',
      'Why did five seeds regress?',
      'Did the scoring rule change?',
      'Why does a tie leave skill open?',
    ];
    const as = [
      'Open the paired interval and check its width.',
      'The table locates the losses. A causal account needs traces.',
      'Score both frozen policies on the original goal reward.',
      'Open seed 18. Both reached only 91 goals in 200 trips.',
    ];
    label(c, qs[q], 151, 688, 57, ink, 'Serif');
    label(c, as[q], 152, 804, 43, teal);
  }
}
const exampleRuns = [
  {
    team: 'Authors',
    role: 'Original team',
    files: 'Authors’ files',
    setup: 'Same setup',
    evidenceCue: 'recover their result',
    result: 'Result recovered',
    term: 'Repeatability',
  },
  {
    team: 'Team B',
    role: 'Independent team',
    files: 'Authors’ files',
    setup: 'Original implementation',
    evidenceCue: 'got a match',
    result: 'Match',
    term: 'Reproducibility',
  },
  {
    team: 'Team C',
    role: 'Independent team',
    files: 'Own implementation',
    setup: 'From the paper',
    evidenceCue: 'Their result matched',
    result: 'Match',
    term: 'Replicability',
  },
];

export function teams(c, k) {
  ground(c, 'blue');
  const b = beat(k);
  title(
    c,
    b === 0
      ? 'Who ran which implementation?'
      : b === 1
        ? 'Exercise the artifact'
        : 'Make the artifact reusable',
  );
  if (b === 0) {
    label(c, 'Worked example', 136, 234, 37, mute);
    const cols = [271, 618, 1074, 1460];
    ['Team', 'What they used', 'Run result', 'ACM term'].forEach((name, i) =>
      label(c, name, cols[i], 326, 36, mute),
    );
    exampleRuns.forEach((run, i) => {
      const y = 419 + i * 183;
      line(c, 132, y - 49, 1789, y - 49, '#94a9a6', 2);
      oval(c, 183, y, 30, 31, i ? teal : plum);
      polygon(
        c,
        [
          [133, y + 90],
          [145, y + 51],
          [221, y + 51],
          [234, y + 90],
        ],
        i ? teal : plum,
      );
      label(c, run.team, cols[0], y + 10, 46);
      label(c, run.role, cols[0], y + 69, 33, mute);
      label(c, run.files, cols[1], y + 10, 42);
      label(c, run.setup, cols[1], y + 69, 33, mute);
      if (cue(k, 0, run.evidenceCue)) label(c, run.result, cols[2], y + 10, 40);
      if (run.team === 'Team B' && cue(k, 0, 'within the declared tolerance'))
        label(c, 'Within tolerance', cols[2], y + 69, 33, mute);
      if (cue(k, 0, run.term.toLowerCase())) {
        line(c, cols[3] - 21, y - 22, cols[3] - 21, y + 44, teal, 5);
        label(c, run.term, cols[3], y + 10, 44, teal, 'Serif');
      }
    });
    return;
  }
  if (b === 1) {
    const instructions = cue(k, 1, 'follow the instructions');
    const contents = cue(k, 1, 'find every file');
    const run = cue(k, 1, 'run the study');
    const verify = cue(k, 1, 'verify the output');
    let evidence = '';
    if (verify) evidence = result.gain + ' net goals / ' + result.episodesPerArm + ' trips per arm';
    if (cue(k, 1, 'fourteen point three')) evidence += ' = ' + result.points.toFixed(1) + ' pp';
    folio(c, 138, 236, 1642, 665, 'Reviewer’s worksheet in a separate checkout');
    rows(
      c,
      197,
      445,
      1519,
      [
        ['Instructions', instructions ? illustrationsPrompt : ''],
        [
          'Contents',
          run
            ? 'run_study.py executes the study in content.md'
            : contents
              ? 'Locate run_study.py and the study in content.md'
              : '',
        ],
        ['Evidence', evidence],
      ],
      verify ? 2 : contents ? 1 : instructions ? 0 : -1,
      113,
    );
    line(c, 182, 756, 1729, 756, gray, 2);
    label(c, 'Availability', 197, 824, 36, mute);
    if (cue(k, 1, 'A download shows availability')) label(c, 'Downloadable archive', 851, 824, 40);
    return;
  }
  folio(c, 138, 250, 1642, 645, 'FAIR');
  rows(
    c,
    197,
    463,
    1519,
    [
      ['Findable', 'persistent identifier'],
      ['Accessible', 'documented access, including authorization'],
      ['Interoperable', 'readable standard formats'],
      ['Reusable', 'provenance, license and context'],
    ],
    1,
    104,
  );
}
