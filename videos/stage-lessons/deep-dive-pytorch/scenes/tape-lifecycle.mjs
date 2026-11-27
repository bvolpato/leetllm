// Scene 05: The reverse graph follows the branch that actually ran (y=2x, L=y^2 at x=3 -> y=6, L=36, dL/dy=12, dL/dx=24).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildAutogradGraph3d,
  glassCell,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tapeLifecycle(s, c) {
  const phase = s.value(0);
  const stage3d = s.value(0);
  const showPath = s.value(0);
  const showGrad = s.value(0);
  const showModes = s.value(0);

  const bgAura = aura(440, 20, 520, '#a78bfa22', '#6ee7b718');
  const { view: graph3d } = buildAutogradGraph3d(stage3d, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Reverse Graph Follows', 'the Executed Branch'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'DYNAMIC AUTOGRAD TAPE · CHAIN RULE',
  });

  const live = guardedDynamic(1, () => {
    const sp = showPath.value;
    const sg = showGrad.value;
    const sm = showModes.value;

    const nodes = [
      txt('3D DYNAMIC AUTOGRAD DAG', 475, -390, 26, ROLE.grad, 'mono').glow(5, ROLE.grad),
      txt(
        sg > 0.5 ? 'Reverse pass: dL/dy=12 -> dL/dx=24' : 'Forward records only taken branches',
        475,
        405,
        26,
        sg > 0.5 ? ROLE.good : ROLE.grad,
        'mono',
      ),
    ];

    // Scalar chain nodes: x=3 -> (x2) -> y=6 -> (sq) -> L=36
    const chain = [
      { title: 'x = 3', sub: sg > 0.5 ? 'dx = 24' : 'leaf', x: -720, col: ROLE.orig },
      { title: 'y = 2x = 6', sub: sg > 0.5 ? 'dy = 12' : 'saved y', x: -395, col: ROLE.grad },
      { title: 'L = y² = 36', sub: sg > 0.5 ? 'dL = 1' : 'loss', x: -65, col: ROLE.good },
    ];
    chain.forEach((nd, i) => {
      nodes.push(
        glassCell(nd.x, -110, 276, 134, sp > 0.5 || i === 0 ? nd.col : COSMOS.dim, {
          fill: '#111b31',
          glow: sg > 0.5 ? 9 : 4,
        }),
        txt(nd.title, nd.x, -138, 28, nd.col, 'mono'),
        txt(nd.sub, nd.x, -82, 28, sg > 0.5 ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
      if (i < chain.length - 1) {
        nodes.push(
          line([nd.x + 144, -110], [chain[i + 1].x - 144, -110], {
            stroke: COSMOS.gold,
            width: 3.0,
          }),
        );
      }
    });

    // Mode / failure comparison cards
    nodes.push(
      glassCell(-590, 145, 490, 178, sm > 0.5 ? ROLE.bad : ROLE.trans, {
        fill: sm > 0.5 ? '#2b1220' : '#211b10',
        glow: 8,
      }),
      txt(
        sm > 0.5 ? 'LEAF IN-PLACE WRITE' : 'SAVED INTERMEDIATE',
        -590,
        92,
        28,
        sm > 0.5 ? ROLE.bad : ROLE.trans,
        'mono',
      ),
      txt(
        sm > 0.5 ? 'Fails immediately in forward' : 'Detached alias invalidates y',
        -590,
        148,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt(
        sm > 0.5 ? 'Saved view fails in backward' : 'even if leaf bytes stayed put',
        -590,
        198,
        26,
        COSMOS.muted,
        'mono',
      ),

      glassCell(-75, 145, 480, 178, sm > 0.5 ? ROLE.copy : COSMOS.dim, {
        fill: sm > 0.5 ? '#0d202b' : '#0a0f1c',
        glow: sm > 0.5 ? 9 : 2,
      }),
      txt('no_grad vs inference_mode', -75, 92, 28, sm > 0.5 ? ROLE.copy : COSMOS.dim, 'mono'),
      txt('no_grad: stops recording', -75, 148, 26, sm > 0.5 ? COSMOS.ink : COSMOS.dim, 'mono'),
      txt('inference_mode: no versions', -75, 198, 26, sm > 0.5 ? ROLE.copy : COSMOS.dim, 'mono'),
    );

    nodes.push(
      txt(
        sm > 0.5
          ? 'Neither no_grad nor inference_mode repairs mutating tensors needed by backward'
          : sg > 0.5
            ? 'dL/dx = (2y) · 2 = 12 · 2 = 24  (intermediates freed as backward completes)'
            : 'Untaken Python branches never enter the reverse graph',
        -855,
        345,
        28,
        sg > 0.5 ? ROLE.good : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, graph3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, graph3d, { theta: -0.2, phi: 0.9 });

  c.on('pt-tape-lifecycle-0', () => s.play(stage3d.to(0, { duration: 0.3 })));
  c.on('pt-tape-lifecycle-1', () =>
    s.play(showPath.to(1, { duration: remainDuration(c, 'pt-tape-lifecycle-1', 0.4) })),
  );
  c.on('pt-tape-gradient', () => {
    const dur = remainDuration(c, 'pt-tape-gradient', 0.45);
    s.play(showGrad.to(1, { duration: dur }));
    s.play(stage3d.to(2, { duration: dur }));
  });
  c.on('pt-tape-lifecycle-2', () => {
    const dur = remainDuration(c, 'pt-tape-lifecycle-2', 0.45);
    s.play(showModes.to(1, { duration: dur }));
    s.play(stage3d.to(1, { duration: dur }));
  });
}
