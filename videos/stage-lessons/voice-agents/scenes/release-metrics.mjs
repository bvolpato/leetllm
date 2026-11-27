// Scene 27: release-metrics - Did the incident line meet its deadline?
// 10x10 cohort grid of 100 attempted calls (86 fast emerald, 4 late amber, 10 silent rose):
// STRICT prediction withholding before revealing 86/90 (95.6% false pass) vs 86/100 (86% HOLD)!
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function releaseMetrics(s, c) {
  const silentOn = s.value(0);
  const audioOnlyOn = s.value(0); // STRICT after load-success!
  const all100On = s.value(0); // STRICT after load-all!
  const holdOn = s.value(0);
  const qualOn = s.value(0);

  const header = cinemaHeader(
    'RELEASE SLO DENOMINATOR',
    'Did the incident line',
    'meet its 95% SLO?',
    {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const sil = silentOn.value;
      const ao = audioOnlyOn.value;
      const all = all100On.value;
      const hld = holdOn.value;
      const ql = qualOn.value;
      const nodes = [];

      // Left: 10x10 grid of 100 attempted calls (cell 34x34, step 44 -> width 440, centered around x = -470)
      const gx0 = -680;
      const gy0 = -165;
      const step = 44;

      for (let i = 0; i < 100; i++) {
        const r = Math.floor(i / 10);
        const colIdx = i % 10;
        const cx = gx0 + colIdx * step;
        const cy = gy0 + r * step;

        let color = ROLE.ok; // 0..85: 86 timely (<= 500 ms)
        let alpha = 0.92;
        if (i >= 86 && i < 90) {
          color = ROLE.warn; // 86..89: 4 late audio
        } else if (i >= 90) {
          color = ROLE.fail; // 90..99: 10 timed out in silence!
          alpha = ao > 0.4 && all < 0.4 ? 0.2 : 0.35 + sil * 0.6;
        }

        nodes.push(
          rect(32, 32, { fill: color, stroke: '#ffffff', width: 1, radius: 5 })
            .at(cx, cy)
            .opacity(alpha),
        );
      }

      nodes.push(
        txt('100 ATTEMPTED CALLS (1 SLICE)', -480, gy0 - 52, 26, ROLE.audio, 'mono', 'center'),
        txt(
          '86 TIMELY · 4 LATE · 10 SILENT',
          -480,
          gy0 + 10 * step + 22,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Right: Denominator Trap Comparison (STRICT withholding before load-success!)
      const rx = 380;
      nodes.push(
        txt('PROMISED TARGET: >= 95% <= 500 ms', rx, -425, 26, ROLE.focus, 'mono', 'center'),
      );

      if (all > 0.35 || hld > 0.35) {
        nodes.push(
          txt('AUDIO-ONLY DENOMINATOR (WRONG):', rx, -135, 26, COSMOS.muted, 'mono', 'center'),
          txt('86 / 90 = 95.6%  (hides 10 silent!)', rx, -85, 28, ROLE.warn, 'mono', 'center'),
          line([40, -18], [720, -18], { stroke: ROLE.fail, width: 3 }).glow(8, ROLE.fail),
          txt('ALL ATTEMPTED CALLS (HONEST):', rx, 45, 26, ROLE.fail, 'mono', 'center'),
          txt('86 / 100 = 86.0%  (< 95% SLO!)', rx, 102, 34, ROLE.fail, 'mono', 'center').glow(
            10,
            ROLE.fail,
          ),
          txt('HOLD THE RELEASE ON THIS SLICE!', rx, 175, 28, ROLE.cut, 'mono', 'center').glow(
            8,
            ROLE.cut,
          ),
        );
      } else if (ao > 0.35) {
        nodes.push(
          txt('AUDIO-ONLY DENOMINATOR:', rx, -65, 26, ROLE.audio, 'mono', 'center'),
          txt('86 / 90 = 95.6%  (looks like pass...)', rx, -5, 30, ROLE.warn, 'mono', 'center'),
          txt('What about the 10 silent calls?', rx, 75, 28, ROLE.fail, 'mono', 'center'),
        );
      } else {
        nodes.push(
          txt('86 timely  ·  4 late  ·  10 silent', rx, -55, 28, COSMOS.ink, 'mono', 'center'),
          txt('Did this slice meet 95% <= 500 ms?', rx, 20, 32, ROLE.focus, 'serif', 'center').glow(
            6,
            ROLE.focus,
          ),
          txt('Target: 10,000 simultaneous calls', rx, 105, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      // Bottom quality checklist
      nodes.push(
        txt(
          ql > 0.4
            ? 'Also test digit cutoffs, pronunciation, blocked forbidden tools, barge-in & recovery!'
            : 'Decide upfront how missing playback enters the denominator before releasing',
          0,
          388,
          26,
          ql > 0.4 ? ROLE.audio : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('load-silent', () => {
    s.play(silentOn.to(1, { duration: clampDur(c, c.cue('load-silent').start, 0.35) }));
  });
  c.after('load-success', () => {
    s.play(audioOnlyOn.to(1, { duration: clampDur(c, c.cue('load-success').end, 0.35) }));
  });
  c.after('load-all', () => {
    s.play(all100On.to(1, { duration: clampDur(c, c.cue('load-all').end, 0.4) }));
  });
  c.after('load-hold', () => {
    s.play(holdOn.to(1, { duration: clampDur(c, c.cue('load-hold').end, 0.35) }));
  });
  c.on('load-quality', () => {
    s.play(qualOn.to(1, { duration: clampDur(c, c.cue('load-quality').start, 0.35) }));
  });
}
