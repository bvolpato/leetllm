import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildXmlContract(s, c) {
  s.add(aura(-460, -40, 560, ROLE.warn, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('PARSER VS EVIDENCE', 'Valid XML advisory', 'is not a tool receipt', {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    }),
  );

  const fixOn = s.value(0);
  const emptyRev = s.value(0);
  const recOn = s.value(0);
  const ageOn = s.value(0);

  c.on('xml-fix', () =>
    s.play(fixOn.to(1, { duration: clampDur(c, c.cue('xml-fix').start, 0.5) })),
  );
  // Strict prediction withholding: empty receipt slot revealed ONLY after xml-empty!
  c.after('xml-empty', () =>
    s.play(emptyRev.to(1, { duration: clampDur(c, c.cue('xml-empty').end, 0.45) })),
  );
  c.on('xml-receipt', () =>
    s.play(recOn.to(1, { duration: clampDur(c, c.cue('xml-receipt').start, 0.5) })),
  );
  c.on('xml-age', () =>
    s.play(ageOn.to(1, { duration: clampDur(c, c.cue('xml-age').start, 0.5) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const fx = fixOn.value;
        const em = emptyRev.value;
        const rc = recOn.value;
        const ag = ageOn.value;
        const nodes = [];

        // Left: Invalid tag vs Fixed tag
        const yBox = -100;
        nodes.push(
          txt('MODEL RESPONSE XML', -840, yBox - 108, 26, ROLE.agent, 'mono', 'left'),
          rect(760, 176, {
            fill: '#0b1224',
            stroke: fx > 0.5 ? ROLE.ok : ROLE.fail,
            width: 2.8,
            radius: 10,
          }).at(-460, yBox),
          txt(
            '<checkpoint>rev-7 check</checkpoint>',
            -810,
            yBox - 48,
            26,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt('<verification>smoke ok</verification>', -810, yBox, 26, COSMOS.ink, 'mono', 'left'),
          txt(
            fx > 0.5 ? '<final_answer>Hold</final_answer>' : '<final>Hold</final>  (REJECTED!)',
            -810,
            yBox + 48,
            26,
            fx > 0.5 ? ROLE.ok : ROLE.fail,
            'mono',
            'left',
          ),
          txt(
            fx > 0.5 ? 'PARSER STATUS: ACCEPTED ADVISORY' : 'PARSER EXPECTS <final_answer>',
            -840,
            yBox + 128,
            26,
            fx > 0.5 ? ROLE.ok : ROLE.fail,
            'mono',
            'left',
          ),
        );

        // Right: Separate authenticated evidence slot
        const slotCol = rc > 0.5 ? ROLE.ok : em > 0.5 ? ROLE.warn : ROLE.focus;
        nodes.push(
          txt('AUTHENTICATED EVIDENCE SLOT', 60, yBox - 108, 26, slotCol, 'mono', 'left'),
          rect(780, 176, {
            fill: '#0b1224',
            stroke: slotCol,
            width: 2.8,
            radius: 10,
            dash: rc > 0.5 ? null : [10, 7],
          }).at(450, yBox),
        );

        if (rc > 0.5) {
          nodes.push(
            txt(
              'deploy=checkout-42  rev=7  canary=10%',
              92,
              yBox - 46,
              26,
              ROLE.ok,
              'mono',
              'left',
            ),
            txt('smoke=true (bool)  p95=240.0 (>=0)', 92, yBox + 2, 26, ROLE.ok, 'mono', 'left'),
            txt(
              ag > 0.4 ? 'age = now - observed = 10 s in [0..30]' : 'SOURCE: METRICS ADAPTER',
              92,
              yBox + 50,
              26,
              ag > 0.4 ? ROLE.focus : ROLE.agent,
              'mono',
              'left',
            ),
          );
        } else if (em > 0.5) {
          nodes.push(
            txt('EMPTY  (MODEL TEXT != RECEIPT)', 450, yBox - 18, 28, ROLE.warn, 'mono', 'center'),
            txt(
              'WAIT FOR METRICS ADAPTER RECORD',
              450,
              yBox + 34,
              26,
              COSMOS.muted,
              'mono',
              'center',
            ),
          );
        } else {
          nodes.push(
            txt('METRICS RECEIPT PRESENT?', 450, yBox - 18, 30, ROLE.focus, 'mono', 'center'),
            txt('[ ? ]', 450, yBox + 34, 34, ROLE.focus, 'mono', 'center'),
          );
        }

        // Bottom bounded-parser & freshness rules
        nodes.push(line([-860, 146], [840, 146], { stroke: '#233152', width: 2 }));
        nodes.push(
          dotItem(
            -840,
            212,
            'REJECTS declarations, attributes, nested tags, oversize input',
            ROLE.model,
          ),
          dotItem(
            -840,
            272,
            'CHECKS deploy, int rev, 10% share, bool smoke, finite p95 >= 0',
            ROLE.tool,
            {
              opacity: 0.4 + 0.6 * rc,
            },
          ),
          dotItem(
            -840,
            332,
            'WHOLE-SECOND AGE IN [0..30]: future, stale, or wrong rev blocks advice',
            ROLE.focus,
            { opacity: 0.35 + 0.65 * ag },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
