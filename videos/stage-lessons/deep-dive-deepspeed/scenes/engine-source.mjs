import {
  assertEqual,
  boxOf,
  codeBlock,
  dot,
  dynamic,
  indicate,
  line,
  place,
  rect,
  to,
} from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
export default function engine(s, c) {
  const b = open(s, c, 'engine-source');
  const [left, right] = WORK.columns([3, 2], 'loose');
  const [head, gatherArea, engineHead, engineArea] = left.rows([0.5, 2.8, 0.5, 1.5], 'tight');
  const filename = place(note('zero/partition_parameters.py · c455031'), head);
  // These source lines are wrapped. The ellipses mark omitted intervening code.
  const source = place(
    codeBlock(
      'return self._all_gather(\n    param_list, async_op=async_op,\n    hierarchy=hierarchy)\n...\nparam.ds_status = ZeroParamStatus.AVAILABLE\n...\nparam.ds_status = ZeroParamStatus.NOT_AVAILABLE',
      { language: 'python', size: 29, leading: 1 },
    ),
    gatherArea,
  );
  const runtime = place(note('runtime/engine.py · step() · 3101, 3118'), engineHead);
  const guard = place(
    codeBlock(
      'if self.is_gradient_accumulation_boundary():\n    ...\n    self._take_model_step(lr_kwargs)',
      { language: 'python', size: 29, leading: 1 },
    ),
    engineArea,
  );
  const [ownerArea, storage, boundaryArea, foot] = right.rows([1.2, 1, 2, 0.6], 'normal');
  const [name, flag] = ownerArea.rows([1, 1], 'tight');
  const owner = place(
    namedBox('W0 · owner R0', { width: 490, height: 48, color: 'blue', size: 34 }),
    name,
  );
  const status = s.value(0);
  const state = dynamic(() =>
    mono(['NOT_AVAILABLE', 'INFLIGHT', 'AVAILABLE'][Math.round(status.value)], {
      size: 34,
      color: status.value === 2 ? 'green' : 'yellow',
    }).moveTo(flag.point('center')),
  );
  const [local, full] = storage.rows([1, 1], 'normal');
  const localLabel = place(note('Full W0 view · resident shard kept', { color: 'blue' }), local);
  const slots = full.columns(4, 'tight');
  const cells = dynamic(() =>
    slots.map((slot) =>
      rect(slot.width, 34, {
        fill: status.value === 2 ? 'blue' : 'surface',
        stroke: 'grid',
      }).moveTo(slot.point('center')),
    ),
  );
  const [gateHead, gateRow, outcome] = boundaryArea.rows([0.8, 1.2, 1], 'normal');
  const boundaryName = place(note('Managed accumulation boundary'), gateHead);
  const ends = gateRow.columns([2, 1, 2], 'tight');
  const request = place(
    namedBox('step request', { width: 230, height: 54, color: 'dim', size: 31 }),
    ends[0],
  );
  const update = place(
    namedBox('Adam update', { width: 230, height: 54, color: 'dim', size: 31 }),
    ends[2],
  );
  const gate = place(rect(10, 54, { fill: 'red', stroke: 'red' }), ends[1]);
  const path = line(boxOf(request).point('right'), boxOf(update).point('left'), {
    stroke: 'grid',
    width: 3,
  });
  const receipt = place(note('ZeRO 1/2: gradient + optimizer owners'), foot);
  const paths = place(note('PipelineEngine / AutoTP: distinct paths'), foot);
  const microsteps = 3,
    accumulation = 8;
  assertEqual(microsteps % accumulation, 3, 'early managed request is not a boundary');
  const blocked = place(mono('3 / 8 → false · updates = 0', { size: 31, color: 'red' }), outcome);
  const markerPoint = (target) => [boxOf(target).left + 9, boxOf(target).top + 31];
  const points = [
    source.find('return self._all_gather'),
    source.find('param.ds_status = ZeroParamStatus.AVAILABLE'),
    source.find('param.ds_status = ZeroParamStatus.NOT_AVAILABLE'),
  ].map((part) => [boxOf(source).left + 9, boxOf(part).cy]);
  const marker = dot(6, 'yellow').moveTo(points[0]);
  const incoming = dot(9, 'yellow').moveTo([boxOf(request).right + 12, gateRow.cy]);
  s.add(
    filename,
    source,
    runtime,
    guard,
    owner,
    state,
    localLabel,
    cells,
    boundaryName,
    request,
    update,
    path,
    gate,
    receipt,
  );
  c.on('runtime', () => s.play(indicate(runtime, { scale: 1, color: 'yellow' })));
  c.on('owners', () => s.play(indicate(receipt, { scale: 1, color: 'yellow' })));
  c.on('partition', () => s.play(indicate(filename, { scale: 1, color: 'yellow' })));
  c.show('resident', marker);
  c.on('resident', () => {
    status.set(0);
    s.play(to(marker, (n) => n.moveTo(points[1]), { duration: 1.4 }));
    status.set(2);
    s.wait(1.2);
    s.play(to(marker, (n) => n.moveTo(points[2]), { duration: 1.2 }));
    status.set(0);
  });
  c.show('boundary', incoming);
  c.on('boundary', () =>
    s.play(
      to(marker, (n) => n.moveTo(markerPoint(guard)), { duration: 1.2 }),
      to(incoming, (n) => n.moveTo([boxOf(gate).left - 14, gateRow.cy]), { duration: 1.2 }),
    ),
  );
  c.show('boundary', blocked, { after: true });
  c.swap('paths', receipt, paths);
  finish(c, b, 'engine-source');
}
