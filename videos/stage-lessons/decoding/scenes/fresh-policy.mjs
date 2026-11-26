// Scene 33: fresh-policy: "Finish the canary update"
// Grand-finale dashboard uniting every decoding rule on the fresh 5-token status row
// [ready 0.48, waiting 0.26, paused 0.14, checking 0.08, unknown 0.04]:
//   - Top-p 0.80 -> paused (0.88), Exact top-k 2 -> 64.9% / 35.1%, Min-p 0.20 -> floor 0.096
//   - Temperature T = 0.5 -> ready 70.8%, restore T = 1.0
//   - Hard grammar mask forbids ready -> 52% legal mass -> top-p 0.80 crosses at checking (92.3%)
//   - Rollout log (10:42 rollout.phase = paused) verifies actual state AFTER dec-fresh-verified!
import { line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  FRESH_NAMES,
  FRESH_ROLLOUT,
  ROLE,
  cinemaAtmosphere,
  decodeSoftmax,
  decodingFreshModel,
  fmt,
  lumBar,
  pctTrim,
  playCue,
} from '../parts.mjs';

export default function freshPolicy(s, c) {
  const title = heroTitle(['Finish the', 'canary update'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const f = decodingFreshModel();

  const dealCount = s.value(1); // 1 -> 5
  const crossWord = s.value(0);
  const showP = s.value(0);
  const showK = s.value(0);
  const showMin = s.value(0);
  const tempVal = s.value(1.0); // 1.0 -> 0.5 -> 1.0
  const inCoolBeat = s.value(0);
  const maskedReady = s.value(0);
  const rescaleFrac = s.value(0);
  const maskResDone = s.value(0);
  const showRecord = s.value(0);
  const verifiedDone = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const count = Math.round(Math.max(1, Math.min(5, dealCount.value)));
    const cw = crossWord.value > 0.4;
    const sp = showP.value > 0.4;
    const sk = showK.value > 0.4;
    const sm = showMin.value > 0.4;
    const T = Math.max(0.48, Math.min(1.05, tempVal.value));
    const coolMode = inCoolBeat.value > 0.4;
    const masked = maskedReady.value > 0.4;
    const resc = rescaleFrac.value;
    const mRes = maskResDone.value > 0.4;
    const rec = showRecord.value > 0.4;
    const ver = verifiedDone.value > 0.4;

    const row = masked
      ? f.row.map((v, i) => (i === 0 ? 0 : v + (f.masked[i] - v) * resc))
      : decodeSoftmax(f.row.map(Math.log), T);

    // Top-right sentence status header
    nodes.push(
      txt(
        ver ? `The canary status is ${FRESH_ROLLOUT.phase}.` : 'The canary status is ___',
        845,
        -395,
        38,
        ver ? ROLE.valid : COSMOS.ink,
        'serif',
        'right',
      )
        .glow(ver ? 8 : 0, ROLE.valid)
        .opacity(alpha),
    );

    // Left panel: 5 aligned horizontal probability bars
    const barL = -620;
    const barMaxW = 540;
    nodes.push(
      txt(
        masked
          ? resc > 0.85
            ? 'Renormalized legal weights (÷ 0.52)'
            : 'Grammar forbids "ready"'
          : `Next-word distribution  (T = ${fmt(T, 2)})`,
        barL,
        -245,
        28,
        masked ? ROLE.heat : ROLE.active,
        'mono',
        'left',
      ).opacity(alpha),
    );

    for (let i = 0; i < count; i++) {
      const y = -140 + i * 108;
      const forbid = masked && i === 0;
      const isMaskedWinner = mRes && f.maskedP.ids.includes(i);
      const isCrossPaused = !masked && !coolMode && cw && i === 2;
      const col = isMaskedWinner
        ? ROLE.valid
        : forbid
          ? ROLE.pruned
          : isCrossPaused
            ? ROLE.winner
            : ROLE.base;
      const w = Math.max(8, row[i] * barMaxW);

      nodes.push(
        txt(FRESH_NAMES[i], barL - 26, y, 32, col, 'mono', 'right').opacity(alpha),
        lumBar(barL + barMaxW / 2, y, barMaxW, 44, {
          color: '#2b395e',
          fillOpacity: 0.14,
          strokeWidth: 1.5,
          glow: 2,
          radius: 7,
          opacity: alpha,
        }),
      );

      if (!forbid && row[i] > 0.001) {
        nodes.push(
          lumBar(barL + w / 2, y, w, 38, {
            color: col,
            fillOpacity: isMaskedWinner || isCrossPaused ? 0.56 : 0.4,
            strokeWidth: isMaskedWinner || isCrossPaused ? 2.8 : 2,
            glow: isMaskedWinner || isCrossPaused ? 11 : 7,
            radius: 6,
            opacity: alpha,
          }),
        );
      } else if (forbid) {
        nodes.push(
          line([barL + 10, y], [barL + 220, y], {
            stroke: ROLE.pruned,
            width: 3,
            dash: [7, 5],
          }).opacity(alpha),
        );
      }

      nodes.push(
        txt(
          forbid ? 'masked (-∞)' : pctTrim(row[i], 1),
          barL + barMaxW + 24,
          y,
          28,
          col,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    // Right panel: Context-sensitive live stage readout (never overlapping!)
    const rx = 205;
    if (rec) {
      nodes.push(
        txt('Deployment rollout log', rx, -200, 30, COSMOS.muted, 'mono', 'left').opacity(alpha),
        lumBar(rx + 315, -80, 630, 108, {
          color: ver ? ROLE.valid : ROLE.winner,
          fillOpacity: 0.22,
          strokeWidth: 2.8,
          glow: 11,
          radius: 14,
          opacity: alpha,
        }),
        txt(
          `${FRESH_ROLLOUT.time}   rollout.phase = "${FRESH_ROLLOUT.phase}"`,
          rx + 315,
          -80,
          30,
          ver ? ROLE.valid : ROLE.winner,
          'mono',
          'center',
        )
          .glow(7, ver ? ROLE.valid : ROLE.winner)
          .opacity(alpha),
        txt(
          ver ? 'Update: "paused" (verified by log)' : 'Which word belongs in the update?',
          rx,
          65,
          32,
          ver ? ROLE.valid : ROLE.winner,
          'serif',
          'left',
        )
          .glow(ver ? 7 : 0, ROLE.valid)
          .opacity(alpha),
        txt(
          'Waiting had the longest bar, but telemetry decides.',
          rx,
          145,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(alpha),
      );
    } else if (masked) {
      nodes.push(
        txt('Grammar excludes "ready"', rx, -200, 32, ROLE.pruned, 'mono', 'left').opacity(alpha),
        txt('Legal mass: 1 - 0.48 = 0.52', rx, -125, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      );
      if (resc > 0.65) {
        nodes.push(
          txt('waiting + paused = 76.9% < 80%', rx, -35, 28, ROLE.active, 'mono', 'left').opacity(
            alpha,
          ),
          txt(
            mRes ? '+ checking -> 92.3% >= 80%' : 'Which word reaches 80%?',
            rx,
            45,
            32,
            mRes ? ROLE.valid : ROLE.winner,
            'mono',
            'left',
          )
            .glow(mRes ? 7 : 0, ROLE.valid)
            .opacity(alpha),
          txt(
            mRes ? 'Waiting leads legal words (50.0%)' : 'Recompute top-p over legal tokens.',
            rx,
            135,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(alpha),
        );
      }
    } else if (coolMode) {
      nodes.push(
        txt(`Cool all 5 words: T = ${fmt(T, 2)}`, rx, -195, 34, ROLE.active, 'mono', 'left')
          .glow(6, ROLE.active)
          .opacity(alpha),
        txt('Square original shares (p^2) / Z', rx, -105, 28, COSMOS.ink, 'mono', 'left').opacity(
          alpha,
        ),
        txt(
          `ready rises to ${pctTrim(row[0], 1)}`,
          rx,
          -25,
          32,
          ROLE.winner,
          'mono',
          'left',
        ).opacity(alpha),
        txt('All 5 words remain drawable.', rx, 55, 26, COSMOS.muted, 'sans', 'left').opacity(
          alpha,
        ),
      );
    } else {
      nodes.push(
        txt(cw ? 'Top-p 0.80 -> paused' : 'Top-p 0.80', rx, -200, 34, ROLE.winner, 'mono', 'left')
          .glow(cw ? 7 : 0, ROLE.winner)
          .opacity(alpha),
      );
      if (!cw) {
        nodes.push(
          txt('Add from the top to 80%.', rx, -110, 30, COSMOS.ink, 'serif', 'left').opacity(alpha),
          txt('Which word gets the last place?', rx, -45, 30, ROLE.active, 'serif', 'left').opacity(
            alpha,
          ),
        );
      }
      if (sp) {
        nodes.push(
          txt('48 + 26 = 74%  |  +14 = 88%', rx, -130, 28, COSMOS.ink, 'mono', 'left').opacity(
            alpha,
          ),
        );
      }
      if (sk) {
        nodes.push(
          txt('Exact top-k = 2  (÷ 0.74)', rx, -30, 30, ROLE.active, 'mono', 'left').opacity(alpha),
          txt(
            `ready ${pctTrim(f.k.values[0], 1)}  ·  waiting ${pctTrim(f.k.values[1], 1)}`,
            rx,
            26,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(alpha),
        );
      }
      if (sm) {
        nodes.push(
          txt(
            `Min-p 0.20 -> floor ${fmt(f.floor, 3)}`,
            rx,
            125,
            30,
            ROLE.valid,
            'mono',
            'left',
          ).opacity(alpha),
          txt(
            'paused (0.14) clears; checking (0.08) drops',
            rx,
            180,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(alpha),
        );
      }
    }

    nodes.push(
      txt(
        ver
          ? 'Decoding shapes probabilities; grounded records verify truth.'
          : 'Same five status words under top-p, top-k, min-p, temperature & grammar.',
        0,
        405,
        28,
        ver ? ROLE.valid : COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.winner), title, mainLayer);

  playCue(s, c, 'dec-fresh-deal', (d) => s.play(dealCount.to(5, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'dec-fresh-crossing-word', (d) => s.play(crossWord.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-fresh-p', (d) => s.play(showP.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-fresh-k', (d) => s.play(showK.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-fresh-minp', (d) => s.play(showMin.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  playCue(
    s,
    c,
    'dec-fresh-temperature',
    (d) =>
      s.play(inCoolBeat.to(1, { duration: Math.min(0.25, d) }), tempVal.to(0.5, { duration: d })),
    { dur: 0.95 },
  );
  playCue(
    s,
    c,
    'dec-fresh-reset',
    (d) =>
      s.play(inCoolBeat.to(0, { duration: Math.min(0.25, d) }), tempVal.to(1.0, { duration: d })),
    { dur: 0.55 },
  );
  playCue(s, c, 'dec-fresh-mask-input', (d) => s.play(maskedReady.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-fresh-rescale', (d) => s.play(rescaleFrac.to(1, { duration: d })), {
    dur: 0.85,
  });
  playCue(s, c, 'dec-fresh-mask-result', (d) => s.play(maskResDone.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-fresh-record', (d) => s.play(showRecord.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dec-fresh-verified', (d) => s.play(verifiedDone.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
