// Scene 05: identity - Which workspace can Alice open?
// Runs Alice's verified identity & grant (Alice -> A) twice through the gateway.
// Selecting A opens the authorized route to retrieval; selecting B pauses for prediction
// and strictly withholds "Permission denied / No lookup" until `c.after('identity-deny-b')`.
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function identity(s, c) {
  const grantOn = s.value(0);
  const allowA = s.value(0);
  const selectB = s.value(0);
  const askOn = s.value(0);
  const denyB = s.value(0);

  const stageAura = aura(-60, 20, 740, '#60a5fa1e', '#ff6b8b16');
  const header = cinemaHeader(
    'WORKSPACE AUTHORIZATION GATE',
    'Which workspace',
    'can Alice open?',
    { x: -860, y: -450, accent: ROLE.A, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const gOk = grantOn.value > 0.5;
      const aOk = allowA.value > 0.5;
      const isB = selectB.value > 0.5;
      const ask = askOn.value > 0.5;
      const denied = denyB.value > 0.5;

      const selColor = isB ? ROLE.B : ROLE.A;
      const nodes = [];

      // Left column: Verified caller Alice + Selected workspace
      nodes.push(
        rect(430, 175, { fill: '#0c1428', stroke: ROLE.A, width: 2.8, radius: 16 })
          .at(-625, -125)
          .glow(6, ROLE.A),
        txt('VERIFIED CALLER', -808, -172, 26, COSMOS.muted, 'mono', 'left'),
        txt('Alice', -808, -108, 52, COSMOS.ink, 'serif', 'left'),
        txt('Authenticated identity', -808, -62, 26, ROLE.A, 'sans', 'left'),

        rect(430, 195, { fill: '#0c1428', stroke: selColor, width: 3.0, radius: 16 })
          .at(-625, 130)
          .glow(8, selColor),
        txt('SELECTED WORKSPACE', -808, 72, 26, COSMOS.muted, 'mono', 'left'),
        txt(`Workspace ${isB ? 'B' : 'A'}`, -808, 146, 52, selColor, 'serif', 'left').glow(
          7,
          selColor,
        ),
        txt(
          isB ? 'Changed request target' : 'Matches active grant',
          -808,
          198,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Center: Grant badge & Gateway decision barrier
      nodes.push(
        rect(380, 148, {
          fill: '#0d182d',
          stroke: gOk ? ROLE.A : '#31426b',
          width: 2.8,
          radius: 16,
        })
          .at(-10, -140)
          .glow(gOk ? 9 : 2, ROLE.A),
        txt('CURRENT GRANT', -10, -178, 26, COSMOS.muted, 'mono', 'center'),
        txt('Alice  ->  A', -10, -118, 42, ROLE.A, 'mono', 'center').glow(6, ROLE.A),
      );

      // Beam from Selected Workspace to Gateway
      nodes.push(
        beamWithPhotons(
          [
            [-408, 130],
            [-36, 130],
          ],
          selColor,
          0,
          { width: 4.5, glow: 9 },
        ),
      );

      // Gateway node at (-10, 130)
      if (isB && denied) {
        // Hard closed barrier
        nodes.push(
          line([-10, 38], [-10, 222], { stroke: ROLE.fail, width: 10 }).glow(12, ROLE.fail),
          txt('PERMISSION DENIED', -10, 272, 30, ROLE.fail, 'mono', 'center').glow(7, ROLE.fail),
        );
      } else if (!isB && aOk) {
        // Open blue route to Retrieval
        nodes.push(
          circle(22, { fill: '#0d2336', stroke: ROLE.ok, width: 3.4 })
            .at(-10, 130)
            .glow(9, ROLE.ok),
          beamWithPhotons(
            [
              [14, 130],
              [345, 130],
            ],
            ROLE.A,
            0,
            { width: 4.5, glow: 9 },
          ),
          txt('AUTHORIZED CONTEXT', -10, 272, 28, ROLE.ok, 'mono', 'center'),
        );
      } else {
        // Holding at the gate (either checking A or prediction pause on B!)
        nodes.push(
          circle(24, { fill: '#221c0c', stroke: ROLE.focus, width: 3.4 })
            .at(-10, 130)
            .glow(10, ROLE.focus),
          txt('?', -10, 130, 28, ROLE.focus, 'mono', 'center'),
          txt(
            isB && ask ? 'SEND LOOKUP?' : 'CHECKING GRANT',
            -10,
            272,
            28,
            ROLE.focus,
            'mono',
            'center',
          ),
        );
      }

      // Right: Retrieval Service + Hot B Adapter status pill
      const retStroke = !isB && aOk ? ROLE.A : isB && denied ? ROLE.fail : '#354872';
      nodes.push(
        rect(480, 260, { fill: '#0b1224', stroke: retStroke, width: 3.0, radius: 18 })
          .at(600, 100)
          .glow(!isB && aOk ? 9 : 3, retStroke),
        txt('RETRIEVAL SERVICE', 600, 28, 28, COSMOS.muted, 'mono', 'center'),
        txt(
          isB && denied
            ? 'No lookup sent'
            : !isB && aOk
              ? 'Context: A / Alice'
              : 'Awaiting gateway',
          600,
          104,
          36,
          isB && denied ? ROLE.fail : !isB && aOk ? ROLE.A : COSMOS.dim,
          'mono',
          'center',
        ),
        txt(
          !isB && aOk ? 'Carol’s private doc stays blocked' : 'Checks per-document ACLs',
          600,
          168,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),

        // Hot B adapter status card above Retrieval (visible when B is selected)
        rect(480, 118, {
          fill: '#151228',
          stroke: isB ? ROLE.model : '#263354',
          width: 2.4,
          radius: 14,
        })
          .at(600, -145)
          .glow(isB ? 7 : 0, ROLE.model),
        txt('WORKER ADAPTER CACHE', 600, -172, 26, ROLE.model, 'mono', 'center'),
        txt(
          isB ? 'Workspace B adapter: HOT' : 'Hot adapter != permission',
          600,
          -124,
          28,
          isB ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom takeaway / question
      const bottomText =
        isB && denied
          ? 'A hot adapter saves load time; it never grants access to Workspace B.'
          : isB
            ? 'Same credentials, same grant (A). Should the gateway send a B lookup?'
            : 'Verified caller identity and workspace grant travel into every downstream check.';
      nodes.push(
        txt(
          bottomText,
          0,
          410,
          30,
          isB && denied ? ROLE.focus : isB ? ROLE.focus : COSMOS.ink,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'identity-principal', grantOn, 1);
  stepAfter(s, c, 'identity-allow-a', allowA, 1);
  stepOn(s, c, 'identity-select-b', selectB, 1);
  stepOn(s, c, 'identity-choice', askOn, 1);
  // Strict prediction withholding: reveal denial ONLY after "Deny the selection here" finishes!
  stepAfter(s, c, 'identity-deny-b', denyB, 1);
}
