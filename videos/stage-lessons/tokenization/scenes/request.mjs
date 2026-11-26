// Scene 20: request: Special control vs user text paths -> chat template format -> 7-slot window overflow (2 + 6 = 8).
import {
  ADDED,
  COSMOS,
  RAINY_POSITIONS,
  REQUEST_SOURCES,
  ROLE,
  WINDOW,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function request(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showUserPath = s.value(0);
  const showTemplateDiff = s.value(0);
  const fillCount = s.value(2); // 2 (rainy) -> 5 (+3 system) -> 7 (+2 role) -> 8 (+1 reply overflow!)

  const bgAura = aura(0, 0, 740, '#16355c26', '#4a183018');
  const title = heroTitle(['Special Tokens &', 'the whole request'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.piece,
  });

  // View 1: Walled special control token path vs user text path + template syntax difference
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const up = showUserPath.value;
    const td = showTemplateDiff.value;
    const nodes = [
      txt('TEMPLATE CONTROL PATH', -855, -210, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
      tokenPill('<|eot|>', -710, -125, { w: 230, h: 74, color: ROLE.ok, size: 34, opacity: alpha }),
      glowingTrail(
        [
          [-580, -125],
          [-430, -125],
        ],
        { color: ROLE.ok, width: 4, glow: 10, opacity: alpha },
      ),
      tokenPill('Control ID 128009', -235, -125, {
        w: 340,
        h: 74,
        color: ROLE.ok,
        size: 28,
        opacity: alpha,
      }),
    ];

    const aUp = (0.45 + 0.55 * up) * alpha;
    const aTd = (0.45 + 0.55 * td) * alpha;
    nodes.push(
      txt(
        'USER-TYPED LITERAL TEXT (SEPARATE PATH)',
        -855,
        -5,
        26,
        ROLE.warn,
        'mono',
        'left',
      ).opacity(aUp),
      tokenPill('"<|eot|>"', -710, 80, {
        w: 230,
        h: 74,
        color: ROLE.warn,
        size: 32,
        opacity: aUp,
      }),
      glowingTrail(
        [
          [-580, 80],
          [-430, 80],
        ],
        { color: ROLE.warn, width: 4, glow: up > 0.2 ? 10 : 3, opacity: aUp },
      ),
      tokenPill('<', -365, 80, { w: 80, h: 74, color: ROLE.warn, size: 30, opacity: aUp }),
      tokenPill('|', -275, 80, { w: 80, h: 74, color: ROLE.warn, size: 30, opacity: aUp }),
      tokenPill('eot', -160, 80, {
        w: 120,
        h: 74,
        color: ROLE.warn,
        size: 30,
        opacity: aUp,
      }),
      tokenPill('|>', -40, 80, { w: 96, h: 74, color: ROLE.warn, size: 30, opacity: aUp }),
      txt(
        'CHAT TEMPLATE FORMAT MUST MATCH TRAINING',
        -855,
        230,
        26,
        ROLE.merge,
        'mono',
        'left',
      ).opacity(aTd),
      txt(
        'Angle brackets  <user>   ≠   Square brackets  [user]   → different token IDs',
        -855,
        300,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(aTd),
    );
    return group(...nodes);
  });

  // View 2: 7-position context window filling up to 8 (overflow!)
  const slots = [
    { label: 'sys 1', col: ROLE.piece },
    { label: 'sys 2', col: ROLE.piece },
    { label: 'sys 3', col: ROLE.piece },
    { label: 'role 1', col: ROLE.path },
    { label: 'role 2', col: ROLE.path },
    { label: 'rain', col: ROLE.token },
    { label: 'y', col: ROLE.token },
    { label: 'reply', col: ROLE.warn },
  ];

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const cnt = Math.round(fillCount.value); // 2 -> 5 -> 7 -> 8
    const isOverflow = cnt > WINDOW;
    // Build currently active slot list cleanly: start with rainy (2), then prepend/append overhead
    const active = [];
    if (cnt >= 5) active.push(slots[0], slots[1], slots[2]);
    if (cnt >= 7) active.push(slots[3], slots[4]);
    active.push(slots[5], slots[6]);
    if (cnt >= 8) active.push(slots[7]);

    const slotW = 180;
    const gap = 22;
    const x0 = -760;
    const slotY = 40;
    const wallX = x0 + WINDOW * (slotW + gap) - gap * 0.5 - slotW * 0.5;

    const nodes = [
      txt(
        `CONTEXT WINDOW LIMIT = ${WINDOW} POSITIONS`,
        -855,
        -200,
        28,
        ROLE.merge,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        isOverflow
          ? `TOTAL = ${RAINY_POSITIONS} + ${ADDED} = ${cnt}  →  OVERFLOW (+1 PAST EDGE)`
          : `ACTIVE POSITIONS: ${cnt} / ${WINDOW}  (FITS)`,
        855,
        -200,
        30,
        isOverflow ? ROLE.warn : ROLE.ok,
        'mono',
        'right',
      )
        .glow(8, isOverflow ? ROLE.warn : ROLE.ok)
        .opacity(alpha),
    ];

    // Window edge boundary beam after slot 7
    nodes.push(
      glowingTrail(
        [
          [wallX, slotY - 105],
          [wallX, slotY + 105],
        ],
        { color: isOverflow ? ROLE.warn : ROLE.merge, width: 4.5, glow: 12, opacity: alpha },
      ),
      txt(
        'WINDOW EDGE',
        wallX,
        slotY - 128,
        26,
        isOverflow ? ROLE.warn : ROLE.merge,
        'mono',
        'center',
      ).opacity(alpha),
    );

    active.forEach((slot, idx) => {
      const sx = x0 + idx * (slotW + gap);
      const past = idx >= WINDOW;
      nodes.push(
        tokenPill(slot.label, sx, slotY, {
          w: slotW,
          h: 82,
          color: past ? ROLE.warn : slot.col,
          fill: past ? '#2e1120' : '#10182d',
          size: 30,
          glow: past ? 14 : 7,
          opacity: alpha,
        }),
      );
    });

    // Breakdown legend along bottom
    const summary = REQUEST_SOURCES.map(([name, n]) => `${name} +${n}`).join('   ·   ');
    nodes.push(
      txt(
        `User "rainy" (2)  +  ${summary}  =  ${RAINY_POSITIONS + ADDED} tokens`,
        -855,
        240,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'Count the entire formatted request before sending it to the model',
        -855,
        320,
        30,
        ROLE.ok,
        'serif',
        'left',
      )
        .glow(6, ROLE.ok)
        .opacity((isOverflow ? 1 : 0.35) * alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'typed', (d) => s.play(showUserPath.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'differ', (d) => s.play(showTemplateDiff.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'rainy', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'add', (d) => s.play(fillCount.to(5, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'add-role', (d) => s.play(fillCount.to(7, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'add-reply', (d) => s.play(fillCount.to(8, { duration: d })), { dur: 0.45 });
  bindCueBeat(s, c, s.value(0), [
    'special',
    'control',
    'apart',
    'template',
    'window',
    'fits',
    'made-up',
    'total',
    'overflow',
    'final',
  ]);
}
