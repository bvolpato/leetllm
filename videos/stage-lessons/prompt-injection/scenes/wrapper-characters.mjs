// Scene 5: wrapper-characters - Change markup characters without changing authority
// Optical lexical-escape workbench: transforms literal `</retrieved-eval>` into
// `&lt;/retrieved-eval&gt;` in place while keeping the hostile promotion text hot and
// proving XML nonce attributes + causal attention never perform a host permission lookup.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ESCAPED_CLOSING_TAG,
  RAW_CLOSING_TAG,
  REPORT,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  glowDot,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function wrapperCharacters(s, c) {
  const pulse = s.value(0);
  const escapeMorph = s.value(0);
  const noncePhase = s.value(0);

  const header = cinemaHeader(
    'ESCAPING vs AUTHORITY',
    'Change markup characters,',
    'not execution authority',
    { accent: ROLE.untrusted, size: 48 },
  );

  const stageAura = aura(100, 40, 620, '#fb923c1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const em = escapeMorph.value;
      const np = noncePhase.value;
      const nodes = [];

      // Top Workbench: Raw Tag -> ESCAPE Gate -> Encoded Literal Characters
      const topY = -105;
      nodes.push(
        energyRail(-855, -205, -20, ROLE.source, { width: 6 }),
        txt('RAW INPUT SPAN', -825, -182, 26, ROLE.source, 'mono', 'left'),
        txt(RAW_CLOSING_TAG, -825, -124, 30, ROLE.attack, 'mono', 'left').glow(6, ROLE.attack),
        txt(`“${REPORT.attack}”`, -825, -62, 28, ROLE.untrusted, 'serif', 'left'),
      );

      const gateX = -20;
      nodes.push(
        hexGate(gateX, topY, 64, ROLE.host, {
          label: 'ESCAPE',
          sub: '< -> &lt;',
          glow: 9,
        }),
      );

      const inPts = quadArcPts([-340, topY], [gateX - 102, topY], 0, 18);
      const outPts = quadArcPts([gateX + 102, topY], [220, topY], 0, 18);
      nodes.push(
        beamWithPhotons(inPts, ROLE.attack, p * 1.1, { width: 3.2 }),
        beamWithPhotons(outPts, em > 0.3 ? ROLE.host : COSMOS.dim, p * 1.1 + 0.5, {
          width: 3.2,
          alpha: 0.45 + em * 0.55,
        }),
      );

      nodes.push(
        energyRail(240, -205, -20, ROLE.source, { width: 6 }),
        txt('ENCODED IN PLACE (SAME SOURCE)', 270, -182, 26, ROLE.host, 'mono', 'left'),
        txt(
          em > 0.35 ? ESCAPED_CLOSING_TAG : RAW_CLOSING_TAG,
          270,
          -124,
          30,
          em > 0.35 ? ROLE.ok : ROLE.attack,
          'mono',
          'left',
        ).glow(6, em > 0.35 ? ROLE.ok : ROLE.attack),
        txt(`“${REPORT.attack}” (ACTIVE)`, 270, -62, 26, ROLE.untrusted, 'mono', 'left').glow(
          6,
          ROLE.untrusted,
        ),
      );

      // Bottom Workbench: XML Nonce Attribute & Causal Attention Reality Check
      nodes.push(line([-855, 45], [840, 45], { stroke: '#25355a', width: 2 }));

      // Bottom-left: XML attribute nonce anatomy
      nodes.push(
        energyRail(-855, 85, 360, np > 0.25 ? ROLE.focus : '#334673', {
          width: 5,
          opacity: 0.5 + np * 0.5,
        }),
        txt('XML NONCE ATTRIBUTE', -825, 112, 26, ROLE.focus, 'mono', 'left'),
        txt('<retrieved-eval nonce="a9f3c1">', -825, 172, 26, COSMOS.ink, 'mono', 'left'),
        txt('</retrieved-eval>', -825, 232, 28, ROLE.attack, 'mono', 'left').glow(
          np > 0.3 ? 6 : 0,
          ROLE.attack,
        ),
        txt(
          'Closing tag NEVER repeats the nonce attribute',
          -825,
          294,
          26,
          np > 0.3 ? ROLE.untrusted : COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          'Reminder after report still shares one context',
          -825,
          344,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Bottom-right: Causal attention arcs vs missing host permission lookup
      const tokXs = [150, 315, 480, 645, 800];
      const tokLabels = ['DEV', 'OPEN', 'PASS', 'ATK', 'REM'];
      const tokCols = [ROLE.host, ROLE.source, ROLE.ok, ROLE.attack, ROLE.focus];
      const tokY = 235;

      nodes.push(txt('CAUSAL SELF-ATTENTION WINDOW', 475, 112, 26, ROLE.host, 'mono', 'center'));

      // Causal arcs backward from REM -> earlier tokens
      for (let i = 0; i < 4; i++) {
        const arc = quadArcPts([tokXs[4], tokY - 26], [tokXs[i], tokY - 26], -48 - i * 10, 18);
        nodes.push(
          beamWithPhotons(arc, tokCols[i], p * 0.8 + i * 0.2, {
            width: i === 3 ? 3.2 : 2.0,
            alpha: (0.35 + np * 0.55) * (i === 3 ? 1 : 0.65),
            photonCount: 1,
          }),
        );
      }

      tokXs.forEach((tx, i) => {
        nodes.push(
          rect(116, 48, { fill: '#0e1528', stroke: tokCols[i], width: 2.4, radius: 8 })
            .at(tx, tokY)
            .opacity(0.9),
          txt(tokLabels[i], tx, tokY, 26, tokCols[i], 'mono', 'center'),
        );
      });

      nodes.push(
        txt(
          'Attention prioritizes roles, NOT host permission lookups',
          475,
          324,
          26,
          np > 0.3 ? ROLE.denied : COSMOS.muted,
          'mono',
          'center',
        ).glow(np > 0.3 ? 6 : 0, ROLE.denied),
        glowDot(150 + ((p * 0.3) % 1) * 650, tokY + 42, {
          radius: 4.5,
          color: ROLE.host,
          glow: 9,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('pi-wrapper-characters-0', () => {
    s.play(
      escapeMorph.to(1, { duration: clampDur(c, c.cue('pi-wrapper-characters-0').start, 0.7) }),
    );
  });
  c.on('pi-wrapper-characters-1', () => {
    s.play(
      noncePhase.to(1, { duration: clampDur(c, c.cue('pi-wrapper-characters-1').start, 0.6) }),
    );
  });
}
