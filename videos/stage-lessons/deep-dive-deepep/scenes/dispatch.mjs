// Scene 03: Destination copies and expert assignments count different work.
// Beat 0: 8 assignments, 8 dest rows. Beat 1: a -> E2/E3 dedup -> 8 assignments, 7 dest rows.
// Beat 2: a -> E2/-1 masked -> 7 assignments, 7 dest rows.
import {
  COSMOS,
  LEDGER_BASE,
  LEDGER_DEDUP,
  LEDGER_MASKED,
  ROLE,
  ROUTES_DEDUP,
  ROUTES_MASKED,
  aura,
  buildDualGpuNvlinkRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  hidden,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  routes,
  runPhase,
  source,
  txt,
} from '../parts.mjs';

export default function dispatch(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(0);
  const travel = s.value(0.2);
  const expand = s.value(0);
  const beatMode = s.value(0); // 0: table base, 1: dedup flow, 2: table masked
  const revealEight = s.value(0);
  const sendProg = s.value(0);
  const e2Prog = s.value(0);
  const e3Prog = s.value(0);
  const revealSeven = s.value(0);
  const revealMask = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#fb923c1a');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Destination Rows vs.', 'Expert Assignments'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.nvlink,
    eyebrow: 'FOUR-TOKEN ROUTING LEDGER · 2 RANKS, 4 EXPERTS',
    subtitle: 'Rank 0 owns [E0, E1] · Rank 1 owns [E2, E3]',
  });

  const live = guardedDynamic(1, () => {
    const mode = Math.round(beatMode.value);
    const nodes = [
      txt('3D DEDUP TRANSPORT + LOCAL EXPANSION', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        mode === 1
          ? '1 copy sent to Rank 1 -> split into E2 & E3'
          : mode === 2
            ? 'Unused -1 slot skips transport & expert work'
            : 'Every token initially touches both ranks',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (mode === 1) {
      const sent = Math.round(sendProg.value) >= 1;
      const gotE2 = Math.round(e2Prog.value) >= 1;
      const gotE3 = Math.round(e3Prog.value) >= 1;
      const sev = Math.round(revealSeven.value) >= 1;

      nodes.push(
        glassCell(-720, -25, 260, 108, ROLE.token, { fill: '#1e190e', glow: 7 }),
        txt('Token a [1, 0]', -720, -44, 26, ROLE.token, 'mono'),
        txt('src Rank 0', -720, -2, 26, COSMOS.muted, 'mono'),

        line([-585, -25], [-495, -25], {
          stroke: sent ? ROLE.nvlink : COSMOS.dim,
          width: 4,
        }),

        glassCell(-360, -25, 260, 108, sent ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0c202e',
          glow: sent ? 7 : 0,
        }),
        txt('Rank 1 Recv', -360, -44, 26, sent ? ROLE.nvlink : COSMOS.muted, 'mono'),
        txt(sent ? '1 wire row' : 'pending', -360, -2, 26, sent ? ROLE.good : COSMOS.dim, 'mono'),

        line([-225, -45], [-165, -95], { stroke: gotE2 ? ROLE.good : COSMOS.dim, width: 3.5 }),
        line([-225, -5], [-165, 55], { stroke: gotE3 ? ROLE.good : COSMOS.dim, width: 3.5 }),

        glassCell(-55, -100, 220, 92, gotE2 ? ROLE.good : COSMOS.dim, { fill: '#0e241b' }),
        txt('E2 slot', -55, -118, 26, gotE2 ? ROLE.good : COSMOS.muted, 'mono'),
        txt(gotE2 ? 'gate 0.70' : 'pending', -55, -78, 26, COSMOS.ink, 'mono'),

        glassCell(-55, 60, 220, 92, gotE3 ? ROLE.good : COSMOS.dim, { fill: '#0e241b' }),
        txt('E3 slot', -55, 42, 26, gotE3 ? ROLE.good : COSMOS.muted, 'mono'),
        txt(gotE3 ? 'gate 0.30' : 'pending', -55, 82, 26, COSMOS.ink, 'mono'),

        txt(
          `Token a: ${sent ? 1 : 0} dest row  ·  ${(gotE2 ? 1 : 0) + (gotE3 ? 1 : 0)} expert slots`,
          -860,
          205,
          28,
          ROLE.nvlink,
          'mono',
          'left',
        ),
        glassCell(-440, 322, 820, 92, sev ? ROLE.good : COSMOS.dim, {
          fill: sev ? '#0e241d' : '#111626',
          glow: sev ? 8 : 0,
        }),
        txt(
          sev
            ? `All 4 tokens: ${LEDGER_DEDUP.slots.length} assignments · ${LEDGER_DEDUP.destinations} dest rows`
            : 'Expanding Rank 1 locally · 4-token totals pending',
          -440,
          322,
          27,
          sev ? ROLE.good : COSMOS.muted,
          'mono',
        ),
      );
    } else {
      const isMask = mode === 2;
      const curChoices = isMask ? ROUTES_MASKED : routes;
      const curLedger = isMask ? LEDGER_MASKED : LEDGER_BASE;
      const ready = isMask ? Math.round(revealMask.value) >= 1 : Math.round(revealEight.value) >= 1;

      const cols = [-805, -640, -400, -145];
      const headers = ['Tok', 'Rank', 'Choice 0', 'Choice 1'];
      headers.forEach((h, i) => {
        nodes.push(txt(h, cols[i], -120, 26, COSMOS.muted, 'mono'));
      });
      nodes.push(line([-860, -90], [-20, -90], { stroke: COSMOS.rule, width: 2 }));

      const tokens = Object.keys(hidden);
      tokens.forEach((tok, idx) => {
        const y = -45 + idx * 66;
        const isA = tok === 'a';
        const rowCol = isA ? ROLE.token : COSMOS.ink;
        nodes.push(
          rect(840, 54, {
            fill: isA ? '#1d180e' : '#0d1424',
            stroke: isA ? ROLE.token : COSMOS.rule,
            width: isA ? 2.2 : 1.4,
            radius: 6,
          }).at(-440, y),
          txt(tok, cols[0], y, 28, rowCol, 'mono'),
          txt(`R${source[tok]}`, cols[1], y, 26, COSMOS.muted, 'mono'),
        );
        curChoices[tok].forEach(([exp, wt], ci) => {
          const masked = exp < 0;
          const label = masked ? '-1 (skip)' : `E${exp} (${wt.toFixed(2)})`;
          const col = masked ? ROLE.bad : exp >= 2 ? ROLE.brand : ROLE.nvlink;
          nodes.push(txt(label, cols[2 + ci], y, 26, col, 'mono'));
        });
      });

      nodes.push(
        glassCell(-440, 280, 820, 92, ready ? ROLE.good : COSMOS.dim, {
          fill: ready ? '#0e241d' : '#111626',
          glow: ready ? 8 : 0,
        }),
        txt(
          ready
            ? `${curLedger.slots.length} expert assignments · ${curLedger.destinations} dest rows`
            : 'Counting expert assignments & dest rows...',
          -440,
          280,
          28,
          ready ? ROLE.good : COSMOS.muted,
          'mono',
        ),
        txt(
          ready
            ? `Per-expert counts: [${curLedger.counts.join(', ')}]`
            : 'Masking, deduplicating, and padding are distinct',
          -860,
          380,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('dispatch-beat-1-focus-1', () =>
    s.play(travel.to(1, { duration: remainDuration(c, 'dispatch-beat-1-focus-1', 0.8) })),
  );
  c.after('dep-result-dispatch-eight', () =>
    s.play(
      revealEight.to(1, { duration: remainAfterDuration(c, 'dep-result-dispatch-eight', 0.3) }),
    ),
  );

  c.on('de-dispatch-send', () => {
    const dur = remainDuration(c, 'de-dispatch-send', 0.7);
    s.play(beatMode.to(1, { duration: 0.2 }));
    s.play(routeMode.to(1, { duration: 0.35 }));
    s.play(travel.to(1, { duration: dur }));
    s.play(sendProg.to(1, { duration: dur }));
  });
  c.on('de-dispatch-e2', () => {
    const dur = remainDuration(c, 'de-dispatch-e2', 0.55);
    s.play(e2Prog.to(1, { duration: dur }));
    s.play(expand.to(0.55, { duration: dur }));
  });
  c.on('de-dispatch-e3', () => {
    const dur = remainDuration(c, 'de-dispatch-e3', 0.55);
    s.play(e3Prog.to(1, { duration: dur }));
    s.play(expand.to(1, { duration: dur }));
  });
  c.after('dep-result-dispatch-seven', () =>
    s.play(
      revealSeven.to(1, { duration: remainAfterDuration(c, 'dep-result-dispatch-seven', 0.3) }),
    ),
  );

  c.on('dispatch-beat-3-focus-1', () => {
    s.play(beatMode.to(2, { duration: 0.25 }));
    s.play(expand.to(0.4, { duration: 0.4 }));
  });
  c.after('dep-result-dispatch-mask', () =>
    s.play(revealMask.to(1, { duration: remainAfterDuration(c, 'dep-result-dispatch-mask', 0.3) })),
  );
}
