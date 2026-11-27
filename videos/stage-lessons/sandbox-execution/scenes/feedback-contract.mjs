// Scene 03 (feedback-contract): "What goes back to the agent?"
// Worker-to-supervisor laser channel + byte-capped head/tail shear + untrusted log boundary + XML limits.
import {
  COSMOS,
  ROLE,
  WORKER_ID,
  cinemaAtmosphere,
  commas,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  renderGauge,
  repairTrace,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

const LONG_BYTES = 256;
const RETAINED_BYTES = 64;
const USUAL_FRAC = 24 / LONG_BYTES;
const LIMIT_FRAC = RETAINED_BYTES / LONG_BYTES;
const KEEP_FRAC = LIMIT_FRAC / 2;

export default function feedbackContract(s, c) {
  const errText = repairTrace().first.error;

  const mode0 = s.value(1); // Byte-capped evidence packet
  const mode1 = s.value(0); // Untrusted traceback + env + cwd
  const mode2 = s.value(0); // XML parser limits + scope

  // Top channel states
  const fixedHot = s.value(0);
  const retriesLit = s.value(0);
  const sameDiag = s.value(0);
  const policyHot = s.value(0);
  const forgedTravel = s.value(0);
  const showLogData = s.value(0);

  // Beat 0 states
  const pktField = s.value(0);
  const streamGrow = s.value(USUAL_FRAC);
  const streamCut = s.value(0);
  const streamJoin = s.value(0);
  const showRoot = s.value(0);

  // Beat 1 states
  const untrustHot = s.value(0);
  const forgedHot = s.value(0);
  const escHot = s.value(0);
  const secretHot = s.value(0);
  const escFixed = s.value(0);
  const envHot = s.value(0);
  const envCleared = s.value(0);
  const cwdHot = s.value(0);
  const relShown = s.value(0);
  const absShown = s.value(0);
  const osDecides = s.value(0);

  // Beat 2 states
  const gInput = s.value(0);
  const gDecomp = s.value(0);
  const gTime = s.value(0);
  const gMem = s.value(0);
  const showExpat = s.value(0);
  const showBug = s.value(0);
  const scopeStep = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.evidence, ROLE.host);
  const title = heroTitle(['What Goes Back', 'to the Agent?'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.evidence,
    eyebrow: 'BOUNDED FEEDBACK CONTRACT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = mode0.value;
    const m1 = mode1.value;
    const m2 = mode2.value;
    const nodes = [];

    // Persistent top channel: Worker -> Evidence Conduit -> Supervisor
    const topY = -360;
    nodes.push(
      lumBar(-55, topY, 450, 96, {
        color: fixedHot.value > 0.4 ? ROLE.mark : ROLE.candidate,
        fillOpacity: 0.14,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt(WORKER_ID, -260, topY - 22, 26, ROLE.candidate, 'mono', 'left'),
      txt('parse.py  +  report.xml', -260, topY + 20, 26, COSMOS.ink, 'mono', 'left'),
      glowArrow([182, topY], [358, topY], ROLE.evidence, { width: 4, tip: 14 }),
      txt('bounded evidence', 270, topY - 72, 26, ROLE.evidence, 'mono'),
      lumBar(615, topY, 490, 96, {
        color: policyHot.value > 0.4 ? ROLE.mark : ROLE.host,
        fillOpacity: 0.14,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt('SUPERVISOR  /  POLICY', 392, topY - 22, 26, ROLE.host, 'mono', 'left'),
      txt('retries:', 392, topY + 20, 26, COSMOS.muted, 'mono', 'left'),
    );

    for (let i = 0; i < 3; i++) {
      const lit = retriesLit.value > i + 0.35;
      nodes.push(
        glowDot(548 + i * 38, topY + 20, {
          radius: 9,
          color: lit ? ROLE.candidate : COSMOS.dim,
          glow: lit ? 11 : 3,
        }),
      );
    }
    if (sameDiag.value > 0.02) {
      nodes.push(
        txt('3x same -> diagnose', 615, topY + 76, 26, ROLE.mark, 'mono').opacity(sameDiag.value),
      );
    }
    if (forgedTravel.value > 0.02 && m1 > 0.02) {
      const fx = 186 + (346 - 186) * forgedTravel.value;
      nodes.push(glowDot(fx, topY, { radius: 10, color: ROLE.candidate, glow: 14, opacity: m1 }));
    }
    if (showLogData.value > 0.02 && m1 > 0.02) {
      nodes.push(
        txt('data only', 270, topY + 32, 26, ROLE.evidence, 'mono').opacity(showLogData.value * m1),
      );
    }

    // === BEAT 0: Bounded byte stream & head/tail shear ===
    if (m0 > 0.02) {
      const px = -860;
      const py = -200;
      const byteCount = Math.round(streamGrow.value * LONG_BYTES);
      const isOver = streamGrow.value > LIMIT_FRAC;
      nodes.push(
        txt('EVIDENCE PACKET FIELDS', px, py, 26, ROLE.host, 'mono', 'left').opacity(m0),
        rule(px, py + 24, 850, py + 24, ROLE.rule, 2).opacity(m0),
      );
      const rows = [
        ['command', 'python parse.py report.xml', ROLE.evidence, 1],
        ['exit status', '1', ROLE.evidence, 2],
        ['exception', errText, ROLE.candidate, 3],
        [
          'stderr stream',
          `1 line  /  ${commas(byteCount)} bytes`,
          isOver ? ROLE.candidate : ROLE.evidence,
          4,
        ],
      ];
      rows.forEach(([k, v, col, req], i) => {
        const y = py + 66 + i * 56;
        nodes.push(txt(k, px, y, 28, COSMOS.muted, 'mono', 'left').opacity(m0));
        if (pktField.value >= req - 0.1) {
          nodes.push(txt(v, px + 290, y, 30, col, 'mono', 'left').opacity(m0));
        }
      });

      // Live byte strip across full width
      const sLeft = -860;
      const sW = 1710;
      const sY = 210;
      const sH = 66;
      const xOf = (f) => sLeft + f * sW;
      nodes.push(
        lumBar(sLeft + sW * 0.5, sY, sW, sH, {
          color: COSMOS.rule,
          fillOpacity: 0.2,
          strokeWidth: 2,
          glow: 0,
          opacity: m0,
        }),
      );
      const endX = xOf(streamGrow.value);
      const limX = xOf(LIMIT_FRAC);
      const cutV = streamCut.value;
      const joinV = streamJoin.value;
      if (cutV < 0.02) {
        const safeW = Math.min(endX, limX) - sLeft;
        if (safeW > 4) {
          nodes.push(
            lumBar(sLeft + safeW * 0.5, sY, safeW, sH - 10, {
              color: ROLE.evidence,
              fillOpacity: 0.72,
              strokeWidth: 2,
              glow: 9,
              opacity: m0,
            }),
          );
        }
        if (endX > limX + 6) {
          const overW = endX - limX;
          nodes.push(
            lumBar(limX + overW * 0.5, sY, overW, sH - 10, {
              color: ROLE.candidate,
              fillOpacity: 0.76,
              strokeWidth: 2,
              glow: 11,
              opacity: m0,
            }),
          );
        }
      } else {
        const headW = xOf(KEEP_FRAC) - sLeft;
        const tailW = headW;
        const tailStart = (endX - tailW) * (1 - joinV) + (limX - tailW) * joinV;
        nodes.push(
          lumBar(sLeft + headW * 0.5, sY, headW - 4, sH - 10, {
            color: ROLE.evidence,
            fillOpacity: 0.78,
            strokeWidth: 2,
            glow: 9,
            opacity: m0,
          }),
          lumBar(tailStart + tailW * 0.5, sY, tailW - 4, sH - 10, {
            color: ROLE.evidence,
            fillOpacity: 0.78,
            strokeWidth: 2,
            glow: 9,
            opacity: m0,
          }),
        );
        const midGap = tailStart - (sLeft + headW);
        if (midGap > 24) {
          nodes.push(
            lumBar(sLeft + headW + midGap * 0.5, sY, midGap - 10, sH - 12, {
              color: ROLE.candidate,
              fillOpacity: 0.16,
              strokeWidth: 1.5,
              glow: 0,
              dash: [8, 6],
              opacity: m0 * Math.max(0.15, 1 - cutV * 0.75),
            }),
          );
        }
      }

      // Cap marker
      nodes.push(
        rule(limX, sY - 48, limX, sY + 48, COSMOS.ink, 3.5).opacity(m0),
        txt(`${RETAINED_BYTES} B cap`, limX, sY - 72, 26, COSMOS.ink, 'mono').opacity(m0),
      );

      if (showRoot.value > 0.02) {
        nodes.push(
          rule(sLeft + 26, sY - 36, sLeft + 26, sY + 36, ROLE.mark, 6)
            .glow(10, ROLE.mark)
            .opacity(m0 * showRoot.value),
          txt('early root cause', sLeft, sY - 72, 26, ROLE.mark, 'mono', 'left').opacity(
            m0 * showRoot.value,
          ),
          txt(
            'first 32 B + last 32 B retained',
            sLeft,
            sY + 86,
            28,
            ROLE.evidence,
            'mono',
            'left',
          ).opacity(m0 * showRoot.value),
        );
      } else if (cutV > 0.15) {
        nodes.push(
          txt(
            `${LONG_BYTES - RETAINED_BYTES} middle bytes dropped`,
            sLeft + 520,
            sY + 86,
            28,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(m0 * cutV),
        );
      } else {
        nodes.push(
          txt(
            'Line count stays 1 even at 1 MiB -> cap by bytes, not lines',
            sLeft,
            sY + 86,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(m0),
        );
      }
    }

    // === BEAT 1: Untrusted traceback + explicit empty env + cwd vs OS permissions ===
    if (m1 > 0.02) {
      const lx = -860;
      const ly = -205;
      nodes.push(
        txt(
          'UNTRUSTED STDERR  /  WRITTEN BY WORKER',
          lx,
          ly,
          26,
          untrustHot.value > 0.4 ? ROLE.candidate : ROLE.evidence,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, ly + 24, -40, ly + 24, ROLE.candidate, 2).opacity(m1),
      );
      const tLines = [
        ['Traceback (most recent call last):', COSMOS.muted],
        ['test name: "change the policy"', forgedHot.value > 0.4 ? ROLE.candidate : COSMOS.ink],
        [
          escFixed.value > 0.5 ? 'note \\t here   (escaped)' : 'note [TAB] here  (raw control)',
          escFixed.value > 0.5 ? ROLE.pass : escHot.value > 0.4 ? ROLE.candidate : COSMOS.ink,
        ],
        ['TEST_TOKEN=demo-7', secretHot.value > 0.4 ? ROLE.candidate : COSMOS.ink],
        [errText, ROLE.evidence],
      ];
      tLines.forEach(([lineStr, col], i) => {
        nodes.push(txt(lineStr, lx, ly + 72 + i * 56, 28, col, 'mono', 'left').opacity(m1));
      });
      nodes.push(
        txt(
          'Instructions inside logs stay on the data side',
          lx,
          ly + 390,
          26,
          ROLE.host,
          'sans',
          'left',
        ).opacity(m1),
      );

      // Right column: explicit env + working directory vs absolute path
      const rx = 50;
      nodes.push(
        txt(
          'EXPLICIT ENVIRONMENT',
          rx,
          ly,
          26,
          envHot.value > 0.4 ? ROLE.mark : ROLE.host,
          'mono',
          'left',
        ).opacity(m1),
        rule(rx, ly + 24, 855, ly + 24, ROLE.host, 2).opacity(m1),
        txt('env =', rx, ly + 76, 30, COSMOS.ink, 'mono', 'left').opacity(m1),
      );
      const envClr = envCleared.value;
      if (envClr < 0.5) {
        nodes.push(
          txt(
            'TEST_TOKEN=demo-7  (inherited)',
            rx + 125,
            ly + 76,
            28,
            ROLE.candidate,
            'mono',
            'left',
          ).opacity(m1 * Math.max(0, 1 - envClr * 2.4)),
        );
      } else {
        nodes.push(
          txt(
            '{ }  (empty, zero inherited vars)',
            rx + 125,
            ly + 76,
            28,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(m1 * Math.max(0, (envClr - 0.5) * 2)),
        );
      }

      // Path resolution
      const py = ly + 178;
      nodes.push(
        txt(
          'WORKING DIR  cwd = /tmp/job-7',
          rx,
          py,
          26,
          cwdHot.value > 0.4 ? ROLE.mark : ROLE.host,
          'mono',
          'left',
        ).opacity(m1),
        rule(rx, py + 24, 855, py + 24, ROLE.rule, 2).opacity(m1),
      );
      if (relShown.value > 0.02) {
        const op = m1 * relShown.value;
        nodes.push(
          txt('report.xml', rx, py + 76, 28, ROLE.candidate, 'mono', 'left').opacity(op),
          glowArrow([rx + 215, py + 76], [rx + 360, py + 76], ROLE.pass, { opacity: op }),
          txt('/tmp/job-7/report.xml', rx + 382, py + 76, 28, ROLE.pass, 'mono', 'left').opacity(
            op,
          ),
        );
      }
      if (absShown.value > 0.02) {
        const op = m1 * absShown.value;
        nodes.push(
          txt('/demo/note.txt', rx, py + 152, 28, ROLE.candidate, 'mono', 'left').opacity(op),
          glowArrow([rx + 265, py + 152], [rx + 360, py + 152], ROLE.candidate, { opacity: op }),
          txt('escapes cwd!', rx + 382, py + 152, 28, ROLE.candidate, 'mono', 'left').opacity(op),
        );
      }
      if (osDecides.value > 0.02) {
        nodes.push(
          txt(
            'Absolute paths still follow OS filesystem permissions',
            rx,
            py + 224,
            26,
            ROLE.host,
            'sans',
            'left',
          ).opacity(m1 * osDecides.value),
        );
      }
    }

    // === BEAT 2: XML input/decomp/time/mem limits + Expat + verification scope ===
    if (m2 > 0.02) {
      const lx = -860;
      const ly = -210;
      nodes.push(
        txt('XML PARSER RESOURCE BOUNDS', lx, ly, 26, ROLE.host, 'mono', 'left').opacity(m2),
        rule(lx, ly + 24, 80, ly + 24, ROLE.host, 2).opacity(m2),
      );
      const gSpecs = [
        ['Input size', gInput.value, ROLE.evidence],
        ['Decompressed', gDecomp.value, ROLE.host],
        ['Parse time', gTime.value, ROLE.mark],
        ['Memory', gMem.value, ROLE.candidate],
      ];
      gSpecs.forEach(([label, val, col], i) => {
        const y = ly + 78 + i * 74;
        nodes.push(txt(label, lx, y, 28, COSMOS.ink, 'sans', 'left').opacity(m2));
        const g = renderGauge(lx + 245, y, 640, 34, val, {
          cap: 0.8,
          color: col,
          opacity: m2,
        });
        nodes.push(...g.nodes);
      });
      if (showExpat.value > 0.02) {
        nodes.push(
          txt('Expat version:', lx, ly + 378, 28, COSMOS.ink, 'sans', 'left').opacity(
            m2 * showExpat.value,
          ),
          txt(
            'verified against CVE baseline',
            lx + 245,
            ly + 378,
            28,
            ROLE.pass,
            'mono',
            'left',
          ).opacity(m2 * showExpat.value),
        );
      }
      if (showBug.value > 0.02) {
        nodes.push(
          txt(
            'Small inputs can still exercise parser bugs',
            lx,
            ly + 440,
            26,
            ROLE.mark,
            'sans',
            'left',
          ).opacity(m2 * showBug.value),
        );
      }

      // Right column: Tested regressions vs config templates
      const rx = 180;
      const st = scopeStep.value;
      nodes.push(
        txt('VERIFICATION SCOPE', rx, ly, 26, ROLE.pass, 'mono', 'left').opacity(m2),
        rule(rx, ly + 24, 855, ly + 24, ROLE.pass, 2).opacity(m2),
      );
      if (st >= 0.5) {
        nodes.push(
          txt('Executed in article tests:', rx, ly + 78, 26, COSMOS.muted, 'sans', 'left').opacity(
            m2,
          ),
          glowDot(rx + 14, ly + 132, { radius: 7, color: ROLE.pass, opacity: m2 }),
          txt('Hand-written XML parsers', rx + 38, ly + 132, 28, ROLE.pass, 'sans', 'left').opacity(
            m2,
          ),
        );
      }
      if (st >= 1.5) {
        nodes.push(
          glowDot(rx + 14, ly + 186, { radius: 7, color: ROLE.pass, opacity: m2 }),
          txt(
            'Bounded WebAssembly guests',
            rx + 38,
            ly + 186,
            28,
            ROLE.pass,
            'sans',
            'left',
          ).opacity(m2),
        );
      }
      if (st >= 2.5) {
        nodes.push(
          txt(
            'Configs to verify in staging:',
            rx,
            ly + 266,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(m2),
          glowRing(rx + 14, ly + 320, 7, ROLE.host, { opacity: m2 }),
          txt(
            'Docker  /  gVisor  /  Firecracker',
            rx + 38,
            ly + 320,
            28,
            ROLE.host,
            'mono',
            'left',
          ).opacity(m2),
        );
      }
      if (st >= 3.5) {
        nodes.push(
          glowRing(rx + 14, ly + 374, 7, ROLE.mark, { opacity: m2 }),
          txt(
            'Disposable worker + harmless fixtures',
            rx + 38,
            ly + 374,
            28,
            ROLE.mark,
            'sans',
            'left',
          ).opacity(m2),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  // Beat 0 cues
  tweenCue(s, c, 'fb-fixed', fixedHot, 1, { duration: 0.45 });
  tweenCue(s, c, 'fb-command', pktField, 1, { duration: 0.25 });
  tweenCue(s, c, 'fb-exit', pktField, 2, { duration: 0.25 });
  tweenCue(s, c, 'fb-exception', pktField, 3, { duration: 0.25 });
  tweenCue(s, c, 'fb-streams', pktField, 4, { duration: 0.25 });
  tweenCue(s, c, 'fb-megabyte', streamGrow, 1, { duration: 2.2 });
  c.on('fb-excerpts', () => {
    s.play(streamCut.to(1, { duration: 0.45 }));
    c.after('fb-excerpts', () => s.play(streamJoin.to(1, { duration: 0.75 })));
  });
  tweenCue(s, c, 'fb-root', showRoot, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-retries', retriesLit, 3, { duration: 0.9 });
  tweenCue(s, c, 'fb-identical', sameDiag, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-privilege', policyHot, 1, { duration: 0.4 });

  // Beat 1 cues
  crossSwap(s, c, 'fb-untrusted', mode0, mode1, { duration: 0.42 });
  tweenCue(s, c, 'fb-untrusted', untrustHot, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'fb-forged', forgedHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'fb-escapes', escHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'fb-secret', secretHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'fb-escape', escFixed, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-promote', forgedTravel, 1, { duration: 0.95 });
  tweenCue(s, c, 'fb-promote', showLogData, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'fb-env', envHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'fb-empty', envCleared, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'fb-cwd', cwdHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'fb-relative', relShown, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-absolute', absShown, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-os', osDecides, 1, { duration: 0.4 });

  // Beat 2 cues
  crossSwap(s, c, 'fb-input', mode1, mode2, { duration: 0.42 });
  c.on('fb-input', () => {
    s.play(gInput.to(0.32, { duration: 0.75 }), gDecomp.to(0.8, { duration: 0.9 }));
  });
  tweenCue(s, c, 'fb-time', gTime, 0.8, { duration: 0.7 });
  tweenCue(s, c, 'fb-memory', gMem, 0.8, { duration: 0.7 });
  tweenCue(s, c, 'fb-expat', showExpat, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-bytecap', showBug, 1, { duration: 0.4 });
  tweenCue(s, c, 'fb-authored', scopeStep, 1, { duration: 0.3 });
  tweenCue(s, c, 'fb-guests', scopeStep, 2, { duration: 0.3 });
  tweenCue(s, c, 'fb-notrun', scopeStep, 3, { duration: 0.3 });
  tweenCue(s, c, 'fb-attack', scopeStep, 4, { duration: 0.3 });
}
