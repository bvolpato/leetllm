// Scene 01: When can Python print the mean? Async launch vs host scalar sync with orbiting 3D GPU package.
import {
  COSMOS,
  TICKET_CLOCK,
  TOKEN_VALUES,
  afterDuration,
  aura,
  buildDualClockNodes,
  buildGpuPackage3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const clockTime = s.value(TICKET_CLOCK.hostStart);
  const askPredict = s.value(0);
  const callingItem = s.value(0);
  const scalarRevealed = s.value(0);

  const bgAura = aura(510, -255, 440, '#5ce1e626', '#60a5fa14');
  const gpu3d = buildGpuPackage3d(phase, { x: 540, y: -270, unit: 54 });

  const title = heroTitle(['When Is a CUDA', 'Result Ready?'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'CUDA ASYNCHRONOUS EXECUTION',
  });

  const live = guardedDynamic(1, () => {
    const t = clockTime.value;
    const pred = askPredict.value;
    const item = callingItem.value;
    const rev = scalarRevealed.value;
    const pulse = 0.72 + 0.28 * Math.sin(phase.value * 3.4);

    const nodes = [];

    // 8 GPU token cells floating cleanly under the hero title on the left
    nodes.push(txt('GPU INPUT ROW x (float32)', -855, -206, 26, COSMOS.cyan, 'mono', 'left'));
    TOKEN_VALUES.forEach((val, i) => {
      const cx = -812 + i * 116;
      const cy = -92;
      nodes.push(
        glassCell(cx, cy, 98, 86, COSMOS.cyan, { fill: '#0d1c2e', glow: 6 }),
        txt(`T${i}`, cx, cy - 66, 26, COSMOS.muted, 'mono'),
        txt(String(val), cx, cy + 4, 38, COSMOS.ink, 'mono'),
      );
    });

    // Dual-track execution timeline across lower half
    const { nodes: clockNodes, run } = buildDualClockNodes({
      clock: TICKET_CLOCK,
      time: t,
      ticks: [0, 10, 20, 30, 40, 50],
      x0: -600,
      x1: 790,
      hostY: 128,
      streamY: 268,
      waiting: item > 0.5,
      showStreamInterval: false,
      showHostInterval: false,
    });
    nodes.push(...clockNodes);

    // Bottom readout strip: handle vs Python scalar (strictly withheld until scalarRevealed)
    nodes.push(
      glassCell(-555, 395, 580, 96, run.returned ? COSMOS.blue : COSMOS.dim, {
        fill: '#0e172a',
        glow: run.returned ? 8 : 0,
      }),
      txt('pooled = x.mean()', -815, 375, 28, COSMOS.blue, 'mono', 'left'),
      txt(
        run.returned ? 'CUDA tensor handle (queued)' : 'launching kernel...',
        -815,
        416,
        26,
        run.returned ? COSMOS.ink : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    const scalarColor =
      rev > 0.5 ? COSMOS.emerald : pred > 0.5 || item > 0.5 ? COSMOS.gold : COSMOS.dim;
    const scalarText = rev > 0.5 && run.scalar !== null ? String(run.scalar) : '?';
    nodes.push(
      glassCell(350, 395, 860, 96, scalarColor, {
        fill: '#101828',
        glow: rev > 0.5 ? 10 * pulse : 7,
      }),
      txt(
        item > 0.5 ? 'pooled.item() -> Python' : 'Python scalar',
        -45,
        375,
        28,
        item > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        rev > 0.5
          ? 'GPU finished · value copied back'
          : item > 0.5
            ? 'Python waits for GPU stream'
            : pred > 0.5
              ? 'Can Python print it yet?'
              : 'awaiting host read',
        -45,
        416,
        26,
        rev > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),
      txt(scalarText, 735, 398, 52, scalarColor, 'mono', 'right').glow(9, scalarColor),
    );

    return group(...nodes);
  });

  s.add(bgAura, gpu3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, gpu3d, { theta: -0.24, phi: 0.96 });

  c.on('start-clock', () => s.play(clockTime.to(TICKET_CLOCK.eventStart, { duration: 0.45 })));
  c.on('host-return', () => s.play(clockTime.to(TICKET_CLOCK.hostReturn, { duration: 0.45 })));
  c.on('opening-prediction', () => s.play(askPredict.to(1, { duration: 0.35 })));
  c.on('read-call', () => s.play(callingItem.to(1, { duration: 0.35 })));
  c.on('stream-advances', () =>
    s.play(
      clockTime.to(TICKET_CLOCK.eventEnd, {
        duration: remainDuration(c, 'stream-advances', 1.4),
      }),
    ),
  );
  // Strict prediction withholding: scalar arrives and displays only AFTER "Now the number comes back"
  c.after('number-returns', () => {
    const dur = afterDuration(c, 'number-returns', 0.4);
    s.play(clockTime.to(TICKET_CLOCK.scalarAt, { duration: dur }));
    s.play(scalarRevealed.to(1, { duration: dur }));
  });
}
