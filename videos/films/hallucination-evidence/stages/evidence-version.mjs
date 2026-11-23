import { EVIDENCE } from '../fixtures.mjs';
import {
  drawEstablishedEvidenceCard,
  drawEstablishedEvidenceRouteLine,
  drawEstablishedEvidenceText,
} from '../defaults.mjs';
import { preserveRejectedUpgradePrelude } from '../compatibility.mjs';
export function drawEvidenceVersion(ctx, scene, state, api) {
  preserveRejectedUpgradePrelude(state, api);
  const { C: themeColors, components: components, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1);
  const q = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(beatProgress, 0.04, 0.94);
  {
    const source = api.focus.target('source-identity', () =>
      drawEstablishedEvidenceCard(
        ctx,
        api,
        themeColors,
        components,
        EVIDENCE.sourceId,
        250,
        365,
        620,
        themeColors.blue,
        98,
      ),
    );
    const version = api.focus.target('source-version', () =>
      drawEstablishedEvidenceCard(
        ctx,
        api,
        themeColors,
        components,
        EVIDENCE.version,
        250,
        505,
        620,
        themeColors.cyan,
        98,
      ),
    );
    const etaLookup = currentBeat === 1;
    const field = api.focus.target(etaLookup ? 'recovery-field-absent' : 'record-status', () =>
      drawEstablishedEvidenceCard(
        ctx,
        api,
        themeColors,
        components,
        etaLookup ? 'recovery ETA · ABSENT' : 'status = investigating',
        250,
        645,
        620,
        etaLookup ? themeColors.yellow : themeColors.green,
        98,
      ),
    );
    const claim = api.focus.target(etaLookup ? 'draft-eta-claim' : 'draft-status', () =>
      drawEstablishedEvidenceCard(
        ctx,
        api,
        themeColors,
        components,
        etaLookup ? 'Draft claim\nrecovery ETA = 14:30 UTC' : 'Draft claim\nstatus = resolved',
        1320,
        690,
        420,
        etaLookup ? themeColors.yellow : themeColors.red,
        132,
      ),
    );
    const gate = api.focus.target('field-check', () =>
      drawEstablishedEvidenceCard(
        ctx,
        api,
        themeColors,
        components,
        etaLookup ? 'Requested field\nrecovery ETA' : 'Identity + version\nthen compare field',
        1000,
        500,
        480,
        themeColors.yellow,
        136,
      ),
    );
    drawEstablishedEvidenceRouteLine(ctx, api, teaching, source, gate, themeColors.blue, q(0));
    drawEstablishedEvidenceRouteLine(ctx, api, teaching, version, gate, themeColors.cyan, q(1));
    drawEstablishedEvidenceRouteLine(
      ctx,
      api,
      teaching,
      field,
      gate,
      etaLookup ? themeColors.yellow : themeColors.green,
      q(1),
    );
    drawEstablishedEvidenceRouteLine(
      ctx,
      api,
      teaching,
      gate,
      claim,
      etaLookup ? themeColors.yellow : themeColors.red,
      q(2),
    );
    drawEstablishedEvidenceText(
      ctx,
      api,
      themeColors,
      'Snapshot time · May 27, 2026 at 10:00 UTC',
      960,
      940,
      28,
      themeColors.muted,
      'center',
    );
    drawEstablishedEvidenceText(
      ctx,
      api,
      themeColors,
      'Check freshness and authorization before admitting it.',
      960,
      980,
      26,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'evidence-version',
  draw: drawEvidenceVersion,
  cues: ['resolve-version', 'compare-field', 'citation-eta', 'fresh-snapshot'],
};
