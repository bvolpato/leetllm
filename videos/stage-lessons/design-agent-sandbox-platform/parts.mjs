// The fixed host map gives every enlarged resource a location and an owner.
import {
  arrow,
  boxOf,
  dynamic,
  line,
  place,
  row,
  zone,
} from 'vizmatic/stage';
import { area, heading, namedBox } from '../kit-narrated.mjs';
export {
  sandboxPages,
  sandboxCapacity,
  sandboxAck,
  sandboxReadiness,
  sandboxRetirement,
  sandboxReconcile,
  cowSnapshot,
  capacitySnapshot,
  networkDecision,
} from '../../films/design-agent-sandbox-platform/arithmetic.mjs';
export const COLOR = {
  A: 'cyan',
  B: 'blue',
  shared: 'green',
  control: 'pink',
  current: 'yellow',
  failure: 'red',
};
export const [MAP, VIEW, FOOT] = area.rows([2.1, 5.4, 0.65], 'normal');
export const PAGE_LOOKS = {
  absent: { color: 'dim', fill: 0, dash: true },
  shared: { color: 'green', fill: 0.35 },
  present: { color: 'green', fill: 0.75 },
  copied: { color: 'cyan', fill: 0.75 },
  dirty: { color: 'yellow', fill: 0.65 },
};
export const ORDER = [
  'intro',
  'request-limits',
  'boundary',
  'kvm-descriptors',
  'jailer-surfaces',
  'clean-template',
  'cow',
  'article-page-run',
  'fault-handler',
  'clock-refresh',
  'rng-window',
  'namespace-identity',
  'freshness',
  'filesystem',
  'overlay-whiteout',
  'network',
  'egress-addresses',
  'vsock-wire',
  'bounded-ack',
  'capacity',
  'capacity-arithmetic',
  'group-budget',
  'readonly-data',
  'state-machine',
  'retirement',
  'reference-retirement',
  'reconciliation-table',
  'endpoint-clock',
  'fresh-generation',
];
// The map keeps resource identity and records the current disposal state.
export const STATE = {
  'intro': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'The guest has stopped. A host exporter still holds the scratch backing open.',
  },
  'request-limits': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'One tenant, sandbox, and generation bind placement, command, writable resources, and capabilities.',
  },
  'boundary': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'A and B have separate guest kernels. Restricted VMMs use trusted host KVM.',
  },
  'kvm-descriptors': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'RUN uses the vCPU descriptor. Failed returns bypass current exit decoding.',
  },
  'jailer-surfaces': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Host authority narrows. Guest-driven output remains bounded.',
  },
  'clean-template': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Memory, VM state, and matching disks are authenticated. User work remains held.',
  },
  'cow': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Six-page schematic. A reads its private 99 and B retains shared 30.',
  },
  'article-page-run': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'A and B own separate copies of page 1. Replacing A’s 99 with 101 leaves five modeled entries.',
  },
  'fault-handler': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'The delegated missing page remains absent. The access waits and admission is held.',
  },
  'clock-refresh': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'Wall time is current. Compatible application software handles its separate deadline state.',
  },
  'rng-window': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Kernel randomness is refreshed. Copied application state remains a separate repair.',
  },
  'namespace-identity': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'TAP names repeat in separate namespaces. Routing and fresh control remain explicit.',
  },
  'freshness': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'All five current-generation observations pass and the user gate opens.',
  },
  'filesystem': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'A reads its edited config and output row from its upper layer. The lower bytes are unchanged.',
  },
  'overlay-whiteout': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Fresh upper and work are empty. Clean lower config is visible again.',
  },
  'network': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'Public traffic reaches the API. The rebound private target stops at the external gate.',
  },
  'egress-addresses': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'The broker checks authority and constructs its own approved upstream request.',
  },
  'vsock-wire': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'The complete acknowledgement is validated before the current-generation command stream starts.',
  },
  'bounded-ack': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Both streams leave PAYLOAD unread. The upper-bound port fails range validation.',
  },
  'capacity': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'Dirty growth reduces memory slots. A synchronized wake fills cores and the waiting queue.',
  },
  'capacity-arithmetic': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'The memory-only worksheet and the CPU burst toy remain distinct. The burst queue is visible.',
  },
  'group-budget': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus':
      'All threads share one allowance. The first thread leaves the remainder for the group.',
  },
  'readonly-data': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Shared reads create host residency. GC writes create separate private dirty pages.',
  },
  'state-machine': {
    'map':
      'A pages and scratch are empty, and its control link is closed. B and shared backing remain.',
    'focus': 'A is disposed with empty private and scratch resources. B retains the base.',
  },
  'retirement': {
    'map':
      'A pages and scratch are empty, and its control link is closed. B and shared backing remain.',
    'focus':
      'Processes and control retire. Private memory and scratch reach the pool before capacity is free.',
  },
  'reference-retirement': {
    'map':
      'A pages and scratch are empty, and its control link is closed. B and shared backing remain.',
    'focus': 'The creator exits first. Final reference closure precedes resource reclamation.',
  },
  'reconciliation-table': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'Uncertain resource rows remain quarantined under the same generation owner.',
  },
  'endpoint-clock': {
    'map': 'Named A and B resources share immutable backing and retain separate control links.',
    'focus': 'The endpoint is first user entry. The supplied request misses the target.',
  },
  'fresh-generation': {
    'map':
      'A pages and scratch are empty, and its control link is closed. B and shared backing remain.',
    'focus':
      'Wrong-generation confirmation is rejected. Final closure permits disposal and fresh scratch.',
  },
};
const closeUps = new Set([
  'intro', 'cow', 'article-page-run', 'freshness', 'filesystem', 'overlay-whiteout', 'bounded-ack',
  'state-machine', 'retirement', 'endpoint-clock', 'fresh-generation',
]);

export function host(s, c, id) {
  const slots = MAP.columns([1, 1, 1.15], 'wide');
  const previous = ORDER[ORDER.indexOf(id) - 1];
  const next = ORDER[ORDER.indexOf(id) + 1];
  const owned = s.value(1);
  const control = s.value(owned.value);
  const resourceRows = [];
  const guest = (title, color, region) => {
    const resources = ['pages', 'scratch', 'ctl'].map((name, i) =>
      namedBox(name, { width: [140, 170, 110][i], height: 64, color, size: 29 }),
    );
    const frame = place(
      zone(row(resources, { gap: 'tight' }), {
        title,
        color,
        titleSize: 31,
        padding: 18,
        minWidth: region.width - 12,
      }),
      region,
    );
    resourceRows.push(resources);
    return frame;
  };
  const a = guest('A · J4 / generation 4', 'cyan', slots[0]);
  const b = guest('B · separate owner', 'blue', slots[1]);
  const base = namedBox('base pages', { width: 240, height: 64, color: 'green', size: 29 });
  const trustedControl = namedBox('control / broker', {
    width: 270,
    height: 64,
    color: 'pink',
    size: 29,
  });
  const broker = place(
    zone(row([base, trustedControl], { gap: 'tight' }), {
      title: 'Trusted KVM / host',
      color: 'pink',
      titleSize: 31,
      padding: 18,
      minWidth: slots[2].width - 12,
    }),
    slots[2],
  );
  const empty = resourceRows[0].map((node, i) =>
    place(
      namedBox(['pages', 'scratch', 'ctl'][i], {
        width: [140, 170, 110][i],
        height: 64,
        color: 'dim',
        size: 29,
        dash: true,
      }),
      boxOf(node),
    ),
  );
  // The A frame remains. Live resources replace its original children at the same measured places.
  for (const node of resourceRows[0]) node.opacity(0);
  const visible = resourceRows[0].map((node, i) =>
    place(
      namedBox(['pages', 'scratch', 'ctl'][i], {
        width: [140, 170, 110][i],
        height: 64,
        color: 'cyan',
        size: 29,
      }),
      boxOf(node),
    ),
  );
  const resources = dynamic(() =>
    visible.map((node, i) => ((i === 2 ? control.value : owned.value) ? node : empty[i])),
  );
  const links = dynamic(() => {
    const out = [];
    for (const [index, active] of [control.value, 1].entries()) {
      if (!active) continue;
      const from = boxOf(resourceRows[index][2]).point('bottom');
      const target = boxOf(trustedControl).point('bottom');
      const rail = MAP.bottom - 12 - index * 18;
      out.push(
        line(from, [from[0], rail], { stroke: index ? 'blue' : 'pink', width: 2 }),
        line([from[0], rail], [target[0], rail], { stroke: index ? 'blue' : 'pink', width: 2 }),
        arrow([target[0], rail], target, { stroke: index ? 'blue' : 'pink', pad: 4, width: 2 }),
      );
    }
    return out;
  });
  const map = [a, b, broker, resources, links];
  s.add(heading(c.title));
  if (closeUps.has(previous) || id === 'reconciliation-table') s.add(map);
  else c.take(map);
  if (next && !closeUps.has(next) && next !== 'reconciliation-table') c.keep(map);
  if (id === 'reference-retirement')
    c.after('close', () => {
      owned.set(0);
      control.set(0);
    });
  // Each enlarged view has a short stem from its named resource in the host map.
  const focus = ['filesystem', 'overlay-whiteout'].includes(id)
    ? resourceRows[0][1]
    : ['vsock-wire', 'bounded-ack', 'freshness'].includes(id)
      ? resourceRows[0][2]
      : [
            'kvm-descriptors',
            'network',
            'egress-addresses',
            'capacity',
            'capacity-arithmetic',
          ].includes(id)
        ? broker
        : a;
  const from = boxOf(focus).point('bottom');
  const stem = arrow(from, [from[0], VIEW.top + 18], { stroke: 'cyan', width: 3, pad: 2 });
  if (
    !['cow', 'article-page-run', 'readonly-data', 'retirement', 'fresh-generation'].includes(id)
  ) {
    s.add(stem);
    c.clear([stem], 0.5, 0.2);
  }
  const locate = (target, resource = 'base') => {
    const source =
      resource === 'base' ? base : visible[{ pages: 0, scratch: 1, control: 2 }[resource]];
    const leader = arrow(boxOf(source).point('bottom'), boxOf(target).point('top'), {
      stroke: resource === 'base' ? 'green' : 'cyan',
      width: 2,
      pad: 10,
    });
    s.add(leader);
    return leader;
  };
  return { a, b, broker, map, base, resources, locate };
}
