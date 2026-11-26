// Scene 3: mdp - "What did the desk know?"
// View 1: Radiant 4-node MDP constellation on the left + floating Agent <-> Environment orbital loop
//         with live elapsed-wait counter (45 s -> 65 s) and Markov property equation.
// View 2: Partial-observability counterexample: two "New" tickets (45 s vs 65 s) sharing one label
//         but diverging in leave risk.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  drawMdpConstellation,
  glowArcArrow,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  mdpBefore,
  mdpEvent,
  observeEnvironment,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';

export default function mdp(s, c) {
  const receipt = observeEnvironment(mdpBefore, 'ask evidence', mdpEvent);

  const title = heroTitle(['What did the', 'desk know?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.state,
  });

  const vMain = s.value(1);
  const vCounter = s.value(0);

  // View 1 animated state
  const waitSec = s.value(mdpBefore.elapsedWait);
  const hiEvid = s.value(0);
  const hiWait = s.value(0);
  const hiMarkov = s.value(0);
  const actionT = s.value(0);
  const observed = s.value(0);

  // View 2 animated state
  const hiPartial = s.value(0);

  const eqMarkov = glowTex('P(S_{t+1}, R_{t+1} \\mid S_t, A_t)', {
    x: 495,
    y: -365,
    size: 34,
    color: ROLE.gold,
    glow: 6,
  });

  const mainLayer = guardedDynamic(vMain, (alpha) => {
    const obs = observed.value > 0.5;
    const isAct = actionT.value > 0.02 && actionT.value < 0.99;

    const mdpG = drawMdpConstellation({
      cx: -350,
      cy: 65,
      rx: 325,
      ry: 215,
      nodeR: 62,
      activeNode: obs ? 'evidence' : 'new',
      highlightNode: hiEvid.value > 0.5 && !obs ? 'evidence' : null,
      pulseEdge: isAct ? 'new->evidence' : null,
      pulseT: actionT.value,
      alpha,
    });

    const nodes = [...mdpG.nodes];

    // Subtle hairline separator between MDP constellation and live state readout
    nodes.push(rule(145, -280, 145, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha));

    // Right side: Live Agent State Ring -> Environment Loop (ZERO rectangular cards!)
    const rx = 505;
    const stateY = -125;
    const envY = 215;
    const stCol = obs ? ROLE.evidence : ROLE.state;
    const stShort = obs ? 'Verified' : 'New';

    nodes.push(
      txt('Router state S_t', rx, -258, 28, ROLE.state, 'mono', 'center').opacity(alpha),
      glowRing(rx, stateY, 96, stCol, { width: 4, glow: 12 }).opacity(alpha),
      txt(stShort, rx, stateY - 18, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt(
        `${Math.round(waitSec.value)} s`,
        rx,
        stateY + 24,
        30,
        hiWait.value > 0.5 ? ROLE.gold : stCol,
        'mono',
        'center',
      )
        .glow(hiWait.value > 0.5 ? 8 : 0, ROLE.gold)
        .opacity(alpha),
    );

    // Bidirectional curved Agent <-> Environment photon loop (cleanly outside orb rims!)
    nodes.push(
      glowArcArrow([rx - 114, stateY + 38], [rx - 114, envY - 48], 0, {
        color: ROLE.evidence,
        width: isAct ? 4.5 : 2.8,
        glow: isAct ? 12 : 6,
        opacity: alpha,
        photonT: isAct ? actionT.value : null,
      }),
      txt('Ask', rx - 205, 45, 28, ROLE.evidence, 'mono', 'center').opacity(alpha),
      glowArcArrow([rx + 114, envY - 48], [rx + 114, stateY + 38], 0, {
        color: obs ? ROLE.gold : ROLE.state,
        width: obs ? 4.2 : 2.6,
        glow: obs ? 11 : 5,
        opacity: alpha,
      }),
      txt(
        obs ? `Receipt ${receipt.receipt}` : 'Obs & r',
        rx + 230,
        45,
        26,
        obs ? ROLE.gold : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Environment / Receipt orb (clean short text inside, subtitle outside below!)
    nodes.push(
      glowRing(rx, envY, 92, obs ? ROLE.gold : COSMOS.muted, {
        width: 3.4,
        glow: obs ? 11 : 6,
      }).opacity(alpha),
      txt(
        obs ? `r = ${receipt.reward}` : 'Env',
        rx,
        envY - 16,
        30,
        obs ? ROLE.gold : COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(obs ? '+20 s' : 'World', rx, envY + 24, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),
      txt(
        'Requester · verifier · reviewer',
        rx,
        envY + 130,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    // Subtle Markov status caption when highlighted
    if (hiMarkov.value > 0.05) {
      nodes.push(
        txt(
          'Markov property: S_t holds all predictive history',
          rx,
          410,
          26,
          ROLE.gold,
          'sans',
          'center',
        ).opacity(hiMarkov.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Partial Observability Counterexample
  const counterLayer = guardedDynamic(vCounter, (alpha) => {
    const nodes = [];
    const pGlow = hiPartial.value > 0.5;

    // Collapsed shared observation orb at top center
    nodes.push(
      txt('Collapsed label seen by router', 0, -285, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      glowRing(0, -170, 74, ROLE.state, { width: 3.8, glow: 11 }).opacity(alpha),
      txt('New', 0, -170, 38, ROLE.state, 'serif', 'center').opacity(alpha),
    );

    // Two distinct hidden true states diverging below
    const tickets = [
      {
        x: -390,
        name: 'Ticket A',
        wait: `${mdpBefore.elapsedWait} s`,
        risk: 'Lower leave risk',
        col: ROLE.evidence,
      },
      {
        x: 390,
        name: 'Ticket B',
        wait: `${receipt.elapsedWait} s`,
        risk: 'Higher leave risk',
        col: ROLE.amber,
      },
    ];

    tickets.forEach((tk, i) => {
      nodes.push(
        glowArcArrow([i === 0 ? -74 : 74, -135], [tk.x, 38], -45, {
          color: tk.col,
          width: 3.4,
          glow: 9,
          opacity: alpha,
        }),
        glowRing(tk.x, 148, 96, pGlow ? ROLE.gold : tk.col, {
          width: pGlow ? 4.4 : 3.4,
          glow: pGlow ? 14 : 9,
        }).opacity(alpha),
        txt(tk.name, tk.x, 122, 32, COSMOS.ink, 'serif', 'center').opacity(alpha),
        txt(tk.wait, tk.x, 170, 32, pGlow ? ROLE.gold : tk.col, 'mono', 'center')
          .glow(pGlow ? 8 : 0, ROLE.gold)
          .opacity(alpha),
        txt(tk.risk, tk.x, 288, 28, tk.col, 'sans', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'If waiting changes outcomes, include elapsed time or track a belief state.',
        0,
        395,
        32,
        ROLE.gold,
        'serif',
        'center',
      )
        .glow(pGlow ? 8 : 4, ROLE.gold)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.state, ROLE.gold), title, mainLayer, counterLayer);

  playCue(s, c, 'different-state', (d) => s.play(hiEvid.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'wait-field', (d) => s.play(hiWait.to(1, { duration: d })), { dur: 0.45 });
  c.show('markov', eqMarkov);
  playCue(s, c, 'markov', (d) => s.play(hiMarkov.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'agent-action', (d) => s.play(actionT.to(1, { duration: d })), { dur: 0.9 });

  playCue(
    s,
    c,
    'observation',
    (d) =>
      s.play(
        observed.to(1, { duration: Math.min(0.4, d) }),
        waitSec.to(receipt.elapsedWait, { duration: d }),
      ),
    { after: true, dur: 1.0 },
  );

  c.hide('counterexample', eqMarkov);
  playCue(s, c, 'counterexample', (d) => s.play(swapVis(vMain, vCounter, d)), { dur: 0.7 });
  playCue(s, c, 'partial', (d) => s.play(hiPartial.to(1, { duration: d })), { dur: 0.45 });
}
