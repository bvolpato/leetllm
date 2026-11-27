// Scene 05: How long does the reader wait? (Arrival 0 -> first output 240 ms TTFT -> 280 ms [+40 ITL] -> 350 ms [+70 ITL].)
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function tokenClocks(s, c) {
  // step: 0=arrival 0ms, 1=first token 240ms (TTFT), 2=gaps 40ms & 70ms (ITL), 3=TTFT stages breakdown
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#5ce1e618');
  const title = heroTitle(['How Long Does the', 'Reader Wait?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'CLIENT LATENCY CLOCKS · TTFT VS ITL',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    const xOf = (ms) => -730 + (ms / 350) * 1460;
    const axisY = -30;

    // Main timeline axis
    nodes.push(line([xOf(0), axisY], [xOf(350), axisY], { color: '#475569', width: 4 }));

    const ticks = [
      { ms: 0, label: '0 ms', tag: 'Arrival', show: true, col: ROLE.prefill },
      { ms: 240, label: '240 ms', tag: 'Token 1', show: st >= 1, col: ROLE.decode },
      { ms: 280, label: '280 ms', tag: 'Token 2', show: st >= 2, col: ROLE.radix },
      { ms: 350, label: '350 ms', tag: 'Token 3', show: st >= 2, col: ROLE.radix },
    ];

    ticks.forEach((tk) => {
      const tx = xOf(tk.ms);
      nodes.push(
        line([tx, axisY - 18], [tx, axisY + 18], {
          color: tk.show ? tk.col : COSMOS.dim,
          width: 3,
        }),
        txt(tk.label, tx, axisY + 52, 26, tk.show ? tk.col : COSMOS.dim, 'mono'),
      );
      if (tk.show) {
        nodes.push(
          glowDot(tx, axisY, { radius: 10, color: tk.col }),
          txt(tk.tag, tx, axisY - 48, 26, tk.col, 'mono'),
        );
      }
    });

    // TTFT span bar (0 -> 240 ms)
    if (st >= 1) {
      nodes.push(
        line([xOf(0), axisY - 115], [xOf(240), axisY - 115], { color: ROLE.prefill, width: 5 }),
        glassCell((xOf(0) + xOf(240)) / 2, axisY - 165, 360, 66, ROLE.prefill, {
          fill: '#10213c',
          glow: 8,
        }),
        txt('TTFT = 240 ms', (xOf(0) + xOf(240)) / 2, axisY - 165, 30, ROLE.prefill, 'mono'),
      );
    }

    // ITL gap callouts (40 ms & 70 ms)
    if (st >= 2) {
      nodes.push(
        glassCell(xOf(260) - 90, axisY + 130, 260, 68, ROLE.radix, { fill: '#0e2433', glow: 8 }),
        txt('ITL 1 = 40 ms', xOf(260) - 90, axisY + 130, 28, ROLE.radix, 'mono'),
        glassCell(xOf(315) + 45, axisY + 130, 260, 68, COSMOS.gold, { fill: '#221c10', glow: 8 }),
        txt('ITL 2 = 70 ms', xOf(315) + 45, axisY + 130, 28, COSMOS.gold, 'mono'),
      );
    }

    // Beat 1: TTFT internal stages breakdown
    const stages = [
      { label: 'Tokenize', col: ROLE.prefill },
      { label: 'Queue + Lookup', col: ROLE.radix },
      { label: 'First Forward', col: ROLE.grammar },
      { label: 'Sample + Deliver', col: ROLE.decode },
    ];
    stages.forEach((sg, i) => {
      const cx = -570 + i * 380;
      const active = st >= 3;
      nodes.push(
        glassCell(cx, 235, 345, 76, active ? sg.col : COSMOS.dim, {
          fill: active ? '#111d34' : '#0a0f1c',
          glow: active ? 8 : 2,
        }),
        txt(sg.label, cx, 235, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    });

    nodes.push(
      txt(
        st >= 3
          ? 'If the GPU was idle, check when the request entered its first batch.'
          : st >= 2
            ? 'Inter-token latency measures consecutive client arrival gaps: 40 ms, then 70 ms.'
            : 'TTFT spans request arrival (0 ms) to the first output token (240 ms).',
        0,
        355,
        28,
        st >= 3 ? COSMOS.gold : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['sg-token-clocks-beat-0', 0],
    ['sg-clock-first', 1, true],
    ['sg-clock-gaps', 2, true],
    ['sg-token-clocks-beat-1', 3],
  ]);
}
