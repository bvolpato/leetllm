// Scene 08 (pinned-bundle): "Which parent belongs to this request?"
// Orbiting 3D twin wireframe vaults (Bundle A cyan vs Bundle B violet) paired with a 4-component
// atomic bundle matrix, global serving pointer flip A -> B, cross-revision fault arc, and repair.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildBundleVault3d,
  callerTag,
  cinemaAtmosphere,
  glowArrow,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  runPhase,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function pinnedBundle(s, c) {
  const phase = s.value(0);
  const manifestLit = s.value(0);
  const pinLit = s.value(0);
  const bIndexReady = s.value(0);
  const bAllReady = s.value(0);
  const pointerB = s.value(0);
  const linkMode = s.value(0); // 0 = pinned A, 1 = broken cross-pointer B, 2 = repaired A

  const { view: vaults3d } = buildBundleVault3d(linkMode, { x: 460, y: 25 });

  const title = heroTitle(['Which Parent Belongs', 'to This Request?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'ATOMIC INDEX BUNDLES · REQUEST PINNING',
  });

  const parts = ['Child index', 'Parent store', 'Source manifest', 'Retrieval config'];

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const ml = manifestLit.value;
    const pl = pinLit.value;
    const bi = bIndexReady.value;
    const ba = bAllReady.value;
    const pb = pointerB.value;
    const lm = linkMode.value;

    const isBroken = lm > 0.5 && lm < 1.5;
    const isRepaired = lm >= 1.5;

    const nodes = [callerTag(1)];

    // Left top: 4-layer atomic bundle status comparison (Bundle A vs Bundle B)
    nodes.push(
      txt('BUNDLE COMPONENT', -855, -246, 26, COSMOS.muted, 'mono', 'left'),
      txt('BUNDLE A', -345, -246, 26, ROLE.policy, 'mono', 'center'),
      txt('BUNDLE B', -100, -246, 26, ROLE.violet, 'mono', 'center'),
    );

    parts.forEach((part, i) => {
      const ry = -188 + i * 68;
      const isMan = i === 2 && ml > 0.3;
      const bReady = (i === 0 && bi > 0.4) || (i > 0 && ba > 0.4);
      nodes.push(
        lumBar(-435, ry, 845, 52, {
          color: isMan ? ROLE.focus : '#2b3b60',
          fillAlpha: isMan ? 0.14 : 0.06,
          strokeWidth: isMan ? 2.4 : 1.6,
          glow: isMan ? 8 : 0,
          radius: 9,
        }),
        txt(part, -825, ry, 28, COSMOS.ink, 'sans', 'left'),
        txt('HELD', -345, ry, 26, ROLE.admitted, 'mono', 'center'),
        txt(
          bReady ? 'READY' : 'BUILDING',
          -100,
          ry,
          26,
          bReady ? ROLE.admitted : COSMOS.muted,
          'mono',
          'center',
        ).glow(bReady ? 6 : 0, ROLE.admitted),
      );
    });

    // Left bottom: Live child -> parent resolution schematic
    const childY = 128;
    const parY = 276;
    const parAx = -645;
    const parBx = -225;

    nodes.push(
      lumBar(-435, childY, 560, 68, {
        color: pl > 0.3 ? ROLE.focus : ROLE.request,
        fillAlpha: 0.14,
        strokeWidth: 2.4,
        glow: 9,
        radius: 12,
      }),
      txt('child A  ·  pinned to bundle A', -435, childY, 28, COSMOS.ink, 'mono', 'center'),

      lumBar(parAx, parY, 340, 68, {
        color: isRepaired ? ROLE.admitted : ROLE.policy,
        fillAlpha: isRepaired ? 0.2 : 0.1,
        strokeWidth: 2.4,
        glow: isRepaired ? 10 * pulse : 6,
        radius: 12,
      }),
      txt(
        'parent A  (rev A)',
        parAx,
        parY,
        28,
        isRepaired ? ROLE.admitted : ROLE.policy,
        'mono',
        'center',
      ),

      lumBar(parBx, parY, 340, 68, {
        color: isBroken ? ROLE.danger : ROLE.violet,
        fillAlpha: isBroken ? 0.18 : 0.08,
        strokeWidth: 2.2,
        glow: isBroken ? 10 * pulse : 4,
        radius: 12,
      }),
      txt(
        'parent B  (rev B)',
        parBx,
        parY,
        28,
        isBroken ? ROLE.danger : ROLE.violet,
        'mono',
        'center',
      ),
    );

    // Arrow from child A to either parent B (broken mismatch) or parent A (repaired match)
    if (isBroken) {
      nodes.push(
        glowArrow([-360, childY + 38], [parBx, parY - 38], ROLE.danger, {
          width: 4.5,
          tip: 16,
          glow: 11 * pulse,
        }),
        statusPill('REVISION MISMATCH!', -675, 200, {
          color: ROLE.danger,
          width: 325,
          height: 44,
        }),
      );
    } else {
      const col = isRepaired ? ROLE.admitted : ROLE.policy;
      nodes.push(
        glowArrow([-510, childY + 38], [parAx, parY - 38], col, {
          width: 4.5,
          tip: 16,
          glow: isRepaired ? 12 * pulse : 7,
        }),
      );
      if (isRepaired) {
        nodes.push(
          statusPill('MATCHING REVISION', -205, 200, {
            color: ROLE.admitted,
            width: 310,
            height: 44,
          }),
        );
      }
    }

    // 3D vaults caption + global serving pointer indicator
    nodes.push(
      txt('3D ATOMIC BUNDLE VAULTS', 460, -335, 26, ROLE.policy, 'mono', 'center').glow(
        5,
        ROLE.policy,
      ),
      txt('Bundle A (cyan)   |   Bundle B (violet)', 460, 345, 26, COSMOS.muted, 'mono', 'center'),
      line([320, -295], [600, -295], { stroke: '#2c3d63', width: 2.5 }),
      statusPill(pb > 0.5 ? 'GLOBAL POINTER -> B' : 'GLOBAL POINTER -> A', 460, -255, {
        color: pb > 0.5 ? ROLE.violet : ROLE.policy,
        width: 360,
        height: 46,
      }),
    );

    // Bottom discrete status
    let footText = 'Request pins child index, parent store, manifest, and config together';
    let footCol = COSMOS.muted;
    if (isRepaired) {
      footText = 'Follow pinned child back to parent A  ·  recheck live permissions';
      footCol = ROLE.admitted;
    } else if (isBroken) {
      footText = 'Serving pointer flipped to B  ·  following it attaches wrong revision B!';
      footCol = ROLE.danger;
    } else if (pb > 0.5) {
      footText = 'Serving pointer switched to B for new requests; Luna still holds A';
      footCol = ROLE.focus;
    }
    nodes.push(
      txt(footText, -855, 415, 30, footCol, 'mono', 'left').glow(
        footCol !== COSMOS.muted ? 7 : 0,
        footCol,
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.violet), vaults3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, vaults3d, { theta: 0.38, phi: 0.96 });

  tweenCue(s, c, 'pr-snapshot', manifestLit, 1, { dur: 0.5 });
  tweenCue(s, c, 'pr-pin', pinLit, 1, { dur: 0.5 });
  tweenCue(s, c, 'pr-migration', bIndexReady, 1, { dur: 0.6 });
  tweenCue(s, c, 'pr-switch', bAllReady, 1, { dur: 0.6 });
  tweenCue(s, c, 'pr-pointer', pointerB, 1, { dur: 0.5 });
  tweenCue(s, c, 'pr-mixed', linkMode, 1, { dur: 0.75 });
  tweenCue(s, c, 'pr-repair', linkMode, 2, { dur: 0.75 });
}
