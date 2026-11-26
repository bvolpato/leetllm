// Scene 30: hosted-contract: "Accepted, rejected and ignored settings produce different experiments"
// View 1 (Beat 0): Three API request paths sending "temperature": accepted, rejected (HTTP 400),
//   and silently ignored.
// View 2 (Beat 1): Versioned provider contracts (Claude, GPT-6 reasoning effort, Gemini) revealed
//   strictly AFTER dec-host-claude, dec-host-gpt, dec-host-gemini.
// View 3 (Beat 2): Three orthogonal control axes: effort (compute), temperature (token row),
//   schema (output structure).
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowVector, lumBar, playCue, swapVis } from '../parts.mjs';

export default function hostedContract(s, c) {
  const title = heroTitle(['Accepted, rejected,', 'or silently ignored'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.alt,
  });

  const vTri = s.value(1);
  const vProviders = s.value(0);
  const vAxes = s.value(0);

  const triSweep = s.value(1);
  const claudeDone = s.value(0);
  const gptDone = s.value(0);
  const geminiDone = s.value(0);
  const axesSweep = s.value(1);

  // VIEW 1: Three observable runtime outcomes for a submitted temperature field
  const triLayer = guardedDynamic(vTri, (alpha) => {
    const nodes = [];
    const nLit = Math.round(Math.max(1, Math.min(3, triSweep.value)));
    const cols = [
      { x: -535, out: 'Accepted & applied', sub: 'Effective T changes', col: ROLE.valid },
      { x: 0, out: 'Rejected: HTTP 400', sub: 'Request fails fast', col: ROLE.pruned },
      { x: 535, out: 'Accepted & ignored', sub: 'Silent identical policy!', col: ROLE.heat },
    ];

    cols.forEach((item, i) => {
      const lit = i < nLit;
      const la = (lit ? 1 : 0.3) * alpha;
      nodes.push(
        lumBar(item.x, -145, 420, 86, {
          color: ROLE.base,
          fillOpacity: 0.2,
          strokeWidth: 2.2,
          glow: 7,
          radius: 12,
          opacity: la,
        }),
        txt('temperature = 0.7', item.x, -145, 30, COSMOS.ink, 'mono', 'center').opacity(la),
        glowVector([item.x, -85], [item.x, 25], {
          color: item.col,
          width: 4,
          glow: 9,
          opacity: la,
        }),
        lumBar(item.x, 115, 420, 112, {
          color: item.col,
          fillOpacity: 0.24,
          strokeWidth: 2.6,
          glow: 10,
          radius: 14,
          opacity: la,
        }),
        txt(item.out, item.x, 94, 30, item.col, 'mono', 'center').opacity(la),
        txt(item.sub, item.x, 140, 26, COSMOS.muted, 'sans', 'center').opacity(la),
      );
    });

    nodes.push(
      txt(
        'Inspect the exact model + API version and log the effective configuration before any sweep.',
        0,
        365,
        28,
        ROLE.winner,
        'serif',
        'center',
      )
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Versioned provider contract examples (Nov 2026 docs)
  const providersLayer = guardedDynamic(vProviders, (alpha) => {
    const nodes = [];
    const rows = [
      {
        name: 'Claude API (2026-10-21)',
        res: 'Rejects temperature, top-p, top-k',
        ready: claudeDone.value > 0.4,
        col: ROLE.pruned,
        y: -155,
      },
      {
        name: 'GPT-6 (reasoning effort on)',
        res: 'Removes temperature & top-p',
        ready: gptDone.value > 0.4,
        col: ROLE.heat,
        y: 35,
      },
      {
        name: 'Gemini (cited release)',
        res: 'Listed sampling fields ignored',
        ready: geminiDone.value > 0.4,
        col: ROLE.alt,
        y: 225,
      },
    ];

    nodes.push(
      txt(
        'Inspected provider contracts (exact version table in article)',
        0,
        -280,
        30,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    rows.forEach((r) => {
      nodes.push(
        lumBar(-430, r.y, 540, 92, {
          color: ROLE.base,
          fillOpacity: 0.22,
          strokeWidth: 2.2,
          glow: 8,
          radius: 12,
          opacity: alpha,
        }),
        txt(r.name, -430, r.y, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
        glowVector([-145, r.y], [35, r.y], {
          color: r.ready ? r.col : COSMOS.dim,
          width: 4,
          glow: r.ready ? 9 : 2,
          opacity: alpha,
        }),
        lumBar(435, r.y, 740, 92, {
          color: r.ready ? r.col : COSMOS.dim,
          fillOpacity: r.ready ? 0.24 : 0.08,
          strokeWidth: r.ready ? 2.6 : 1.6,
          glow: r.ready ? 10 : 2,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          r.ready ? r.res : 'Check versioned API documentation',
          435,
          r.y,
          30,
          r.ready ? r.col : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    return nodes;
  });

  // VIEW 3: Three orthogonal axes (effort, temperature, schema)
  const axesLayer = guardedDynamic(vAxes, (alpha) => {
    const nodes = [];
    const nLit = Math.round(Math.max(1, Math.min(3, axesSweep.value)));
    const axes = [
      { name: 'Reasoning Effort', role: 'Controls compute / work budget', col: ROLE.alt, y: -155 },
      {
        name: 'Temperature / Top-p',
        role: 'Shapes next-token probability row',
        col: ROLE.active,
        y: 35,
      },
      {
        name: 'JSON Schema / Grammar',
        role: 'Constrains eligible output structure',
        col: ROLE.valid,
        y: 225,
      },
    ];

    nodes.push(
      txt(
        'Three separate control axes (not interchangeable)',
        0,
        -280,
        32,
        ROLE.winner,
        'serif',
        'center',
      ).opacity(alpha),
    );

    axes.forEach((ax, i) => {
      const lit = i < nLit;
      const la = (lit ? 1 : 0.3) * alpha;
      nodes.push(
        lumBar(-430, ax.y, 500, 96, {
          color: ax.col,
          fillOpacity: 0.24,
          strokeWidth: 2.5,
          glow: 10,
          radius: 48,
          opacity: la,
        }),
        txt(ax.name, -430, ax.y, 32, COSMOS.ink, 'serif', 'center').opacity(la),
        glowVector([-165, ax.y], [25, ax.y], { color: ax.col, width: 4, glow: 9, opacity: la }),
        lumBar(435, ax.y, 740, 96, {
          color: ax.col,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 8,
          radius: 14,
          opacity: la,
        }),
        txt(ax.role, 435, ax.y, 30, ax.col, 'mono', 'center').opacity(la),
      );
    });

    nodes.push(
      txt(
        'When sampling knobs are locked, validate returned fields and repeat prompts to measure variance.',
        0,
        385,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.alt, ROLE.active), title, triLayer, providersLayer, axesLayer);

  playCue(s, c, 'dec-hosted-contract-1', (d) => s.play(triSweep.to(3, { duration: d })), {
    dur: 1.0,
  });

  c.onBeat(1, () => s.play(swapVis(vTri, vProviders, 0.55)));
  playCue(s, c, 'dec-hosted-contract-2', (d) => s.play(claudeDone.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-host-claude', (d) => s.play(claudeDone.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-host-gpt', (d) => s.play(gptDone.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-host-gemini', (d) => s.play(geminiDone.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  c.onBeat(2, () => s.play(swapVis(vProviders, vAxes, 0.55)));
  playCue(s, c, 'dec-hosted-contract-3', (d) => s.play(axesSweep.to(3, { duration: d })), {
    dur: 1.1,
  });
}
