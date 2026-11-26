import { group, line } from 'vizmatic/stage';
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

export function buildApiControls(s, c) {
  s.add(aura(-460, -40, 560, ROLE.model, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.tool, COSMOS.bg));

  s.add(
    cinemaHeader(
      'PER-CALL VS APP STATE',
      'A reasoning setting is not',
      'the shared request budget',
      {
        x: -860,
        y: -445,
        accent: ROLE.model,
        size: 46,
      },
    ),
  );

  const appOn = s.value(0);
  const capOn = s.value(0);
  c.on('ra-api-controls-0-2', () =>
    s.play(appOn.to(1, { duration: clampDur(c, c.cue('ra-api-controls-0-2').start, 0.5) })),
  );
  c.on('ra-api-controls-1-1', () =>
    s.play(capOn.to(1, { duration: clampDur(c, c.cue('ra-api-controls-1-1').start, 0.55) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const ap = appOn.value;
        const cp = capOn.value;
        const nodes = [];

        // Left column: Per-Call Model Knobs
        nodes.push(txt('PER-CALL MODEL CONTROLS', -840, -210, 28, ROLE.model, 'mono', 'left'));
        const leftItems = [
          { y: -130, t: 'EFFORT: how much one call deliberates', c: ROLE.model },
          { y: -62, t: 'MODE: standard vs pro execution', c: ROLE.agent },
          { y: 6, t: 'CONTEXT: compatible reasoning items', c: ROLE.focus },
          { y: 74, t: 'MODEL SUPPORT: GPT-6 Astra rejects none', c: ROLE.warn },
        ];
        leftItems.forEach((it) => nodes.push(dotItem(-825, it.y, it.t, it.c)));

        // Center divider
        nodes.push(line([20, -225], [20, 128], { stroke: '#233152', width: 2 }));

        // Right column: Application Controller State
        const rAlpha = 0.35 + 0.65 * ap;
        nodes.push(
          txt('APPLICATION CONTROLLER STATE', 70, -210, 28, ROLE.ok, 'mono', 'left').opacity(
            rAlpha,
          ),
        );
        const rightItems = [
          { y: -130, t: 'AUTHENTICATED TOOL RECEIPTS', c: ROLE.ok },
          { y: -62, t: 'SEARCH & ROUTING DECISIONS', c: ROLE.agent },
          { y: 6, t: 'WHOLE-REQUEST TOKEN BUDGET', c: ROLE.focus },
          { y: 74, t: 'ACTIVE CALL RESERVATIONS', c: ROLE.tool },
        ];
        rightItems.forEach((it) => nodes.push(dotItem(85, it.y, it.t, it.c, { opacity: rAlpha })));

        // Bottom: Why 1-call max_output_tokens != request budget
        nodes.push(line([-860, 178], [840, 178], { stroke: '#233152', width: 2 }));
        const cAlpha = 0.3 + 0.7 * cp;
        nodes.push(
          txt(
            'ONE CALL OUTPUT CAP = HIDDEN REASONING + VISIBLE OUTPUT + FORMATTING',
            0,
            242,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(cAlpha),
          metricReadout('3 SEQUENTIAL CALLS', '3x CAP POSSIBLE', -420, 368, {
            color: ROLE.warn,
            size: 40,
            sub: 'single-call cap cannot bound request',
          }).opacity(cAlpha),
          metricReadout('CONTROLLER LEDGER', '1 SHARED CAP', 420, 368, {
            color: ROLE.ok,
            size: 40,
            sub: 'owns receipts + reservations',
          }).opacity(cAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
