import { CONTEXT_FRESH } from '../fixtures.mjs';
import { freshContextState } from '../construction.mjs';
import { hash } from '../recovery.mjs';
import { caseClock, casePage } from '../case-file.mjs';

const fmt = (n) => n.toLocaleString('en-US');
const names = {
  task: 'Task',
  trace: 'Trace',
  authorization: 'Approval policy',
  'old export': 'Old export',
  runbook: 'Current runbook',
};

function packingDesk(page, clock, model) {
  const { text, rule, box, focus, C } = page;
  const p = model.packing;
  const rejected = p.events.find((e) => !e.fits);
  const runbook = p.events.find((e) => e.id === 'runbook');
  const x = 154,
    width = 1490,
    y = 395;
  const scale = width / rejected.attempted;
  text('Next input     /     ' + fmt(p.budget) + ' assigned units after reserves', x, 270, 36);
  focus('packed-units', () => {
    box(x, y, p.budget * scale, 112, C.panel, C.muted);
    let used = 0;
    const showOld = clock.done('ce-earned-attempt') && !model.showSkip;
    for (const [i, event] of p.events.entries()) {
      const fraction =
        i < 3
          ? Math.max(0, Math.min(1, model.required * 3 - i))
          : event.id === 'runbook'
            ? model.runbook
            : 0;
      if (event.fits && fraction > 0) {
        const w = event.units * scale * fraction;
        box(x + event.before * scale, y + 6, Math.max(1, w - 3), 100, i < 3 ? C.yellow : C.blue);
        used += event.units * fraction;
      }
    }
    if (showOld) box(x + rejected.before * scale, y + 6, rejected.units * scale, 100, C.pink);
    const end = x + p.budget * scale;
    rule(end, y - 41, end, y + 136, C.yellow, 4);
    text('Limit ' + fmt(p.budget), end, y - 58, 31, C.yellow, 'right');
    if (showOld) text(fmt(rejected.attempted) + ' with the export', x, 580, 41, C.pink);
    else if (model.showTotal)
      text(fmt(p.used) + ' packed    /    ' + fmt(p.remaining) + ' free', x, 580, 41, C.green);
    else if (model.showRequired && model.runbook === 0)
      text(fmt(rejected.before) + ' required', x, 580, 41, C.yellow);
    else if (used === 0) text('Which optional record fits?', x, 580, 41, C.ink);
  });
  focus('packing-order', () => {
    text('Required together', x, 715, 30, C.yellow);
    text('Try in priority order', 1005, 715, 30, C.blue);
    CONTEXT_FRESH.slice(0, 3).forEach((r, i) => {
      text(names[r.id], x, 785 + i * 69, 37);
      text(fmt(r.units), 767, 785 + i * 69, 37, C.yellow, 'right');
    });
    [rejected, runbook].forEach((r, i) => {
      const skipped = !r.fits && model.showSkip;
      text(i + 1 + '.  ' + names[r.id], 1005, 785 + i * 69, 37);
      text(fmt(r.units), 1600, 785 + i * 69, 37, C.blue, 'right');
      if (skipped) text('Skip', 1660, 785 + i * 69, 28, C.pink);
    });
  });
}

function restartDesk(page, clock, m) {
  const { text, box, rule, focus, C } = page;
  const { files, receipts } = m.fixture;
  const receipt = receipts['collect-receipt'];
  const report = JSON.parse(files['report.json']);
  const trace = JSON.parse(files['trace.json']);
  const authorizer = JSON.parse(files['authorization.json']).role;
  const missing = !m.packet.includes('authorization');
  const short = (digest) => digest.slice(0, 8);
  focus('receipt-bytes', () => {
    text('Collection receipt', 150, 260, 38);
    text('SHA-256 prefixes', 1750, 260, 29, C.muted, 'right');
    ['File', 'Saved', 'Current'].forEach((v, i) => text(v, [150, 730, 1150][i], 348, 31, C.muted));
    rule(150, 372, 1760, 372);
    const pairs = [
      [receipt.artifact, receipt.sha256],
      ['trace.json', receipt.inputSha256['trace.json']],
      ['authorization.json', receipt.inputSha256['authorization.json']],
    ];
    pairs.forEach(([name, stored], i) => {
      const y = 449 + i * 95;
      const live = hash(files[name]);
      const showVerdict = clock.done('ce-earned-stale');
      const changed = stored !== live;
      text(name, 150, y, 36, C.ink, 'left', 'mono');
      text(short(stored), 730, y, 38, C.blue, 'left', 'mono');
      text(short(live), 1150, y, 38, C.blue, 'left', 'mono');
      if (showVerdict) text(changed ? 'changed' : 'match', 1520, y, 31, changed ? C.pink : C.green);
    });
  });
  focus('restart-input', () => {
    box(150, 711, 1610, 154);
    let detail =
      'Trace revision ' +
      trace.revision +
      '    /    ' +
      trace.trace +
      ' returned HTTP ' +
      trace.status;
    if (clock.started('ce-earned-inspect')) {
      detail =
        'Report   ' +
        report.trace +
        ' / ' +
        report.observed +
        '        Trace   ' +
        trace.trace +
        ' / ' +
        trace.status;
    }
    if (clock.done('ce-earned-omit'))
      detail = 'Which file would let this call name the rollback authorizer?';
    if (!missing && clock.done('ce-earned-omit'))
      detail = 'Approval policy reloaded     /     Rollback authorizer   ?';
    if (clock.done('ce-earned-role')) detail = 'Rollback authorizer     /     ' + authorizer;
    text(
      clock.started('ce-earned-inspect') && !clock.done('ce-earned-omit')
        ? 'Evaluator comparison     /     report.json and trace.json'
        : 'Model input     /     ' + fmt(m.renderedUnits) + ' assigned units',
      182,
      760,
      30,
      C.muted,
    );
    text(detail, 182, 828, 40, missing ? C.yellow : C.ink);
  });
  focus('restart-action', () => {
    let action = 'Can collection still count as done?';
    if (clock.done('ce-earned-stale')) action = 'Hold collection. Recheck the revised trace.';
    if (m.repair)
      action =
        'Collection certified     /     ' + report.trace + ' returned HTTP ' + report.observed;
    text(action, 150, 978, 48, C.yellow, 'left', 'serif');
  });
}

function readyTask(page, model) {
  const { text, box, rule, focus, C } = page;
  const { tasks, files } = model.fixture;
  const trace = JSON.parse(files['trace.json']);
  const policy = JSON.parse(files['authorization.json']);
  text('RUN-842     /     Investigation resumed', 150, 266, 36, C.muted);
  focus('restart-action', () => {
    const labels = {
      collect: 'Collect traces',
      'verify cause': 'Verify cause',
      'write report': 'Write report',
    };
    tasks.forEach((task, i) => {
      const x = 150 + i * 570;
      const ready = task.id === model.next;
      const done = task.status === 'done';
      const color = ready ? C.yellow : done ? C.green : C.muted;
      box(x, 358, 470, 174, C.panel, color);
      text(done ? 'Checked' : ready ? 'Ready' : 'Waiting', x + 27, 410, 29, color);
      text(labels[task.id], x + 27, 483, 47);
      if (i < tasks.length - 1) rule(x + 472, 447, x + 566, 447, C.muted, 2);
    });
    text('Next investigation question     /     trace.json + report.json', 150, 682, 32, C.yellow);
    text(
      'Why did ' + trace.trace + ' return HTTP ' + trace.status + ' on /callback?',
      150,
      783,
      62,
      C.ink,
      'left',
      'serif',
    );
  });
  text('Rollback authorizer     /     ' + policy.role, 150, 941, 37, C.blue);
}

export function drawEarnedContext(ctx, scene, state, api) {
  const clock = caseClock(scene, state);
  const model = freshContextState({ ...state, cues: clock.cues });
  const page = casePage(ctx, api);
  if (model.next) readyTask(page, model);
  else if (clock.started('ce-earned-saved')) restartDesk(page, clock, model);
  else packingDesk(page, clock, model);
}

export default {
  id: 'earned-context',
  draw: drawEarnedContext,
  cues: [
    'ce-earned-1000',
    'ce-earned-attempt',
    'ce-earned-skip',
    'ce-earned-2200',
    'ce-earned-saved',
    'ce-earned-mutation',
    'ce-earned-stale',
    'ce-earned-omit',
    'ce-earned-inspect',
    'ce-earned-receipt',
    'ce-earned-authorizer',
    'ce-earned-role',
    'ce-earned-next',
  ],
};
