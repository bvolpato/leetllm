// Scene 15: A prepared batch must carry current request state (Batch B metadata rev 2 ready vs late consumer requiring rev 3 -> HOLD).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function metadataReady(s, c) {
  // step: 0=Batch B prepared with rev 2 -> consumer expects rev 2 (READY),
  // 1=late grammar/KV update -> consumer requires rev 3 (HOLD at GPU launch),
  // 2=identify first consumer & readiness event
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b18', '#5ce1e618');
  const title = heroTitle(['Prepared Metadata Must', 'Match Launch State'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warn,
    eyebrow: 'OVERLAP CORRECTNESS · BATCH B DEPENDENCY CHECK',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const late = st >= 1;
    const nodes = [];

    // Top mini-timeline showing Host plan B during GPU A
    const x0 = -560;
    const xOf = (t) => x0 + (t / 10) * 1300;
    nodes.push(
      txt('Host Plan B', -790, -135, 26, ROLE.fail, 'mono', 'left'),
      glassCell((xOf(1) + xOf(2)) / 2, -135, xOf(2) - xOf(1), 64, ROLE.fail, {
        fill: '#2a1224',
        glow: 8,
      }),
      txt('Plan B', (xOf(1) + xOf(2)) / 2, -135, 26, COSMOS.ink, 'mono'),

      txt('GPU Stream', -790, -45, 26, ROLE.prefill, 'mono', 'left'),
      glassCell((xOf(1) + xOf(5)) / 2, -45, xOf(5) - xOf(1) - 10, 68, ROLE.prefill, {
        fill: '#10213d',
        glow: 8,
      }),
      txt('GPU Batch A (1..5)', (xOf(1) + xOf(5)) / 2, -45, 26, COSMOS.ink, 'mono'),
      glassCell(
        (xOf(5) + xOf(9)) / 2,
        -45,
        xOf(9) - xOf(5) - 10,
        68,
        late ? ROLE.fail : ROLE.decode,
        {
          fill: late ? '#2c1120' : '#0d2922',
          glow: 9,
        },
      ),
      txt(
        late ? 'GPU Batch B (HOLD!)' : 'GPU Batch B (5..9)',
        (xOf(5) + xOf(9)) / 2,
        -45,
        26,
        COSMOS.ink,
        'mono',
      ),
    );

    // Attached Batch B record vs GPU runner consumer check
    nodes.push(
      glassCell(-420, 140, 740, 210, ROLE.radix, { fill: '#0e2234', glow: 9 }),
      txt('PREPARED BATCH B RECORD', -420, 72, 26, ROLE.radix, 'mono'),
      txt('Request: R42  ·  positions [4, 5]', -420, 128, 28, COSMOS.ink, 'mono'),
      txt('KV slots: [12, 13]  ·  grammar rev 2', -420, 184, 28, COSMOS.gold, 'mono'),

      line([-40, 140], [50, 140], { color: late ? ROLE.fail : ROLE.decode, width: 4 }),

      glassCell(430, 140, 740, 210, late ? ROLE.fail : ROLE.decode, {
        fill: late ? '#2c1120' : '#0d2922',
        glow: 11,
      }),
      txt('RUNNER LAUNCH CHECK (t = 5)', 430, 72, 26, late ? ROLE.fail : ROLE.decode, 'mono'),
      txt(
        late ? 'Consumer requires grammar rev 3' : 'Consumer expects grammar rev 2',
        430,
        128,
        28,
        COSMOS.ink,
        'mono',
      ),
      txt(
        late ? 'MISMATCH -> HOLD GPU LAUNCH' : 'READY -> LAUNCH IMMEDIATELY',
        430,
        184,
        28,
        late ? ROLE.fail : ROLE.decode,
        'mono',
      ),
    );

    nodes.push(
      txt(
        st >= 2
          ? 'Preserve output correctness and completion time; trace the first consumer readiness event.'
          : late
            ? 'A stale record pointing to recycled KV or old grammar state is not a valid speedup.'
            : 'Request IDs, positions, KV locations, and grammar state must agree at handoff.',
        0,
        345,
        28,
        late ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['sg-metadata-ready-beat-0', 0],
    ['sg-metadata-late', 1],
    ['sg-metadata-ready-beat-1', 2, true],
  ]);
}
