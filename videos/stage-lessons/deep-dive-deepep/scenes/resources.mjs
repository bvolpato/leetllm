// Scene 22: Resource planning starts from the route distribution.
// Beat 0: 6 pairs of 2 experts among 4 -> E[dests] = 5/3.
// Beat 1: 12 SMs, 128 pool -> direct min(12,9)=9, hybrid 12*16+1=193 capped at 128.
// Beat 2: CPU reference diff: cached vs rebuilt [1,2,3,2] vs [2,2,2,2], only token a differs (1.90 vs 3.30).
import {
  COSMOS,
  REPLAY_COMP,
  RESOURCES_12SM,
  RESOURCE_PAIRS,
  ROLE,
  aura,
  buildStreamOverlapRig3d,
  fmtVec,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function resources(s, c) {
  const phase = s.value(0);
  const smSplit = s.value(0.25);
  const waitGate = s.value(0.6);
  const viewMode = s.value(0); // 0: pairs/mean, 1: QP budget, 2: CPU ref check
  const showMean = s.value(0);
  const showPool = s.value(0);
  const showDiff = s.value(0);
  const showCounts = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#5ce1e61c');
  const { view: rig3d } = buildStreamOverlapRig3d(smSplit, waitGate, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Resource Planning', 'Starts With Routes'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.brand,
    eyebrow: 'DESTINATION COUNT · QP POOL · REFERENCE CHECK',
    subtitle: 'Enumerate destinations, cap QPs, verify output before timing',
  });

  const live = guardedDynamic(1, () => {
    const mode = Math.round(viewMode.value);
    const hasMean = Math.round(showMean.value) >= 1;
    const hasPool = Math.round(showPool.value) >= 1;
    const hasDiff = Math.round(showDiff.value) >= 1;
    const hasCounts = Math.round(showCounts.value) >= 1;

    const nodes = [
      txt('3D SM & QUEUE-PAIR RESOURCE STAGE', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        mode === 2
          ? 'Verify exact rows & counts before benchmarking'
          : mode === 1
            ? 'Direct 9 QPs · Hybrid 193 req -> 128 pool cap'
            : 'Uniform pairs of 2 experts -> mean 5/3 dests',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (mode === 0) {
      nodes.push(
        txt('ALL 6 DISTINCT EXPERT PAIRS (E=4, G=2)', -860, -135, 26, ROLE.token, 'mono', 'left'),
      );
      RESOURCE_PAIRS.forEach((p, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = -715 + col * 275;
        const cy = -55 + row * 102;
        const isOne = p.destinations === 1;
        const cHex = isOne ? ROLE.bad : ROLE.nvlink;
        nodes.push(
          rect(252, 80, { fill: '#0e1729', stroke: cHex, width: 2.2, radius: 8 }).at(cx, cy),
          txt(`[E${p.experts[0]}, E${p.experts[1]}]`, cx - 54, cy, 26, COSMOS.ink, 'mono'),
          txt(`${p.destinations}d`, cx + 76, cy, 26, cHex, 'mono'),
        );
      });
      nodes.push(
        glowTex(
          String.raw`\mathbb{E}[\mathrm{dests}] = \frac{1+2+2+2+2+1}{6} = ${hasMean ? String.raw`\frac{5}{3}` : '?'}`,
          { x: -440, y: 182, size: 38, color: hasMean ? ROLE.good : ROLE.token, glow: 6 },
        ),
        txt(
          'Skewed or group-limited routers can violate uniform-subset math',
          -860,
          302,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else if (mode === 1) {
      nodes.push(
        txt(
          `V2 sizing: ${RESOURCES_12SM.sms} comm SMs  ·  ${RESOURCES_12SM.allocated} allocated QPs`,
          -860,
          -130,
          27,
          ROLE.token,
          'mono',
          'left',
        ),
        glassCell(-440, -20, 820, 128, ROLE.rank0, { fill: '#0d1b33', glow: 6 }),
        txt('DIRECT PATH · min(12, 9)', -820, -54, 26, ROLE.rank0, 'mono', 'left'),
        txt(
          hasPool
            ? `Requested ${RESOURCES_12SM.directRequested}  ->  Allocated ${RESOURCES_12SM.direct} QPs`
            : 'Computing direct QP request...',
          -820,
          10,
          28,
          hasPool ? ROLE.good : COSMOS.muted,
          'mono',
          'left',
        ),

        glassCell(-440, 146, 820, 128, ROLE.brand, { fill: '#26170e', glow: 6 }),
        txt('HYBRID PATH · 12 x 16 + 1', -820, 112, 26, ROLE.brand, 'mono', 'left'),
        txt(
          hasPool
            ? `Requested ${RESOURCES_12SM.hybridRequested}  ->  Capped at ${RESOURCES_12SM.hybrid} QPs`
            : 'Computing hybrid QP request...',
          -820,
          176,
          28,
          hasPool ? ROLE.brand : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          'Requested QPs and allocated pool are separate limits',
          -860,
          292,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      const { cached, rebuilt } = REPLAY_COMP;
      nodes.push(
        txt('CPU REFERENCE CHECK (a: E0 -> E2)', -860, -135, 26, ROLE.token, 'mono', 'left'),
        txt('Tok', -810, -82, 26, COSMOS.muted, 'mono'),
        txt('Cached', -570, -82, 26, ROLE.bad, 'mono'),
        txt('Reference', -235, -82, 26, ROLE.nvlink, 'mono'),
      );
      ['a', 'b', 'c', 'd'].forEach((tok, idx) => {
        const y = -28 + idx * 62;
        const diff = tok === 'a';
        const col = hasDiff && diff ? ROLE.token : COSMOS.ink;
        nodes.push(
          rect(830, 50, {
            fill: hasDiff && diff ? '#281c0e' : '#0e1526',
            stroke: hasDiff && diff ? ROLE.token : COSMOS.rule,
            width: hasDiff && diff ? 2.4 : 1.4,
            radius: 6,
          }).at(-440, y),
          txt(tok, -810, y, 26, col, 'mono'),
          txt(fmtVec(cached.restored[tok], 2), -570, y, 26, diff ? ROLE.bad : col, 'mono'),
          txt(fmtVec(rebuilt.restored[tok], 2), -235, y, 26, diff ? ROLE.good : col, 'mono'),
        );
      });

      nodes.push(
        glassCell(-440, 262, 820, 96, hasCounts ? ROLE.nvlink : ROLE.token, {
          fill: '#0e1d2a',
          glow: 7,
        }),
        txt(
          hasCounts
            ? `Counts: cached [${cached.counts.join(',')}] vs ref [${rebuilt.counts.join(',')}]`
            : 'Both return 8 slots · only token a differs!',
          -440,
          262,
          26,
          hasCounts ? ROLE.nvlink : ROLE.token,
          'mono',
        ),
        txt(
          'Fix the route before timing precision, waits, or latency',
          -860,
          362,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('resources-beat-1-focus-1', () =>
    s.play(smSplit.to(0.3, { duration: remainDuration(c, 'resources-beat-1-focus-1', 0.45) })),
  );
  c.on('resources-beat-1-focus-2', () =>
    s.play(smSplit.to(0.35, { duration: remainDuration(c, 'resources-beat-1-focus-2', 0.4) })),
  );
  c.after('dep-result-resources-mean', () =>
    s.play(showMean.to(1, { duration: remainAfterDuration(c, 'dep-result-resources-mean', 0.3) })),
  );

  c.on('resources-beat-2-focus-1', () => {
    s.play(viewMode.to(1, { duration: 0.25 }));
    s.play(smSplit.to(0.55, { duration: remainDuration(c, 'resources-beat-2-focus-1', 0.6) }));
  });
  c.on('resources-beat-2-focus-2', () =>
    s.play(waitGate.to(1, { duration: remainDuration(c, 'resources-beat-2-focus-2', 0.45) })),
  );
  c.after('dep-result-resources-pool', () =>
    s.play(showPool.to(1, { duration: remainAfterDuration(c, 'dep-result-resources-pool', 0.3) })),
  );

  c.on('resources-beat-3-focus-1', () => {
    s.play(viewMode.to(2, { duration: 0.25 }));
  });
  c.after('resources-return-home', () =>
    s.play(showDiff.to(1, { duration: remainAfterDuration(c, 'resources-return-home', 0.3) })),
  );
  c.on('de-resources-counts', () =>
    s.play(showCounts.to(1, { duration: remainDuration(c, 'de-resources-counts', 0.45) })),
  );
}
