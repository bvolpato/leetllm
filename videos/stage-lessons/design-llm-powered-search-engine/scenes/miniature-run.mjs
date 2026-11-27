// Scene 10: miniature-run - Execute the actual four-document path
// Traces all 4 corpus docs -> eligibility filter -> exception@1 (15w) + policy@2 (12w) = 27/40 budget
// -> 5-point publisher predicate -> publishes both complete quotations in identity order.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PACK_EXCEPTION_WORDS,
  PACK_POLICY_WORDS,
  PACK_TOTAL_WORDS,
  ROLE,
  SEARCH_TEXT,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  guardedDynamic,
  sourceDigest,
  txt,
} from '../parts.mjs';

export default function miniatureRun(s, c) {
  const corpusOn = s.value(0);
  const eligibleOn = s.value(0);
  const rankOn = s.value(0);
  const wordProg = s.value(0);
  const quoteOn = s.value(0);
  const pubStage = s.value(0);
  const checksProg = s.value(0);
  const publishDone = s.value(0);

  const excDigest = sourceDigest(SEARCH_TEXT.exception).slice(0, 10);
  const polDigest = sourceDigest(SEARCH_TEXT.policy).slice(0, 10);

  const header = cinemaHeader('END-TO-END TRACE', 'Execute the actual', 'four-document path', {
    accent: ROLE.exception,
    size: 46,
  });

  const stageAura = aura(100, 40, 700, '#6ee7b71a', '#60a5fa1a');

  const corpus = [
    { id: 'policy@1', note: 'superseded rev', ok: false, col: ROLE.deny },
    { id: 'policy@2', note: 'current + allowed', ok: true, col: ROLE.policy },
    { id: 'exception@1', note: 'current + allowed', ok: true, col: ROLE.exception },
    { id: 'roadmap@1', note: 'workspace-b', ok: false, col: ROLE.deny },
  ];

  const view = guardedDynamic(
    () => 1,
    () => {
      const el = eligibleOn.value > 0.5;
      const rk = rankOn.value > 0.5;
      const wp = wordProg.value;
      const qo = quoteOn.value > 0.5;
      const pb = pubStage.value > 0.5;
      const cp = checksProg.value;
      const pd = publishDone.value > 0.5;
      const nodes = [];

      // Left column: 4-doc corpus filter
      nodes.push(txt('FOUR-DOCUMENT CORPUS', -855, -238, 26, ROLE.query, 'mono', 'left'));
      corpus.forEach((doc, i) => {
        const y = -165 + i * 102;
        const dim = el && !doc.ok;
        const col = dim ? COSMOS.dim : doc.col;
        nodes.push(
          rect(760, 80, { fill: '#0d1426', stroke: col, width: dim ? 1.6 : 2.6, radius: 12 })
            .at(-475, y)
            .opacity(dim ? 0.45 : 0.96),
          txt(doc.id, -825, y, 29, col, 'mono', 'left'),
          txt(doc.note, -125, y, 26, dim ? COSMOS.dim : COSMOS.muted, 'sans', 'right'),
        );
      });

      // Right column: Ranking, 40-word pack meter, and Quote metadata
      nodes.push(txt('ELIGIBLE RANKING & PACK', 40, -238, 26, ROLE.focus, 'mono', 'left'));

      if (el || rk) {
        nodes.push(
          rect(810, 84, { fill: '#0d1924', stroke: ROLE.exception, width: 2.6, radius: 12 }).at(
            445,
            -160,
          ),
          txt('1. exception@1   ->   2. policy@2', 75, -160, 30, ROLE.exception, 'mono', 'left'),
        );
      } else {
        nodes.push(
          txt(
            'Checking access, tenant, current rev, groups...',
            40,
            -160,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(0.6 + 0.4 * corpusOn.value),
        );
      }

      if (rk || wp > 0.05) {
        const curExc = Math.round(PACK_EXCEPTION_WORDS * Math.max(0.1, wp));
        const curPol = Math.round(PACK_POLICY_WORDS * Math.max(0.1, wp));
        nodes.push(
          txt(`exception@1: ${curExc} regex words`, 40, -56, 26, ROLE.exception, 'mono', 'left'),
          glowMeter(40, -14, 780, 34, curExc / 40, { fill: ROLE.exception }),

          txt(`policy@2: ${curPol} regex words`, 40, 56, 26, ROLE.policy, 'mono', 'left'),
          glowMeter(40, 98, 780, 34, curPol / 40, { fill: ROLE.policy }),

          txt(
            wp > 0.7
              ? `PACKED: ${PACK_TOTAL_WORDS} / 40 WORDS (BOTH FIT)`
              : 'Packing within 40-word budget...',
            40,
            168,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
        );
      }

      if (qo && !pb) {
        nodes.push(
          txt(
            `Quotes retain: key · [0, len) · exact text · sha256 (${excDigest} / ${polDigest})`,
            -855,
            285,
            26,
            ROLE.query,
            'mono',
            'left',
          ),
        );
      }

      // Beat 2: 5-gate publisher predicate across bottom
      if (pb) {
        const gates = ['current access', 'full digest', 'start = 0', 'full end', 'exact text'];
        const nPass = Math.ceil(cp * gates.length);
        gates.forEach((g, i) => {
          const x = -690 + i * 345;
          const ok = i < nPass;
          const col = ok ? ROLE.ok : COSMOS.dim;
          nodes.push(
            rect(310, 74, { fill: '#0c1625', stroke: col, width: ok ? 2.8 : 1.8, radius: 10 })
              .at(x, 290)
              .glow(ok ? 7 : 0, col),
            txt(`${ok ? 'OK' : '..'}  ${g}`, x, 290, 26, col, 'mono', 'center'),
          );
        });

        if (pd) {
          nodes.push(
            txt(
              'PUBLISHED IN IDENTITY ORDER: exception@1 + policy@2 (ORIGINAL WORDING)',
              0,
              395,
              30,
              ROLE.ok,
              'mono',
              'center',
            ).glow(8, ROLE.ok),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-miniature-run-0', () => {
    s.play(corpusOn.to(1, { duration: clampDur(c, c.cue('se-miniature-run-0').start, 0.35) }));
  });
  c.on('se-miniature-run-eligible', () => {
    s.play(
      eligibleOn.to(1, { duration: clampDur(c, c.cue('se-miniature-run-eligible').start, 0.35) }),
    );
  });
  c.on('se-miniature-run-1', () => {
    s.play(rankOn.to(1, { duration: clampDur(c, c.cue('se-miniature-run-1').start, 0.3) }));
  });
  c.on('se-miniature-run-wordsum', () => {
    s.play(wordProg.to(1, { duration: clampDur(c, c.cue('se-miniature-run-wordsum').start, 0.7) }));
  });
  c.on('se-miniature-run-quote', () => {
    s.play(quoteOn.to(1, { duration: clampDur(c, c.cue('se-miniature-run-quote').start, 0.3) }));
  });
  c.on('se-miniature-run-2', () => {
    s.play(pubStage.to(1, { duration: clampDur(c, c.cue('se-miniature-run-2').start, 0.25) }));
  });
  c.on('se-miniature-run-checks', () => {
    s.play(
      checksProg.to(1, { duration: clampDur(c, c.cue('se-miniature-run-checks').start, 0.9) }),
    );
  });
  c.on('se-miniature-run-publish', () => {
    s.play(
      publishDone.to(1, { duration: clampDur(c, c.cue('se-miniature-run-publish').start, 0.3) }),
    );
  });
}
