// Scene 36: Would this candidate pass the same rules? (222/400 Wilson [50.6%, 60.3%] + exact +20 miss -> +19 counterfactual -> +20 hold)
import {
  COSMOS,
  RELEASE_EDGE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  prefLerp,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshRelease(s, c) {
  const phase = s.value(0);
  const sCount = s.value(0);
  const sInterval = s.value(0);
  const sGrowth = s.value(0);
  const sHold = s.value(0);
  const sCounter = s.value(0);
  const sPass = s.value(0);
  const sReturn = s.value(0);
  const sNext = s.value(0);

  const bgAura = aura(0, 20, 620, '#123e3628', '#3c1b2a1e');
  const title = heroTitle(['Would This Candidate Pass', 'the Same Rules?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'STRICT RELEASE BOUNDARY · 222 / 400 (LOWER 50.6%) & STRICT < +20 TOKENS',
  });

  // Two aligned rulers on x in [-240, 810]
  const rx0 = -240;
  const rx1 = 810;
  const winX = (p) => rx0 + ((p - 0.35) / 0.3) * (rx1 - rx0); // [35%, 65%]
  const lenX = (t) => rx0 + (t / 35) * (rx1 - rx0); // [0, 35] zoomed around 20 so 19 vs 20 is crisp!

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.8);
    const ct = Math.max(0.75, sCount.value);
    const iv = sInterval.value;
    const gr = sGrowth.value;
    const hd = sHold.value;
    const cf = sCounter.value;
    const ps = sPass.value;
    const rt = sReturn.value;
    const nx = sNext.value;

    // Length bead: 20 -> 19 (counterfactual) -> 20 (measured candidate)
    const curLen = rt > 0.02 ? prefLerp(19, 20, rt) : prefLerp(20, 19, cf);
    const inCounter = cf > 0.5 && rt < 0.5;
    const lenCol = inCounter
      ? ps > 0.5
        ? COSMOS.emerald
        : COSMOS.gold
      : hd > 0.5
        ? COSMOS.rose
        : COSMOS.cyan;

    const winY = -92;
    const lenY = 128;
    const x50 = winX(0.5);
    const x20 = lenX(20);
    const xLo = winX(RELEASE_EDGE.lower); // 50.6%
    const xHi = winX(RELEASE_EDGE.upper); // 60.3%
    const xRate = winX(RELEASE_EDGE.rate); // 55.5%
    const xCur = lenX(curLen);

    const nodes = [
      txt(
        'FRESH CANDIDATE COHORT: 222 / 400 BLIND WINS  ·  SAME PREDECLARED GATES',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // RULER 1: Blinded human win rate (withhold PASS label until fresh-hold!)
      glassCell(-580, winY, 550, 148, hd > 0.5 ? COSMOS.emerald : COSMOS.cyan, {
        fill: hd > 0.5 ? '#0e2824' : '#0f2138',
        glow: 6,
        opacity: ct,
      }),
      txt(
        'RULE 1: HUMAN WINS',
        -825,
        winY - 40,
        26,
        hd > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('222 / 400 = 55.5%', -825, winY + 6, 30, COSMOS.ink, 'mono', 'left'),
      txt(
        iv > 0.2
          ? hd > 0.5
            ? '95% Wilson: [50.6%, 60.3%]  PASS'
            : '95% Wilson: [50.6%, 60.3%]'
          : 'Lower 95% bound must clear 50%',
        -825,
        winY + 48,
        26,
        hd > 0.5 ? COSMOS.emerald : COSMOS.cyan,
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
      line([x50, winY - 44], [x50, winY + 14], { stroke: COSMOS.gold, width: 4.5 }).glow(
        7,
        COSMOS.gold,
      ),
      txt('50% GATE', x50, winY - 68, 26, COSMOS.gold, 'mono'),

      ...(iv > 0.1
        ? [
            line([xLo, winY], [xHi, winY], { stroke: COSMOS.emerald, width: 10 })
              .glow(9, COSMOS.emerald)
              .opacity(iv),
            line([xLo, winY - 22], [xLo, winY + 22], { stroke: COSMOS.emerald, width: 4 }).opacity(
              iv,
            ),
            line([xHi, winY - 22], [xHi, winY + 22], { stroke: COSMOS.emerald, width: 4 }).opacity(
              iv,
            ),
            txt('50.6%', xLo + 20, winY - 48, 26, COSMOS.emerald, 'mono', 'left').opacity(iv),
            txt('60.3%', xHi + 20, winY - 48, 26, COSMOS.emerald, 'mono', 'left').opacity(iv),
          ]
        : []),
      glowDot(xRate, winY, { radius: 10, color: COSMOS.ink, glow: 12 }),

      // RULER 2: Mean length growth (zoomed around 20 so 19 vs 20 is super clear)
      glassCell(-580, lenY, 550, 148, lenCol, {
        fill: inCounter ? (ps > 0.5 ? '#0e2824' : '#1b1710') : hd > 0.5 ? '#28101a' : '#12182b',
        glow: 6,
      }),
      txt('RULE 2: LENGTH GROWTH', -825, lenY - 40, 26, lenCol, 'mono', 'left'),
      txt(
        gr > 0.2
          ? `+${curLen.toFixed(0)} tokens ${inCounter ? '(counterfactual)' : '(measured)'}`
          : 'Strict cutoff: < +20 tokens',
        -825,
        lenY + 6,
        28,
        lenCol,
        'mono',
        'left',
      ),
      txt(
        inCounter
          ? ps > 0.5
            ? 'Passes strict < +20 cutoff!'
            : 'Counterfactual: < +20? [ ? ]'
          : hd > 0.5
            ? 'Landing ON +20 is a miss (< 20)'
            : 'Rule: fewer than +20 tokens',
        -825,
        lenY + 48,
        26,
        inCounter ? (ps > 0.5 ? COSMOS.emerald : COSMOS.gold) : COSMOS.muted,
        'mono',
        'left',
      ),

      line([rx0, lenY], [rx1, lenY], { stroke: COSMOS.rule, width: 3 }),
      ...[0, 5, 10, 15, 20, 25, 30, 35].flatMap((tk) => {
        const tx = lenX(tk);
        return [
          line([tx, lenY - 12], [tx, lenY + 12], { stroke: COSMOS.muted, width: 2.2 }),
          txt(
            tk === 0 ? '0' : `+${tk}`,
            tx,
            lenY + 44,
            26,
            tk === 20 ? COSMOS.gold : COSMOS.muted,
            'mono',
          ),
        ];
      }),
      line([x20, lenY - 26], [x20, lenY + 18], { stroke: COSMOS.gold, width: 4.5 }).glow(
        7,
        COSMOS.gold,
      ),
      txt('STRICT < +20', x20, lenY - 68, 26, COSMOS.gold, 'mono'),

      ...(gr > 0.1
        ? [
            rect((xCur - rx0) * gr, 28, {
              fill: inCounter ? (ps > 0.5 ? '#103b33' : '#3a2a12') : '#5e1a32',
              stroke: lenCol,
              width: 2.4,
              radius: 6,
            })
              .at(rx0 + (xCur - rx0) * gr * 0.5, lenY)
              .opacity(gr),
            glowDot(rx0 + (xCur - rx0) * gr, lenY, {
              radius: 10,
              color: lenCol,
              glow: 14,
              opacity: gr,
            }),
            txt(
              `+${curLen.toFixed(0)}`,
              inCounter ? xCur - 30 : xCur + 30,
              lenY - 38,
              30,
              lenCol,
              'mono',
              inCounter ? 'right' : 'left',
            )
              .glow(6, lenCol)
              .opacity(gr),
          ]
        : []),

      // Strictly withheld multi-stage verdict banner
      glassCell(
        0,
        344,
        1680,
        122,
        rt > 0.5
          ? COSMOS.rose
          : inCounter
            ? ps > 0.5
              ? COSMOS.emerald
              : COSMOS.gold
            : hd > 0.5
              ? COSMOS.rose
              : COSMOS.amber,
        {
          fill: inCounter ? (ps > 0.5 ? '#0e2824' : '#1b1710') : hd > 0.5 ? '#29101a' : '#1b1710',
          dash: hd > 0.5 && (!inCounter || ps > 0.5) ? undefined : [10, 6],
          glow: 10 * pulse,
        },
      ),
      txt(
        rt > 0.5
          ? 'MEASURED CANDIDATE (+20) STAYS ON HOLD  ·  NEXT VOTE: TICKET (P-7) vs INVENTED EXCEPTION'
          : inCounter
            ? ps > 0.5
              ? 'YES!  AT +19 TOKENS (< 20) AND 50.6% (> 50%), BOTH RULES WOULD PASS'
              : 'Counterfactual +19 tokens with same 50.6% lower bound: would BOTH rules pass?  [ ? ]'
            : hd > 0.5
              ? 'LENGTH BLOCKS IT!  Win CI clears 50%, but +20 is NOT strictly below +20 -> HOLD'
              : 'Wins 222/400 (lower 50.6%) & exactly +20 extra tokens. Which rule blocks release?  [ ? ]',
        0,
        322,
        26,
        rt > 0.5
          ? COSMOS.gold
          : inCounter && ps > 0.5
            ? COSMOS.emerald
            : hd > 0.5
              ? COSMOS.rose
              : COSMOS.gold,
        'mono',
      ),
      txt(
        nx > 0.3
          ? 'Next lesson: a model applies written principles to judge pairs like P-7 ticket vs exception, verified by people'
          : 'Predeclared strict inequalities prevent goalpost-shifting at release time',
        0,
        374,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fresh-count', () =>
    s.play(sCount.to(1, { duration: remainDuration(c, 'fresh-count', 0.45) })),
  );
  c.on('fresh-interval', () =>
    s.play(sInterval.to(1, { duration: remainDuration(c, 'fresh-interval', 0.6) })),
  );
  c.on('fresh-growth', () =>
    s.play(sGrowth.to(1, { duration: remainDuration(c, 'fresh-growth', 0.65) })),
  );
  c.after('fresh-hold', () =>
    s.play(sHold.to(1, { duration: remainAfterDuration(c, 'fresh-hold', 0.45) })),
  );
  c.on('fresh-counter', () =>
    s.play(sCounter.to(1, { duration: remainDuration(c, 'fresh-counter', 0.75) })),
  );
  c.after('fresh-pass', () =>
    s.play(sPass.to(1, { duration: remainAfterDuration(c, 'fresh-pass', 0.45) })),
  );
  c.after('fresh-measured', () =>
    s.play(sReturn.to(1, { duration: remainAfterDuration(c, 'fresh-measured', 0.55) })),
  );
  c.on('fresh-next-pair', () =>
    s.play(sNext.to(1, { duration: remainDuration(c, 'fresh-next-pair', 0.45) })),
  );
}
