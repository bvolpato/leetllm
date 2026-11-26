// Scene 17: export-job: "Two answers for job 612"
// Trusted record (queued, job 612, automatic deletion off) vs Cedar (PPL 7.6) and Pine (PPL 8.1).
// STRICT WITHHOLDING: Keep Cedar & Pine answers in neutral colors during Beat 0; reveal Cedar's
// 1-of-3 result ONLY AFTER fresh-cedar and Pine's 3-of-3 pass ONLY AFTER fresh-pass!
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  FRESH_ANSWERS,
  FRESH_CONTRACT,
  ROLE,
  answerChecks,
  cinemaAtmosphere,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function exportJob(s, c) {
  const title = heroTitle(['Two answers for', 'export job 612'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.good,
  });

  const showReq = s.value(0);
  const showCedar = s.value(0);
  const showPine = s.value(0);
  const checkCedar = s.value(0); // AFTER fresh-cedar
  const checkPine = s.value(0); // AFTER fresh-pass

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const sr = showReq.value;
    const sc = showCedar.value;
    const sp = showPine.value;
    const cc = checkCedar.value;
    const cp = checkPine.value;

    const fieldKeys = ['status', 'source', 'automatic'];
    const fieldNames = ['Status', 'Source ID', 'Auto deletion'];
    const rowYs = [-75, 65, 205];
    const fmtField = (key, val) =>
      key === 'automatic' ? (val ? 'ON' : 'OFF') : String(val).replaceAll('_', ' ');

    const colField = -785;
    const colReq = -275;
    const colCedar = 175;
    const colPine = 620;

    // Column headers
    nodes.push(
      txt('Field', colField, -205, 32, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Trusted record', colReq, -205, 32, ROLE.observed, 'mono', 'center')
        .glow(sr > 0.3 ? 6 : 2, ROLE.observed)
        .opacity((0.45 + 0.55 * sr) * alpha),
      txt(
        'Cedar',
        colCedar,
        -215,
        38,
        cc > 0.5 ? ROLE.warn : COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
      txt('PPL 7.6', colCedar, -165, 26, COSMOS.muted, 'mono', 'center').opacity(
        (0.3 + 0.7 * sc) * alpha,
      ),
      txt('Pine', colPine, -215, 38, cp > 0.5 ? ROLE.good : COSMOS.ink, 'serif', 'center')
        .glow(cp > 0.5 ? 9 : 0, ROLE.good)
        .opacity(alpha),
      txt('PPL 8.1', colPine, -165, 26, COSMOS.muted, 'mono', 'center').opacity(
        (0.3 + 0.7 * sp) * alpha,
      ),
      glowingTrail(
        [
          [-810, -132],
          [810, -132],
        ],
        { color: '#334673', width: 2, glow: 4, core: false, opacity: 0.7 * alpha },
      ),
    );

    // Horizontal spec rows
    fieldKeys.forEach((key, j) => {
      const ry = rowYs[j];
      nodes.push(
        txt(fieldNames[j], colField, ry, 32, COSMOS.muted, 'sans', 'left').opacity(alpha),
        lumBar(colReq, ry, 280, 72, {
          color: ROLE.observed,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 6,
          radius: 10,
          opacity: (0.45 + 0.55 * sr) * alpha,
        }),
        txt(
          fmtField(key, FRESH_CONTRACT[key]),
          colReq,
          ry,
          32,
          ROLE.observed,
          'mono',
          'center',
        ).opacity((0.45 + 0.55 * sr) * alpha),
      );
    });

    // Cedar & Pine answers with strictly gated verdict colors
    const ansCols = [colCedar, colPine];
    const dealVals = [sc, sp];
    const checkedVals = [cc, cp];

    FRESH_ANSWERS.forEach((ans, idx) => {
      const cx = ansCols[idx];
      const dealt = dealVals[idx];
      const isChecked = checkedVals[idx] > 0.5;
      const passes = answerChecks(ans, FRESH_CONTRACT);

      fieldKeys.forEach((key, j) => {
        if (dealt < 0.1) return;
        const ry = rowYs[j];
        const pass = passes[j];
        const col = isChecked ? (pass ? ROLE.good : ROLE.warn) : ROLE.context;

        nodes.push(
          lumBar(cx, ry, 290, 72, {
            color: col,
            fillOpacity: isChecked ? 0.3 : 0.15,
            strokeWidth: isChecked ? 2.8 : 2,
            glow: isChecked ? 10 : 4,
            radius: 10,
            opacity: dealt * alpha,
          }),
          txt(
            fmtField(key, ans[key]),
            cx,
            ry,
            32,
            isChecked ? col : COSMOS.ink,
            'mono',
            'center',
          ).opacity(dealt * alpha),
        );
        if (isChecked) {
          nodes.push(
            glowDot(cx + 124, ry, {
              radius: 7,
              color: col,
              glow: 11,
              opacity: checkedVals[idx] * alpha,
            }),
          );
        }
      });
    });

    // Bottom verdict strip
    nodes.push(
      glowingTrail(
        [
          [-810, 285],
          [810, 285],
        ],
        { color: '#334673', width: 2, glow: 4, core: false, opacity: 0.7 * alpha },
      ),
    );

    if (cc > 0.5) {
      nodes.push(
        txt('1 of 3 pass', colCedar, 355, 36, ROLE.warn, 'mono', 'center')
          .glow(8, ROLE.warn)
          .opacity(cc * alpha),
      );
    }
    if (cp > 0.5) {
      nodes.push(
        txt('3 of 3 pass (qualified)', colPine, 355, 34, ROLE.good, 'mono', 'center')
          .glow(9, ROLE.good)
          .opacity(cp * alpha),
      );
    }
    if (cc < 0.3 && sp > 0.5) {
      nodes.push(
        txt('Which answer clears all three checks?', 0, 355, 38, ROLE.observed, 'serif', 'center')
          .glow(8, ROLE.observed)
          .opacity(sp * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.good, ROLE.observed), title, mainLayer);

  // Beat 0: show contract -> Cedar fields -> Pine fields (NO verdicts!)
  playCue(s, c, 'fresh-job-contract', (d) => s.play(showReq.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'cedar-fields', (d) => s.play(showCedar.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'pine-fields', (d) => s.play(showPine.to(1, { duration: d })), { dur: 0.65 });

  // Beat 1: reveal Cedar 1/3 AFTER fresh-cedar, Pine 3/3 AFTER fresh-pass!
  playCue(s, c, 'fresh-cedar', (d) => s.play(checkCedar.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'fresh-pass', (d) => s.play(checkPine.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
