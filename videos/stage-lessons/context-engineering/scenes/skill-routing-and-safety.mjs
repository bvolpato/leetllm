// Scene 20: skill-routing-and-safety: "Test activation, artifact production and authority separately"
// Three requests tested against incident-skill (canary -> activate, vacation -> unloaded,
// rollback -> activate proposal-only / 0 writes) + 3 independent verification axes.
import {
  COSMOS,
  ROLE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function skillRoutingAndSafety(s, c) {
  const showTrigger = s.value(0.35);
  const routeCanary = s.value(0);
  const routeVacation = s.value(0);
  const routeRollback = s.value(0);
  const showAxes = s.value(0);
  const showTradeoff = s.value(0);

  const bgAura = aura(0, 20, 820, '#1e164028', '#14335c26');
  const title = heroTitle(['Test activation, output', '& authority separately'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tool,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const tr = ease(showTrigger.value);
    const rc = ease(routeCanary.value);
    const rv = ease(routeVacation.value);
    const rr = ease(routeRollback.value);
    const ax = ease(showAxes.value);
    const td = ease(showTradeoff.value);

    const rows = [
      {
        req: '1. Canary deploy investigation',
        prog: rc,
        res: 'ACTIVATE skill',
        detail: 'Matches traces & failed deploys',
        col: ROLE.evidence,
        mark: 'check',
      },
      {
        req: '2. Vacation-policy summary',
        prog: rv,
        res: 'LEAVE UNLOADED',
        detail: 'Unrelated domain -> 0 body tokens',
        col: COSMOS.muted,
        mark: 'cross',
      },
      {
        req: '3. Request immediate rollback',
        prog: rr,
        res: 'ACTIVATE: PROPOSAL ONLY',
        detail: 'No-write runtime contract (0 writes)',
        col: ROLE.units,
        mark: 'warn',
      },
    ];

    const nodes = [
      txt(
        'INCIDENT-SKILL ROUTING TRIGGER: FAILED DEPLOYS, TRACES, EVIDENCE HANDOFFS',
        -855,
        -255,
        26,
        ROLE.tool,
        'mono',
        'left',
      ).opacity(alpha * (0.6 + 0.4 * tr)),
    ];

    rows.forEach((row, i) => {
      const y = -145 + i * 130;
      const done = row.prog > 0.35;
      const c = done ? row.col : ROLE.dim;
      nodes.push(
        chip(row.req, -565, y, {
          color: c,
          size: 27,
          h: 68,
          minW: 560,
          opacity: alpha * (0.6 + 0.4 * row.prog),
        }),
        glowArrow([-265, y], [-145, y], c, { opacity: alpha * (0.5 + 0.5 * row.prog) }),
        cornerBrackets(345, y, 930, 96, c, {
          arm: 22,
          width: 2.6,
          opacity: alpha * (0.55 + 0.45 * row.prog),
        }),
        txt(done ? row.res : 'Routing pending...', -85, y - 16, 29, c, 'mono', 'left').opacity(
          alpha,
        ),
        txt(
          done ? row.detail : 'Checking trigger description',
          -85,
          y + 22,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(alpha),
      );
      if (done && row.mark === 'check')
        nodes.push(checkMark(765, y, 26, ROLE.note, alpha * row.prog));
      if (done && row.mark === 'cross')
        nodes.push(crossMark(765, y, 26, COSMOS.muted, alpha * row.prog));
    });

    // Bottom 3 independent test axes (illuminated on B1/B2)
    const axisOp = alpha * (0.5 + 0.5 * ax);
    nodes.push(
      txt(
        'SEPARATE EVALUATION OUTCOMES',
        -855,
        225,
        26,
        ax > 0.3 ? ROLE.note : COSMOS.muted,
        'mono',
        'left',
      ).opacity(axisOp),
      chip('1. Routing accuracy', -595, 305, {
        color: ROLE.evidence,
        size: 26,
        minW: 410,
        opacity: axisOp,
      }),
      chip('2. Artifact validity', 0, 305, {
        color: ROLE.note,
        size: 26,
        minW: 410,
        opacity: axisOp,
      }),
      chip('3. Runtime permission', 595, 305, {
        color: ROLE.poison,
        size: 26,
        minW: 410,
        opacity: axisOp,
      }),

      txt(
        td > 0.3
          ? 'Keep always-needed rules in base prompt; measure activation errors, tokens, and end-to-end work.'
          : ax > 0.3
            ? 'Correct activation != valid handoff; valid script != rollback permission.'
            : 'Evaluate routing, execution, and authority boundary as separate gates.',
        0,
        415,
        29,
        td > 0.3 ? ROLE.evidence : ax > 0.3 ? ROLE.poison : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-skill-routing-and-safety-1', (d) => s.play(showTrigger.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-investigation', (d) => s.play(routeCanary.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-vacation', (d) => s.play(routeVacation.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-proposal', (d) => s.play(routeRollback.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-routing-and-safety-2', (d) => s.play(showAxes.to(1, { duration: d })));
  playCue(s, c, 'ce-skill-routing-and-safety-3', (d) =>
    s.play(showTradeoff.to(1, { duration: d })),
  );
}
