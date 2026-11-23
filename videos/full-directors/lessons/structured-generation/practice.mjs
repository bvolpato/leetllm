import * as ex from './examples.mjs';
import { ink, white, fog, gold, mint, rose, pale, rule } from './press.mjs';

export function cost(g) {
  const { beat, at } = g;
  if (beat === 1) {
    g.text('Time to first token', 48, 129, 20, fog);
    [
      ['Cold', ['Compile', 'Prefill']],
      ['Warm', ['Prefill']],
    ].forEach(([label, jobs], i) => {
      const y = 171 + i * 68;
      g.text(label, 51, y + 20, 25, white);
      jobs.forEach((s, j) => {
        const x = 215 + j * 189;
        g.rect(x, y, 175, 44, s === 'Compile' ? gold : pale);
        g.text(s, x + 86, y + 22, 23, ink, 'Sans', 158, 'center');
      });
    });
    g.text('During decoding', 49, 343, 20, fog);
    g.text('CPU mask   ∥   GPU forward', 251, 343, 27, mint, 'Mono');
    g.note('Schematic stages. Measure cold and warm latency at the serving batch size.');
  } else if (beat === 2 || beat === 3) {
    const us = 1e6 / 100,
      mask = 40,
      pct = (mask / us) * 100;
    g.text('2024 XGrammar test setup', 47, 133, 22, fog);
    g.text('Mask time < ' + mask + ' µs', 47, 199, 39, mint, 'Mono');
    if (at(2, 'one hundred output tokens'))
      g.text(
        'At 100 tokens/s     ' + us.toLocaleString('en-US') + ' µs/token',
        47,
        282,
        30,
        white,
        'Mono',
      );
    if (at(2, 'four tenths of a percent'))
      g.text('40 / 10,000 × 100 = ' + pct + '%', 47, 365, 32, gold, 'Mono');
    g.note(
      'Illustrative comparison to one token’s time budget. End-to-end latency includes more work.',
    );
  } else {
    g.feed(112, 'RUNNER LOG', ex.RUN_LOG);
    const records = ex.LANGUAGE.map((s) => JSON.parse(s));
    records.forEach((r, i) => {
      const y = 246 + 66 * i;
      g.text(ex.LANGUAGE[i], 49, y, 25, white, 'Mono', 284);
      g.text('Parses', 348, y, 26, mint);
      if (at(4, 'only one matches'))
        g.text(
          r.status === ex.CI_RUN.status ? 'Agrees with run' : 'Disagrees with run',
          586,
          y,
          26,
          r.status === ex.CI_RUN.status ? mint : rose,
        );
    });
    const correct = records.filter((r) => r.status === ex.CI_RUN.status).length;
    g.note(
      at(4, 'only one matches')
        ? records.length +
            ' / 2 parse     ' +
            correct +
            ' / 2 match CI     ·     Also measure completion, permission and latency.'
        : 'Count replies that match the run.',
    );
  }
}

export function deadline(g) {
  const { at } = g,
    refusal = at(4, 'A refusal'),
    costChange = at(4, 'If A had spent six') && !refusal;
  const x = 139,
    scale = 55,
    deadline = x + 12 * scale,
    run = at(3, 'Lay the three-second call', 0.7),
    validate = at(3, 'add one second', 0.45);
  g.text(
    '500 / 600 tokens   ·   ' + (costChange ? 'B cost  4 + 3 = 7 / 8' : 'Cost  4 + 3 = 7 / 8'),
    47,
    125,
    23,
    fog,
    'Mono',
  );
  g.text('12 s deadline', deadline, 171, 19, gold, 'Sans', 170, 'center');
  g.line(deadline, 191, deadline, 398, gold, 3);
  [7, 8.5].forEach((elapsed, i) => {
    const y = 213 + 110 * i,
      changed = !i && costChange,
      stop = !i && refusal ? 'refusal' : 'length',
      result = ex.budget(elapsed, changed ? 6 : 4, stop);
    g.text(i ? 'B' : 'A', 50, y + 19, 31, white, 'Serif');
    g.rect(x, y, elapsed * scale, 41, white);
    g.text(elapsed + ' s spent', x + 14, y + 20, 23, ink, 'Mono', elapsed * scale - 22);
    g.rect(x + elapsed * scale, y, 3 * scale * run, 41, mint);
    g.rect(x + (elapsed + 3) * scale, y, scale * validate, 41, gold);
    if (at(4, 'Only A fits')) {
      const why =
        stop === 'refusal'
          ? 'Refusal → stop'
          : changed
            ? '6 + 3 = 9 > 8 → stop'
            : result.allowed
              ? 'Retry'
              : 'Too late';
      g.text(
        result.totalTime + ' s  ·  ' + why,
        x,
        y + 62,
        21,
        result.allowed ? mint : rose,
        'Mono',
        665,
      );
    }
  });
  g.note(
    'Projected time   ·   ' +
      (costChange
        ? 'A uses 6 + 3 cost units against a limit of 8.'
        : 'Mint = 3 s call. Gold = 1 s validation.'),
  );
}

export function finalCase(g) {
  const { at } = g,
    record = ex.finalRecord,
    scope = at(3, 'read scope to delta') ? 'project-delta' : 'project-gamma',
    switched = scope !== record.project;
  const { read, approved } = ex.checkRun(scope);
  const firstResult = at(2, 'Show the failed snapshot'),
    showJob = at(2, 'Leave the job unknown'),
    deny = at(2, 'Deny the rollback'),
    count = at(4, 'Zero');
  g.slip(44, 114, 410, 187, 'COMPLETED REPLY', [
    record.project + ' / ' + record.run_id,
    'status      ' + record.status,
    'failing_job ' + JSON.stringify(record.failing_job),
  ]);
  g.slip(
    499,
    114,
    415,
    187,
    'HOST STATE',
    [
      'scope: ' + scope,
      'rollback approvals: ' + ex.finalGrants.length,
      switched ? 'CI read: ' + (count ? 'skipped' : 'pending') : 'CI: RUN-915 failed / job unknown',
    ],
    pale,
  );
  g.text('Proposal     rollback     approved: true', 48, 328, 23, white, 'Mono');
  if (switched) {
    g.text('Earlier gamma read: failed / job unknown. Rollback denied.', 47, 370, 19, fog);
    if (count)
      g.text(
        'Delta replay   ·   Snapshot lookups: ' + Number(read.queried),
        47,
        410,
        25,
        rose,
        'Mono',
      );
  } else {
    g.line(45, 353, 453, 353, rule, 2);
    g.line(500, 353, 913, 353, rule, 2);
    g.text('Dashboard', 47, 371, 18, fog);
    g.text('Deployment action', 501, 371, 18, fog);
    g.text(
      firstResult && read.queried
        ? record.status + (showJob ? ' / Job unknown' : '')
        : 'Awaiting checks',
      47,
      407,
      27,
      firstResult ? mint : fog,
    );
    g.text(
      deny && !approved ? 'Rollback denied' : 'Awaiting checks',
      501,
      407,
      27,
      deny ? rose : fog,
    );
  }
  const note = switched
    ? count
      ? 'Stop at scope. No gamma lookup or rollback on this replay.'
      : 'How many gamma snapshots may this caller look up?'
    : deny && !approved
      ? 'Rollback denied. The model’s approval flag grants no permission.'
      : 'What can the dashboard show? May the host roll back?';
  g.note(note, (switched && count) || (deny && !switched) ? rose : gold);
}
