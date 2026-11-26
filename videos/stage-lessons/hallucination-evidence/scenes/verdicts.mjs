// Scene 3: What did the record establish? (Supported vs Extrinsic Unsupported vs Intrinsic Contradicted)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function verdicts(s, c) {
  const phase = s.value(0);
  const showEnt = s.value(0);
  const showExt = s.value(0);
  const showAlt = s.value(0);
  const showCon = s.value(0);
  const showAction = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['What Did the', 'Record Establish?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'THREE EVIDENCE VERDICTS · SUPPORTED · EXTRINSIC · INTRINSIC',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const se = showEnt.value;
    const sx = showExt.value;
    const sa = showAlt.value;
    const sc = showCon.value;
    const sAct = showAction.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const cols = [
      {
        cx: -575,
        title: 'SUPPORTED',
        tag: 'ENTAILED BY RECORD',
        claim: 'service, event, 08:14 UTC',
        ev: 'Matches admitted fields',
        action: 'Safe to render',
        col: COSMOS.emerald,
        fill: '#0e2624',
        hi: se > 0.3,
      },
      {
        cx: 0,
        title: 'NOT SUPPORTED',
        tag: 'EXTRINSIC HALLUCINATION',
        claim: 'recovery_eta: 14:30 UTC',
        ev: 'Record cannot settle it',
        action: 'Ask incident owner',
        col: COSMOS.amber,
        fill: '#241c10',
        hi: sx > 0.3,
      },
      {
        cx: 575,
        title: 'CONTRADICTED',
        tag: 'INTRINSIC HALLUCINATION',
        claim: 'status: "resolved"',
        ev: 'Record says "investigating"',
        action: 'Resolve conflict first!',
        col: COSMOS.rose,
        fill: '#29111a',
        hi: sc > 0.3 || sa > 0.3,
      },
    ];

    const nodes = [];
    cols.forEach((item) => {
      nodes.push(
        glassCell(item.cx, 25, 530, 440, item.hi ? item.col : COSMOS.muted, {
          fill: item.hi ? item.fill : '#11182c',
          glow: item.hi ? 10 * pulse : 3,
        }),
        txt(item.title, item.cx, -140, 32, item.col, 'mono'),
        txt(item.tag, item.cx, -92, 26, COSMOS.muted, 'mono'),
        txt('CLAIM:', item.cx, -20, 26, COSMOS.cyan, 'mono'),
        txt(item.claim, item.cx, 22, 26, COSMOS.ink, 'sans'),
        txt('RUNBOOK CHECK:', item.cx, 88, 26, COSMOS.gold, 'mono'),
        txt(item.ev, item.cx, 128, 26, item.col, 'sans'),
        txt(
          sAct > 0.3 ? `ON-CALL: ${item.action}` : item.action,
          item.cx,
          200,
          26,
          sAct > 0.3 ? item.col : COSMOS.muted,
          'mono',
        ),
      );
    });

    nodes.push(
      glowDot(-840, 345, { radius: 6, color: COSMOS.gold }),
      txt(
        'Extrinsic additions need missing evidence; intrinsic conflicts contradict the admitted record directly',
        -812,
        347,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('entailed-fields', () => s.play(showEnt.to(1, { duration: 0.45 })));
  c.on('absent-eta', () => s.play(showExt.to(1, { duration: 0.45 })));
  c.on('status-alternative', () => s.play(showAlt.to(1, { duration: 0.4 })));
  c.on('contradicted-status', () => s.play(showCon.to(1, { duration: 0.45 })));
  c.on('unknown-truth', () =>
    s.play(showAction.to(1, { duration: remainDuration(c, 'unknown-truth', 0.45) })),
  );
}
