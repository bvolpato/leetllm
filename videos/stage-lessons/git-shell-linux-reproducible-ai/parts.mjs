import { column, place, rect, table } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
import {
  rows,
  wrongRow,
  freshRows,
  freshWrong,
  fixturePath,
} from '../../films/git-shell-linux-reproducible-ai/fixtures.mjs';
export { rows, wrongRow, freshRows, freshWrong, fixturePath };

// Python str.strip() also treats U+001C through U+001F as whitespace and leaves U+FEFF in place.
function normalizeLabel(label) {
  return label.replace(/^[\p{White_Space}\u001c-\u001f]+|[\p{White_Space}\u001c-\u001f]+$/gu, '').toLowerCase();
}

export function score(records) {
  const total = records.length;
  const correct = records.filter(
    row => normalizeLabel(row.expected) === normalizeLabel(row.prediction ?? row.predicted),
  ).length;
  return {
    correct,
    matches: correct,
    total,
    fraction: total ? correct / total : 0,
    passes: total > 0 && 3 * correct >= 2 * total,
  };
}

// Cyan is the fixture. Blue is execution. Pink is local state. Green is recorded or verified state.
// Yellow is the current comparison. Red is failure. Dim is completed context.
export const COLOR = {
  fixture: 'cyan',
  execution: 'blue',
  local: 'pink',
  recorded: 'green',
  focus: 'yellow',
  failure: 'red',
};

// The four entries name the working, index, commit, and clone fixture at each scene end.
export const STATE = {
  opening: ['original', null, null, null],
  'navigation-contract': ['original', null, null, null],
  'find-file': ['original', null, null, null],
  'ignore-contract': ['original', null, null, null],
  'git-states': ['repaired', 'original', 'original', null],
  score: ['trial', 'original', 'original', null],
  'input-contract': ['original without final newline', 'original', 'original', null],
  'local-hook': ['trial', 'trial', 'original', null],
  'commit-boundary': ['original', 'trial', 'trial', 'trial'],
  history: ['original', 'trial', 'trial', 'trial'],
  'shell-inspection': ['original', 'trial', 'trial', 'trial'],
  'helper-contract': ['original', 'trial', 'trial', 'trial'],
  pipeline: ['original', 'trial', 'trial', 'trial'],
  'strict-shell': ['original', 'trial', 'trial', 'trial'],
  'remote-jobs': ['original', 'trial', 'trial', 'trial'],
  shutdown: ['original', 'trial', 'trial', 'trial'],
  environment: ['original', 'trial', 'trial', 'trial'],
  'environment-contract': ['original', 'trial', 'trial', 'trial'],
  'device-contract': ['original', 'trial', 'trial', 'trial'],
  'lfs-contract': ['original', 'trial', 'trial', 'trial'],
  'clean-clone': ['original', 'original', 'original', 'original'],
  'fresh-handoff': ['fresh seven', 'fresh seven', 'fresh seven', 'fresh seven'],
};

export function repositoryContext(s, c) {
  s.add(heading(c.title));
  return { main: area };
}

// Four snapshots of the same fixture. The transfer track is separate from text and paper.
export function repository(
  main,
  contents = [rows, null, null, null],
  absent = 'no fixture',
  options = {},
) {
  const [head, track, body, receipts] = main.rows([1, 1, 5, 2], 'normal');
  const columns = body.columns(4, 'normal');
  const names = ['working tree', 'index', 'commit', 'fresh clone'];
  const heads = head
    .columns(4, 'normal')
    .map((region, i) =>
      place(
        label(names[i], { size: 34, color: i === 0 ? 'pink' : i === 1 ? 'cyan' : 'green' }),
        region,
      ),
    );
  const tracks = track.columns(4, 'normal');
  const papers = columns.map((region) =>
    place(
      rect(region.width, region.height, {
        fill: 'surface',
        stroke: 'grid',
        strokeWidth: 2,
        radius: 8,
      }),
      region,
    ),
  );
  const tables = columns.map((region, i) => {
    const records = contents[i];
    if (!records) return null;
    return place(
      fixtureTable(records, region.width - 24, {
        compact: true,
        maxRows: options.maxRows ?? 4,
        leading: options.leading,
      }),
      region.inset('tight'),
      'top',
    );
  });
  const empty = columns
    .map((region, i) => (contents[i] ? null : place(note(absent), region)))
    .filter(Boolean);
  return {
    heads,
    papers,
    tables,
    empty,
    tracks,
    receipts: receipts.columns(4, 'normal'),
    columns,
    skeleton: [heads, papers],
  };
}

export function fixtureTable(
  records,
  width,
  { compact = false, maxRows = records.length, leading } = {},
) {
  return table(
    compact
      ? [
          { key: 'id', label: 'id', mono: true },
          { key: 'prediction', label: 'saved', sample: 'APPROVED' },
        ]
      : [
          { key: 'id', label: 'request', mono: true },
          { key: 'expected', label: 'expected', sample: 'approved' },
          { key: 'prediction', label: 'prediction', sample: 'escalated' },
        ],
    records.map((r) => ({
      id: r.prompt.match(/\d+/)[0],
      ...(compact ? {} : { expected: r.expected }),
      prediction: r.prediction,
    })),
    { width, maxRows, size: compact ? 29 : 34, leading: leading ?? (compact ? 2.2 : 2.4) },
  );
}

export function receipt(region, words, color = 'yellow', gap = 'tight') {
  return place(
    column(
      words.map((word) => mono(word, { size: 34, color })),
      { gap },
    ),
    region,
  );
}

// Both runs use a schematic time axis. The background run keeps its launching shell open for wait.
export function jobPicture(main, lanes, fitted, terminalKind) {
  const [commandBand, timeBand, identityBand, foot] = main.rows([1, 4, 3, 1], 'wide');
  const tmux = terminalKind === 'tmux';
  const terminal = tmux ? 'SSH' : 'launching shell';
  const connection = tmux
    ? [
        { lane: terminal, start: 0, end: 2, color: 'blue' },
        { lane: terminal, start: 2, end: 5, label: 'offline', down: true },
        { lane: terminal, start: 5, end: 6, label: 'back', color: 'blue' },
      ]
    : [{ lane: terminal, start: 0, end: 10, color: 'blue' }];
  const flow = place(
    fitted(timeBand, (width) =>
      lanes(
        [terminal, 'eval loop', 'log'],
        [
          ...connection,
          { lane: 'eval loop', start: 0, end: 7, color: 'blue' },
          { lane: 'log', at: 1, label: 'check 1', color: 'cyan' },
          { lane: 'log', at: 4, label: 'check 2', color: 'cyan' },
          { lane: 'eval loop', at: 7, label: 'TERM', labelSide: 'under', color: 'yellow' },
          { lane: 'eval loop', start: 7, end: 9, label: 'cleanup', color: 'blue' },
          { lane: 'log', at: 8, label: 'flushed', color: 'green' },
          { lane: 'eval loop', at: 9, label: 'exit', labelSide: 'right', color: 'green' },
        ],
        { width, domain: [0, 10], pitch: 116, barHeight: 42, size: 34, cursor: false },
      ),
    ),
    timeBand,
  );
  return { flow, commandBand, identityBand, foot };
}
