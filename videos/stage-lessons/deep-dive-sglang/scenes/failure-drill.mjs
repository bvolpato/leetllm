// Scene 30: Where did the four-token hit go? (PREDICTION SCENE: [10,20,30,40] -> edit 10->99 drops hit to 0; restore 10 -> 4; route to cold B -> PREDICT HOLD -> 0; long prefill decode stall).
import {
  COSMOS,
  DRILL_EDITED,
  DRILL_WARM,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  prefixReuse,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function failureDrill(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = warm Replica A reference: [10,20,30,40] matches 4/4
  // 1 = edit first ID 10 -> 99
  // 2 = hit drops to 0!
  // 3 = restore 10 on Replica A
  // 4 = 4 positions reusable again
  // 5 = route identical request to cold Replica B -> PREDICT HOLD ("how many of the 4 positions does B find?")
  // 6 = 0 on Replica B!
  // 7 = inverted symptom: high hits yet ITL spikes -> long prefill fills gap between decode steps
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1a', '#5ce1e618');
  const title = heroTitle(['Production Failure Drill:', 'Where Did the Hit Go?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.fail,
    eyebrow: 'DIAGNOSTICS · TOKEN SHIFT · COLD REPLICA · PREFILL STALL',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st < 7) {
      const edited = st === 1 || st === 2;
      const moved = st >= 5;
      const req = edited ? DRILL_EDITED : DRILL_WARM;
      const local = moved ? [] : DRILL_WARM;
      const hit = prefixReuse(local, req, 'A', 'A').reusable;
      const showHit = st === 0 || st === 2 || st === 4 || st === 6;

      nodes.push(
        txt('REDACTED REPLAY · MODEL R7 · ADAPTER A', -760, -210, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Row 1: Incoming token IDs
      nodes.push(txt('Incoming IDs', -760, -118, 28, COSMOS.ink, 'mono', 'left'));
      req.forEach((id, i) => {
        const cx = -180 + i * 260;
        const isEdited = edited && i === 0;
        nodes.push(
          glassCell(cx, -118, 224, 94, isEdited ? COSMOS.gold : ROLE.prefill, {
            fill: isEdited ? '#261e0e' : '#10213d',
            glow: isEdited ? 11 : 7,
          }),
          txt(String(id), cx, -118, 38, isEdited ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
      });

      // Row 2: Local Replica Tree
      nodes.push(
        txt(
          moved ? 'Replica B (COLD)' : 'Replica A (WARM)',
          -760,
          25,
          28,
          moved ? ROLE.fail : ROLE.radix,
          'mono',
          'left',
        ),
      );
      for (let i = 0; i < 4; i++) {
        const cx = -180 + i * 260;
        const val = local[i];
        nodes.push(
          glassCell(cx, 25, 224, 94, val !== undefined ? ROLE.radix : COSMOS.dim, {
            fill: val !== undefined ? '#0e2436' : '#0b101d',
            glow: val !== undefined ? 7 : 2,
          }),
          txt(
            val !== undefined ? String(val) : 'empty',
            cx,
            25,
            32,
            val !== undefined ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }

      // Row 3: Matched prefix count (STRICTLY WITHHELD as "?" on step 5!)
      const hitCol = !showHit ? COSMOS.gold : hit > 0 ? ROLE.decode : ROLE.fail;
      nodes.push(
        txt('Matched prefix positions', -760, 185, 28, COSMOS.ink, 'mono', 'left'),
        glassCell(210, 185, 420, 108, hitCol, {
          fill: !showHit ? '#201c10' : hit > 0 ? '#0d2922' : '#2c1120',
          glow: 11,
        }),
        txt(showHit ? `${hit} / 4 hits` : '? / 4 hits', 210, 185, 42, hitCol, 'mono'),
      );
    } else {
      // Beat 3: Inverted symptom (high hits, decode ITL stall from long prefill)
      const x0 = -560;
      const xOf = (t) => x0 + (t / 10) * 1240;
      nodes.push(
        txt(
          'INVERTED SYMPTOM: HIGH CACHE HITS, YET DECODE ITL SPIKES',
          0,
          -200,
          28,
          COSMOS.gold,
          'mono',
        ),
        txt('Long Prefill', -780, -75, 26, ROLE.fail, 'mono', 'left'),
        glassCell((xOf(2) + xOf(7)) / 2, -75, xOf(7) - xOf(2), 92, ROLE.fail, {
          fill: '#2c1120',
          glow: 11,
        }),
        txt('Unchunked Long Prefill (t = 2..7)', (xOf(2) + xOf(7)) / 2, -75, 28, ROLE.fail, 'mono'),

        txt('Active Decode', -780, 95, 26, ROLE.prefill, 'mono', 'left'),
        glassCell((xOf(0) + xOf(2)) / 2, 95, xOf(2) - xOf(0), 92, ROLE.prefill, {
          fill: '#10213d',
          glow: 8,
        }),
        txt('Dec 1', (xOf(0) + xOf(2)) / 2, 95, 28, COSMOS.ink, 'mono'),
        glassCell((xOf(7) + xOf(9)) / 2, 95, xOf(9) - xOf(7), 92, ROLE.prefill, {
          fill: '#10213d',
          glow: 8,
        }),
        txt('Dec 2', (xOf(7) + xOf(9)) / 2, 95, 28, COSMOS.ink, 'mono'),

        glassCell(0, 235, 1460, 84, COSMOS.gold, { fill: '#201c10', glow: 8 }),
        txt(
          'Check admitted chunk size, runner/collective timing, and P/D transfer queues',
          0,
          235,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 295, { radius: 6, color: st === 5 ? COSMOS.gold : ROLE.fail }),
      txt(
        st === 0
          ? 'Warm Replica A matches all 4 leading IDs [10, 20, 30, 40].'
          : st === 1
            ? 'Changing only the first ID (10 -> 99) while keeping 20, 30, 40 identical...'
            : st === 2
              ? 'Prefix hit drops to 0: lookup stops at the very first token difference.'
              : st === 3
                ? 'Restoring 10 on Replica A...'
                : st === 4
                  ? 'Restored 10 on Replica A: 4 / 4 reusable.'
                  : st === 5
                    ? 'Predict: Route the exact same request to cold Replica B. How many of the 4 positions match?'
                    : st === 6
                      ? '0 on Replica B: different replica cache explains the miss; trace queue/allocator for idle GPU.'
                      : 'Long prefill stalls active readers between decode steps; replay one change at a time.',
        0,
        355,
        28,
        st === 5 ? COSMOS.gold : st === 2 || st === 6 ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['drill-reference', 0],
    ['drill-change', 1],
    ['drill-miss', 2, true],
    ['drill-restore', 3],
    ['drill-warm', 4],
    ['drill-move', 5],
    ['drill-cold', 6, true],
    ['drill-timing', 7],
  ]);
}
