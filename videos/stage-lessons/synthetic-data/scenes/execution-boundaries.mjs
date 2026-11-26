// Scene 07: Keep the verifier independent of the candidate (4 scopes, test tampering vs independent contract, Phi-1 / Llama 3 / Orca)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function executionBoundaries(s, c) {
  const phase = s.value(0);
  const sScopes = s.value(0);
  const sSchema = s.value(0);
  const sStatic = s.value(0);
  const sRuntime = s.value(0);
  const sSymbolic = s.value(0);
  const sAct2 = s.value(0);
  const sEdited = s.value(0);
  const sEditedRes = s.value(0);
  const sTrustedFail = s.value(0);
  const sLlama = s.value(0);
  const sAct3 = s.value(0);
  const sPhi = s.value(0);
  const sPhiScore = s.value(0);
  const sOrca = s.value(0);

  const bgAura = aura(0, 20, 680, '#14375c28', '#331a4418');

  const title = heroTitle(['Keep the Verifier Independent', 'of the Candidate'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'VERIFICATION SCOPES · ANTI-TAMPERING & HISTORICAL RECIPES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const sc = Math.max(0.75, sScopes.value);
    const sch = sSchema.value;
    const sta = sStatic.value;
    const rnt = sRuntime.value;
    const sym = sSymbolic.value;
    const a2 = sAct2.value;
    const edt = sEdited.value;
    const edr = sEditedRes.value;
    const trf = sTrustedFail.value;
    const llm = sLlama.value;
    const a3 = sAct3.value;
    const phi = sPhi.value;
    const psc = sPhiScore.value;
    const orc = sOrca.value;

    // Act 3: Phi-1 inventory & Orca scope
    if (a3 > 0.5) {
      const bars = [
        { label: 'Filtered code: ~6B', val: 6.0, col: COSMOS.blue },
        { label: 'Synthetic textbook: <1B', val: 1.0, col: COSMOS.cyan },
        { label: 'Exercises: ~0.18B', val: 0.32, col: COSMOS.gold },
      ];
      const nodes = [
        txt(
          'PHI-1 (2023) DATASET INVENTORY · SEPARATE TOKEN COUNTS',
          0,
          -186,
          26,
          COSMOS.blue,
          'mono',
        ),
      ];
      bars.forEach((b, i) => {
        const y = -82 + i * 116;
        const w = b.val * 124 * Math.max(0.15, phi);
        nodes.push(
          txt(b.label, -810, y + 2, 28, b.col, 'mono', 'left'),
          rect(w, 60, { fill: '#102238', stroke: b.col, width: 2.6, radius: 8 })
            .at(-220 + w * 0.5, y)
            .glow(6, b.col),
        );
      });

      nodes.push(
        glassCell(0, 268, 1520, 86, psc > 0.3 ? COSMOS.emerald : COSMOS.rule, {
          fill: '#0e2424',
          glow: psc > 0.3 ? 8 : 2,
        }),
        txt(
          psc > 0.3
            ? 'Phi-1 (1.3B params): HumanEval pass@1 = 50.6%   (inventory != training exposure)'
            : 'Dataset inventory differs from repeated training exposure',
          0,
          270,
          28,
          psc > 0.3 ? COSMOS.emerald : COSMOS.muted,
          'mono',
        ),
        glassCell(0, 382, 1520, 82, orc > 0.3 ? COSMOS.cyan : COSMOS.rule, {
          fill: '#0f1c32',
          glow: orc > 0.3 ? 6 : 2,
        }),
        txt(
          'Orca explanation traces: measured by task outcomes, not proof of validity or throughput',
          0,
          384,
          26,
          orc > 0.3 ? COSMOS.cyan : COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Act 2: Generator-edited test vs Trusted Independent Contract
    if (a2 > 0.5) {
      const nodes = [
        glassCell(0, -158, 1280, 82, COSMOS.rose, { fill: '#281119', glow: 7 }),
        txt(
          'SAME CANDIDATE CLIENT:  requests page_size = 10,000',
          0,
          -156,
          30,
          COSMOS.rose,
          'mono',
        ),

        // Left: Generator-edited test
        glassCell(-430, 35, 760, 224, COSMOS.amber, {
          fill: '#241a0d',
          glow: edt > 0.2 ? 8 * pulse : 4,
        }),
        txt('GENERATOR-EDITED TEST', -430, -34, 28, COSMOS.amber, 'mono'),
        txt('Weakened rule: limit <= 10,000', -430, 24, 28, COSMOS.ink, 'mono'),
        txt(
          edr > 0.5 ? '10,000 <= 10,000  ->  FALSE PASS!' : '10,000 <= 10,000  ->  pending...',
          -430,
          92,
          30,
          edr > 0.5 ? COSMOS.amber : COSMOS.muted,
          'mono',
        ),

        // Right: Independent trusted contract
        glassCell(430, 35, 760, 224, trf > 0.5 ? COSMOS.rose : COSMOS.blue, {
          fill: trf > 0.5 ? '#281119' : '#0e1d36',
          glow: trf > 0.5 ? 10 * pulse : 5,
        }),
        txt('TRUSTED INDEPENDENT CONTRACT', 430, -34, 28, COSMOS.blue, 'mono'),
        txt('Locked rule: limit <= 100', 430, 24, 28, COSMOS.ink, 'mono'),
        txt(
          trf > 0.5 ? '10,000 <= 100  ->  FAIL (WITHHOLD)' : '10,000 <= 100  ->  pending...',
          430,
          92,
          30,
          trf > 0.5 ? COSMOS.rose : COSMOS.muted,
          'mono',
        ),

        // Bottom Llama 3 historical note
        glassCell(0, 315, 1620, 114, llm > 0.3 ? COSMOS.cyan : COSMOS.rule, {
          fill: '#0f1a2f',
          glow: llm > 0.3 ? 6 : 2,
        }),
        txt(
          trf > 0.5
            ? 'Preserve independent tests outside generator write access'
            : 'Compare self-edited test against independent contract',
          0,
          288,
          28,
          trf > 0.5 ? COSMOS.rose : COSMOS.muted,
          'sans',
        ),
        txt(
          llm > 0.3
            ? 'Llama 3 execution feedback: ~1M coding dialogues · ~20% self-corrected (not full proof)'
            : 'Self-edited tests confirm self-consistency, not correctness',
          0,
          340,
          26,
          llm > 0.3 ? COSMOS.cyan : COSMOS.dim,
          'mono',
        ),
      ];
      return group(...nodes);
    }

    // Act 1: 4 Verifier Scopes ladder
    const rows = [
      {
        name: 'SCHEMA',
        desc: 'Field shape & types (e.g. 3-field JSON config)',
        col: COSMOS.blue,
        on: sch > 0.2,
      },
      {
        name: 'STATIC',
        desc: 'Syntax, types & AST code inspection',
        col: COSMOS.cyan,
        on: sta > 0.2,
      },
      {
        name: 'RUNTIME',
        desc: 'Execute two-page fixture: cursors, retries & names',
        col: COSMOS.emerald,
        on: rnt > 0.2,
      },
      {
        name: 'SYMBOLIC',
        desc: 'Formal property proof inside explicit model',
        col: COSMOS.violet,
        on: sym > 0.2,
      },
    ];

    const nodes = [
      txt(
        'FOUR VERIFIER SCOPES · EACH ESTABLISHES A DIFFERENT CLAIM',
        0,
        -192,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    rows.forEach((row, i) => {
      const y = -96 + i * 124;
      const active = row.on ? 1 : 0.72;
      nodes.push(
        glassCell(-620, y, 360, 88, row.on ? row.col : COSMOS.rule, {
          fill: row.on ? '#102138' : '#0b101d',
          glow: row.on ? 8 : 2,
          opacity: active,
        }),
        txt(row.name, -620, y + 2, 30, row.on ? row.col : COSMOS.muted, 'mono').opacity(sc),
        glowingArc([-430, y], [-285, y], 0, { color: row.col, width: 3.2, opacity: active }),
        glowDot(-285, y, { radius: 6, color: row.col, opacity: active }),
        glassCell(275, y, 1080, 88, row.on ? row.col : COSMOS.rule, {
          fill: row.on ? '#0f1b30' : '#0b101d',
          glow: row.on ? 5 : 1,
          opacity: active,
        }),
        txt(row.desc, -230, y + 2, 28, row.on ? COSMOS.ink : COSMOS.muted, 'sans', 'left'),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('verifier-scopes', () => s.play(sScopes.to(1, { duration: 0.4 })));
  c.on('scope-schema', () => s.play(sSchema.to(1, { duration: 0.4 })));
  c.on('scope-static', () => s.play(sStatic.to(1, { duration: 0.4 })));
  c.on('scope-runtime', () => s.play(sRuntime.to(1, { duration: 0.4 })));
  c.on('scope-symbolic', () => s.play(sSymbolic.to(1, { duration: 0.4 })));

  c.on('edited-test', () => {
    s.play(sAct2.to(1, { duration: 0.3 }), sEdited.to(1, { duration: 0.45 }));
  });
  c.after('edited-test-result', () => s.play(sEditedRes.to(1, { duration: 0.35 })));
  c.on('independent-test', () => s.play(sAct2.to(1, { duration: 0.25 })));
  c.after('trusted-failure', () => s.play(sTrustedFail.to(1, { duration: 0.35 })));
  c.on('llama-historical', () => s.play(sLlama.to(1, { duration: 0.45 })));

  c.on('phi-recipe', () => {
    s.play(sAct3.to(1, { duration: 0.3 }), sPhi.to(1, { duration: 0.55 }));
  });
  c.after('phi-score', () => s.play(sPhiScore.to(1, { duration: 0.4 })));
  c.on('historical-outcomes', () => s.play(sOrca.to(0.6, { duration: 0.35 })));
  c.after('orca-scope', () =>
    s.play(sOrca.to(1, { duration: remainDuration(c, 'orca-scope', 0.4) })),
  );
}
