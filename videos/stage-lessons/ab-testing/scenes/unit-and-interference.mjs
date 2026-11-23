import {
  arrow,
  boxOf,
  column,
  dot,
  draw,
  dynamic,
  indicate,
  line,
  place,
  row,
  tex,
  to,
  unitChart,
  zone,
} from 'vizmatic/stage';
import { chip, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { FOOT, SIDE, experiment } from '../parts.mjs';
import { clusterDesignEffect } from '../../../films/ab-testing/model.mjs';
export default function interference(s, c) {
  const b = experiment(s);
  const [top, staffRegion, queueRegion, math] = SIDE.rows([2, 1, 1.5, 2], 'normal');
  const queries = top.columns(2, 'normal');
  const raw = place(
    column(
      [
        label('inc-C: control', { color: 'cyan', size: 36 }),
        note('raw canary question'),
        chip('own experience', { color: 'cyan' }),
      ],
      { gap: 'tight' },
    ),
    queries[0],
  );
  const rewrite = place(
    column(
      [
        label('inc-T: treatment', { color: 'blue', size: 36 }),
        note('rollback • error-rate policy'),
        note('owner acknowledgement'),
      ],
      { gap: 'tight' },
    ),
    queries[1],
  );
  const learned = chip('learned rollback', { color: 'yellow' }).moveTo(
    boxOf(raw.nodes[2]).point('center'),
  );
  const staff = place(
    namedBox('shared technician', { width: 380, height: 80, color: 'dim' }),
    staffRegion,
  );
  const spill = arrow(boxOf(rewrite).point('bottom'), boxOf(staff).point('right'), {
    stroke: 'yellow',
    width: 3,
    pad: 18,
  });
  const returnPath = arrow(boxOf(staff).point('left'), boxOf(raw).point('bottom'), {
    stroke: 'yellow',
    width: 3,
    pad: 18,
  });
  const procedure = dot(12, 'yellow').moveTo(boxOf(rewrite).point('bottom'));
  const [queueTitle, queueSlots] = queueRegion.rows([1, 2], 'tight');
  const title = place(note('One shared worker: queue → execution'), queueTitle);
  const slots = queueSlots.columns(4, 'normal');
  const worker = place(namedBox('worker', { width: 190, height: 70, color: 'dim' }), slots[3]);
  const control = place(chip('C query', { color: 'cyan' }), slots[2]);
  const treatment = place(chip('T rewrite', { color: 'blue' }), slots[2]);
  const queued = slots[1].point('center');
  const running = slots[2].point('center');
  const work = dot(12, 'blue').moveTo(slots[0].point('center'));
  const detour = slots[0].point('bottom');
  const approach = [running[0], detour[1]];
  const track = line(slots[0].point('bottom'), slots[3].point('bottom'), {
    stroke: 'grid',
    width: 3,
  });
  const waiting = place(note('Treatment work runs. Control waits.', { color: 'red' }), FOOT);
  const [clusterRegion, spreadRegion] = math.columns([1, 1.4], 'wide');
  const teams = clusterRegion.columns(2, 'normal').map((region, i) => {
    const units = place(
      unitChart([{ count: 20, color: i ? 'blue' : 'cyan' }], {
        columns: 4,
        cell: 13,
        gap: 6,
        shape: 'square',
      }),
      region,
    );
    return zone(units, { title: i ? 'team T' : 'team C', color: 'dim' });
  });
  const designEffect = clusterDesignEffect(20, 0.1);
  const variance = s.value(1);
  const [formulaRegion, widthRegion] = spreadRegion.rows([1, 2], 'normal');
  const formula = place(tex('1+(20-1)\\times0.1', { size: 36 }), formulaRegion);
  const center = widthRegion.point('center');
  const halfWidth = widthRegion.width * 0.24;
  const widthLabels = [
    note('independent').moveTo([center[0], center[1] - 65]),
    note('team-aware', { color: 'yellow' }).moveTo([center[0], center[1]]),
  ];
  const spreads = dynamic(() => [
    line([center[0] - halfWidth, center[1] - 32], [center[0] + halfWidth, center[1] - 32], {
      stroke: 'dim',
      width: 7,
    }),
    line(
      [center[0] - halfWidth * Math.sqrt(variance.value), center[1] + 32],
      [center[0] + halfWidth * Math.sqrt(variance.value), center[1] + 32],
      { stroke: 'yellow', width: 7 },
    ),
  ]);
  const result = place(
    mono(`variance × ${designEffect.toFixed(1)}`, { size: 36, color: 'yellow' }),
    FOOT,
  );
  const inference = place(note('20 incidents per team • team-aware inference'), FOOT);
  s.add(
    heading('Keep the exposure contrast intact'),
    raw,
    rewrite,
    staff,
    title,
    worker,
    control,
    track,
  );
  s.add(b.standing);
  c.on('policy', () => s.play(indicate(rewrite, { scale: 1 })));
  c.on('versions', () => s.play(indicate([raw, rewrite], { scale: 1 })));
  c.show('learning', [draw(spill), draw(returnPath), procedure]);
  c.on('learning', () => {
    s.play(to(procedure, (n) => n.moveTo(boxOf(staff).point('bottom right')), { duration: 0.8 }));
    s.play(to(procedure, (n) => n.moveTo(boxOf(staff).point('bottom left')), { duration: 0.7 }));
    s.play(to(procedure, (n) => n.moveTo(boxOf(raw).point('bottom')), { duration: 0.8 }));
  });
  c.swap('learning', raw.nodes[2], learned, { after: true, lead: -0.8 });
  c.show('compute', work);
  c.on('compute', () => {
    s.play(
      to(control, (n) => n.moveTo(queued), { duration: 0.6 }),
      tint(worker, 'blue'),
    );
    for (const point of [detour, approach, running])
      s.play(to(work, (n) => n.moveTo(point), { duration: 0.5 }));
  });
  c.hide('compute', work, { after: true, lead: -1.2 });
  c.show('compute', treatment, { after: true, lead: -1.2 });
  c.show('compute', waiting, { after: true });
  c.show(2, [teams, formula, spreads, widthLabels]);
  c.after('design-effect', () => s.play(variance.to(designEffect, { duration: 1.2 })));
  c.swap('design-effect', waiting, result, { after: true, lead: -1.3 });
  c.swap('teams', result, inference);
  c.clear([spill, returnPath, track], 0.5, 0.2);
  c.keep(b.standing);
}
