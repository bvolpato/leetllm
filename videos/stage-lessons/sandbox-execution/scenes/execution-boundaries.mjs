// Scene 05 (execution-boundaries): "Follow one file read"
// Four parallel luminous isolation tunnels (Container, gVisor, Firecracker, WebAssembly)
// with live capability laser gates testing /work/report.xml (allowed) vs /work/notes.txt (denied).
import {
  COSMOS,
  REPORT_XML,
  ROLE,
  cinemaAtmosphere,
  crossSwap,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  rule,
  runAmbientPhase,
  runtimeAccess,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const ROUTES = [
  {
    runtime: 'container',
    name: 'Container',
    via: 'Syscall filter',
    gate: 'Shared kernel / mount',
    color: ROLE.evidence,
  },
  { runtime: 'gvisor', name: 'gVisor', via: 'Sentry', gate: 'Scoped filesystem', color: ROLE.host },
  {
    runtime: 'microvm',
    name: 'Firecracker',
    via: 'Guest kernel',
    gate: 'Attached volume',
    color: ROLE.pass,
  },
  {
    runtime: 'wasm',
    name: 'WebAssembly',
    via: 'Checked guest',
    gate: 'Linked report reader',
    color: ROLE.wasm,
  },
];

const REPORT_PATH = '/work/report.xml';
const NOTES_PATH = '/work/notes.txt';
const REQUESTED_BYTES = 128;

export default function executionBoundaries(s, c) {
  const reportBytes = Buffer.from(REPORT_XML, 'utf8').subarray(0, REQUESTED_BYTES).length;
  verifyInvariant(reportBytes === REQUESTED_BYTES, 'report fixture supplies 128 bytes');
  for (const r of ROUTES) {
    verifyInvariant(
      runtimeAccess(r.runtime, REPORT_PATH).allowed === true,
      `${r.name} allows report`,
    );
    verifyInvariant(
      runtimeAccess(r.runtime, NOTES_PATH).allowed === false,
      `${r.name} denies notes`,
    );
  }

  const phase = s.value(0);
  const routeVis = ROUTES.map(() => s.value(0));
  const pathMode = s.value(0); // 0 = report.xml, 1 = notes.txt
  const yesTravel = s.value(0);
  const yesResult = s.value(0);
  const noTravel = s.value(0);
  const noResult = s.value(0);

  const footBase = s.value(1);
  const footAsk = s.value(0);
  const footTake = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.host, ROLE.wasm);
  const title = heroTitle(['Follow One', 'File Read'], {
    x: -860,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.host,
    eyebrow: 'FOUR SERVER ISOLATION BOUNDARIES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const isNotes = pathMode.value > 0.5;
    const yt = yesTravel.value;
    const yr = yesResult.value;
    const nt = noTravel.value;
    const nr = noResult.value;
    const nodes = [];

    // Top-right: active path request + locked grant badge
    const reqY = -390;
    nodes.push(
      txt('REQUESTED PATH', -210, reqY - 52, 26, COSMOS.muted, 'mono', 'left'),
      lumBar(20, reqY + 14, 460, 56, {
        color: isNotes ? ROLE.mark : ROLE.evidence,
        fillOpacity: 0.16,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt(
        isNotes ? NOTES_PATH : REPORT_PATH,
        20,
        reqY + 14,
        30,
        isNotes ? ROLE.mark : ROLE.evidence,
        'mono',
      ),
      txt('EXPLICIT READ GRANT', 330, reqY - 52, 26, ROLE.host, 'mono', 'left'),
      lumBar(590, reqY + 14, 520, 56, {
        color: ROLE.host,
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 7,
      }),
      txt('report.xml ONLY  (128 B)', 590, reqY + 14, 28, ROLE.host, 'mono'),
    );

    // Four glowing parallel isolation tunnels
    const railLeft = -460;
    const gateX = 120;
    const railRight = 560;
    const topY = -205;
    const rowPitch = 148;

    ROUTES.forEach((route, i) => {
      const y = topY + i * rowPitch;
      const vis = routeVis[i].value;

      // Left runtime badge
      nodes.push(
        glowDot(-840, y, { radius: 8, color: route.color, glow: 10 }),
        txt(route.name, -812, y, 32, COSMOS.ink, 'sans', 'left'),
        // Luminous tunnel rail
        glowingTrail(
          [
            [railLeft, y],
            [railRight, y],
          ],
          { color: route.color, width: 3.2, glow: 7, opacity: 0.55 + 0.35 * vis, core: false },
        ),
        // Origin port dot
        glowDot(railLeft, y, { radius: 6, color: route.color, glow: 8 }),
      );

      if (vis > 0.02) {
        nodes.push(
          txt(route.via, -445, y - 38, 26, route.color, 'mono', 'left').opacity(vis),
          txt(route.gate, gateX + 18, y - 38, 26, ROLE.host, 'mono', 'left').opacity(vis),
          // Vertical laser capability gate
          line([gateX, y - 28], [gateX, y + 28], {
            stroke: nr > 0.4 ? ROLE.candidate : ROLE.host,
            width: 5,
          })
            .glow(10, nr > 0.4 ? ROLE.candidate : ROLE.host)
            .opacity(vis),
        );
      }

      // Allowed photon traversing full tunnel
      if (!isNotes && yt > 0.01) {
        const px = railLeft + (railRight - railLeft) * yt;
        nodes.push(
          glowingTrail(
            [
              [railLeft, y],
              [px, y],
            ],
            { color: ROLE.pass, width: 5, glow: 11, opacity: 0.9 },
          ),
          glowDot(px, y, { radius: 9, color: ROLE.pass, glow: 14 }),
        );
      }
      if (!isNotes && yr > 0.02) {
        nodes.push(
          txt(`${REQUESTED_BYTES} bytes`, 600, y, 30, ROLE.pass, 'mono', 'left')
            .glow(7, ROLE.pass)
            .opacity(yr),
        );
      }

      // Denied photon slamming into capability gate and halting
      if (isNotes && nt > 0.01) {
        const px = railLeft + (gateX - 10 - railLeft) * nt;
        nodes.push(
          glowingTrail(
            [
              [railLeft, y],
              [px, y],
            ],
            { color: ROLE.candidate, width: 5, glow: 11, opacity: 0.9 },
          ),
          glowDot(px, y, { radius: 9, color: ROLE.candidate, glow: 14 }),
        );
      }
      if (isNotes && nr > 0.02) {
        nodes.push(
          txt('DENIED  /  0 B', 600, y, 30, ROLE.candidate, 'mono', 'left')
            .glow(7, ROLE.candidate)
            .opacity(nr),
        );
      }
    });

    // Bottom non-overlapping footer ribbon
    const fy = 408;
    nodes.push(rule(-860, fy - 42, 855, fy - 42, ROLE.rule, 2));
    if (footBase.value > 0.02) {
      nodes.push(
        txt(
          `Configured examples  /  each worker requests the first ${REQUESTED_BYTES} bytes`,
          -860,
          fy,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(footBase.value),
      );
    }
    if (footAsk.value > 0.02) {
      nodes.push(
        txt(
          'Which of these four workers can read /work/notes.txt?',
          -860,
          fy,
          36,
          ROLE.mark,
          'serif',
          'left',
        )
          .glow(8, ROLE.mark)
          .opacity(footAsk.value),
      );
    }
    if (footTake.value > 0.02) {
      nodes.push(
        txt(
          'Verify actual grants with one allowed file and one ungranted file',
          -860,
          fy,
          30,
          ROLE.host,
          'sans',
          'left',
        )
          .glow(6, ROLE.host)
          .opacity(footTake.value),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  ROUTES.forEach((_, i) => {
    tweenCue(s, c, `eb-route-${i}`, routeVis[i], 1, { duration: 0.45 });
  });
  tweenCue(s, c, 'eb-read', yesTravel, 1, { duration: 0.85 });
  tweenCue(s, c, 'eb-allowed', yesResult, 1, { duration: 0.35, after: true });

  c.on('eb-change', () => {
    s.play(
      yesTravel.to(0, { duration: 0.2 }),
      yesResult.to(0, { duration: 0.2 }),
      pathMode.to(1, { duration: 0.3 }),
    );
  });
  crossSwap(s, c, 'eb-predict', footBase, footAsk, { duration: 0.4 });
  tweenCue(s, c, 'eb-deny', noTravel, 1, { duration: 0.75 });
  tweenCue(s, c, 'eb-deny', noResult, 1, { duration: 0.35, after: true });
  crossSwap(s, c, 'eb-check', footAsk, footTake, { duration: 0.4 });
}
