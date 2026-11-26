// Scene 3: sliding-window - Five messages, three places
// Live 3-slot sliding window across WINDOW_TURNS: Turn 4 slides Turn 1 out while preserving
// its FACT event ID in the rolling summary -> Turn 5 drops unmarked Turn 2 cleanly ->
// Replacing Turn 5 with a massive tool result triggers prediction pause ("Will they fit?") ->
// Tokenizer budget meter reveals why token count (not message count) governs fit!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WINDOW_SUMMARY,
  WINDOW_TURNS,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function slidingWindow(s, c) {
  const pulse = s.value(0);
  const stepStage = s.value(0); // 0=T1..T3, 1=T2..T4 (T1 FACT saved), 2=T3..T5 (T2 dropped)
  const longToolOn = s.value(0);
  const tokBudgetReveal = s.value(0);

  const header = cinemaHeader('SLIDING WINDOW + SUMMARY', 'Five messages,', 'three live slots', {
    accent: ROLE.prompt,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#5ce1e61e', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const st = stepStage.value;
      const lt = longToolOn.value;
      const tb = tokBudgetReveal.value;
      const nodes = [];

      // Rolling Summary Rail on top
      const hasFact = st >= 0.7;
      nodes.push(
        txt(
          'PINNED ROLLING SUMMARY (MARKED "FACT:" ONLY)',
          -840,
          -185,
          26,
          ROLE.focus,
          'mono',
          'left',
        ),
        rect(1640, 64, {
          fill: '#0e1529',
          stroke: hasFact ? ROLE.focus : '#2b3b64',
          width: 2.4,
          radius: 10,
        })
          .at(0, -120)
          .glow(hasFact ? 7 : 0, ROLE.focus),
        txt(
          hasFact ? `[T1 preserved]  ${WINDOW_SUMMARY}` : '[ empty: no turns evicted yet ]',
          -790,
          -120,
          26,
          hasFact ? ROLE.focus : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // 3-Slot Live Window (T1..T3 -> T2..T4 -> T3..T5)
      const startIdx = st >= 1.6 ? 2 : st >= 0.7 ? 1 : 0;
      const slotYs = [12, 104, 196];

      nodes.push(txt('LIVE 3-SLOT WINDOW (VERBATIM)', -840, -56, 26, ROLE.prompt, 'mono', 'left'));

      for (let slot = 0; slot < 3; slot++) {
        const turn = WINDOW_TURNS[startIdx + slot];
        const y = slotYs[slot];
        const isLongSlot = slot === 2 && lt > 0.35;
        const w = isLongSlot ? 1560 : 1080;
        const col = isLongSlot
          ? ROLE.fail
          : turn.text.startsWith('FACT:')
            ? ROLE.focus
            : ROLE.prompt;

        nodes.push(
          rect(w, 64, { fill: '#10182d', stroke: col, width: 2.6, radius: 10 })
            .at(-820 + w * 0.5, y)
            .glow(isLongSlot ? 9 : 4, col),
          txt(
            isLongSlot
              ? `T5: [ HUGE TOOL RESULT · 4,800 TOKENS ]`
              : `T${startIdx + slot + 1}: ${turn.text}`,
            -795,
            y,
            26,
            isLongSlot ? ROLE.fail : COSMOS.ink,
            'mono',
            'left',
          ),
        );
      }

      // Eviction note on right (when not stretched by huge tool result)
      if (lt < 0.35) {
        const evTxt =
          st >= 1.6
            ? 'T2 unmarked -> dropped cleanly'
            : st >= 0.7
              ? 'T1 evicted -> FACT saved!'
              : '3 / 3 slots full';
        nodes.push(
          txt('EVICTION LOG', 340, 20, 26, ROLE.episodic, 'mono', 'left'),
          txt(evTxt, 340, 74, 28, st >= 0.7 ? ROLE.ok : COSMOS.muted, 'sans', 'left'),
        );
      }

      // Bottom prediction prompt -> tokenizer budget gauge!
      nodes.push(line([-840, 265], [840, 265], { stroke: '#25355a', width: 2 }).opacity(0.65));
      if (lt > 0.35 && tb < 0.05) {
        nodes.push(
          txt(
            'Still only 3 messages. Will they fit inside the context window?',
            0,
            330,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (tb > 0.05) {
        nodes.push(
          txt(
            'COUNT TOKENS WITH TARGET TOKENIZER (SUMMARY + SCHEMAS + RECALL + ANSWER)',
            0,
            305,
            26,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(6, ROLE.ok)
            .opacity(tb),
          glowMeter(-640, 360, 1280, 26, 0.96, { fill: ROLE.fail, opacity: tb }),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('fourth-message', () => {
    s.play(stepStage.to(1, { duration: clampDur(c, c.cue('fourth-message').start, 0.45) }));
  });
  c.on('fifth-message', () => {
    s.play(stepStage.to(2, { duration: clampDur(c, c.cue('fifth-message').start, 0.45) }));
  });
  c.on('long-message', () => {
    s.play(longToolOn.to(1, { duration: clampDur(c, c.cue('long-message').start, 0.45) }));
  });
  // Strict prediction withholding!
  c.after('count-tokens', () => {
    s.play(tokBudgetReveal.to(1, { duration: clampDur(c, c.cue('count-tokens').end, 0.35) }));
  });
}
