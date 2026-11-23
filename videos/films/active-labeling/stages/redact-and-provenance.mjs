import { rawText } from '../fixtures.mjs';
import { phase, sampleModel } from '../construction.mjs';
import { redact } from '../model.mjs';
import {
  card,
  cueVisible,
  detailFooter,
  detailHeading,
  detailRow,
  detailTarget,
  detailText,
  text,
} from '../defaults.mjs';
export function drawRedactAndProvenance(ctx, scene, state, api) {
  if (drawPlaceholderScope(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    beat = state.beat,
    progress = state.beatP,
    q = phase(progress),
    modelState = sampleModel('redact-and-provenance', state);
  const route = (source, target, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: source,
        opacity: 1,
      },
      target: {
        shape: target,
        opacity: 1,
      },
      color,
      progress: q,
      gap: 22,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 4,
    });
  {
    if (state.cues?.['redact-copy']) {
      modelState.redacted = api.focus.visible('redact-copy');
      modelState.text = modelState.redacted ? redact(rawText) : rawText;
    }
    const source = api.focus.target('raw-trace', () =>
      card(
        ctx,
        api,
        modelState.redacted
          ? 'Restricted raw trace\nIdentifier retained separately'
          : `Raw trace\n${modelState.text}`,
        145,
        350,
        560,
        themeColors.pink,
        160,
        28,
      ),
    );
    const clean = api.focus.target('clean-copy', () =>
      card(
        ctx,
        api,
        modelState.redacted
          ? `Reviewer copy\n${modelState.text}`
          : 'Reviewer copy\nwaiting for redaction',
        1130,
        350,
        620,
        modelState.redacted ? themeColors.green : themeColors.muted,
        160,
        29,
      ),
    );
    if (modelState.redacted) route(source, clean, themeColors.green);
    Object.entries(modelState.provenance).forEach(([key, value], i) =>
      api.focus.target('source-lineage', () =>
        card(
          ctx,
          api,
          `${key}: ${value}`,
          150 + (i % 3) * 580,
          650 + Math.floor(i / 3) * 120,
          530,
          themeColors.blue,
          80,
          27,
        ),
      ),
    );
    text(
      ctx,
      api,
      'Prompt and policy versions remain beside redactor and rubric versions.',
      960,
      970,
      28,
      themeColors.ink,
      'center',
    );
  }
}
function drawPlaceholderScope(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (!(currentBeat === 2)) return false;
  const { C: themeColors } = api;
  {
    detailHeading(ctx, api, 'Preserve relationships without creating a global identifier');
    const scoped = cueVisible(ctx, api, 'placeholder-scope'),
      limited = cueVisible(ctx, api, 'redaction-limit');
    detailText(ctx, api, 'Trace A', 440, 350, 31, themeColors.blue, 'center');
    detailText(
      ctx,
      api,
      'Trace B · independent mapping',
      1390,
      350,
      31,
      themeColors.cyan,
      'center',
    );
    ['Customer [PERSON 1] asks', 'Reply addresses [PERSON 1]'].forEach((s, i) =>
      detailTarget(ctx, api, 'placeholder-scope', () =>
        detailRow(
          ctx,
          api,
          scoped ? s : 'Customer identity',
          150,
          415 + i * 115,
          620,
          themeColors.blue,
        ),
      ),
    );
    detailTarget(ctx, api, 'placeholder-scope', () => {
      detailRow(
        ctx,
        api,
        scoped ? 'Different customer → [PERSON 1]' : 'Reset numbering per trace',
        1070,
        415,
        700,
        themeColors.cyan,
      );
    });
    detailRow(
      ctx,
      api,
      'Authorized facts retained: role / governing policy / approval evidence',
      150,
      735,
      1620,
      themeColors.green,
    );
    detailTarget(ctx, api, 'redaction-limit', () => {
      if (limited) {
        detailText(
          ctx,
          api,
          '“The only on-call database admin in our Lisbon office”',
          960,
          875,
          34,
          themeColors.pink,
          'center',
        );
        detailText(
          ctx,
          api,
          'Identifying description · no email pattern required',
          960,
          940,
          29,
          themeColors.pink,
          'center',
        );
      }
    });
    detailFooter(
      ctx,
      api,
      'Reserved placeholder collisions reject; reversible maps stay separately restricted.',
    );
  }
  return true;
}
export default {
  id: 'redact-and-provenance',
  draw: drawRedactAndProvenance,
  cues: ['raw-permission', 'redact-copy', 'retain-lineage', 'placeholder-scope', 'redaction-limit'],
};
