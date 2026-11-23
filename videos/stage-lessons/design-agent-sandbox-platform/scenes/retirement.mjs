import { column, place } from 'vizmatic/stage';
import { heading, label, mono, namedBox } from '../../kit-narrated.mjs';
import { context, diskRow, drawing, verdict } from '../handoff.mjs';

export default function scene(s, c) {
  const [record, disk] = drawing.rows([1, 1.45], 'wide');
  const [ownerSlot, stateSlot] = record.columns(2, 'loose');
  const owner = place(
    column([
      label('Durable owner', { color: 'dim', size: 34 }),
      mono('A / J4 / g4', { color: 'cyan', size: 50 }),
    ]),
    ownerSlot,
  );
  const state = (name, color) =>
    place(namedBox(name, { width: 620, height: 100, color, size: 40 }), stateSlot);
  const running = state('Execution running', 'cyan');
  const requested = state('Stop requested', 'yellow');
  const stopped = state('Execution retired', 'dim');
  const diskRef = diskRow(s, disk);
  const held = place(
    label('A still owns the writable backing', { size: 41, color: 'cyan' }),
    verdict,
  );
  const discarded = place(label('A’s scratch backing disposed', { size: 44, color: 'dim' }), disk);
  const fresh = place(
    namedBox('Fresh scratch  ·  empty', { width: 760, height: 120, size: 47, color: 'blue' }),
    disk,
  );
  const next = place(label('Next tenant', { size: 44, color: 'blue' }), ownerSlot);
  const here = place(label('Host inventory', { size: 38 }), context);

  s.add(heading(c.title), here, owner, running, diskRef.item, diskRef.connection);
  c.swap('request', running, requested, { after: true });
  c.swap('stop', requested, stopped, { after: true });
  c.show('reader', held);
  diskRef.close(c, 'close');
  c.swap('dispose', [...diskRef.closedState, held], discarded, { after: true });
  c.swap('fresh', [discarded, owner, stopped], [next, fresh], { after: true });
}
