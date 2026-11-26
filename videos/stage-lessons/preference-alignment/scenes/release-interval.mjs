// Scene 27: Would you release this candidate? (184/400 Wilson CI [41.2%, 50.9%] + +48 tokens vs +20 cap -> HOLD)
import {
  COSMOS,
  RELEASE_HOLD,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function releaseInterval(s, c) {
  const phase = s.value(0);
  const sWinRule = s.value(0);
  const sLenRule = s.value(0);
  const sCount = s.value(0);
  const sInterval = s.value(0);
  const sGrowth = s.value(0);
  const sHold = s.value(0);

  const bgAura = aura(0, 20, 620, '#3c1b2a26', '#14385c22');
  const title = heroTitle(['Would You Release', 'This Candidate?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RELEASE GATE · 95% WILSON INTERVAL (> 50%) & LENGTH CAP (< +20 TOKENS)',
  });

  // Two aligned rulers on x in [-260, 810]
  const rx0 = -240;
  const rx1 = 810;
  const winX = (p) => rx0 + ((p - 0.35) / 0.3) * (rx1 - rx0); // [35%, 65%]
  const lenX = (t) => rx0 + (t / 55) * (rx1 - rx0); // [0, 55]

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.8);
    const wr = Math.max(0.75, sWinRule.value);
    const lr = Math.max(0.75, sLenRule.value);
    const ct = sCount.value;
    const iv = sInterval.value;
    const gr = sGrowth.value;
    const hd = sHold.value;

    const winY = -92;
    const lenY = 128;
    const x50 = winX(0.5);
    const x20 = lenX(20);
    const xLo = winX(RELEASE_HOLD.lower);
    const xHi = winX(RELEASE_HOLD.upper);
    const xRate = winX(RELEASE_HOLD.rate);
    const x48 = lenX(RELEASE_HOLD.growth);

    const nodes = [
      // Candidate header
      txt(
        'CANDIDATE REWARD GAIN: +0.31   ·   400 INDEPENDENT BLIND PROMPTS (NO TIES)',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // RULER 1: Blinded human win rate
      glassCell(-580, winY, 550, 148, hd > 0.5 ? COSMOS.rose : COSMOS.cyan, {
        fill: hd > 0.5 ? '#28101a' : '#0f2138',
        glow: 5,
        opacity: wr,
      }),
      txt('RULE 1: HUMAN WINS', -825, winY - 40, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        ct > 0.2 ? '184 / 400 = 46.0%' : 'Lower 95% bound > 50%',
        -825,
        winY + 6,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        iv > 0.2 ? '95% Wilson: [41.2%, 50.9%]' : 'Threshold: 50.0% lower end',
        -825,
        winY + 48,
        26,
        iv > 0.2 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),

      line([rx0, winY], [rx1, winY], { stroke: COSMOS.rule, width: 3 }),
      ...[0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65].flatMap((tk) => {
        const tx = winX(tk);
        return [
          line([tx, winY - 12], [tx, winY + 12], { stroke: COSMOS.muted, width: 2.2 }),
          txt(
            `${Math.round(tk * 100)}%`,
            tx,
            winY + 52,
            26,
            tk === 0.5 ? COSMOS.gold : COSMOS.muted,
            'mono',
          ),
        ];
      }),
      line([x50, winY - 44], [x50, winY + 16], { stroke: COSMOS.gold, width: 4.5 }).glow(
        7,
        COSMOS.gold,
      ),
      txt('50% GATE', x50, winY - 68, 26, COSMOS.gold, 'mono'),

      ...(iv > 0.1
        ? [
            line([xLo, winY], [xHi, winY], { stroke: COSMOS.rose, width: 10 })
              .glow(9, COSMOS.rose)
              .opacity(iv),
            line([xLo, winY - 22], [xLo, winY + 22], { stroke: COSMOS.rose, width: 4 }).opacity(iv),
            line([xHi, winY - 22], [xHi, winY + 22], { stroke: COSMOS.rose, width: 4 }).opacity(iv),
            txt('41.2%', xLo - 22, winY - 46, 26, COSMOS.rose, 'mono', 'right').opacity(iv),
            txt('50.9%', xHi + 22, winY - 46, 26, COSMOS.rose, 'mono', 'left').opacity(iv),
          ]
        : []),
      ...(ct > 0.1
        ? [glowDot(xRate, winY, { radius: 10, color: COSMOS.ink, glow: 12, opacity: ct })]
        : []),

      // RULER 2: Mean length growth
      glassCell(-580, lenY, 550, 148, hd > 0.5 ? COSMOS.rose : COSMOS.amber, {
        fill: hd > 0.5 ? '#28101a' : '#1b1710',
        glow: 5,
        opacity: lr,
      }),
      txt('RULE 2: LENGTH GROWTH', -825, lenY - 40, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        gr > 0.2 ? '+48 tokens mean growth' : 'Must stay below +20',
        -825,
        lenY + 6,
        30,
        gr > 0.2 ? COSMOS.rose : COSMOS.ink,
        'mono',
        'left',
      ),
      txt('Strict cutoff: < +20 tokens', -825, lenY + 48, 26, COSMOS.muted, 'mono', 'left'),

      line([rx0, lenY], [rx1, lenY], { stroke: COSMOS.rule, width: 3 }),
      ...[0, 10, 20, 30, 40, 50].flatMap((tk) => {
        const tx = lenX(tk);
        return [
          line([tx, lenY - 12], [tx, lenY + 12], { stroke: COSMOS.muted, width: 2.2 }),
          txt(
            tk === 0 ? '0' : `+${tk}`,
            tx,
            lenY + 52,
            26,
            tk === 20 ? COSMOS.gold : COSMOS.muted,
            'mono',
          ),
        ];
      }),
      line([x20, lenY - 44], [x20, lenY + 16], { stroke: COSMOS.gold, width: 4.5 }).glow(
        7,
        COSMOS.gold,
      ),
      txt('+20 CAP', x20, lenY - 68, 26, COSMOS.gold, 'mono'),

      ...(gr > 0.1
        ? [
            rect((x48 - rx0) * gr, 28, {
              fill: '#5e1a32',
              stroke: COSMOS.rose,
              width: 2.4,
              radius: 6,
            })
              .at(rx0 + (x48 - rx0) * gr * 0.5, lenY)
              .opacity(gr),
            glowDot(rx0 + (x48 - rx0) * gr, lenY, {
              radius: 10,
              color: COSMOS.rose,
              glow: 14,
              opacity: gr,
            }),
            txt('+48 tokens', x48, lenY - 48, 30, COSMOS.rose, 'mono')
              .glow(6, COSMOS.rose)
              .opacity(gr),
          ]
        : []),

      // Strictly withheld verdict banner
      glassCell(0, 344, 1680, 118, hd > 0.5 ? COSMOS.rose : COSMOS.amber, {
        fill: hd > 0.5 ? '#29101a' : '#1b1710',
        dash: hd > 0.5 ? undefined : [10, 6],
        glow: 10 * pulse,
      }),
      txt(
        hd > 0.5
          ? 'HOLD CANDIDATE!  NEITHER RULE CLEARS (50% INSIDE CI; +48 EXCEEDS +20)'
          : gr > 0.2
            ? '184/400 [41.2%, 50.9%] and +48 tokens. Does EITHER rule clear?  [ ? ]'
            : 'Predeclared gates: 95% Wilson lower bound > 50% and length growth < +20 tokens',
        0,
        324,
        28,
        hd > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
      txt(
        hd > 0.5
          ? 'Inspect longer replies for padding vs detail; select on validation, judge once on planned holdout'
          : 'Predeclared gates override proxy reward gain (+0.31)',
        0,
        372,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('release-win-rule', () =>
    s.play(sWinRule.to(1, { duration: remainDuration(c, 'release-win-rule', 0.45) })),
  );
  c.on('release-length-rule', () =>
    s.play(sLenRule.to(1, { duration: remainDuration(c, 'release-length-rule', 0.45) })),
  );
  c.on('release-count', () =>
    s.play(sCount.to(1, { duration: remainDuration(c, 'release-count', 0.45) })),
  );
  c.on('release-interval', () =>
    s.play(sInterval.to(1, { duration: remainDuration(c, 'release-interval', 0.6) })),
  );
  c.on('release-growth', () =>
    s.play(sGrowth.to(1, { duration: remainDuration(c, 'release-growth', 0.7) })),
  );
  c.after('release-hold', () =>
    s.play(sHold.to(1, { duration: remainAfterDuration(c, 'release-hold', 0.5) })),
  );
}
