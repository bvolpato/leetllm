import { narratedLesson } from '../../lib/narrated-lesson.mjs';
import scene0 from './scenes/intro.mjs';
import scene1 from './scenes/request-limits.mjs';
import scene2 from './scenes/boundary.mjs';
import scene3 from './scenes/kvm-descriptors.mjs';
import scene4 from './scenes/jailer-surfaces.mjs';
import scene5 from './scenes/clean-template.mjs';
import scene6 from './scenes/cow.mjs';
import scene7 from './scenes/article-page-run.mjs';
import scene8 from './scenes/fault-handler.mjs';
import scene9 from './scenes/clock-refresh.mjs';
import scene10 from './scenes/rng-window.mjs';
import scene11 from './scenes/namespace-identity.mjs';
import scene12 from './scenes/freshness.mjs';
import scene13 from './scenes/filesystem.mjs';
import scene14 from './scenes/overlay-whiteout.mjs';
import scene15 from './scenes/network.mjs';
import scene16 from './scenes/egress-addresses.mjs';
import scene17 from './scenes/vsock-wire.mjs';
import scene18 from './scenes/bounded-ack.mjs';
import scene19 from './scenes/capacity.mjs';
import scene20 from './scenes/capacity-arithmetic.mjs';
import scene21 from './scenes/group-budget.mjs';
import scene22 from './scenes/readonly-data.mjs';
import scene23 from './scenes/state-machine.mjs';
import scene24 from './scenes/retirement.mjs';
import scene25 from './scenes/reference-retirement.mjs';
import scene26 from './scenes/reconciliation-table.mjs';
import scene27 from './scenes/endpoint-clock.mjs';
import scene28 from './scenes/fresh-generation.mjs';
export default narratedLesson({
  id: 'design-agent-sandbox-platform',
  scenes: {
    'intro': scene0,
    'request-limits': scene1,
    'boundary': scene2,
    'kvm-descriptors': scene3,
    'jailer-surfaces': scene4,
    'clean-template': scene5,
    'cow': scene6,
    'article-page-run': scene7,
    'fault-handler': scene8,
    'clock-refresh': scene9,
    'rng-window': scene10,
    'namespace-identity': scene11,
    'freshness': scene12,
    'filesystem': scene13,
    'overlay-whiteout': scene14,
    'network': scene15,
    'egress-addresses': scene16,
    'vsock-wire': scene17,
    'bounded-ack': scene18,
    'capacity': scene19,
    'capacity-arithmetic': scene20,
    'group-budget': scene21,
    'readonly-data': scene22,
    'state-machine': scene23,
    'retirement': scene24,
    'reference-retirement': scene25,
    'reconciliation-table': scene26,
    'endpoint-clock': scene27,
    'fresh-generation': scene28,
  },
});
