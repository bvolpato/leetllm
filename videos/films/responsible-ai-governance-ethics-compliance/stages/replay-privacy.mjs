import { originalEvents } from '../fixtures.mjs';
import { cueProgress, governancePermission } from '../construction.mjs';
import { actorLabel, chain } from '../model.mjs';
import {
  drawGovernanceConstructionBox,
  drawGovernanceConstructionFlight,
  drawGovernanceConstructionRows,
  drawGovernanceConstructionText,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress2 = (id) => cueProgress(state, id),
    resultComplete = (id) => governancePermission(state, id);
  return api.focus.target('replay-privacy-mechanism', () => {
    {
      if (currentBeat === 0) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'C17 / original held decision / traffic effects 0',
          250,
          290,
          1420,
          themeColors.blue,
        );
        drawGovernanceConstructionRows(
          ctx,
          api,
          [
            'Event + time + actor',
            'Exact proposal + versions',
            'Source trust + gate reason',
            'Reviewer + appeal + effect',
          ],
          220,
          535,
          themeColors.ink,
          82,
          32,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('redacted-reference')
            ? 'Controlled reference / redacted excerpt'
            : 'Select evidence needed for this role',
          1040,
          510,
          720,
          themeColors.cyan,
          120,
        );
        drawGovernanceConstructionFlight(
          ctx,
          api,
          [850, 575],
          [1010, 575],
          cueProgress2('redacted-reference'),
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          resultComplete('private-fields')
            ? 'Credentials / private prompts / hidden reasoning: excluded by default'
            : 'Default log field review',
          1010,
          760,
          780,
          resultComplete('private-fields') ? themeColors.pink : themeColors.muted,
          120,
        );
      } else if (currentBeat === 1) {
        const actor = 'USER-918204';
        const label = actorLabel(actor);
        const matched = resultComplete('actor-linkable');
        const { C, text, line } = api;
        text(ctx, 'Request ID', 185, 315, 48, C.ink, 'left', 'serif');
        line(ctx, 185, 356, 1725, 356, C.muted, 2);
        for (const [index, sequence] of ['001', '002'].entries()) {
          const y = 475 + index * 154;
          text(ctx, 'promotion/', 185, y, 44, C.muted, 'left', 'mono');
          text(ctx, label, 525, y, 44, matched ? C.yellow : C.ink, 'left', 'mono');
          text(ctx, '/' + sequence, 1430, y, 44, C.ink, 'left', 'mono');
          if (matched) line(ctx, 525, y + 20, 1315, y + 20, C.yellow, 4);
        }
        if (resultComplete('pseudonym-value')) {
          text(ctx, 'Same user + same key', 185, 795, 38, C.muted);
          text(ctx, '24 hexadecimal digits = 96 bits', 775, 795, 38, C.yellow);
        }
        if (resultComplete('key-scope')) {
          text(ctx, 'Same user + different key', 185, 915, 38, C.muted);
          text(
            ctx,
            actorLabel(actor, 'different-public-demo-scope'),
            775,
            915,
            38,
            C.cyan,
            'left',
            'mono',
          );
        }
      } else if (currentBeat === 2) {
        const old = chain(originalEvents),
          changed = chain(
            originalEvents.map((v, i) =>
              i === 1
                ? {
                    ...v,
                    value: 'Approved',
                  }
                : v,
            ),
          );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Writer authority / mutable chain',
          140,
          320,
          760,
          themeColors.blue,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Independent protected authority',
          1030,
          320,
          750,
          themeColors.yellow,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Recomputed head / ' + changed.at(-1).hash.slice(0, 16),
          140,
          570,
          760,
          themeColors.pink,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Original head / ' + old.at(-1).hash.slice(0, 16),
          1030,
          570,
          750,
          themeColors.yellow,
        );
        api.line(ctx, 965, 300, 965, 740, themeColors.muted, 3);
        drawGovernanceConstructionText(
          ctx,
          api,
          'Internal chain valid / independent head differs',
          960,
          800,
          34,
          themeColors.pink,
          'center',
        );
        if (resultComplete('mutable-anchor'))
          drawGovernanceConstructionText(
            ctx,
            api,
            'If both are writable, a matching rewrite has no independent guarantee',
            960,
            925,
            30,
            themeColors.yellow,
            'center',
          );
      } else {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Dataset fixture / separate purpose',
          150,
          330,
          740,
          themeColors.blue,
        );
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Covered deployer logs / Article 26(6)',
          1030,
          330,
          750,
          themeColors.green,
        );
        api.line(ctx, 230, 610, 800, 610, themeColors.blue, 4);
        api.line(ctx, 1110, 610, 1690, 610, themeColors.green, 4);
        if (resultComplete('dataset-retention'))
          drawGovernanceConstructionBox(
            ctx,
            api,
            '90-day record rule',
            230,
            710,
            580,
            themeColors.blue,
          );
        if (resultComplete('deployer-retention'))
          drawGovernanceConstructionBox(
            ctx,
            api,
            'Appropriate period ≥ 6 months / unless law provides otherwise',
            1070,
            710,
            680,
            themeColors.green,
            140,
          );
      }
    }
    return true;
  });
}

export function drawReplayPrivacy(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'replay-privacy',
  draw: drawReplayPrivacy,
  cues: [
    'gov-replay-privacy-b1',
    'gov-redacted-reference',
    'gov-private-fields',
    'gov-replay-privacy-b2',
    'gov-actor-linkable',
    'gov-key-scope',
    'gov-pseudonym-value',
    'gov-replay-privacy-b3',
    'gov-anchor-authority',
    'gov-mutable-anchor',
    'gov-replay-privacy-b4',
    'gov-dataset-retention',
    'gov-deployer-retention',
  ],
};
