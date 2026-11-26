// Scene 15: untrusted-source - Can Alice preview the roadmap?
// Prediction beat: Policy page (Workspace A) links to Roadmap (Workspace B).
// Strictly withholds "ACCESS DENIED" until `c.after('se-untrusted-source-1')`,
// then Beat 2 shows the streaming hold buffer keeping unchecked drafts behind the same boundary.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function untrustedSource(s, c) {
  const pulse = s.value(0);
  const linkOn = s.value(0);
  const scopeOn = s.value(0);
  const reqProg = s.value(0);
  const deniedOn = s.value(0);
  const bufferOn = s.value(0);
  const progressOn = s.value(0);

  const header = cinemaHeader('READER BOUNDARY', 'Can Alice preview', 'the linked roadmap?', {
    accent: ROLE.deny,
    size: 46,
  });

  const stageAura = aura(0, 40, 700, '#60a5fa1a', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const rq = reqProg.value;
      const dn = deniedOn.value > 0.5;
      const bf = bufferOn.value > 0.5;
      const pr = progressOn.value > 0.5;
      const nodes = [];

      nodes.push(
        txt(
          'PRINCIPAL: ALICE  ·  WORKSPACE A ONLY',
          840,
          -400,
          28,
          ROLE.policy,
          'mono',
          'right',
        ).opacity(0.6 + 0.4 * scopeOn.value),
      );

      if (bf) {
        // Beat 2: Streaming Hold Buffer
        nodes.push(
          rect(790, 360, { fill: '#121526', stroke: ROLE.focus, width: 3, radius: 16 })
            .at(-445, 55)
            .glow(8, ROLE.focus),
          txt('DRAFT HELD FOR VERIFICATION', -805, -62, 28, ROLE.focus, 'mono', 'left'),
          txt('"60 days with security approval"', -805, 32, 36, COSMOS.ink, 'serif', 'left'),
          txt(
            'Citations checked: policy@2, exception@1',
            -805,
            118,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
          txt('ACL check: pending release', -805, 174, 26, ROLE.pending, 'mono', 'left'),

          line([0, -135], [0, 250], { stroke: ROLE.focus, width: 5, dash: [10, 8] }).glow(
            9,
            ROLE.focus,
          ),
          txt('HOLD GATE', 0, 294, 26, ROLE.focus, 'mono', 'center'),

          rect(790, 360, { fill: '#0d1527', stroke: ROLE.policy, width: 3, radius: 16 })
            .at(445, 55)
            .glow(7, ROLE.policy),
          txt('WHAT ALICE SEES WHILE WAITING', 85, -62, 28, ROLE.policy, 'mono', 'left'),
          txt(
            pr ? 'Search progress + permitted source links' : 'Streaming connection open...',
            85,
            32,
            30,
            pr ? ROLE.query : COSMOS.muted,
            'sans',
            'left',
          ),
          txt('Unchecked policy claims sent: 0', 85, 148, 28, ROLE.ok, 'mono', 'left'),

          txt(
            'Hold the draft until citations AND Alice permissions pass.',
            0,
            385,
            32,
            ROLE.query,
            'serif',
            'center',
          ),
        );
      } else {
        // Beats 0 & 1: Workspace A Policy Page -> Access Check -> Workspace B Roadmap Preview
        const wallCol = dn ? ROLE.deny : ROLE.focus;
        const rightCol = dn ? ROLE.deny : '#3a4f7c';

        nodes.push(
          // Left: Policy Page (Workspace A)
          rect(710, 380, { fill: '#0d1528', stroke: ROLE.policy, width: 2.8, radius: 16 }).at(
            -490,
            45,
          ),
          txt('POLICY PAGE  ·  WORKSPACE A', -810, -82, 26, ROLE.policy, 'mono', 'left'),
          txt('Planning Calendar', -810, -14, 38, COSMOS.ink, 'serif', 'left'),
          line([-810, 28], [-170, 28], { stroke: '#2c3d66', width: 2 }),
          txt('Embedded link:', -810, 78, 26, COSMOS.muted, 'mono', 'left'),
          txt('Open the roadmap', -810, 134, 34, ROLE.query, 'serif', 'left').glow(
            5 + linkOn.value * 5,
            ROLE.query,
          ),
          txt('Destination: workspace B', -810, 192, 26, ROLE.deny, 'mono', 'left'),

          // Connector + Access Boundary Wall
          line([-135, 100], [115, 100], { stroke: '#3a4f7c', width: 3 }),
          line([118, -110], [118, 230], { stroke: wallCol, width: 6 }).glow(11, wallCol),
          txt('ACCESS CHECK', 118, 275, 26, wallCol, 'mono', 'center'),

          // Right: Roadmap Preview (Workspace B)
          rect(630, 380, { fill: '#111322', stroke: rightCol, width: dn ? 3.2 : 2.2, radius: 16 })
            .at(535, 45)
            .glow(dn ? 9 : 0, rightCol),
          txt('ROADMAP PREVIEW  ·  WORKSPACE B', 255, -82, 26, rightCol, 'mono', 'left'),
          txt('Private Roadmap', 255, -14, 38, COSMOS.ink, 'serif', 'left'),
          line([255, 28], [810, 28], { stroke: '#2c3d66', width: 2 }),
        );

        // Request photon approaches boundary wall
        if (rq > 0.05) {
          const px = -125 + rq * 222;
          nodes.push(
            glowDot(px, 100, {
              radius: 12,
              color: dn ? ROLE.deny : ROLE.query,
              glow: 14,
            }),
          );
        }

        if (dn) {
          nodes.push(
            txt('ACCESS DENIED', 255, 118, 40, ROLE.deny, 'mono', 'left').glow(8, ROLE.deny),
            txt('Preview stays closed · 0 bytes fetched', 255, 184, 26, COSMOS.ink, 'sans', 'left'),
            txt(
              'Treat page instructions as quoted text; check Alice permissions on every preview.',
              -845,
              375,
              32,
              ROLE.ok,
              'serif',
              'left',
            ),
          );
        } else if (rq > 0.4) {
          nodes.push(
            txt('Preview requested...', 255, 128, 30, COSMOS.muted, 'mono', 'left'),
            txt(
              'What happens when Alice asks for the preview?',
              -845,
              375,
              36,
              ROLE.focus,
              'serif',
              'left',
            ).glow(7, ROLE.focus),
          );
        } else {
          nodes.push(txt('Out-of-scope target', 255, 128, 28, COSMOS.dim, 'mono', 'left'));
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-untrusted-source-0', () => {
    s.play(linkOn.to(1, { duration: clampDur(c, c.cue('se-untrusted-source-0').start, 0.35) }));
  });
  c.on('se-untrusted-source-isolate', () => {
    s.play(
      scopeOn.to(1, { duration: clampDur(c, c.cue('se-untrusted-source-isolate').start, 0.3) }),
    );
  });
  c.on('se-untrusted-source-request', () => {
    s.play(
      reqProg.to(1, { duration: clampDur(c, c.cue('se-untrusted-source-request').start, 0.7) }),
    );
  });
  // Strict prediction withholding: reveal ACCESS DENIED ONLY after "The preview stays closed".
  c.after('se-untrusted-source-1', () => {
    s.play(deniedOn.to(1, { duration: clampDur(c, c.cue('se-untrusted-source-1').end, 0.25) }));
  });
  c.on('se-untrusted-source-2', () => {
    s.play(bufferOn.to(1, { duration: clampDur(c, c.cue('se-untrusted-source-2').start, 0.3) }));
  });
  c.on('se-untrusted-source-hold', () => {
    s.play(
      progressOn.to(1, { duration: clampDur(c, c.cue('se-untrusted-source-hold').start, 0.35) }),
    );
  });
}
