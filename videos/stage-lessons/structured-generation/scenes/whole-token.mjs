// Scene 7: whole-token - Which whole token can the decoder append?
// Animated whole-token FSM stepper! Walks multi-character subword tokens (letters + punctuation)
// byte-by-byte from shop prefix {"status":"clo across Candidate A (sed"}) and Candidate B (sed"}!),
// rejecting B at the trailing !, committing A, then morphing into the CI token index
// ({"status":"fa + iled"} score 1 Eligible vs iled"}! score 8 Masked out -> EOS allowed!).
import { group, line } from 'vizmatic/stage';
import {
  CI_TRIAL,
  COSMOS,
  EOS,
  ROLE,
  SHOP_TRIAL,
  TOKEN_SCORES,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  guardedDynamic,
  legal,
  quadArcPts,
  tokenChip,
  txt,
} from '../parts.mjs';

export default function wholeToken(s, c) {
  const lettersHi = s.value(0);
  const punctHi = s.value(0);
  const prefixHi = s.value(0);
  const scanA = s.value(0);
  const closeA = s.value(0);
  const verdictA = s.value(0);
  const scanB = s.value(0);
  const bangCursor = s.value(0);
  const verdictB = s.value(0);
  const wholeHi = s.value(0);
  const commitA = s.value(0);
  const lookupMode = s.value(0); // 0 = shop trial, 1 = CI token index

  const header = cinemaHeader('SUBWORD ALIGNMENT', 'Which whole token can', 'the decoder append?', {
    accent: ROLE.fsm,
    size: 48,
  });

  const stageAura = aura(200, 40, 640, '#5ce1e61f', '#ff6b8b16');

  // Mode 0: Shop status whole-token character walk
  const shopView = guardedDynamic(
    () => fadeOutHalf(lookupMode.value),
    (a) => {
      const lh = lettersHi.value;
      const ph = punctHi.value;
      const pr = prefixHi.value;
      const sa = scanA.value;
      const ca = closeA.value;
      const va = verdictA.value;
      const sb = scanB.value;
      const bc = bangCursor.value;
      const vb = verdictB.value;
      const wh = wholeHi.value;
      const cm = commitA.value;
      const nodes = [];

      const buffer = cm > 0.5 ? SHOP_TRIAL.prefix + SHOP_TRIAL.suffix : SHOP_TRIAL.prefix;
      const tokA = SHOP_TRIAL.suffix; // sed"} (len 5)
      const tokB = SHOP_TRIAL.suffix + '!'; // sed"}! (len 6)
      const checkedA = Math.round(sa * 3) + Math.round(ca * 2);
      const checkedB = Math.round(sb * 5) + (bc > 0.5 ? 1 : 0);

      nodes.push(
        txt(
          'SHOP LANGUAGE:  {"status":"open"}  |  {"status":"closed"}',
          -840,
          -246,
          26,
          ROLE.schema,
          'mono',
          'left',
        ).opacity(a),
        txt(
          `ACCEPTED PREFIX: ${buffer}`,
          -840,
          -182,
          42,
          cm > 0.5 ? ROLE.legal : pr > 0.3 ? ROLE.prefix : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(cm > 0.5 ? 9 : pr > 0.3 ? 6 : 0, cm > 0.5 ? ROLE.legal : ROLE.prefix)
          .opacity(a),
      );

      if (cm > 0.5 && legal(buffer, EOS, SHOP_TRIAL.language)) {
        nodes.push(
          txt('EOS ALLOWED', 840, -182, 32, ROLE.legal, 'mono', 'right')
            .glow(8, ROLE.legal)
            .opacity(a * cm),
        );
      }

      const drawRow = (label, tok, checked, verdict, isB, y) => {
        const ok = legal(SHOP_TRIAL.prefix, tok, SHOP_TRIAL.language);
        nodes.push(
          txt(
            label,
            -810,
            y,
            42,
            verdict > 0.5 ? (ok ? ROLE.legal : ROLE.prune) : ROLE.fsm,
            'mono',
            'center',
          ).opacity(a),
        );
        const startX = -675;
        const step = 112;
        [...tok].forEach((ch, idx) => {
          const isPunct = idx >= 3;
          const isBang = isB && idx === tok.length - 1;
          const walked = idx < checked;
          let col = COSMOS.muted;
          if (walked) {
            col = isBang ? ROLE.prune : ROLE.fsm;
          } else if (lh > 0.3 && !isPunct && checked === 0) {
            col = ROLE.fsm;
          } else if (ph > 0.3 && isPunct && checked === 0) {
            col = ROLE.prefix;
          }
          if (verdict > 0.5 && ok) col = ROLE.legal;
          if (verdict > 0.5 && isBang) col = ROLE.prune;

          nodes.push(
            tokenChip(ch, startX + idx * step, y, {
              w: 92,
              h: 82,
              color: col,
              size: 40,
              glow: walked || (isBang && bc > 0.3) ? 9 : 3,
              opacity: a,
            }),
          );
          if (idx > 0 && idx < checked) {
            nodes.push(
              line([startX + (idx - 1) * step + 48, y], [startX + idx * step - 48, y], {
                stroke: isBang ? ROLE.prune : ROLE.fsm,
                width: 3.2,
              }).opacity(a * 0.85),
            );
          }
        });

        // Trailing bang cursor spark on B
        if (isB && bc > 0.2) {
          const bx = startX + 5 * step;
          nodes.push(
            line([bx - 42, y + 54], [bx + 42, y + 54], { stroke: ROLE.prune, width: 6 })
              .glow(12, ROLE.prune)
              .opacity(a * bc),
            glowDot(bx, y + 54, { radius: 6, color: ROLE.prune, glow: 12, opacity: a * bc }),
          );
        }

        // Right-hand verdict
        let vText = 'awaiting scan';
        let vCol = COSMOS.dim;
        if (verdict > 0.5) {
          vText = ok ? 'WHOLE TOKEN ACCEPTED' : 'WHOLE TOKEN REJECTED';
          vCol = ok ? ROLE.legal : ROLE.prune;
        } else if (isB && bc > 0.5) {
          vText = 'NO TRANSITION FOR "!"';
          vCol = ROLE.prune;
        } else if (checked > 0) {
          vText = `${checked} / ${tok.length} bytes valid`;
          vCol = ROLE.fsm;
        }
        nodes.push(
          txt(vText, 120, y, 32, vCol, 'mono', 'left')
            .glow(verdict > 0.5 ? 8 : 0, vCol)
            .opacity(a),
        );
      };

      drawRow('A', tokA, checkedA, va, false, -18);
      drawRow('B', tokB, checkedB, vb, true, 182);

      // Commit arc from A toward prefix when shop-commit fires (generous clearance below prefix text)
      if (cm > 0.05) {
        const arc = quadArcPts([-440, -68], [-320, -120], -14);
        nodes.push(beamWithPhotons(arc, ROLE.legal, 0, { alpha: a * cm, width: 3.4 }));
      }

      nodes.push(
        txt(
          wh > 0.4
            ? 'Engine validates every byte of a token before advancing committed parser state'
            : lh > 0.3 && ph > 0.3
              ? 'One vocabulary token can mix word fragments ("sed") with punctuation ("}")'
              : 'Grammars operate on bytes while models emit multi-character subword tokens',
          -840,
          365,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: CI Token Index lookup ({"status":"fa + iled"} score 1 vs iled"}! score 8)
  const ciView = guardedDynamic(
    () => fadeInHalf(lookupMode.value),
    (a) => {
      const nodes = [];
      const tokA = CI_TRIAL.suffix; // iled"}
      const tokB = CI_TRIAL.suffix + '!'; // iled"}!

      nodes.push(
        txt(
          'CI TOKEN INDEX  ·  PRECOMPUTED STATE LOOKUP',
          -840,
          -238,
          26,
          ROLE.trie,
          'mono',
          'left',
        ).opacity(a),
        txt(`ACCEPTED PREFIX: ${CI_TRIAL.prefix}`, -840, -166, 42, ROLE.prefix, 'mono', 'left')
          .glow(7, ROLE.prefix)
          .opacity(a),
        txt('MODEL SCORE', 760, -166, 26, COSMOS.muted, 'mono', 'center').opacity(a),
      );

      [tokA, tokB].forEach((tok, row) => {
        const y = -18 + row * 185;
        const ok = legal(CI_TRIAL.prefix, tok, CI_TRIAL.language);
        const col = ok ? ROLE.legal : ROLE.prune;
        const score = TOKEN_SCORES.get(tok);
        const startX = -675;
        const step = 104;

        nodes.push(txt(row === 0 ? 'A' : 'B', -810, y, 42, col, 'mono', 'center').opacity(a));
        [...tok].forEach((ch, idx) => {
          const isBad = !ok && idx === tok.length - 1;
          nodes.push(
            tokenChip(ch, startX + idx * step, y, {
              w: 84,
              h: 78,
              color: isBad ? ROLE.prune : ok ? ROLE.legal : ROLE.fsm,
              size: 38,
              glow: isBad || ok ? 8 : 4,
              opacity: a,
            }),
          );
        });

        nodes.push(
          txt(ok ? 'ELIGIBLE' : 'MASKED OUT (-∞)', 170, y, 32, col, 'mono', 'left')
            .glow(8, col)
            .opacity(a),
          txt(
            String(score.toFixed(1)),
            760,
            y,
            44,
            ok ? ROLE.legal : COSMOS.dim,
            'mono',
            'center',
          ).opacity(a),
        );
      });

      const beam = quadArcPts([-675, 295], [300, 295], -18);
      nodes.push(
        beamWithPhotons(beam, ROLE.legal, 0, { alpha: a * 0.85, width: 3.2 }),
        txt(`AFTER SAMPLING A: ${CI_TRIAL.nextBuffer}`, -840, 355, 34, ROLE.legal, 'mono', 'left')
          .glow(8, ROLE.legal)
          .opacity(a),
        txt('EOS ALLOWED', 840, 355, 32, ROLE.legal, 'mono', 'right')
          .glow(8, ROLE.legal)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, shopView, ciView);

  c.on('whole-token-b1-1', () => {
    s.play(lettersHi.to(1, { duration: clampDur(c, c.cue('whole-token-b1-1').start, 0.35) }));
  });
  c.on('token-punctuation', () => {
    s.play(punctHi.to(1, { duration: clampDur(c, c.cue('token-punctuation').start, 0.35) }));
  });
  c.on('shop-prefix', () => {
    s.play(prefixHi.to(1, { duration: clampDur(c, c.cue('shop-prefix').start, 0.35) }));
  });
  c.on('shop-scan-a', () => {
    s.play(scanA.to(1, { duration: clampDur(c, c.cue('shop-scan-a').start, 0.55) }));
  });
  c.on('shop-close-a', () => {
    s.play(closeA.to(1, { duration: clampDur(c, c.cue('shop-close-a').start, 0.45) }));
  });
  c.on('whole-token-b2-1', () => {
    s.play(verdictA.to(1, { duration: clampDur(c, c.cue('whole-token-b2-1').start, 0.35) }));
  });
  c.on('shop-scan-b', () => {
    s.play(scanB.to(1, { duration: clampDur(c, c.cue('shop-scan-b').start, 0.65) }));
  });
  c.on('whole-token-b2-2', () => {
    s.play(bangCursor.to(1, { duration: clampDur(c, c.cue('whole-token-b2-2').start, 0.35) }));
  });
  c.on('shop-reject', () => {
    s.play(verdictB.to(1, { duration: clampDur(c, c.cue('shop-reject').start, 0.35) }));
  });
  c.on('whole-token-b3-1', () => {
    s.play(wholeHi.to(1, { duration: clampDur(c, c.cue('whole-token-b3-1').start, 0.35) }));
  });
  c.on('shop-commit', () => {
    s.play(commitA.to(1, { duration: clampDur(c, c.cue('shop-commit').start, 0.45) }));
  });
  c.on('ci-lookup', () => {
    s.play(lookupMode.to(1, { duration: clampDur(c, c.cue('ci-lookup').start, 0.5) }));
  });
}
