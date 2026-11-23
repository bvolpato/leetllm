import { admissionDisplay } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawActionBoundary(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0;
  const progress2 = state.beatP ?? 0;
  const q = phase(progress2, 0.04, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1, radius = 8) =>
    api.teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      width: 3,
      progress,
      gap: 28,
      margin: 4,
      particle: {
        radius,
        fill: color,
      },
    });
  {
    const admission = admissionDisplay(beat, progress2);
    if (beat === 2) {
      const malformed = api.focus.target('action-boundary-malformed', () =>
        card(ctx, api, 'Lookup · run ID missing', 130, 350, 430, themeColors.yellow, 120, 29),
      );
      const repaired = api.focus.target('action-boundary-repaired', () =>
        card(
          ctx,
          api,
          admission.repair === 1 ? 'Lookup · RUN-842' : 'One bounded repair',
          740,
          350,
          430,
          themeColors.cyan,
          120,
          29,
        ),
      );
      const checked = api.focus.target('action-boundary-checked', () =>
        card(
          ctx,
          api,
          admission.recheck === 1 ? 'Read admitted after checks' : 'Admission checks again',
          1350,
          350,
          430,
          admission.recheck === 1 ? themeColors.green : themeColors.muted,
          120,
          28,
        ),
      );
      route(malformed, repaired, themeColors.yellow, admission.repair);
      if (admission.repair === 1) route(repaired, checked, themeColors.green, admission.recheck);
      const unauthorized = api.focus.target('action-boundary-unauthorized', () =>
        card(ctx, api, 'Rollback · no approval', 130, 650, 430, themeColors.pink, 120, 29),
      );
      const denied = api.focus.target('action-boundary-denied', () =>
        card(ctx, api, 'Permission failure', 740, 650, 430, themeColors.pink, 120, 29),
      );
      const stopped = api.focus.target('action-boundary-stopped', () =>
        card(ctx, api, 'Path ends · no dispatch', 1350, 650, 430, themeColors.pink, 120, 29),
      );
      route(unauthorized, denied, themeColors.pink, 1);
      route(denied, stopped, themeColors.pink, 1);
      api.focus.target('action-boundary-a-repaired-shape-returns-to-admission-missing-au', () =>
        text(
          ctx,
          api,
          'A repaired shape returns to admission; missing authority keeps the path closed',
          960,
          860,
          30,
          themeColors.ink,
          'center',
        ),
      );
      return;
    }
    const request = api.focus.target('action-boundary-request', () =>
      card(ctx, api, 'User task: check status', 120, 490, 420, themeColors.blue, 118),
    );
    const read = api.focus.target('action-boundary-read', () =>
      card(ctx, api, 'Proposal: lookup run', 650, 330, 350, themeColors.cyan, 108),
    );
    const write = api.focus.target('action-boundary-write', () =>
      card(
        ctx,
        api,
        'Proposal: rollback',
        650,
        650,
        350,
        beat === 0 ? themeColors.muted : themeColors.pink,
        108,
      ),
    );
    const gate = api.focus.target('action-boundary-gate', () =>
      card(ctx, api, 'Status-only authority', 1090, 490, 360, themeColors.yellow, 118),
    );
    const allow = api.focus.target('action-boundary-allow', () =>
      card(
        ctx,
        api,
        admission.readResult === 1 ? 'Read admitted' : 'Read pending',
        1490,
        300,
        330,
        admission.readResult === 1 ? themeColors.green : themeColors.muted,
        100,
        28,
      ),
    );
    const deny = api.focus.target('action-boundary-deny', () =>
      card(
        ctx,
        api,
        admission.writeResult === 1 ? 'Write stopped' : 'Write pending',
        1490,
        660,
        330,
        admission.writeResult === 1 ? themeColors.pink : themeColors.muted,
        100,
        28,
      ),
    );
    route(request, read, themeColors.cyan, admission.readProposal);
    if (admission.readProposal === 1) route(read, gate, themeColors.green, admission.readCheck);
    if (admission.readCheck === 1) route(gate, allow, themeColors.green, admission.readResult);
    if (admission.writeProposal > 0)
      route(request, write, themeColors.pink, admission.writeProposal);
    if (admission.writeProposal === 1) route(write, gate, themeColors.pink, admission.writeCheck);
    if (admission.writeCheck === 1) route(gate, deny, themeColors.pink, admission.writeResult);
    api.focus.target('action-boundary-readout', () =>
      text(
        ctx,
        api,
        beat === 0
          ? 'A status lookup fits the requested task'
          : 'A rollback requires separate approval',
        960,
        840,
        37,
        beat === 0 ? themeColors.green : themeColors.pink,
        'center',
      ),
    );
  }
}
export default {
  id: 'action-boundary',
  draw: drawActionBoundary,
  cues: [
    'proposed-read',
    'read-authority',
    'rollback-proposal',
    'separate-approval',
    'bounded-repair',
    'readmit-repaired',
    'permission-failure',
  ],
};
