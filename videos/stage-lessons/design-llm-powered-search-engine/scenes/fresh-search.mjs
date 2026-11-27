// Scene 29: fresh-search - A new exception for Alice
// Grand finale with TWO strict prediction beats:
//   1. Beats 0-2: Pack A (stale exception@1) vs Pack B (truncated exception@2 missing "recorded before Friday").
//      Strictly withholds "WITHHOLD BOTH" until `c.after('se-fresh-search-1')`, extends to [0,124), releases both quotes.
//   2. Beats 3-4: Returns to the opening Migration Window ruler for day 40 with Friday morning approval.
//      Strictly withholds "OUTSIDE" until `c.after('fresh-outside')`, then shifts approval to Thursday morning -> INSIDE!
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_CUT_BEFORE_RECORDED,
  ROLE,
  SEARCH_TEXT,
  aura,
  buildMigrationRulerNodes,
  buildSpanRibbonNodes,
  cinemaHeader,
  clampDur,
  freshSearchState,
  guardedDynamic,
  migrationDecision,
  txt,
} from '../parts.mjs';

export default function freshSearch(s, c) {
  // Part 1 (Beats 0-2): Pack A vs Pack B -> Restore -> Release
  const rev2On = s.value(0);
  const askPackOn = s.value(0);
  const withholdBothOn = s.value(0);
  const staleReasonOn = s.value(0);
  const shortReasonOn = s.value(0);
  const fetchOn = s.value(0);
  const extendProg = s.value(0);
  const recheckOn = s.value(0);
  const releasedOn = s.value(0);

  // Part 2 (Beats 3-4): Counterfactual Migration Window (Day 40, Friday vs Thursday)
  const rulerMode = s.value(0);
  const fridayOn = s.value(0);
  const askDayOn = s.value(0);
  const fridayOutOn = s.value(0);
  const thursdayOn = s.value(0);
  const extFillProg = s.value(0);
  const thursdayInOn = s.value(0);

  const cached = freshSearchState(0);
  const shortSt = freshSearchState(1);
  const complete = freshSearchState(2);

  const header = cinemaHeader('POLICY UPDATE & COUNTERFACTUAL', 'A new exception', 'for Alice', {
    accent: ROLE.focus,
    size: 46,
  });

  const stageAura = aura(0, 40, 720, '#ffd1661c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const r2 = rev2On.value > 0.5;
      const askP = askPackOn.value > 0.5;
      const whB = withholdBothOn.value > 0.5;
      const stR = staleReasonOn.value > 0.5;
      const shR = shortReasonOn.value > 0.5;
      const extP = extendProg.value;
      const rel = releasedOn.value > 0.5;
      const rm = rulerMode.value > 0.5;
      const fri = fridayOn.value > 0.5;
      const askD = askDayOn.value > 0.5;
      const friOut = fridayOutOn.value > 0.5;
      const thu = thursdayOn.value > 0.5;
      const extF = extFillProg.value;
      const thuIn = thursdayInOn.value > 0.5;
      const nodes = [];

      if (rm) {
        // Beats 3-4: Migration Window ruler for revised exception@2 (45 days, before Friday)
        const decision = migrationDecision(2, 40, { granted: true, beforeFriday: thu });
        const recordText = thu
          ? 'Security approval recorded: THURSDAY MORNING (before Friday)'
          : fri
            ? 'Security approval recorded: FRIDAY MORNING'
            : 'Approval record: awaiting timestamp...';
        const recordCol = thu ? ROLE.ok : fri ? ROLE.query : COSMOS.muted;
        const showVerdict = thu ? thuIn : friOut;
        const bottomText =
          !showVerdict && askD && !friOut && !thu
            ? 'Does that Friday approval cover a start on day 40?'
            : '';

        nodes.push(
          txt(
            'REVISED POLICY: policy@2 (30d)  +  exception@2 (45d if approved before Friday)',
            -760,
            -210,
            28,
            ROLE.exception,
            'mono',
            'left',
          ),
          ...buildMigrationRulerNodes({
            decision,
            rulerY: -20,
            baseFrac: 1,
            offerFrac: 1,
            extFrac: extF,
            recordText,
            recordColor: recordCol,
            bottomText,
            bottomColor: ROLE.focus,
            showVerdict,
            showRuleLabels: true,
          }),
        );
      } else if (rel) {
        // End of Beat 2: Both complete current quotations released
        nodes.push(
          txt(
            'BOTH COMPLETE CURRENT QUOTATIONS RELEASED',
            -840,
            -225,
            32,
            ROLE.ok,
            'mono',
            'left',
          ).glow(8, ROLE.ok),
        );
        const cards = [
          {
            q: complete.quotes[1],
            col: ROLE.exception,
            y: -55,
            line1: 'Service-account SDK migrations may start within 45 days',
            line2: 'after the notice only with security approval recorded before Friday.',
          },
          {
            q: complete.quotes[0],
            col: ROLE.policy,
            y: 195,
            line1: 'Parser-v2 SDK migrations must start within 30 days',
            line2: 'after the deprecation notice.',
          },
        ];
        cards.forEach((item) => {
          nodes.push(
            rect(1680, 198, { fill: '#0d1826', stroke: item.col, width: 3, radius: 14 })
              .at(0, item.y)
              .glow(8, item.col),
            txt(
              `${item.q.id}@${item.q.revision}   [${item.q.start}, ${item.q.end})   ·   SHA-256 ${item.q.digest.slice(0, 12)}...`,
              -800,
              item.y - 54,
              26,
              item.col,
              'mono',
              'left',
            ),
            txt(item.line1, -800, item.y + 4, 32, COSMOS.ink, 'serif', 'left'),
            txt(item.line2, -800, item.y + 52, 32, item.col, 'serif', 'left'),
          );
        });
      } else {
        // Beats 0-2: Span ribbon + Pack A vs Pack B comparison
        const full2Len = SEARCH_TEXT.fresh.length;
        const curEnd = r2
          ? Math.round(FRESH_CUT_BEFORE_RECORDED + (full2Len - FRESH_CUT_BEFORE_RECORDED) * extP)
          : cached.quotes[1].end;
        const displayEnd = r2
          ? extP > 0.5
            ? full2Len
            : FRESH_CUT_BEFORE_RECORDED
          : cached.quotes[1].end;

        nodes.push(
          ...buildSpanRibbonNodes({
            textValue: r2 ? SEARCH_TEXT.fresh : SEARCH_TEXT.exception,
            revision: r2 ? 2 : 1,
            endOffset: curEnd,
            displayEnd,
            topY: -175,
            xLeft: -720,
            charW: 18.5,
          }),
          txt(
            `Both packs keep policy@2 [0, ${complete.quotes[0].end})`,
            -840,
            150,
            26,
            ROLE.policy,
            'mono',
            'left',
          ),
          txt(`REGISTRY: exception@${r2 ? 2 : 1}`, 840, 150, 28, ROLE.focus, 'mono', 'right'),

          // Pack A row
          txt(
            `Pack A: cached exception@1  [0, ${cached.quotes[1].end})`,
            -840,
            222,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt(
            stR ? 'REJECTED: stale rev 1 != 2' : 'complete old exception',
            840,
            222,
            26,
            stR ? ROLE.deny : COSMOS.muted,
            'mono',
            'right',
          ),
        );

        // Pack B row
        if (r2) {
          const bStatus =
            recheckOn.value > 0.5
              ? 'RECHECKING ACL + REVISIONS...'
              : extP > 0.85
                ? 'COMPLETE [0, 124)'
                : shR
                  ? 'REJECTED: drops Friday cutoff'
                  : 'stops after "approval"';
          const bCol = extP > 0.85 ? ROLE.ok : shR ? ROLE.deny : COSMOS.muted;
          nodes.push(
            txt(
              `Pack B: current exception@2 [0, ${displayEnd})`,
              -840,
              286,
              28,
              COSMOS.ink,
              'mono',
              'left',
            ),
            txt(bStatus, 840, 286, 26, bCol, 'mono', 'right'),
          );
        }

        // Bottom prediction prompt / withhold verdict (strictly gated!)
        let bottom = 'Comparing cached Pack A and current Pack B...';
        let bCol = COSMOS.muted;
        if (fetchOn.value > 0.5) {
          bottom = 'Fetching current exception@2 and extending span through "before Friday."';
          bCol = ROLE.query;
        } else if (whB) {
          bottom = 'WITHHOLD BOTH: Pack A is stale (rev 1); Pack B drops the Friday cutoff!';
          bCol = ROLE.deny;
        } else if (askP) {
          bottom = 'Which pack can the publisher release: A, B, or neither?';
          bCol = ROLE.focus;
        }

        nodes.push(
          txt(bottom, -840, 382, 34, bCol, 'serif', 'left').glow(askP || whB ? 7 : 0, bCol),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  // Part 1 cues (Beats 0-2)
  c.on('se-fresh-search-new-input', () => {
    s.play(rev2On.to(1, { duration: clampDur(c, c.cue('se-fresh-search-new-input').start, 0.3) }));
  });
  c.on('se-fresh-search-0', () => {
    s.play(askPackOn.to(1, { duration: clampDur(c, c.cue('se-fresh-search-0').start, 0.25) }));
  });
  // Strict prediction withholding #1: reveal WITHHOLD BOTH only AFTER "Withhold both".
  c.after('se-fresh-search-1', () => {
    s.play(withholdBothOn.to(1, { duration: clampDur(c, c.cue('se-fresh-search-1').end, 0.25) }));
  });
  c.on('se-fresh-search-rejection', () => {
    s.play(
      staleReasonOn.to(1, {
        duration: clampDur(c, c.cue('se-fresh-search-rejection').start, 0.25),
      }),
    );
  });
  c.on('se-fresh-search-short', () => {
    s.play(
      shortReasonOn.to(1, { duration: clampDur(c, c.cue('se-fresh-search-short').start, 0.25) }),
    );
  });
  c.on('se-fresh-search-fetch', () => {
    s.play(fetchOn.to(1, { duration: clampDur(c, c.cue('se-fresh-search-fetch').start, 0.25) }));
  });
  c.on('se-fresh-search-2', () => {
    s.play(extendProg.to(1, { duration: clampDur(c, c.cue('se-fresh-search-2').start, 0.7) }));
  });
  c.on('se-fresh-search-recheck', () => {
    s.play(
      recheckOn.to(1, { duration: clampDur(c, c.cue('se-fresh-search-recheck').start, 0.25) }),
    );
  });
  c.after('se-fresh-search-result', () => {
    s.play(releasedOn.to(1, { duration: clampDur(c, c.cue('se-fresh-search-result').end, 0.3) }));
  });

  // Part 2 cues (Beats 3-4)
  c.on('fresh-day', () => {
    s.play(rulerMode.to(1, { duration: clampDur(c, c.cue('fresh-day').start, 0.25) }));
  });
  c.on('fresh-friday', () => {
    s.play(fridayOn.to(1, { duration: clampDur(c, c.cue('fresh-friday').start, 0.25) }));
  });
  c.on('fresh-ask', () => {
    s.play(askDayOn.to(1, { duration: clampDur(c, c.cue('fresh-ask').start, 0.25) }));
  });
  // Strict prediction withholding #2: reveal OUTSIDE verdict only AFTER "Friday misses the cutoff".
  c.after('fresh-outside', () => {
    s.play(fridayOutOn.to(1, { duration: clampDur(c, c.cue('fresh-outside').end, 0.25) }));
  });
  c.after('fresh-thursday', () => {
    s.play(thursdayOn.to(1, { duration: clampDur(c, c.cue('fresh-thursday').end, 0.25) }));
  });
  c.on('fresh-inside', () => {
    s.play(extFillProg.to(1, { duration: clampDur(c, c.cue('fresh-inside').start, 0.65) }));
  });
  c.after('fresh-inside', () => {
    s.play(thursdayInOn.to(1, { duration: clampDur(c, c.cue('fresh-inside').end, 0.25) }));
  });
}
