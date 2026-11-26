// Scene 18: Compress forced syntax without confusing strings and model tokens (HERO 3D Compressed FSM + retokenization boundary).
import {
  COSMOS,
  ROLE,
  aura,
  buildGrammarFsm3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function compressedGrammar(s, c) {
  const phase = s.value(0);
  // step: 0=singular character transition chain, 1=compressed into single forced jump-forward string + variable branch,
  // 2=string vs tokenizer boundary mismatch, 3=retokenize prior "a" + forced "b" -> "ab"
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e61e', '#a78bfa1c');
  const { view: fsm3d } = buildGrammarFsm3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Compressed FSM Jumps', 'and Token Boundaries'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'JUMP-FORWARD DECODING · RETOKENIZATION',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const compressed = st >= 1;
    const showTok = st >= 2;
    const retok = st >= 3;

    const nodes = [
      txt('3D JUMP-FORWARD FSM LATTICE', 475, -390, 26, ROLE.radix, 'mono').glow(5, ROLE.radix),
      txt('Gold arc skips singular forced states', 475, 405, 26, COSMOS.gold, 'mono'),
    ];

    if (!compressed) {
      // Singular 10-character chain
      nodes.push(
        txt('SINGULAR CHARACTER TRANSITIONS (1 CHOICE / STEP)', -420, -185, 26, ROLE.radix, 'mono'),
      );
      const chars = [...'{"label":"'];
      chars.forEach((ch, i) => {
        const cx = -810 + i * 86;
        nodes.push(
          glassCell(cx, -80, 74, 84, ROLE.radix, { fill: '#0e2436', glow: 7 }),
          txt(ch, cx, -80, 30, COSMOS.ink, 'mono'),
        );
      });
      nodes.push(
        glassCell(-420, 75, 860, 96, COSMOS.gold, { fill: '#1e1a10', glow: 7 }),
        txt(
          '10 consecutive forced steps before any model choice',
          -420,
          75,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
    } else {
      // Compressed super-edge + variable value branch
      nodes.push(
        txt('COMPRESSED FORCED EDGE + VARIABLE BRANCH', -420, -190, 26, ROLE.radix, 'mono'),
        glassCell(-590, -82, 460, 112, ROLE.radix, { fill: '#0e2538', glow: 10 }),
        txt('{"label":"', -590, -104, 34, ROLE.radix, 'mono'),
        txt('1 forced string jump', -590, -52, 26, COSMOS.muted, 'mono'),
        line([-350, -82], [-270, -82], { color: COSMOS.gold, width: 3.5 }),
        glassCell(-130, -82, 260, 132, ROLE.prefill, { fill: '#10213d', glow: 8 }),
        txt('bug / feature', -130, -104, 26, COSMOS.ink, 'mono'),
        txt('/ question', -130, -60, 26, COSMOS.ink, 'mono'),
      );
    }

    if (showTok) {
      nodes.push(
        txt('STRING VS MODEL TOKEN BOUNDARIES', -420, 48, 26, COSMOS.gold, 'mono'),
        glassCell(-420, 148, 860, 128, retok ? ROLE.decode : ROLE.fail, {
          fill: retok ? '#0d2922' : '#2a1220',
          glow: 9,
        }),
        txt(
          retok
            ? 'Retokenize "a" + forced "b" -> token "ab"'
            : 'Naive splice: ["a"] + ["b"] != tok("ab")',
          -420,
          122,
          26,
          retok ? ROLE.decode : ROLE.fail,
          'mono',
        ),
        txt('Measure prep, mask cost & probs on real backend', -420, 178, 26, COSMOS.muted, 'sans'),
      );
    }

    const caption = retok
      ? 'Retokenizing prior text with the forced string preserves tokenizer interpretation.'
      : compressed
        ? 'Constant syntax compresses to one jump; variable values still branch.'
        : 'A compressed FSM collapses singular transitions into one forced string path.';

    nodes.push(txt(caption, -855, 355, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, fsm3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, fsm3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['sg-compressed-grammar-beat-0', 0],
    ['sg-compress', 1, true],
    ['sg-compressed-grammar-beat-1', 2],
    ['sg-retokenize', 3, true],
  ]);
}
