// Scene 12: exact-span - Where does the quotation stop?
// Prediction beat: shorten exception@1 [0,101) -> [0,72) keeping exact match & SHA-256 valid.
// Strictly withholds "Withhold" until `c.after('span-withhold')`, then restores [0,101) & releases,
// then advances registry to policy@3 so the previously released pack becomes stale.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  EXCEPTION_CUT_72,
  ROLE,
  SEARCH_TEXT,
  aura,
  buildSpanRibbonNodes,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  quoteReceipt,
  txt,
} from '../parts.mjs';

export default function exactSpan(s, c) {
  const pulse = s.value(0);
  const originOn = s.value(0);
  const shortenProg = s.value(0);
  const askOn = s.value(0);
  const withholdOn = s.value(0);
  const restoreProg = s.value(0);
  const releaseOn = s.value(0);
  const rev3On = s.value(0);

  const text = SEARCH_TEXT.exception;
  const fullLen = text.length;

  const header = cinemaHeader('QUOTATION OFFSETS', 'Where does the', 'quotation stop?', {
    accent: ROLE.query,
    size: 46,
  });

  const stageAura = aura(0, 40, 700, '#5ce1e61a', '#ff6b8b16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const sh = shortenProg.value;
      const rs = restoreProg.value;
      const ask = askOn.value > 0.5;
      const wh = withholdOn.value > 0.5;
      const rl = releaseOn.value > 0.5;
      const r3 = rev3On.value > 0.5;

      const endOffset = Math.round(fullLen - (fullLen - EXCEPTION_CUT_72) * (sh - rs));
      const displayEnd = sh > 0.5 && rs < 0.5 ? EXCEPTION_CUT_72 : fullLen;
      const polRec = quoteReceipt(SEARCH_TEXT.policy, 2, { current: r3 ? 3 : 2 });
      const excRec = quoteReceipt(text, 1, { end: endOffset });
      const passes = polRec.valid && excRec.valid;

      const nodes = [
        ...buildSpanRibbonNodes({
          textValue: text,
          revision: 1,
          endOffset,
          displayEnd,
          topY: -150,
          xLeft: -720,
          charW: 18.8,
        }),
        line([-840, 178], [840, 178], { stroke: '#2c3d66', width: 2 }),
        txt(`policy@2  [0, ${polRec.end})`, -840, 232, 28, ROLE.policy, 'mono', 'left'),
        txt(
          `REGISTRY: policy@${polRec.current}`,
          -140,
          232,
          28,
          r3 ? ROLE.deny : ROLE.policy,
          'mono',
          'left',
        ),
        txt('EXACT MATCH + SHA-256: OK', 840, 232, 26, ROLE.query, 'mono', 'right'),
      ];

      // Verdict bar strictly gated by spoken cues (no early leak!)
      let status = 'Checking normalized character spans [0, end)...';
      let statusCol = COSMOS.muted;

      if (r3) {
        status = 'WITHHOLD: policy@2 is stale (registry now policy@3)';
        statusCol = ROLE.deny;
      } else if (rl && passes) {
        status = 'PUBLISH BOTH COMPLETE QUOTATIONS  ([0,80) + [0,101))';
        statusCol = ROLE.ok;
      } else if (rs > 0.35 && !rl) {
        status = 'Span restored [0, 101) · verifying both quotations...';
        statusCol = ROLE.query;
      } else if (wh && !rl) {
        status = 'WITHHOLD: selection drops "only with security approval."';
        statusCol = ROLE.deny;
      } else if (ask) {
        status = 'Hash and slice match. Can this pack publish as it stands?';
        statusCol = ROLE.focus;
      }

      nodes.push(
        txt(status, -840, 355, 36, statusCol, 'serif', 'left')
          .glow(ask || wh || rl || r3 ? 7 : 0, statusCol)
          .opacity(0.6 + 0.4 * originOn.value),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('span-origin', () => {
    s.play(originOn.to(1, { duration: clampDur(c, c.cue('span-origin').start, 0.3) }));
  });
  c.on('span-shorten', () => {
    s.play(shortenProg.to(1, { duration: clampDur(c, c.cue('span-shorten').start, 0.7) }));
  });
  c.on('span-predict', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('span-predict').start, 0.25) }));
  });
  // Strict prediction withholding: reveal WITHHOLD only AFTER "Withhold it" finishes.
  c.after('span-withhold', () => {
    s.play(withholdOn.to(1, { duration: clampDur(c, c.cue('span-withhold').end, 0.25) }));
  });
  c.on('span-restore', () => {
    s.play(restoreProg.to(1, { duration: clampDur(c, c.cue('span-restore').start, 0.7) }));
  });
  c.after('span-release', () => {
    s.play(releaseOn.to(1, { duration: clampDur(c, c.cue('span-release').end, 0.25) }));
  });
  c.after('span-revision', () => {
    s.play(rev3On.to(1, { duration: clampDur(c, c.cue('span-revision').end, 0.3) }));
  });
}
