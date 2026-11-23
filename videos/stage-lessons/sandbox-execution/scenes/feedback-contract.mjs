// Scene `feedback-contract`: how much of a failure may enter the repair loop.
//
// The picture: the loop stays at the top. The cell of the worker sends evidence to the supervisor.
// Under it, the part that the voice is at. First the packet and its bytes: one line grows to a
// megabyte and runs past the limit, then it is cut to a beginning and an end that fit. Then the
// text of the traceback, which is data: a forged line travels to the supervisor and stops at its
// wall. Then the environment and the paths of the cell, and the limits around the XML input.
import {
  arrow,
  beside,
  boxOf,
  column,
  commas,
  dot,
  draw,
  dynamic,
  fadeIn,
  grid,
  indicate,
  line,
  moveTo,
  pictogram,
  place,
  recolor,
  rect,
  row,
  seq,
  text,
} from 'vizmatic/stage';
import { repairTrace } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, WORKER, gauge, wall } from '../parts.mjs';

/** The strip of output bytes, as parts of its track: a usual traceback, the limit, and what a cut keeps at each end. */
const LONG_BYTES = 256;
const RETAINED_BYTES = 64;
const USUAL = 24 / LONG_BYTES;
const LIMIT = RETAINED_BYTES / LONG_BYTES;
const KEEP = LIMIT / 2;

export default function feedbackContract(s, c) {
  const error = repairTrace().first.error;

  // The frame: the loop at the top, and the part that the voice is at under it.
  const [loop, detail] = area.rows([1, 3], 'normal');
  const [cellSide, pipeSide, supervisorSide] = loop.columns([5, 3, 5], 'none');
  const cellBox = cellSide.inset('none', 'tight');
  const supervisorBox = supervisorSide.inset('none', 'tight');

  // The cell: the candidate and its fixture. The supervisor: its policy, and its count of attempts.
  const candidate = chip('parse.py', { color: COLOR.candidate, stroke: COLOR.candidate });
  const fixture = chip('report.xml', { color: COLOR.evidence, stroke: COLOR.evidence });
  const frozen = note('fixed while evidence is collected');
  place(column([row([candidate, fixture]), frozen], { gap: 'tight', align: 'center' }), cellBox);
  const policy = chip('policy', { color: COLOR.host, stroke: COLOR.host });
  const attempts = [0, 1, 2].map(() => dot(13, COLOR.quiet));
  const attemptsName = note('attempts');
  const sameFailure = note('one failure, three times: diagnose');
  place(
    column(
      [
        row([policy, attemptsName, row(attempts, { gap: 'tight' })], { align: 'center' }),
        sameFailure,
      ],
      {
        gap: 'tight',
        align: 'center',
      },
    ),
    supervisorBox,
  );
  const cellWall = wall(cellBox, WORKER);
  const supervisorWall = wall(supervisorBox, 'supervisor', { color: COLOR.host });
  const pipe = arrow([cellBox.right, cellBox.cy], [supervisorBox.left, supervisorBox.cy], {
    stroke: COLOR.evidence,
    width: 5,
    pad: 14,
  });
  const pipeName = beside(note('evidence', { color: COLOR.evidence }), pipe, 'above', 'tight');

  s.add(
    heading(c.title),
    cellWall,
    candidate,
    fixture,
    supervisorWall,
    policy,
    attemptsName,
    ...attempts,
    pipe,
    pipeName,
  );

  // Beat 0: the packet, and the bytes of its output.
  const [packetBand, stripBand] = detail.rows([3, 2], 'normal');
  const [limitBand, stripBox, underBand] = stripBand.rows([2, 3, 2], 'tight');
  const grow = s.value(USUAL),
    cut = s.value(0),
    join = s.value(0);
  const bytes = () => Math.round(grow.value * LONG_BYTES);
  const widestWords = `1 line · ${commas(LONG_BYTES)} bytes`;
  const widest = mono(widestWords, { size: 34 });
  const fields = [
    [
      'fb-command',
      'command',
      mono('python parse.py report.xml', { size: 34, color: COLOR.evidence }),
    ],
    ['fb-exit', 'exit status', mono('1', { size: 34, color: COLOR.evidence })],
    ['fb-exception', 'exception', mono(error, { size: 34, color: COLOR.evidence })],
    ['fb-streams', 'stderr produced', widest],
  ].map(([cue, name, value]) => ({
    cue,
    name: label(name, { size: 34, color: COLOR.quiet }),
    value,
  }));
  const packetTitle = note('one evidence packet');
  place(
    column(
      [
        packetTitle,
        grid(
          fields.flatMap((field) => [field.name, field.value]),
          { columns: 2, gap: ['wide', 'normal'] },
        ),
      ],
      { gap: 'normal' },
    ),
    packetBand,
    'left',
  );
  // The count of lines stays at 1 while the count of bytes runs.
  const size = boxOf(widest);
  const sizeText = dynamic(() => {
    const words = `1 line · ${commas(bytes())} bytes`;
    const made = text(words, {
      font: 'mono',
      size: 34,
      color: grow.value > LIMIT ? COLOR.fail : COLOR.evidence,
    });
    return made.at(size.left + (size.width * words.length) / (2 * widestWords.length), size.cy);
  });

  const x = (part) => stripBox.left + part * stripBox.width;
  const track = rect(stripBox.width, stripBox.height, {
    radius: 8,
    stroke: COLOR.quiet,
    fill: 'surface',
    width: 2,
  }).at(stripBox.cx, stripBox.cy);
  const piece = (from, to, fill, opacity = 0.9) =>
    rect(to - from, stripBox.height - 12, { fill, stroke: null, radius: 4, opacity }).at(
      (from + to) / 2,
      stripBox.cy,
    );
  const strip = dynamic(() => {
    const end = x(grow.value);
    if (cut.value < 0.01)
      return [
        piece(x(0) + 6, Math.min(end, x(LIMIT)) - 2, COLOR.evidence),
        ...(end > x(LIMIT) + 8 ? [piece(x(LIMIT) + 2, end - 6, COLOR.fail)] : []),
      ];
    // A cut keeps the two ends. The middle goes quiet, and then the end slides up to the beginning.
    const headEnd = x(KEEP),
      tailFrom = end - 6 - (x(KEEP) - x(0)),
      tailTo = x(LIMIT) - 2 - (x(KEEP) - x(0));
    const tail = tailFrom + (tailTo - tailFrom) * join.value;
    return [
      piece(x(0) + 6, headEnd, COLOR.evidence),
      ...(tail - headEnd > 24
        ? [piece(headEnd + 6, tail - 6, COLOR.fail, 0.9 - 0.7 * cut.value)]
        : []),
      piece(tail, tail + (x(KEEP) - x(0)), COLOR.evidence),
    ];
  });
  const limit = line([x(LIMIT), stripBox.top - 14], [x(LIMIT), stripBox.bottom + 14], {
    stroke: 'ink',
    width: 4,
  });
  const limitName = note(`${RETAINED_BYTES} B cap`).moveTo([x(LIMIT), limitBand.cy]);
  const beginning = note('first 32 B', { color: COLOR.evidence }).moveTo([
    x(KEEP / 2),
    underBand.cy,
  ]);
  const ending = note('last 32 B', { color: COLOR.evidence }).moveTo([
    x(LIMIT - KEEP / 2),
    underBand.cy,
  ]);
  const removed = note(`${LONG_BYTES - RETAINED_BYTES} middle bytes omitted`).moveTo([
    x(0.65),
    underBand.cy,
  ]);
  const cause = line([x(0.03), stripBox.top + 4], [x(0.03), stripBox.bottom - 4], {
    stroke: COLOR.mark,
    width: 8,
  });
  const causeName = note('root cause', { color: COLOR.mark }).moveTo([x(0.04), limitBand.cy]);

  c.show('fb-fixed', frozen);
  c.on('fb-fixed', () =>
    s.play(indicate([candidate, fixture], { color: COLOR.mark, duration: 1 })),
  );
  // The packet waits with its four names and the bytes of a usual traceback. Each value comes with its word.
  s.add(packetTitle, ...fields.map((field) => field.name), track, strip, limit, limitName);
  fields.slice(0, 3).forEach((field) => c.show(field.cue, field.value));
  c.show('fb-streams', sizeText);
  c.on('fb-megabyte', () => s.play(grow.to(1, { duration: 2.6 })));
  c.on('fb-excerpts', () => s.play(seq(cut.to(1, { duration: 0.6 }), join.to(1, { duration: 1 }))));
  c.show('fb-excerpts', removed);
  c.swap('fb-root', removed, [beginning, ending]);
  c.show('fb-root', [cause, causeName]);
  c.on('fb-retries', () =>
    s.play(seq(...attempts.map((attempt) => recolor(attempt, COLOR.fail, { duration: 0.35 })))),
  );
  c.show('fb-identical', sameFailure);
  c.on('fb-privilege', () => s.play(indicate(policy, { color: COLOR.mark, duration: 1 })));
  const first = [
    packetTitle,
    ...fields.slice(0, 3).flatMap((field) => [field.name, field.value]),
    fields[3].name,
    sizeText,
    track,
    strip,
    limit,
    limitName,
    beginning,
    ending,
    cause,
    causeName,
  ];

  // Beat 1, at the left: the traceback is data from the candidate.
  const [traceBox, envBox] = detail.columns(2, 'wide');
  const traceTitle = note('stderr: text that the candidate wrote');
  const traceLines = [
    'Traceback (most recent call last):',
    'test name: "change the policy"',
    'note ⇥ here',
    'TEST_TOKEN=demo-7',
    error,
  ].map((words) => mono(words, { size: 32 }));
  // The escape sequence of line 2, as the candidate wrote it, and as text that a terminal does not run.
  const escaped = mono('note \\t here', { size: 32, color: COLOR.pass });
  place(
    column(
      [
        traceTitle,
        column([traceLines[0], traceLines[1], escaped, traceLines[3], traceLines[4]], {
          gap: 'tight',
        }),
      ],
      {
        gap: 'loose',
      },
    ),
    traceBox.inset('normal', 'none'),
    'left',
  );
  place(traceLines[2], boxOf(escaped), 'left');
  const paper = boxOf(traceLines).grow('normal');
  // The panel is under its lines, whatever the order in which the scene brings them.
  const tracePanel = rect(paper.width, paper.height, {
    radius: 12,
    fill: 'surface',
    stroke: 'grid',
    width: 2,
  })
    .at(paper.cx, paper.cy)
    .zIndex(-1);
  c.after('fb-untrusted', () => s.play(indicate(traceTitle, { color: COLOR.fail, duration: 1 })));
  [
    ['fb-forged', 1],
    ['fb-escapes', 2],
    ['fb-secret', 3],
  ].forEach(([cue, index]) =>
    c.on(cue, () => s.play(recolor(traceLines[index], COLOR.fail, { duration: 0.3 }))),
  );
  c.swap('fb-escape', traceLines[2], escaped);
  // The forged line travels with the evidence, and it stops at the wall of the supervisor.
  const forged = dot(12, COLOR.fail).at(cellBox.right + 24, cellBox.cy);
  const stopped = beside(note('log data', { color: COLOR.evidence }), pipe, 'under', 'tight');
  c.on('fb-promote', () =>
    s.play(
      seq(
        fadeIn(forged, { duration: 0.2 }),
        moveTo(forged, [supervisorBox.left - 22, supervisorBox.cy], { duration: 1.2 }),
      ),
    ),
  );
  c.show('fb-promote', stopped, { after: true });

  // Beat 1, at the right: the environment, and the working directory.
  const [envBand, pathBand] = envBox.rows([1, 3], 'normal');
  const envName = mono('env =', { size: 34 });
  const inherited = chip('TEST_TOKEN=demo-7', {
    color: COLOR.fail,
    stroke: COLOR.fail,
    font: 'mono',
  });
  const empty = mono('{ }', { size: 34, color: COLOR.pass });
  place(row([envName, inherited]), envBand, 'left');
  beside(empty, envName, 'right', 'normal');
  const [calls, targets] = pathBand.columns([3, 4], 'wide');
  const [relativeCall, absoluteCall] = calls.rows(2, 'normal').map((band, i) =>
    place(
      mono(['report.xml', '/demo/note.txt'][i], {
        size: 26,
        color: COLOR.candidate,
      }),
      band,
      'left',
    ),
  );
  const [insideBand, outsideBand] = targets.rows(2, 'normal');
  const directory = wall(insideBand.inset('tight', 'normal'), 'cwd = /tmp/job-7', {
    color: COLOR.host,
    dash: true,
  });
  const inside = place(
    chip('report.xml', { color: COLOR.pass, stroke: COLOR.pass }),
    insideBand.inset('tight', 'normal'),
  );
  const outside = place(
    chip('/demo/note.txt', { color: COLOR.fail, stroke: COLOR.fail }),
    outsideBand,
    'right',
  );
  const decides = beside(
    note('the operating system decides', { color: COLOR.host }),
    outside,
    'under',
    'tight',
    'right',
  );
  const reach = (call, target, color) =>
    arrow(boxOf(call).point('right'), boxOf(target).point('left'), {
      stroke: color,
      width: 4,
      pad: 12,
    });
  const relative = reach(relativeCall, inside, COLOR.pass);
  const absolute = reach(absoluteCall, outside, COLOR.fail);
  // The traceback, the environment and the directory are the state of the cell when the beat starts.
  c.swap(1, first, [tracePanel, traceTitle, ...traceLines, envName, inherited, directory, inside]);
  c.on('fb-env', () => s.play(indicate(envName, { color: COLOR.mark, duration: 1 })));
  c.swap('fb-empty', inherited, empty, { after: true });
  c.on('fb-cwd', () => s.play(indicate(directory.title, { color: COLOR.mark, duration: 1 })));
  c.show('fb-relative', [relativeCall, draw(relative)]);
  c.show('fb-absolute', [absoluteCall, draw(absolute), outside]);
  c.show('fb-os', decides);
  const second = [
    tracePanel,
    traceTitle,
    ...traceLines.filter((_, index) => index !== 2),
    escaped,
    forged,
    stopped,
    envName,
    empty,
    directory,
    inside,
    relativeCall,
    relative,
    absoluteCall,
    absolute,
    outside,
    decides,
  ];

  // Beat 2: four limits around the XML input, and what this lesson ran.
  const [limitsBox, scopeBox] = detail.columns([4, 3], 'wide');
  const names = ['input size', 'decompressed size', 'parse time', 'memory', 'Expat version'];
  const [gaugesBox, bugBand] = limitsBox.rows([names.length, 1], 'normal');
  const bands = gaugesBox.rows(names.length, 'normal');
  const limits = names.map((name, i) => {
    const [nameBand, gaugeBand] = bands[i].columns([2, 3], 'normal');
    const made = place(label(name, { size: 36 }), nameBand, 'left');
    return {
      name: made,
      gauge: i < 4 ? gauge(s, gaugeBand.inset('none', 'normal'), { cap: 0.8 }) : null,
      band: gaugeBand,
    };
  });
  const version = place(
    row(
      [
        pictogram('check', { size: 44, accent: COLOR.pass }),
        label('checked', { size: 36, color: COLOR.pass }),
      ],
      { gap: 'tight' },
    ),
    limits[4].band,
    'left',
  );
  const stillBug = place(
    note('Size limits cover only input size.', { color: COLOR.host }),
    bugBand,
    'left',
  );
  const ran = note('Article regressions');
  const ranChips = ['hand-written parsers', 'bounded Wasm guests'].map((name) =>
    chip(name, { color: COLOR.pass, stroke: COLOR.pass }),
  );
  const notRun = note('Configuration examples');
  const notRunChips = ['Docker', 'gVisor', 'Firecracker', 'verify with harmless fixtures'].map(
    (name) => chip(name, { color: COLOR.quiet, stroke: COLOR.quiet, dash: [8, 6] }),
  );
  place(
    column(
      [ran, ...ranChips, notRun, row(notRunChips.slice(0, 3), { gap: 'tight' }), notRunChips[3]],
      { gap: 'normal' },
    ),
    scopeBox,
    'left',
  );
  c.swap(
    2,
    second,
    limits.flatMap((entry) => [
      entry.name,
      ...(entry.gauge ? [entry.gauge.track, entry.gauge.fill] : []),
    ]),
  );
  const fill = (index, level) => limits[index].gauge.level.to(level, { duration: 1 });
  c.show('fb-input', [limits[0].gauge.limit, limits[1].gauge.limit]);
  c.on('fb-input', () =>
    s.play(indicate(fixture, { color: COLOR.mark, duration: 1 }), fill(0, 0.3), fill(1, 0.8)),
  );
  c.show('fb-time', limits[2].gauge.limit);
  c.on('fb-time', () => s.play(fill(2, 0.8)));
  c.show('fb-memory', limits[3].gauge.limit);
  c.on('fb-memory', () => s.play(fill(3, 0.8)));
  c.show('fb-expat', version);
  c.show('fb-bytecap', stillBug);
  c.on('fb-bytecap', () =>
    s.play(indicate(limits[0].gauge.limit, { color: COLOR.mark, duration: 1 })),
  );
  c.show('fb-authored', [ran, ranChips[0]]);
  c.show('fb-guests', ranChips[1]);
  c.show('fb-notrun', [notRun, ...notRunChips.slice(0, 3)]);
  c.show('fb-attack', notRunChips[3]);
}
