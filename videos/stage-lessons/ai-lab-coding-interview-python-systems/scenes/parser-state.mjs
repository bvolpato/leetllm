// Scene 19: parser-state - "Does retry belong to this error?"
// Stage 0: Multiline log parser stepping through header (3rd pipe kept in message) -> continuation
//          -> broken header (clears current record) -> strict prediction hold on " retry" -> Skip retry!
// Stage 1: Streaming chunked parser splitting header across two chunks, buffering partial line,
//          rejoining on newline, and testing every split against whole-line output!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  PARSER_LINES,
  ROLE,
  cinemaAtmosphere,
  codeSpotlight,
  glowArrow,
  glowCross,
  glowPill,
  guardedDynamic,
  lowerFooter,
  parserTrace,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function parserState(s, c) {
  const title = sceneHeading(['Does retry belong', 'to this error?'], { accent: ROLE.workerB });

  const stage = s.value(0); // 0=multiline ownership, 1=streaming chunks
  // Stage 0 step: 0=focus line 0, 1=save header, 2=focus line 1, 3=append timeout,
  // 4=focus line 2 (broken), 5=clear current=None, 6=focus line 3 (PREDICTION HOLD!), 7=skip retry!
  const pStep = s.value(0);
  // Stage 1 step: 0=init, 1=chunk 1 arrives, 2=buffered partial, 3=chunk 2 arrives, 4=parsed complete, 5=test all splits
  const cStep = s.value(0);

  const trace = parserTrace(PARSER_LINES);
  const header = PARSER_LINES[0];
  const splitIdx = header.indexOf('|', header.indexOf('|') + 1) + 1;
  const chunk1 = header.slice(0, splitIdx);
  const chunk2 = header.slice(splitIdx);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const ps = Math.round(pStep.value);
        const activeLine = ps <= 1 ? 0 : ps <= 3 ? 1 : ps <= 5 ? 2 : 3;
        const activeCol = ps === 4 || ps === 5 ? ROLE.fail : ps >= 6 ? ROLE.focus : ROLE.workerB;

        const curRec = ps === 0 ? 'None' : ps <= 4 ? 'record 1 (active)' : 'None (cleared)';
        const curCol = ps >= 5 ? ROLE.fail : ps >= 1 ? ROLE.ok : COSMOS.dim;

        const savedMsg =
          ps === 0
            ? '(none yet)'
            : ps <= 2
              ? trace[0].records[0].message
              : trace[1].records[0].message;

        nodes.push(
          txt('INPUT LOG LINES', -530, -260, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          codeSpotlight(PARSER_LINES, -810, -165, {
            lineH: 76,
            size: 32,
            activeLines: [activeLine],
            activeColor: activeCol,
            beamW: 690,
            alpha,
          }),

          line([-45, -245], [-45, 225], { stroke: '#29375a', width: 2 }).opacity(alpha),

          txt('PARSER STATE', 405, -260, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          txt('current record', 55, -150, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          glowPill(curRec, 565, -150, curCol, {
            size: 27,
            fixedW: 510,
            alpha,
            glow: ps === 5 || ps === 1 ? 12 : 6,
          }),

          txt('saved message', 55, -15, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          glowPill(savedMsg, 565, -15, ps >= 1 ? ROLE.ok : COSMOS.dim, {
            size: 27,
            fixedW: 510,
            alpha: ps >= 1 ? alpha : 0.55 * alpha,
            glow: ps === 3 || ps === 7 ? 12 : 6,
          }),

          txt('action', 55, 120, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          glowPill(
            ps === 7
              ? 'SKIP ORPHAN "retry"'
              : ps === 6
                ? 'append to error?  ( ? )'
                : ps === 5
                  ? 'clear current'
                  : ps === 3 || ps === 4
                    ? 'append timeout'
                    : ps === 1 || ps === 2
                      ? 'keep 3rd pipe'
                      : 'reading header...',
            565,
            120,
            ps === 7 ? ROLE.fail : ps === 6 ? ROLE.focus : ps === 5 ? ROLE.fail : ROLE.workerB,
            { size: 26, fixedW: 560, alpha, glow: ps >= 6 ? 12 : 6 },
          ),
        );

        if (ps === 7) {
          nodes.push(glowCross(250, 120, 26, ROLE.fail, alpha));
        }

        const capY = 330;
        if (ps === 6) {
          nodes.push(
            txt(
              'Current record was cleared. Does indented "retry" get added to that error?',
              0,
              capY,
              30,
              ROLE.focus,
              'serif',
              'center',
            )
              .glow(7, ROLE.focus)
              .opacity(alpha),
          );
        } else if (ps >= 7) {
          nodes.push(
            txt(
              'Skip retry: no active owner exists, so the saved error still ends in "timeout".',
              0,
              capY,
              28,
              ROLE.ok,
              'sans',
              'center',
            ).opacity(alpha),
          );
        } else {
          nodes.push(
            txt(
              'Split on the first two pipes only so any extra pipe stays inside the message.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else {
        // Stage 1: Streaming chunked parser
        const cs = Math.round(cStep.value);
        const bufStr =
          cs <= 1
            ? 'empty'
            : cs === 2
              ? JSON.stringify(chunk1)
              : cs === 3
                ? JSON.stringify(chunk1 + chunk2)
                : 'empty (flushed)';
        const msgStr = cs >= 4 ? trace[0].records[0].message : 'waiting for \\n...';

        nodes.push(
          txt(
            'STREAMING CHUNKED PARSER (SPLIT ACROSS TWO CHUNKS)',
            0,
            -278,
            26,
            ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),

          // Left: Incoming chunks
          txt('INCOMING CHUNKS', -465, -180, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            `chunk 1:   ${JSON.stringify(chunk1)}`,
            -465,
            -85,
            cs >= 1 ? ROLE.workerA : COSMOS.dim,
            {
              size: 28,
              fixedW: 660,
              alpha: cs >= 1 ? alpha : 0.45 * alpha,
              glow: cs === 1 ? 12 : 6,
            },
          ),
          glowPill(
            `chunk 2:   ${JSON.stringify(chunk2 + '\n')}`,
            -465,
            35,
            cs >= 3 ? ROLE.workerB : COSMOS.dim,
            {
              size: 28,
              fixedW: 660,
              alpha: cs >= 3 ? alpha : 0.45 * alpha,
              glow: cs === 3 ? 12 : 6,
            },
          ),

          glowArrow(-120, -25, 35, -25, ROLE.focus, { width: 3.5, alpha }),

          // Right: Streaming line buffer & parsed record
          txt('STREAMING STATE', 465, -180, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          txt('line buffer', 70, -85, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          glowPill(bufStr, 610, -85, cs === 2 || cs === 3 ? ROLE.focus : COSMOS.dim, {
            size: 26,
            fixedW: 480,
            alpha,
            glow: cs === 2 || cs === 3 ? 11 : 4,
          }),

          txt('saved message', 70, 35, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          glowPill(msgStr, 610, 35, cs >= 4 ? ROLE.ok : COSMOS.dim, {
            size: 27,
            fixedW: 480,
            alpha: cs >= 4 ? alpha : 0.55 * alpha,
            glow: cs >= 4 ? 12 : 0,
          }),

          glowPill(
            cs >= 5
              ? `Every split index matches whole-line parse: "${trace[0].records[0].message}"`
              : 'Collect fragments in a list -> join once  ·  Bound max record size',
            0,
            195,
            cs >= 5 ? ROLE.ok : ROLE.record,
            { size: 26, fixedW: 1180, alpha, glow: cs >= 5 ? 11 : 5 },
          ),

          txt(
            'Buffer incomplete lines until newline, flush any final line once at EOF, and test all splits.',
            0,
            330,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'MULTILINE OWNERSHIP + CHUNK-SAFE STREAMING',
          st === 1
            ? 'LIST APPEND + JOIN ONCE  ·  BOUND RECORD SIZE'
            : pStep.value >= 6.5
              ? 'BROKEN HEADER CLEARS OWNER -> SKIP ORPHAN'
              : 'KEEP THIRD PIPE IN MESSAGE',
          { accent: st === 1 ? ROLE.ok : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.focus), title, layer);

  // Beat 0
  playCue(s, c, 'ci-parser-state-0-build', () => s.play(pStep.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'parser-header', () => s.play(pStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'parser-line', () => s.play(pStep.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'parser-tail', () => s.play(pStep.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Beat 1 (strict prediction hold on 'parser-orphan'!)
  playCue(s, c, 'ci-parser-state-1-build', () => s.play(pStep.to(4, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ci-parser-state-clear', () => s.play(pStep.to(5, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'parser-orphan', () => s.play(pStep.to(6, { duration: 0.05 })), { dur: 0.1 });

  // Beat 2: strict reveal AFTER 'parser-skip'!
  playCue(s, c, 'parser-skip', () => s.play(pStep.to(7, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 3: streaming chunked parser
  playCue(
    s,
    c,
    'ci-parser-state-2-build',
    () => s.play(stage.to(1, { duration: 0.05 }), cStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'parser-first-chunk', () => s.play(cStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'parser-stream', () => s.play(cStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'parser-more', () => s.play(cStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'parser-join', () => s.play(cStep.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'parser-splits', () => s.play(cStep.to(5, { duration: 0.05 })), { dur: 0.1 });
}
