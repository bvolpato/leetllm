// Scene 11: freshness - Two replies for one line
// Live editor row (R42, col 23, v42, policy 7) vs arriving R42 (STRICT prediction 1 -> paint gray ghost!)
// followed by late R41 (col 17, v41) -> STRICT prediction 2 -> keep R42 ghost, discard ONLY R41!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  base,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function freshness(s, c) {
  const phase = s.value(0);
  const paint42 = s.value(0); // STRICT after fresh-paint!
  const arrive41 = s.value(0);
  const keep42Drop41 = s.value(0); // STRICT after fresh-keep!

  const header = cinemaHeader('SNAPSHOT FRESHNESS GUARD', 'Two replies for', 'one editor line', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const p42 = paint42.value;
      const a41 = arrive41.value;
      const kd = keep42Drop41.value;
      const nodes = [];

      // Editor buffer with live ghost text ONLY after fresh-paint!
      const lx = -820;
      nodes.push(
        txt('LIVE EDITOR BUFFER', lx, -185, 26, ROLE.ed, 'mono', 'left'),
        txt(
          p42 > 0.4
            ? 'is_allowed = graph.|allows(request)   [GRAY GHOST R42]'
            : 'is_allowed = graph.|',
          lx,
          -125,
          30,
          p42 > 0.4 ? ROLE.ok : COSMOS.ink,
          'mono',
          'left',
        ),
      );

      // Snapshot Comparison Table (Live vs R42 vs Late R41)
      const yLive = -20;
      const yR42 = 55;
      const yR41 = 130;
      nodes.push(
        line([-840, -68], [840, -68], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          `LIVE EDITOR:  ${base.document} · v${base.version} · col ${base.cursor} · pol ${base.policy} · epoch ${base.epoch}`,
          lx,
          yLive,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          `REPLY R42:    ${base.document} · v${base.version} · col ${base.cursor} · pol ${base.policy} · epoch ${base.epoch}`,
          lx,
          yR42,
          26,
          p42 > 0.4 ? ROLE.ok : ROLE.ed,
          'mono',
          'left',
        ),
        txt(
          p42 > 0.4 ? 'MATCH -> PAINT!' : '[ ? ]',
          560,
          yR42,
          26,
          p42 > 0.4 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ),
      );

      if (a41 > 0.2) {
        nodes.push(
          txt(
            `LATE R41:     ${base.document} · v41 · col 17 · pol ${base.policy} · epoch 41`,
            lx,
            yR41,
            26,
            kd > 0.4 ? ROLE.fail : ROLE.warn,
            'mono',
            'left',
          ).opacity(a41),
          txt(
            kd > 0.4 ? 'STALE -> DROP!' : '[ ? ]',
            560,
            yR41,
            26,
            kd > 0.4 ? ROLE.fail : ROLE.focus,
            'mono',
            'left',
          ).opacity(a41),
        );
      }

      // Top-right epoch rule
      nodes.push(
        txt('EPOCH ADVANCES ON:', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'edit · caret/selection move · policy change',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompts & verdict
      const botY = 265;
      nodes.push(line([-840, 200], [840, 200], { stroke: '#25355a', width: 2 }).opacity(0.65));
      if (kd > 0.35) {
        nodes.push(
          txt(
            'KEEP GRAY GHOST R42  |  DISCARD ONLY LATE R41 (COL 17 != 23, EPOCH 41 != 42)',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
          txt(
            'Cancellation saves GPU work; captured snapshot tells client what to drop when cancel arrives late',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (a41 > 0.35) {
        nodes.push(
          txt(
            'Late R41 starts 6 columns earlier. Which suggestion should stay at the caret?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (p42 > 0.35) {
        nodes.push(
          txt(
            'ALL 5 FIELDS MATCH -> PAINT GRAY GHOST TEXT (LINE STILL ENDS AT DOT UNTIL TAB)',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            'R42 matches file, version, selection, policy & epoch. Can the editor show it?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('fresh-paint', () => {
    s.play(paint42.to(1, { duration: clampDur(c, c.cue('fresh-paint').end, 0.35) }));
  });
  c.on('fresh-older', () => {
    s.play(arrive41.to(1, { duration: clampDur(c, c.cue('fresh-older').start, 0.35) }));
  });
  c.after('fresh-keep', () => {
    s.play(keep42Drop41.to(1, { duration: clampDur(c, c.cue('fresh-keep').end, 0.35) }));
  });
}
