import { recoveryDisplay } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawResumeWithEvidence(ctx, scene, state, api) {
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
    const recovered = recoveryDisplay(beat, q, state.cues),
      observation = recovered.observation,
      claim = recovered.claim;
    const checkpoint = api.focus.target('resume-with-evidence-checkpoint', () =>
      card(
        ctx,
        api,
        'Workflow checkpoint\nwaiting on rb-842-1',
        150,
        430,
        470,
        themeColors.blue,
        150,
        30,
      ),
    );
    const ledger = api.focus.target('resume-with-evidence-ledger', () =>
      card(
        ctx,
        api,
        'Operation ledger\nrb-842-1 → job-1',
        720,
        350,
        470,
        themeColors.yellow,
        150,
        30,
      ),
    );
    const status = api.focus.target('resume-with-evidence-status', () =>
      card(
        ctx,
        api,
        observation
          ? `Controller · ${observation.jobId} · ${observation.state}\nkey ${observation.operationKey}\nobserved at ${observation.observedAt}`
          : 'Status probe pending',
        720,
        650,
        470,
        observation ? themeColors.green : themeColors.muted,
        150,
        observation ? 25 : 30,
      ),
    );
    const report = api.focus.target('resume-with-evidence-report', () =>
      card(
        ctx,
        api,
        claim ? claim.text : 'Claim pending evidence',
        1300,
        490,
        470,
        claim ? themeColors.green : themeColors.muted,
        128,
        claim ? 25 : 30,
      ),
    );
    if (claim)
      api.focus.target('resume-with-evidence-report', () =>
        text(
          ctx,
          api,
          `${claim.age}s ago · observed at ${claim.observedAt} · now 1000`,
          1535,
          710,
          25,
          themeColors.green,
          'center',
        ),
      );
    if (observation)
      text(
        ctx,
        api,
        'Toy controller clock · integer seconds',
        960,
        925,
        26,
        themeColors.muted,
        'center',
      );
    route(checkpoint, ledger, themeColors.yellow, q);
    route(
      ledger,
      status,
      themeColors.cyan,
      beat === 1 ? api.focus.progress('current-status', q) : beat > 1 ? 1 : 0,
      beat >= 1 ? 1 : 0,
    );
    route(
      status,
      report,
      themeColors.green,
      beat === 1 ? api.focus.progress('bounded-claim', 0) : beat > 1 ? 1 : 0,
      claim ? 1 : 0,
    );
    api.focus.target('resume-with-evidence-deployment-completion-remains-unobserved', () =>
      text(
        ctx,
        api,
        'Deployment completion remains unobserved',
        960,
        840,
        34,
        themeColors.pink,
        'center',
      ),
    );
  }
}
export default {
  id: 'resume-with-evidence',
  draw: drawResumeWithEvidence,
  cues: [
    'saved-checkpoint',
    'pending-identity',
    'reconcile-controller',
    'current-status',
    'bounded-claim',
    'recovery-identity',
    'evidence-claim',
  ],
};
