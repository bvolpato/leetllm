// Scene 01 (subject-intro): "When a sandboxed parser fails"
// Orbiting 3D multi-ring isolation cage + live JUnit XML inspection + KeyError channel to agent.
import {
  CASES,
  COSMOS,
  ROLE,
  WORKER_ID,
  buildSandboxCage3d,
  cinemaAtmosphere,
  conduitPts,
  crossSwap,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  repairTrace,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const first = CASES[0];
  const errText = repairTrace().first.error;

  const phase = s.value(0);
  const reportHot = s.value(0);
  const lookupHot = s.value(0);
  const showAsk = s.value(0);
  const showError = s.value(0);
  const classHot = s.value(0);
  const nameHot = s.value(0);
  const travel = s.value(0);
  const childHot = s.value(0);
  const showRepair = s.value(0);
  const hostHot = s.value(0);
  const showCleanup = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.host, ROLE.candidate);
  const { view: cage } = buildSandboxCage3d(phase, showError, {
    x: 470,
    y: -15,
    theta: -0.74,
    phi: 1.06,
    distance: 14.8,
    unit: 108,
  });

  const title = heroTitle(['When a Sandboxed', 'Parser Fails'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.host,
    eyebrow: `SANDBOX EXECUTION  /  ${WORKER_ID}`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const rHot = reportHot.value;
    const lHot = lookupHot.value;
    const askOp = showAsk.value;
    const errOp = showError.value;
    const cHot = classHot.value;
    const nHot = nameHot.value;
    const tr = travel.value;
    const chHot = childHot.value;
    const repOp = showRepair.value;
    const hHot = hostHot.value;
    const clOp = showCleanup.value;

    const nodes = [];

    // Left-upper: floating read-only JUnit XML excerpt (zero slide boxes)
    const xmlX = -860;
    const xmlY = -205;
    nodes.push(
      txt(
        'INPUT  /  report.xml (read-only grant)',
        xmlX,
        xmlY - 46,
        26,
        rHot > 0.4 ? ROLE.mark : ROLE.evidence,
        'mono',
        'left',
      ),
      rule(xmlX, xmlY - 22, -65, xmlY - 22, rHot > 0.4 ? ROLE.mark : ROLE.evidence, 2.5),
      txt('<testcase', xmlX, xmlY + 14, 28, ROLE.evidence, 'mono', 'left'),
      txt(
        `  classname="${first.className}"`,
        xmlX + 24,
        xmlY + 60,
        28,
        cHot > 0.4 ? ROLE.mark : ROLE.ink,
        'mono',
        'left',
      ),
      txt(
        `  name="${first.name}">`,
        xmlX + 24,
        xmlY + 106,
        28,
        nHot > 0.4 ? ROLE.mark : ROLE.ink,
        'mono',
        'left',
      ),
      txt(
        `  <${first.children[0]}/>`,
        xmlX + 48,
        xmlY + 154,
        30,
        chHot > 0.4 ? ROLE.mark : ROLE.evidence,
        'mono',
        'left',
      ).glow(chHot > 0.4 ? 10 : 4, chHot > 0.4 ? ROLE.mark : ROLE.evidence),
      txt('</testcase>', xmlX, xmlY + 198, 28, ROLE.evidence, 'mono', 'left'),
    );

    // Left-middle: parser lookup expression and prediction / KeyError reveal
    const exprY = 76;
    nodes.push(
      txt('WORKER LOOKUP  /  parse.py', xmlX, exprY - 42, 26, ROLE.candidate, 'mono', 'left'),
      lumBar(-535, exprY + 14, 650, 62, {
        color: lHot > 0.4 ? ROLE.mark : ROLE.candidate,
        fillOpacity: 0.16,
        strokeWidth: 2.4,
        glow: lHot > 0.4 ? 12 : 7,
      }),
      txt('case.attrib["status"]', xmlX + 20, exprY + 14, 34, COSMOS.ink, 'mono', 'left'),
    );

    // Non-overlapping prediction prompt vs KeyError reveal
    if (askOp > 0.02) {
      nodes.push(
        txt('What will that lookup return?', xmlX, exprY + 96, 34, ROLE.mark, 'sans', 'left')
          .glow(8, ROLE.mark)
          .opacity(askOp),
      );
    }
    if (errOp > 0.02) {
      // Phase 1: show KeyError under worker expression; Phase 2: pulse photon down conduit; Phase 3: dock at agent
      const srcOp = errOp * Math.max(0, 1 - tr * 3.8);
      const dstOp = errOp * Math.max(0, (tr - 0.72) / 0.28);
      if (srcOp > 0.02) {
        nodes.push(
          lumBar(-620, exprY + 102, 390, 58, {
            color: ROLE.candidate,
            fillOpacity: 0.24,
            strokeWidth: 2.6,
            glow: 11,
            opacity: srcOp,
          }),
          txt(errText, -620, exprY + 102, 30, ROLE.candidate, 'mono', 'center').opacity(srcOp),
        );
      }
      if (dstOp > 0.02) {
        nodes.push(
          lumBar(470, 345, 390, 58, {
            color: ROLE.candidate,
            fillOpacity: 0.24,
            strokeWidth: 2.6,
            glow: 11,
            opacity: dstOp,
          }),
          txt(errText, 470, 345, 30, ROLE.candidate, 'mono', 'center').opacity(dstOp),
        );
      }
    }

    // Bounded output conduit connecting worker channel to agent telemetry dock
    const conduit = conduitPts([-210, exprY + 14], [190, 345]);
    nodes.push(
      glowingTrail(conduit, {
        color: tr > 0.05 ? ROLE.candidate : ROLE.evidence,
        width: tr > 0.05 ? 4.2 : 2.6,
        glow: tr > 0.05 ? 10 : 5,
        opacity: 0.85,
      }),
    );
    if (tr > 0.08 && tr < 0.92) {
      const tIdx = Math.min(conduit.length - 1, Math.floor(((tr - 0.08) / 0.84) * conduit.length));
      const [tx, ty] = conduit[tIdx];
      nodes.push(glowDot(tx, ty, { radius: 10, color: ROLE.candidate, glow: 16 }));
    }

    // Bottom-left: worker boundary permissions strip
    const permY = 278;
    nodes.push(
      txt('BOUNDARY GRANTS', xmlX, permY, 26, hHot > 0.4 ? ROLE.mark : ROLE.host, 'mono', 'left'),
      rule(xmlX, permY + 24, -120, permY + 24, ROLE.host, 2),
      txt(
        'READ: report.xml    CREDS: none    NET: closed',
        xmlX,
        permY + 62,
        26,
        hHot > 0.4 ? ROLE.mark : COSMOS.muted,
        'mono',
        'left',
      ),
    );
    if (clOp > 0.02) {
      nodes.push(
        txt(
          'Verify teardown & reset before reusing slot A',
          xmlX,
          permY + 112,
          28,
          ROLE.mark,
          'sans',
          'left',
        )
          .glow(6, ROLE.mark)
          .opacity(clOp),
      );
    }

    // Right-top and bottom: 3D cage captions + Agent receiver dock
    nodes.push(
      txt('3D ISOLATION BOUNDARY', 470, -420, 26, ROLE.host, 'mono').glow(6, ROLE.host),
      txt('Untrusted worker inside kernel & mount rings', 470, -374, 26, COSMOS.muted, 'sans'),
      txt('AGENT RECEIVER  /  BOUNDED OUTPUT', 470, 272, 26, ROLE.evidence, 'mono'),
      rule(190, 298, 750, 298, ROLE.evidence, 2),
    );

    if (tr < 0.35) {
      const waitOp = Math.max(0, 1 - tr * 3.8);
      nodes.push(
        txt('Waiting for bounded stderr channel', 470, 345, 28, COSMOS.muted, 'sans').opacity(
          waitOp,
        ),
      );
    }
    if (repOp > 0.02) {
      nodes.push(
        txt('Next repair: inspect direct child tags', 470, 412, 30, ROLE.pass, 'sans')
          .glow(8, ROLE.pass)
          .opacity(repOp),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, cage, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, cage, { theta: 0.45, phi: 0.98 });

  tweenCue(s, c, 'intro-report', reportHot, 1, { duration: 0.45 });
  tweenCue(s, c, 'intro-lookup', lookupHot, 1, { duration: 0.45 });
  tweenCue(s, c, 'intro-predict', showAsk, 1, { duration: 0.4 });
  crossSwap(s, c, 'intro-error', showAsk, showError, { duration: 0.45, after: true });
  tweenCue(s, c, 'intro-class', classHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'intro-name', nameHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'intro-output', travel, 1, { duration: 1.0 });
  tweenCue(s, c, 'intro-child', childHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'intro-clue', showRepair, 1, { duration: 0.45 });
  tweenCue(s, c, 'intro-host', hostHot, 1, { duration: 0.45 });
  tweenCue(s, c, 'intro-next', showCleanup, 1, { duration: 0.45 });
}
