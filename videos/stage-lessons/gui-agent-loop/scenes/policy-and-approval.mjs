import {
  assertEqual,
  boxOf,
  column,
  dot,
  indicate,
  moveTo,
  place,
  rect,
  row,
} from 'vizmatic/stage';
import { chip, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { policyDecision } from '../../../films/gui-agent-loop/model.mjs';
import { SIDE, footer, handoff, hostGate, portal } from '../parts.mjs';

export default function policy(s, c) {
  const p = portal(s),
    h = hostGate(s);
  const deploy = place(chip('deploy production', { color: 'pink' }), h.top, 'top');
  const allow = footer('Read failure + save local draft: ' + policyDecision('saveDraft'), 'cyan');
  const deny = footer(policyDecision('rerunDeploy').toUpperCase(), 'red');
  const [titleArea, compareArea, gateArea] = SIDE.rows([0.7, 4, 1.1], 'normal');
  const title = place(note('Separate incident extension · example'), titleArea);
  const rows = compareArea.rows(7, 'tight');
  const headers = rows[0].columns([1, 1.3, 1.3], 'tight');
  const heads = ['field', 'proposed', 'grant'].map((v, i) => place(note(v), headers[i], 'left'));
  const proposed = {
    actor: 'agent-ci',
    session: 'S-17',
    incident: 'INC-2048',
    content: 'status missing',
    version: 'v12',
    expiry: '14:05',
  };
  const grant = { ...proposed };
  assertEqual(
    JSON.stringify(proposed),
    JSON.stringify(grant),
    'exact grant matches proposed change',
  );
  const cells = Object.entries(proposed).map(([field, value], i) => {
    const columns = rows[i + 1].columns([1, 1.3, 1.3], 'tight');
    return [
      place(note(field), columns[0], 'left'),
      place(label(value, { size: 29, color: 'pink' }), columns[1], 'left'),
      place(label(grant[field], { size: 29, color: 'green' }), columns[2], 'left'),
    ];
  });
  const gate = place(
    namedBox('HOST · check live version + revocation', {
      width: gateArea.width,
      height: 76,
      color: 'yellow',
    }),
    gateArea,
  );
  const token = dot(12, 'pink').moveTo(boxOf(gate).point('top'));
  const matched = footer('Exact match · session bound', 'yellow');
  const live = footer('v12 = live v12 · grant unrevoked · before 14:05', 'green');
  const atomic = footer('Concurrent use and restart need durable atomic protection.', 'yellow');
  const formRows = SIDE.rows([1, 1.3, 1.7, 1.7], 'normal');
  const form = place(
    column(
      [
        note('Editor · INC-2048'),
        namedBox('status missing', { width: formRows[0].width * 0.8, height: 64, color: 'pink' }),
      ],
      { gap: 'tight' },
    ),
    formRows[0],
  );
  const submit = place(chip('Submit · not pressed', { color: 'dim' }), formRows[1], 'top');
  const autosave = place(
    note('autosave before Submit', { color: 'yellow' }),
    formRows[1],
    'bottom',
  );
  const recordFrames = formRows
    .slice(2)
    .map((r) =>
      place(
        rect(r.width, r.height, { radius: 10, stroke: 'blue', fill: 'surface', width: 2 }).zIndex(
          -1,
        ),
        r,
      ),
    );
  const recordLabels = ['INC-2048 · intended', 'INC-9911 · also in scope'].map((v, i) =>
    place(note(v, { color: 'blue' }), formRows[i + 2].inset('normal'), 'top left'),
  );
  const old = place(
    label('note: empty', { size: 34, color: 'dim' }),
    formRows[2].inset('normal'),
    'bottom left',
  );
  const saved = place(
    label('note: status missing', { size: 34, color: 'green' }),
    formRows[2].inset('normal'),
    'bottom left',
  );
  const other = place(
    label('state: open', { size: 34, color: 'dim' }),
    formRows[3].inset('normal'),
    'bottom left',
  );
  const closed = place(
    label('state: closed', { size: 34, color: 'red' }),
    formRows[3].inset('normal'),
    'bottom left',
  );
  const typed = dot(12, 'pink').moveTo(boxOf(form).point('right'));
  const storeEntrance = [SIDE.right - 16, boxOf(saved).point('right')[1]];
  const effects = footer('Verification scope: INC-2048 + INC-9911 + audit evidence', 'blue');
  const fail = footer('FAIL · stop', 'red');
  const recovery = footer('Detecting a mutation does not undo it.', 'red');
  s.add(heading(c.title), p.shell, p.visible, h.skeleton, h.proposal);
  c.show('read', h.token);
  c.on('read', () =>
    s.play(h.opening.to(1, { duration: 0.5 }), moveTo(h.token, h.landing, { duration: 1.1 })),
  );
  c.show('local', allow);
  c.swap('deploy', h.proposal, deploy);
  c.on('deploy', () =>
    s.play(
      h.opening.to(0, { duration: 0.6 }),
      moveTo(h.token, [h.gatePoint[0], h.gatePoint[1] - 24], { duration: 1 }),
    ),
  );
  c.swap('permission', allow, deny, { after: true });
  c.swap(
    'authorized-write',
    [h.skeleton, deploy, h.token],
    [title, heads, cells.map((r) => r.slice(0, 2)), gate],
  );
  c.hide('authorized-write', deny);
  c.show(
    'bind',
    cells.map((r) => r[2]),
  );
  c.show('bind', matched, { after: true });
  c.swap('recheck', matched, live, { after: true });
  c.show('recheck', token, { after: true });
  c.after('recheck', () =>
    s.play(tint(gate, 'green'), moveTo(token, boxOf(gate).point('bottom'), { duration: 0.8 })),
  );
  c.swap('atomic', live, atomic);
  c.swap(
    'effects',
    [title, heads, cells, gate, token],
    [form, submit, autosave, recordFrames, recordLabels, old, other, typed],
  );
  c.swap('effects', atomic, effects);
  c.on('effects', () => s.play(moveTo(typed, storeEntrance, { duration: 1 })), 0.4);
  c.swap('effects', old, saved, { after: true });
  c.on('target-correct', () => s.play(indicate(saved, { scale: 1, color: 'yellow' })));
  c.swap('collateral', other, closed, { after: true });
  c.swap('verifier', effects, fail, { after: true });
  c.on('verifier', () => s.play(indicate(recordFrames, { scale: 1, color: 'red' })), 0.4);
  c.swap('recovery', fail, recovery);
  handoff(c, p, { first: true });
}
