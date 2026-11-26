// Scene 01: Where does this copy of token a go?
// Prediction scene: keep "Expert 0" mistake answer concealed until c.after('de-intro-wrong').
import {
  COSMOS,
  REPLAY_COMP,
  ROLE,
  aura,
  buildDualGpuNvlinkRig3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  hidden,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(0); // 0: E0/E3, 1: E2/E3
  const travel = s.value(0.25);
  const expand = s.value(0);
  const showChoices = s.value(0);
  const changed = s.value(0);
  const showQuestion = s.value(0);
  const revealWrong = s.value(0); // STRICT: c.after('de-intro-wrong')
  const rebuilt = s.value(0); // STRICT: c.after('de-intro-rebuild')
  const delivered = s.value(0);
  const expanded = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#5ce1e618');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Where Does', 'Token a Go?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.brand,
    eyebrow: 'DEEPEP · EXPERT-PARALLEL ROUTING',
    subtitle: `Token a = [${hidden.a.join(', ')}] starts on GPU 0`,
  });

  const live = guardedDynamic(1, () => {
    const isChanged = Math.round(changed.value) >= 1;
    const isWrong = Math.round(revealWrong.value) >= 1 && Math.round(rebuilt.value) < 1;
    const isRebuilt = Math.round(rebuilt.value) >= 1;
    const isDelivered = Math.round(delivered.value) >= 1;
    const isExpanded = Math.round(expanded.value) >= 1;
    const isQuestion = Math.round(showQuestion.value) >= 1;

    const routerPair = isChanged ? 'E2 / E3' : 'E0 / E3';
    const handlePair = isRebuilt ? 'E2 / E3' : 'E0 / E3';
    const cachedSet = isRebuilt ? REPLAY_COMP.rebuilt.experts : REPLAY_COMP.cached.experts;

    const nodes = [
      txt('3D DUAL-GPU NVLINK DISPATCH', 470, -415, 26, ROLE.nvlink, 'mono').glow(5, ROLE.nvlink),
      txt('GPU 0 (E0, E1)  <->  GPU 1 (E2, E3)', 470, 435, 26, COSMOS.muted, 'mono'),
    ];

    // Two compact hardware GPU panels in left zone (-860 .. 20)
    const g0x = -675;
    const g1x = -215;
    const gy = 30;
    nodes.push(
      glassCell(g0x, gy, 340, 290, ROLE.rank0, { fill: '#0c182e', glow: 7 }),
      txt('GPU 0 · Rank 0', g0x, gy - 108, 28, ROLE.rank0, 'mono'),
      glassCell(g1x, gy, 340, 290, ROLE.rank1, { fill: '#16112b', glow: 7 }),
      txt('GPU 1 · Rank 1', g1x, gy - 108, 28, ROLE.rank1, 'mono'),
    );

    // Bridge line + moving token packet
    const linkL = g0x + 172;
    const linkR = g1x - 172;
    nodes.push(
      line([linkL, gy - 16], [linkR, gy - 16], { stroke: ROLE.nvlink, width: 4 }).glow(
        6,
        ROLE.nvlink,
      ),
      txt('link', (linkL + linkR) * 0.5, gy - 46, 26, ROLE.nvlink, 'mono'),
    );
    const px = linkL + (linkR - linkL) * Math.max(0, Math.min(1, travel.value));
    nodes.push(glowDot(px, gy - 16, { radius: 9, color: ROLE.token, glow: 14 }));

    // 4 expert slots inside GPU 0 and GPU 1
    const expDefs = [
      { id: 0, cx: g0x - 78, cy: gy + 64 },
      { id: 1, cx: g0x + 78, cy: gy + 64 },
      { id: 2, cx: g1x - 78, cy: gy + 64 },
      { id: 3, cx: g1x + 78, cy: gy + 64 },
    ];
    for (const ex of expDefs) {
      const inHandle = cachedSet.includes(ex.id);
      const badHit = isWrong && ex.id === 0;
      const active = badHit || (inHandle && (!isRebuilt || isDelivered || isExpanded));
      const col = badHit ? ROLE.bad : active ? ROLE.nvlink : COSMOS.dim;
      nodes.push(
        rect(134, 68, { fill: '#0b1222', stroke: col, width: 2.4, radius: 8 }).at(ex.cx, ex.cy),
        txt(`E${ex.id}`, ex.cx, ex.cy, 28, col, 'mono'),
      );
      if (active) {
        const srcX = ex.id < 2 ? g0x : g1x;
        nodes.push(line([srcX, gy - 20], [ex.cx, ex.cy - 36], { stroke: col, width: 2.8 }));
      }
    }

    // Token a badge inside active GPU(s)
    if (!isRebuilt) {
      nodes.push(
        rect(180, 48, { fill: '#2a2210', stroke: ROLE.token, width: 2.2, radius: 8 }).at(
          g0x,
          gy - 40,
        ),
        txt('a [1, 0]', g0x, gy - 40, 26, ROLE.token, 'mono'),
      );
    }
    if (isDelivered || !isRebuilt) {
      nodes.push(
        rect(180, 48, { fill: '#2a2210', stroke: ROLE.token, width: 2.2, radius: 8 }).at(
          g1x,
          gy - 40,
        ),
        txt('a [1, 0]', g1x, gy - 40, 26, ROLE.token, 'mono'),
      );
    }

    // Router vs Saved Handle strip
    const choiceAlpha = Math.max(0.5, showChoices.value);
    nodes.push(
      glassCell(-660, 248, 370, 84, ROLE.token, {
        fill: '#1e190e',
        glow: 6,
        opacity: choiceAlpha,
      }),
      txt(`Router: ${routerPair}`, -660, 248, 28, ROLE.token, 'mono').opacity(choiceAlpha),
      glassCell(-235, 248, 410, 84, isWrong ? ROLE.bad : ROLE.nvlink, {
        fill: isWrong ? '#29101a' : '#0c1f2e',
        glow: 6,
        opacity: choiceAlpha,
      }),
      txt(
        `Saved handle: ${handlePair}`,
        -235,
        248,
        28,
        isWrong ? ROLE.bad : ROLE.nvlink,
        'mono',
      ).opacity(choiceAlpha),
    );

    // Bottom status / prediction line (strictly respects withholding)
    let bottomText = 'Each expert keeps its weights on its own GPU';
    let bottomCol = COSMOS.muted;
    if (isExpanded) {
      bottomText = '1 row crosses to GPU 1 -> expands into E2 & E3 slots';
      bottomCol = ROLE.good;
    } else if (isRebuilt) {
      bottomText = 'Fresh handle built for E2 / E3 -> single copy to GPU 1';
      bottomCol = ROLE.nvlink;
    } else if (isWrong) {
      bottomText = 'Cached handle visits Expert 0 by mistake!';
      bottomCol = ROLE.bad;
    } else if (isQuestion) {
      bottomText = 'Predict: which expert would the cached route visit?';
      bottomCol = ROLE.token;
    }

    nodes.push(txt(bottomText, -860, 355, 28, bottomCol, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.24, phi: 0.94 });

  c.on('de-intro-choices', () =>
    s.play(showChoices.to(1, { duration: remainDuration(c, 'de-intro-choices', 0.45) })),
  );
  c.on('de-intro-dispatch', () =>
    s.play(travel.to(1, { duration: remainDuration(c, 'de-intro-dispatch', 0.85) })),
  );
  c.on('de-intro-change', () =>
    s.play(changed.to(1, { duration: remainDuration(c, 'de-intro-change', 0.45) })),
  );
  c.on('de-intro-question', () =>
    s.play(showQuestion.to(1, { duration: remainDuration(c, 'de-intro-question', 0.45) })),
  );
  c.after('de-intro-wrong', () =>
    s.play(revealWrong.to(1, { duration: remainAfterDuration(c, 'de-intro-wrong', 0.3) })),
  );
  c.after('de-intro-rebuild', () => {
    const dur = remainAfterDuration(c, 'de-intro-rebuild', 0.35);
    s.play(rebuilt.to(1, { duration: dur }));
    s.play(routeMode.to(1, { duration: dur }));
    s.play(travel.to(0.15, { duration: 0.2 }));
  });
  c.on('de-intro-deliver', () => {
    const dur = remainDuration(c, 'de-intro-deliver', 0.65);
    s.play(travel.to(1, { duration: dur }));
    s.play(delivered.to(1, { duration: dur }));
  });
  c.on('de-intro-expand', () => {
    const dur = remainDuration(c, 'de-intro-expand', 0.65);
    s.play(expand.to(1, { duration: dur }));
    s.play(expanded.to(1, { duration: dur }));
  });
}
