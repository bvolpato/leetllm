// Scene 23: count-penalties: "Frequency counts every reuse and presence charges once"
// Luminous horizontal subtraction waterfall for raw [2.4, 2.1, 1.2] with counts [3, 1, 0],
// alpha_freq = 0.4, beta_pres = 0.2, plus MathJax additive equation. Reveals [1.0, 1.5, 1.2]
// and new mode ID 1 strictly AFTER dec-count-values.
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, playCue } from '../parts.mjs';

export default function countPenalties(s, c) {
  const title = heroTitle(['Frequency counts reuse;', 'presence charges once'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.alt,
  });

  const raw = [2.4, 2.1, 1.2];
  const counts = [3, 1, 0];
  const freq = counts.map((n) => n * 0.4);
  const pres = counts.map((n) => (n > 0 ? 0.2 : 0));
  const finalZ = raw.map((z, i) => z - freq[i] - pres[i]);

  const showDeductions = s.value(0.2);
  const showResults = s.value(0);
  const showFooter = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const ded = showDeductions.value;
    const res = showResults.value > 0.4;
    const foot = showFooter.value;

    // Column headers cleanly aligned above rows
    const ys = [-120, 45, 210];
    const barL = -520;
    const scale = 320; // 1.0 logit = 320 px

    nodes.push(
      txt('Raw logit', -680, -230, 28, ROLE.base, 'mono', 'center').opacity(alpha),
      txt(
        'Carve frequency (α = 0.4) & presence (β = 0.2)',
        -120,
        -230,
        28,
        ROLE.alt,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Adjusted score', 660, -230, 28, ROLE.winner, 'mono', 'center').opacity(alpha),
    );

    raw.forEach((z, i) => {
      const y = ys[i];
      const fW = freq[i] * scale * ded;
      const pW = pres[i] * scale * ded;
      const remW = Math.max(8, (z - (freq[i] + pres[i]) * ded) * scale);
      const isWin = res && i === 1;

      nodes.push(
        txt(
          `ID ${i}  (c=${counts[i]})`,
          -845,
          y,
          30,
          isWin ? ROLE.winner : COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
        // Remaining score segment
        lumBar(barL + remW / 2, y, remW, 60, {
          color: isWin ? ROLE.valid : ROLE.base,
          fillOpacity: isWin ? 0.54 : 0.36,
          strokeWidth: isWin ? 3 : 2.2,
          glow: isWin ? 12 : 7,
          radius: 7,
          opacity: alpha,
        }),
      );

      // Presence deduction segment (amber)
      if (pW > 4) {
        nodes.push(
          lumBar(barL + remW + pW / 2 + 2, y, Math.max(4, pW - 2), 60, {
            color: ROLE.heat,
            fillOpacity: 0.44,
            strokeWidth: 2,
            glow: 7,
            radius: 5,
            opacity: ded * alpha,
          }),
        );
      }

      // Frequency deduction segment (rose)
      if (fW > 4) {
        nodes.push(
          lumBar(barL + remW + pW + fW / 2 + 4, y, Math.max(4, fW - 2), 60, {
            color: ROLE.pruned,
            fillOpacity: 0.44,
            strokeWidth: 2,
            glow: 7,
            radius: 5,
            opacity: ded * alpha,
          }),
        );
      }

      // Deduction text neatly below bar
      nodes.push(
        txt(
          `z = ${fmt(z, 1)}   -   (${counts[i]}×0.4 = ${fmt(freq[i], 1)})   -   ${fmt(pres[i], 1)}`,
          barL,
          y + 52,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(Math.max(0.35, ded) * alpha),
      );

      // Final score pill on right
      nodes.push(
        lumBar(660, y, 270, 68, {
          color: isWin ? ROLE.valid : res ? ROLE.active : COSMOS.dim,
          fillOpacity: isWin ? 0.34 : res ? 0.18 : 0.08,
          strokeWidth: isWin ? 3 : 2,
          glow: isWin ? 12 : res ? 6 : 2,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          res ? `${fmt(finalZ[i], 1)}${isWin ? '  ★' : ''}` : '?',
          660,
          y,
          34,
          isWin ? ROLE.valid : res ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(isWin ? 8 : 0, ROLE.valid)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        foot > 0.3
          ? 'ID 1 becomes the mode (1.5)  |  heavy penalties can suppress required repeated keys'
          : 'Counts operate on raw token IDs; declare history scope and full processor order.',
        0,
        385,
        28,
        foot > 0.3 ? ROLE.winner : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(foot > 0.3 ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  const addEq = glowTex("z'_i = z_i - \\alpha \\cdot c_i - \\beta \\cdot \\mathbf{1}[c_i > 0]", {
    x: 425,
    y: -385,
    size: 34,
    color: ROLE.alt,
  });

  s.add(cinemaAtmosphere(ROLE.alt, ROLE.valid), title, addEq, mainLayer);

  playCue(s, c, 'dec-count-penalties-1', (d) => s.play(showDeductions.to(0.45, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'dec-count-penalties-2', (d) => s.play(showDeductions.to(1, { duration: d })), {
    dur: 0.8,
  });
  playCue(s, c, 'dec-count-values', (d) => s.play(showResults.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dec-count-penalties-3', (d) => s.play(showFooter.to(1, { duration: d })), {
    dur: 0.65,
  });
}
