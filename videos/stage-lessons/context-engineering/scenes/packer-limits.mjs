// Scene 17: packer-limits: "Who owns the failing callback?"
// Prediction beat (B0 hold=2.25): Spend 600 units on Error log (600) OR Route map (300) + Service directory (300).
// Follow /callback -> Identity -> Access team (withheld until B1 ce-packer-limits-2!).
// B2: Budget drops to 500 -> both records required (600 > 500) -> stop before sending!
import {
  COSMOS,
  LIMITS,
  LIMITS_TRACE,
  ROLE,
  aura,
  checkMark,
  cornerBrackets,
  crossMark,
  ease,
  group,
  guardedDynamic,
  heroTitle,
  limitMarker,
  playBeat,
  playCue,
  swapVis,
  tokenRail,
  txt,
} from '../parts.mjs';

export default function packerLimits(s, c) {
  const v600 = s.value(1);
  const v500 = s.value(0);
  const showBudget = s.value(0.3);
  const fillSingle = s.value(0);
  const fillPair = s.value(0);
  const revealTeam = s.value(0); // WITHHELD until B1 ce-packer-limits-2!
  const showBundle = s.value(0);
  const stopSend = s.value(0);

  const bgAura = aura(0, 20, 820, '#14335c2a', '#14352822');
  const title = heroTitle(['Who owns the', 'failing callback?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.units,
  });

  // View 1 (B0-B1): 600-unit comparison (Error log vs Route map + Service directory)
  const layer600 = guardedDynamic(v600, (alpha) => {
    const bg = ease(showBudget.value);
    const sg = ease(fillSingle.value);
    const pr = ease(fillPair.value);
    const tm = ease(revealTeam.value);
    const bn = ease(showBundle.value);

    const nodes = [
      txt(
        `REMAINING BUDGET: ${LIMITS.capacity} UNITS`,
        855,
        -405,
        32,
        ROLE.units,
        'mono',
        'right',
      ).opacity(alpha * (0.65 + 0.35 * bg)),

      // Left option: Single high-priority Error log (600)
      txt('OPTION A: GREEDY TOP PRIORITY', -855, -245, 26, ROLE.cache, 'mono', 'left').opacity(
        alpha,
      ),
      tokenRail({
        x0: -855,
        y: -175,
        width: 760,
        total: LIMITS.capacity,
        height: 58,
        segments: [
          {
            units: LIMITS.log.units * Math.max(0.15, sg),
            color: ROLE.cache,
            alpha: 0.4 + 0.6 * sg,
          },
        ],
        opacity: alpha,
      }),
      txt('Error log (600 units)', -475, -112, 26, ROLE.cache, 'mono', 'center').opacity(alpha),
      cornerBrackets(-475, 35, 760, 200, ROLE.cache, {
        arm: 28,
        width: 2.6,
        opacity: alpha * (0.5 + 0.5 * sg),
      }),
      txt('Gives only:', -815, -20, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.5 + 0.5 * sg),
      ),
      txt(
        `${LIMITS_TRACE.path}  HTTP ${LIMITS_TRACE.status}`,
        -815,
        44,
        42,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * sg)),
      txt('No service or team owner inside', -815, 102, 26, COSMOS.muted, 'sans', 'left').opacity(
        alpha * (0.5 + 0.5 * sg),
      ),

      // Right option: Route map (300) + Service directory (300)
      txt('OPTION B: TWO COMPLEMENTARY RECORDS', 95, -245, 26, ROLE.note, 'mono', 'left').opacity(
        alpha,
      ),
      tokenRail({
        x0: 95,
        y: -175,
        width: 760,
        total: LIMITS.capacity,
        height: 58,
        segments: [
          {
            units: LIMITS.map.units * Math.max(0.15, pr),
            color: ROLE.units,
            alpha: 0.4 + 0.6 * pr,
          },
          {
            units: LIMITS.directory.units * Math.max(0.15, pr),
            color: ROLE.note,
            alpha: 0.4 + 0.6 * pr,
          },
        ],
        opacity: alpha,
      }),
      txt('Route map 300', 285, -112, 26, ROLE.units, 'mono', 'center').opacity(alpha),
      txt('Directory 300', 665, -112, 26, ROLE.note, 'mono', 'center').opacity(alpha),

      cornerBrackets(475, 35, 760, 200, bn > 0.3 ? ROLE.note : ROLE.units, {
        arm: 28,
        width: bn > 0.3 ? 3.5 : 2.6,
        opacity: alpha * (0.5 + 0.5 * pr),
      }),
      txt('Route map:', 135, -25, 26, ROLE.units, 'mono', 'left').opacity(alpha * (0.5 + 0.5 * pr)),
      txt(
        `${LIMITS_TRACE.path}  ->  ${LIMITS.service}`,
        345,
        -25,
        32,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * pr)),
      txt('Directory:', 135, 45, 26, ROLE.note, 'mono', 'left').opacity(alpha * (0.5 + 0.5 * pr)),
      txt(
        pr > 0.4 ? `${LIMITS.service}  ->  ${LIMITS.owner}` : `${LIMITS.service}  ->  ?`,
        345,
        45,
        32,
        ROLE.note,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * pr)),
      txt(
        bn > 0.3 ? 'BUNDLED TOGETHER: packer keeps both links' : 'Two-hop chain across 2 records',
        135,
        104,
        26,
        bn > 0.3 ? ROLE.note : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * pr)),
    ];

    // Bottom prediction / answer readout (STRICTLY WITHHELD until B1 ce-packer-limits-2!)
    if (tm > 0.35) {
      nodes.push(
        checkMark(-330, 275, 36, ROLE.note, alpha * tm),
        txt(`Page the ${LIMITS.owner}.`, -275, 275, 52, ROLE.note, 'serif', 'left')
          .glow(10, ROLE.note)
          .opacity(alpha * tm),
        txt(
          'What counts as required depends on the current question (diagnosis vs rollback).',
          0,
          380,
          30,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha * tm),
      );
    } else {
      nodes.push(
        txt(
          'Follow the callback through both records. Which team gets the page?',
          0,
          290,
          38,
          ROLE.units,
          'serif',
          'center',
        )
          .glow(7, ROLE.units)
          .opacity(alpha * (0.55 + 0.45 * pr)),
      );
    }

    return group(...nodes);
  });

  // View 2 (B2): Budget drops to 500 -> required pair (600) overflows -> stop before sending!
  const layer500 = guardedDynamic(v500, (alpha) => {
    const st = ease(stopSend.value);
    const x0 = -760;
    const scale = 2.1; // 600 * 2.1 = 1260px
    const limitX = x0 + LIMITS.smaller * scale;

    const nodes = [
      txt(
        'BUDGET DROPS TO 500 UNITS  (BOTH RECORDS REQUIRED)',
        x0,
        -255,
        28,
        ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'Route map (300) + Service directory (300) = 600 units',
        x0,
        -195,
        40,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(alpha),
      tokenRail({
        x0,
        y: -10,
        width: LIMITS.bundle.used * scale,
        total: LIMITS.bundle.used,
        height: 76,
        segments: [
          { units: LIMITS.map.units, color: ROLE.units },
          { units: LIMITS.directory.units, color: ROLE.note },
        ],
        opacity: alpha,
      }),
      txt('Route map 300', x0 + 315, 72, 28, ROLE.units, 'mono', 'center').opacity(alpha),
      txt('Directory 300', x0 + 820, 72, 28, ROLE.note, 'mono', 'center').opacity(alpha),

      limitMarker(limitX, -88, 52, ROLE.poison, 'Budget: 500', { size: 30, opacity: alpha }),
      txt(
        'Pair requires 600 (+100 over)',
        x0 + LIMITS.bundle.used * scale,
        130,
        30,
        ROLE.poison,
        'mono',
        'right',
      ).opacity(alpha),

      crossMark(-730, 230, 34, ROLE.poison, alpha * (0.45 + 0.55 * st)),
      txt(
        st > 0.3 ? 'STOP BEFORE SENDING THE REQUEST' : 'Required bundle cannot fit in 500 units',
        -680,
        230,
        40,
        ROLE.poison,
        'mono',
        'left',
      )
        .glow(8, ROLE.poison)
        .opacity(alpha),
      txt(
        'Options: extract the two needed entries, split into two lookups, or report missing evidence.',
        0,
        355,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer600, layer500);

  playCue(s, c, 'ce-packer-limits-1', (d) => s.play(showBudget.to(1, { duration: d })));
  playCue(s, c, 'ce-packer-single', (d) => s.play(fillSingle.to(1, { duration: d })));
  playCue(s, c, 'ce-packer-pair', (d) => s.play(fillPair.to(1, { duration: d })));
  // Strict prediction withholding: reveal Access team ONLY in B1!
  playCue(s, c, 'ce-packer-limits-2', (d) => s.play(revealTeam.to(1, { duration: d })));
  playCue(s, c, 'ce-packer-bundle', (d) => s.play(showBundle.to(1, { duration: d })));
  // B2 swap to 500-unit overflow stop
  playBeat(s, c, 2, (d) => s.play(swapVis(v600, v500, d)));
  playCue(s, c, 'ce-packer-limits-3', (d) => s.play(stopSend.to(1, { duration: d })));
}
