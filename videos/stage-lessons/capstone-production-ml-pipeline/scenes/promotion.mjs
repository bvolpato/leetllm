import { arrow, boxOf, place } from 'vizmatic/stage';
import { label, namedBox, note } from '../../kit-narrated.mjs';
import { BODY, open } from '../parts.mjs';
import { probeSwitch } from '../probe-switch.mjs';

export default function promotion(s, c) {
  const [history, chain, inspection, desk, foot] = BODY.rows([0.75, 1.3, 1.1, 3, 0.75], 'normal');
  const fields = chain.columns(3, 'loose');
  const window = place(
    note('History A   ·   day 0 pending, day 7 mature   ·   candidate v1'),
    history,
  );
  const ticket = (i, title) =>
    place(
      namedBox(title, { width: fields[i].width - 60, height: 92, size: 35, color: 'pink' }),
      fields[i],
    );
  const ready = ticket(0, 'Ready receipt 3');
  const accepted = ticket(1, 'Offline receipt 2');
  const evidence = ticket(2, 'Offline evidence 3');
  const link = (a, b) =>
    arrow(boxOf(a).point('right'), boxOf(b).point('left'), { stroke: 'pink', width: 3, pad: 8 });
  const status = (v, color) => place(label(v, { size: 39, color }), inspection);
  const bindings = status('Model and policy fingerprints match the stored evidence', 'pink');
  const base = status('Receipt base  v0     ·     current production  ?', 'yellow');
  const match = status('Receipt base  v0     ·     current production  v0', 'blue');
  const precommit = status('promote(candidate, receipt_id)     ·     receipt 3', 'yellow');
  const committed = status(
    'Audit   ·   v0 → v1   ·   ready receipt 3   ·   canary cleared',
    'green',
  );
  const bench = probeSwitch(s, desk, { release: 'v0', id: 'eval-1', delay: 9 });
  const serving = place(
    note('Verify worker readiness and the revision serving requests', { color: 'cyan' }),
    foot,
  );
  open(s, c);
  s.add(window, bench.nodes);
  c.show('promotion-ready', ready);
  c.show('promotion-offline', [link(ready, accepted), accepted]);
  c.show('promotion-rows', [link(accepted, evidence), evidence]);
  c.show('promotion-bind', bindings);
  c.swap('promotion-base', bindings, base);
  c.swap('promotion-match', base, match);
  c.swap('promotion-call', match, precommit);
  c.on('promotion-select', () => bench.select('v1'));
  c.swap('promotion-event', precommit, committed);
  c.on('promotion-send', bench.send);
  c.on('promotion-probe-result', () => bench.report('v1'));
  c.show('promotion-workers', serving);
}
