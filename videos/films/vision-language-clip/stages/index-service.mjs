import { IMAGE_REQUEST } from '../fixtures.mjs';
import { activateImageGeneration, cachedImageAllowed, imageLedgerSnapshot } from '../protocols.mjs';
import {
  drawInspectionBox,
  drawInspectionEquation,
  drawInspectionLine,
  drawInspectionRectangle,
  drawInspectionText,
  inspectionCueProgress,
  inspectionCueVisible,
  rackPhoto,
} from '../defaults.mjs';
export function drawIndexService(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('index-contract', () => {
    if (currentBeat === 0) {
      const q = inspectionCueProgress(ctx, api, 'index-bytes');
      drawInspectionText(
        ctx,
        api,
        '10 million images · 768 coordinates · 2 bytes/value',
        960,
        285,
        37,
        themeColors.ink,
      );
      for (let i = 0; i < 24; i++)
        drawInspectionRectangle(
          ctx,
          api,
          260 + (i % 12) * 115,
          430 + Math.floor(i / 12) * 100,
          85,
          65,
          i < 24 * q ? themeColors.cyan : themeColors.panel,
          themeColors.muted,
        );
      if (inspectionCueVisible(ctx, api, 'index-bytes'))
        drawInspectionEquation(
          ctx,
          api,
          String.raw`10^7\times768\times2=15.36\,GB`,
          960,
          800,
          49,
          themeColors.cyan,
        );
      if (inspectionCueVisible(ctx, api, 'index-factor'))
        drawInspectionText(
          ctx,
          api,
          'Assumed total 2–4× → 30.72–61.44 GB / generation',
          960,
          940,
          34,
          themeColors.yellow,
        );
      drawInspectionText(
        ctx,
        api,
        'Actual graph, filters, IDs, replicas and generation overlap need measurement',
        960,
        1030,
        27,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const snapshot = imageLedgerSnapshot(
        inspectionCueVisible(ctx, api, 'index-replay')
          ? 2
          : inspectionCueVisible(ctx, api, 'index-ledger-insert')
            ? 1
            : 0,
      );
      rackPhoto(ctx, api, 180, 330, 500, 390);
      drawInspectionBox(ctx, api, 'Ops/image17@v1 · East', 180, 760, 500, 100, themeColors.cyan);
      drawInspectionBox(ctx, api, 'Authenticated tenant: Ops', 890, 310, 810, 90, themeColors.cyan);
      drawInspectionBox(
        ctx,
        api,
        'Scoped key: Ops / ingest-17',
        890,
        430,
        810,
        90,
        themeColors.yellow,
      );
      drawInspectionBox(
        ctx,
        api,
        'F1 binds bytes + image ID + site + metadata v1',
        890,
        550,
        810,
        100,
        themeColors.cyan,
      );
      if (inspectionCueVisible(ctx, api, 'index-ledger-insert'))
        drawInspectionBox(
          ctx,
          api,
          'Accepted operation → receipt R17',
          890,
          700,
          810,
          100,
          themeColors.green,
        );
      if (inspectionCueVisible(ctx, api, 'index-replay')) {
        drawInspectionBox(
          ctx,
          api,
          'Same key + F1 → replay R17',
          890,
          850,
          810,
          100,
          themeColors.green,
        );
        drawInspectionText(
          ctx,
          api,
          'Accepted image rows: ' +
            snapshot.count +
            ' · ' +
            snapshot.result.status +
            ' saved receipt',
          960,
          1030,
          31,
          themeColors.green,
        );
      } else
        drawInspectionText(
          ctx,
          api,
          'Validated supplied request · a content hash grants no site authority',
          960,
          1030,
          29,
          themeColors.muted,
        );
    } else if (currentBeat === 2) {
      const conflict = inspectionCueVisible(ctx, api, 'index-conflict'),
        reject = inspectionCueVisible(ctx, api, 'index-reject-conflict'),
        stage = inspectionCueVisible(ctx, api, 'index-stage'),
        old = inspectionCueVisible(ctx, api, 'index-keep-old'),
        commit = inspectionCueVisible(ctx, api, 'index-commit-generation'),
        snapshot = imageLedgerSnapshot(conflict ? 3 : 2),
        active = activateImageGeneration('G12', 'G13', {
          preprocess: stage,
          pairedEncoders: stage,
          normalization: stage,
          index: commit,
        });
      drawInspectionBox(
        ctx,
        api,
        'Retained ledger\nOps / ingest-17 / F1 / R17',
        180,
        290,
        730,
        125,
        themeColors.green,
      );
      drawInspectionBox(
        ctx,
        api,
        conflict ? 'Same key · metadata v2 → F2' : 'Same key · original metadata v1',
        1040,
        290,
        700,
        125,
        conflict ? themeColors.pink : themeColors.cyan,
      );
      if (reject)
        drawInspectionText(
          ctx,
          api,
          snapshot.result.status.toUpperCase() +
            ' · ' +
            snapshot.count +
            ' accepted ledger row unchanged',
          960,
          475,
          35,
          themeColors.pink,
        );
      drawInspectionText(ctx, api, 'ACTIVE', commit ? 1380 : 530, 525, 27, themeColors.green);
      const fields = ['preprocessing', 'paired encoders', 'normalization', 'image index'];
      for (let g = 0; g < 2; g++) {
        const x = 270 + g * 850;
        drawInspectionText(
          ctx,
          api,
          g ? 'Staged G13' : 'Complete G12',
          x + 260,
          570,
          33,
          g ? themeColors.cyan : themeColors.green,
        );
        fields.forEach((s, i) => {
          const ready = !g || commit || (stage && i < 3);
          drawInspectionBox(
            ctx,
            api,
            s + (g && !ready ? ' · incomplete' : ''),
            x,
            620 + i * 80,
            520,
            65,
            ready ? (g ? themeColors.cyan : themeColors.green) : themeColors.pink,
          );
        });
      }
      if (old && !commit)
        drawInspectionText(
          ctx,
          api,
          'Active: ' + active + ' · replacement incomplete',
          960,
          1015,
          33,
          themeColors.yellow,
        );
      if (commit)
        drawInspectionText(
          ctx,
          api,
          'Atomic whole-tuple switch → active ' + active + ' · G12 retained',
          960,
          1015,
          33,
          themeColors.green,
        );
    } else {
      const revoked = inspectionCueVisible(ctx, api, 'index-revoke'),
        permitted = cachedImageAllowed(
          {
            tenant: 'Ops',
            sites: revoked ? [] : ['East'],
          },
          IMAGE_REQUEST,
        ),
        denied = inspectionCueVisible(ctx, api, 'index-cache-deny') && !permitted;
      drawInspectionBox(
        ctx,
        api,
        'Active G13 · complete paired generation',
        220,
        290,
        1480,
        100,
        themeColors.green,
      );
      drawInspectionBox(
        ctx,
        api,
        'Cached result\nOps/image17@v1 · East · receipt R17',
        220,
        455,
        670,
        160,
        themeColors.cyan,
      );
      drawInspectionBox(
        ctx,
        api,
        'Current authenticated permission\nOps · sites: ' + (revoked ? 'none' : 'East'),
        1040,
        455,
        670,
        160,
        revoked ? themeColors.pink : themeColors.green,
      );
      drawInspectionLine(
        ctx,
        api,
        900,
        535,
        1030,
        535,
        denied ? themeColors.pink : themeColors.line,
        4,
      );
      if (denied)
        drawInspectionText(
          ctx,
          api,
          'DENY CACHED READ · old receipt and image hash do not restore access',
          960,
          755,
          34,
          themeColors.pink,
        );
      drawInspectionText(
        ctx,
        api,
        'Lifecycle owners: source / crops / OCR / index / cache',
        960,
        920,
        30,
        themeColors.muted,
      );
      drawInspectionText(
        ctx,
        api,
        'Ingestion replay, generation commit and current read authority have separate checks',
        960,
        1020,
        29,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'index-service',
  draw: drawIndexService,
  cues: [
    'index-bytes',
    'index-factor',
    'index-admission',
    'index-ledger-insert',
    'index-fingerprint',
    'index-replay',
    'index-conflict',
    'index-reject-conflict',
    'index-stage',
    'index-keep-old',
    'index-commit-generation',
    'index-generation',
    'index-cache-hit',
    'index-revoke',
    'index-cache-deny',
  ],
};
