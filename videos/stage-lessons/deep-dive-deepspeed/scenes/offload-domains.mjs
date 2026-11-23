import { boxOf, codeBlock, connector, dot, indicate, place } from 'vizmatic/stage';
import { mono, namedBox, note } from '../../kit-narrated.mjs';
import { WORK, open, finish } from '../parts.mjs';
export default function domains(s, c) {
  const b = open(s, c, 'offload-domains');
  const [diagram, config] = WORK.columns([2, 3], 'loose');
  const [g, p, n, formula] = diagram.rows([1, 1, 1, 1], 'normal');
  const gpu = place(namedBox('GPU: compute W', { width: 450, height: 76, color: 'blue' }), g);
  const cpu = place(namedBox('CPU: Adam update', { width: 450, height: 76, color: 'pink' }), p);
  const nvme = place(
    namedBox('NVMe: parameter storage', { width: 450, height: 76, color: 'blue' }),
    n,
  );
  const store = connector(cpu, nvme, { color: 'blue' }),
    stage = connector(cpu, gpu, { color: 'blue' });
  const math = place(
    mono('service ≥ bytes / bandwidth\noverlap ≥ max(transfer, compute)', { size: 29 }),
    formula,
  );
  const sum = place(
    mono('dependency → transfer + compute', { size: 29, color: 'yellow' }),
    formula,
  );
  const [codeArea, foot] = config.rows([9, 1], 'normal');
  const source = place(
    codeBlock(
      '{\n  "zero_optimization": {\n    "stage": 3,\n    "offload_optimizer": {\n      "device": "cpu", "pin_memory": true\n    },\n    "offload_param": {\n      "device": "nvme",\n      "nvme_path": "/local_nvme/deepspeed"\n    }\n  }\n}',
      { language: 'json', size: 29, leading: 1.05 },
    ),
    codeArea,
  );
  const cpuField = source.find('"device": "cpu"'),
    nvmeField = source.find('"device": "nvme"');
  const fieldEnd = (field) => {
    const p = boxOf(field).point('left');
    return [p[0] - 18, p[1]];
  };
  const cpuLink = connector(fieldEnd(cpuField), cpu, { color: 'pink' }),
    nvmeLink = connector(fieldEnd(nvmeField), nvme, { color: 'blue' });
  const partial = place(
    note('Partial config: verify storage · I/O · host staging', { color: 'yellow' }),
    foot,
  );
  s.add(gpu, cpu, nvme, store, stage, source, math);
  c.show('cpu', cpuLink);
  c.on('cpu', () => s.play(indicate(cpu, { scale: 1, color: 'yellow' })));
  c.show('nvme', nvmeLink);
  c.on('nvme', () => s.play(store.send(dot(14, 'blue'), { duration: 1.6 })));
  c.on('work', () =>
    s.play(
      indicate(cpu, { scale: 1, color: 'yellow' }),
      store.send(dot(14, 'blue'), { duration: 1.6, reverse: true }),
    ),
  );
  c.swap('dependency', math, sum);
  c.show('partial', partial);
  c.on('verify', () => s.play(indicate(partial, { scale: 1, color: 'yellow' })));
  finish(c, b, 'offload-domains');
}
