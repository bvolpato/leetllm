// Scene 8: transfer - What can this grader see?
// Three-layer observability spectrum across full cinema width:
// Left: Browser Page (WebArena) -> Center: Database Row (Tau-Bench) -> Right: Host Permission Trace.
// Strictly withholds the permission trace evidence until `retain-result`.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  autoNode,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  railBar,
  river,
  segmentWithPhoton,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pulse = s.value(0);
  const pageHi = s.value(0);
  const webBench = s.value(0);
  const dbOpen = s.value(0);
  const askPerm = s.value(0);
  const hostOpen = s.value(0);

  const header = cinemaHeader('OBSERVABILITY SCOPE', 'What can this', 'grader see?', {
    accent: ROLE.host,
    size: 50,
  });

  const stageAura = aura(0, 40, 680, '#60a5fa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ph = pageHi.value;
      const wb = webBench.value;
      const db = dbOpen.value;
      const ap = askPerm.value;
      const ho = hostOpen.value;
      const nodes = [];

      // Three evenly distributed optical columns: x = -840..-320, -245..265, 340..860
      // Column 1: Browser Page (WebArena)
      const c1Col = ph > 0.3 ? ROLE.host : COSMOS.muted;
      nodes.push(
        railBar(-840, -175, 255, c1Col, { width: 5, glow: 8 }),
        txt('1. BROWSER PAGE', -810, -155, 26, c1Col, 'mono', 'left'),
        txt(river.title, -810, -90, 38, COSMOS.ink, 'serif', 'left'),
        txt('“Your book is reserved.”', -810, -24, 30, ROLE.host, 'sans', 'left').glow(
          ph * 7,
          ROLE.host,
        ),
        line([-810, 26], [-340, 26], { stroke: '#29385f', width: 2 }),
        txt('Sees: rendered DOM text', -810, 76, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          wb > 0.3 ? 'Example: WebArena page checks' : 'Checks UI display only',
          -810,
          132,
          26,
          wb > 0.3 ? ROLE.host : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          ap > 0.3 ? 'Permission shown? NO' : 'Real reservation? Unproven',
          -810,
          208,
          26,
          ap > 0.3 ? ROLE.fail : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Column 2: Library Database (Tau-Bench)
      const c2Col = db > 0.35 ? ROLE.read : COSMOS.dim;
      nodes.push(
        railBar(-250, -175, 255, c2Col, { width: 5, glow: db > 0.35 ? 10 : 4 }),
        txt('2. LIBRARY DATABASE', -220, -155, 26, c2Col, 'mono', 'left'),
      );
      if (db < 0.35) {
        nodes.push(
          txt('Database unopened', -220, -56, 32, COSMOS.dim, 'serif', 'left'),
          txt('Final state not yet queried', -220, 12, 26, COSMOS.dim, 'mono', 'left'),
        );
      } else {
        const dbA = Math.min(1, (db - 0.35) * 2.2);
        nodes.push(
          txt(
            `${river.reader} · ${river.book}`,
            -220,
            -90,
            38,
            COSMOS.ink,
            'serif',
            'left',
          ).opacity(dbA),
          txt('hold-17  ·  version 3', -220, -24, 30, ROLE.read, 'mono', 'left')
            .glow(8, ROLE.read)
            .opacity(dbA),
          line([-220, 26], [250, 26], { stroke: '#29385f', width: 2 }).opacity(dbA),
          txt('Sees: committed DB row', -220, 76, 26, COSMOS.muted, 'mono', 'left').opacity(dbA),
          txt('Example: Tau-Bench DB diff', -220, 132, 26, ROLE.read, 'mono', 'left').opacity(dbA),
          txt(
            ap > 0.3 ? 'Permission shown? NO' : 'Establishes final outcome',
            -220,
            208,
            26,
            ap > 0.3 ? ROLE.fail : ROLE.pass,
            'mono',
            'left',
          ).opacity(dbA),
        );
      }

      // Column 3: Host Permission Trace (withheld until `retain-result`!)
      const c3Col = ho > 0.35 ? ROLE.pass : ap > 0.3 ? ROLE.focus : COSMOS.dim;
      nodes.push(
        railBar(340, -175, 255, c3Col, { width: 5, glow: ho > 0.35 ? 12 : ap > 0.3 ? 8 : 3 }),
        txt('3. HOST DECISION TRACE', 370, -155, 26, c3Col, 'mono', 'left'),
      );
      if (ho < 0.35) {
        const qNode = autoNode(585, 20, ap > 0.3 ? 'PERMIT?' : 'TRACE', {
          radius: 62,
          color: c3Col,
          glow: ap > 0.3 ? 11 : 4,
          size: 28,
        });
        nodes.push(
          qNode.node,
          txt(
            ap > 0.3 ? 'Who authorized this write?' : 'Separate runtime evidence',
            585,
            154,
            26,
            ap > 0.3 ? ROLE.focus : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      } else {
        const hA = Math.min(1, (ho - 0.35) * 2.2);
        nodes.push(
          txt('op-17 PERMITTED', 370, -90, 36, ROLE.pass, 'mono', 'left')
            .glow(10, ROLE.pass)
            .opacity(hA),
          txt('Lena · B7 · ALLOW', 370, -24, 30, COSMOS.ink, 'mono', 'left').opacity(hA),
          line([370, 26], [850, 26], { stroke: '#214c45', width: 2 }).opacity(hA),
          txt('Checked BEFORE dispatch', 370, 76, 26, ROLE.pass, 'mono', 'left').opacity(hA),
          txt('Pair with repeats + spend', 370, 132, 26, COSMOS.muted, 'mono', 'left').opacity(hA),
          txt('Add unseen permission tests', 370, 208, 26, ROLE.focus, 'mono', 'left').opacity(hA),
        );
      }

      // Connecting optical signal beams across the 3 evidence layers (below the rails)
      const [b1a, b1b] = trimSeg([-560, 315], [20, 315], 12, 12);
      const [b2a, b2b] = trimSeg([20, 315], [600, 315], 12, 12);
      nodes.push(
        segmentWithPhoton(b1a, b1b, db > 0.35 ? ROLE.read : COSMOS.dim, p, {
          width: 3,
          glow: db > 0.35 ? 8 : 3,
          photon: db > 0.35,
        }),
        segmentWithPhoton(b2a, b2b, ho > 0.35 ? ROLE.pass : COSMOS.dim, p + 0.4, {
          width: 3,
          glow: ho > 0.35 ? 9 : 3,
          photon: ho > 0.35,
        }),
      );

      // Dynamic footer
      const footer =
        ho > 0.35
          ? 'COMPLETE EVIDENCE: PAGE + FINAL DB + HOST PERMISSION TRACE + UNSEEN SUITE'
          : ap > 0.3
            ? 'Does the web page or database row prove the write was permitted?'
            : db > 0.35
              ? 'Final database row confirms Lena’s hold on B7 at v3'
              : 'Match your verifier’s sightlines to what the product actually promises';
      nodes.push(
        txt(
          footer,
          0,
          395,
          28,
          ho > 0.35 ? ROLE.pass : ap > 0.3 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('episode-evidence', () => {
    s.play(pageHi.to(1, { duration: clampDur(c, c.cue('episode-evidence').start, 0.35) }));
  });
  c.on('representative-tasks', () => {
    s.play(webBench.to(1, { duration: clampDur(c, c.cue('representative-tasks').start, 0.35) }));
  });
  c.on('db-diff', () => {
    s.play(dbOpen.to(1, { duration: clampDur(c, c.cue('db-diff').start, 0.45) }));
  });
  c.on('scope-question', () => {
    s.play(askPerm.to(1, { duration: clampDur(c, c.cue('scope-question').start, 0.35) }));
  });
  c.on('retain-result', () => {
    s.play(hostOpen.to(1, { duration: clampDur(c, c.cue('retain-result').start, 0.45) }));
  });
}
