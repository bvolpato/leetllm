import {
  arrow,
  boxOf,
  column,
  draw,
  indicate,
  pictogram,
  place,
  rect,
  table,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';
import { deviceEnumeration } from '../../../films/git-shell-linux-reproducible-ai/arithmetic.mjs';

export default function deviceContract(s, c) {
  const { main } = repositoryContext(s, c);
  const [maskBand, physicalBand, appBand, probeBand, foot] = main.rows([1, 2.4, 2.6, 2, 1], 'wide');
  const physical = [0, 1, 2],
    masked = deviceEnumeration(physical, '2,0'),
    unmasked = deviceEnumeration(physical, null);
  const mask = place(mono('CUDA_VISIBLE_DEVICES=2,0', { color: 'yellow' }), maskBand);
  const emptyMask = place(mono('CUDA_VISIBLE_DEVICES=""', { color: 'yellow' }), maskBand);
  const unsetMask = place(mono('CUDA_VISIBLE_DEVICES unset', { color: 'yellow' }), maskBand);
  const physicalRegions = physicalBand.columns(physical.length, 'wide');
  const host = physicalRegions.map((region, i) =>
    place(
      column(
        [
          pictogram('core', { size: 110, color: 'blue' }),
          mono(`physical ${physical[i]}`, { size: 34, color: 'blue' }),
        ],
        { gap: 'normal' },
      ),
      region,
    ),
  );
  const slots = appBand.columns(physical.length, 'wide');
  const frames = slots.map((region) =>
    place(
      rect(region.width, region.height, {
        fill: 'surface',
        stroke: 'dim',
        strokeWidth: 2,
        radius: 12,
        dash: [10, 8],
      }),
      region,
    ).zIndex(-1),
  );
  const apps = slots.map((region, i) =>
    place(label(`application ${i}`, { size: 34 }), region.inset('normal'), 'bottom'),
  );
  const aliases = masked.map((entry) =>
    place(
      mono(`physical ${entry.physical}`, { size: 36, color: 'cyan' }),
      slots[entry.logical],
      'center',
    ),
  );
  const normal = unmasked.map((entry) =>
    place(
      mono(`physical ${entry.physical}`, { size: 36, color: 'cyan' }),
      slots[entry.logical],
      'center',
    ),
  );
  const wires = masked.map((entry) =>
    arrow(physicalRegions[entry.physical].point('bottom'), slots[entry.logical].point('top'), {
      stroke: 'cyan',
      pad: 64,
      width: 4,
    }),
  );
  const normalWires = unmasked.map((entry) =>
    arrow(physicalRegions[entry.physical].point('bottom'), slots[entry.logical].point('top'), {
      stroke: 'cyan',
      pad: 18,
      width: 4,
    }),
  );
  const probes = place(
    table(
      [
        { key: 'id', label: 'driver view', sample: 'nvidia-smi' },
        { key: 'python', label: 'interpreter', sample: 'selected Python' },
        { key: 'framework', label: 'framework probe', sample: 'application devices' },
      ],
      [{ id: 'nvidia-smi', python: 'selected Python', framework: 'application devices' }],
      { width: probeBand.width, size: 34 },
    ),
    probeBand,
  );
  const empty = place(mono('0 application devices', { color: 'red' }), foot);
  const boundary = place(note('Record mask, driver, interpreter, and framework together.'), foot);
  s.add(mask, host, frames, apps, probes);
  c.show('mask-device-map', [draw(wires[0], { duration: 0.6 }), aliases[0]], { after: true });
  c.show('mask-second-device', [draw(wires[1], { duration: 0.5 }), aliases[1]], { after: true });
  c.swap('mask-emptied', mask, emptyMask);
  c.hide('mask-emptied', [wires, aliases]);
  c.show('empty-device-mask', empty, { after: true });
  c.swap('unset-device-mask', emptyMask, unsetMask);
  c.hide('unset-device-mask', empty);
  c.show('unset-device-mask', [normalWires.map((wire) => draw(wire, { duration: 0.5 })), normal], {
    after: true,
  });
  c.show('device-probe-boundary', boundary);
  c.on('device-probe-boundary', () => s.play(probes.light('nvidia-smi')));
  c.clear(normalWires, 0.46, 0.2);
}
