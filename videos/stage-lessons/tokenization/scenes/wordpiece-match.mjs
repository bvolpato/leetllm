// Scene 08: wordpiece-match: Greedy longest-prefix scan on "rainbow" -> trap when "rainb" is added -> [UNK].
import {
  COSMOS,
  FIRST_PASS,
  FIRST_VOCAB,
  ROLE,
  TRAP_PASS,
  TRAP_VOCAB,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function wordpieceMatch(s, c) {
  const passMode = s.value(0); // 0 = first vocab, 1 = trap vocab (rainb added)
  const probeIdx = s.value(0); // 0..4 in pass 0 (0=none, 1=rainbow X, 2=rainbo X, 3=rainb X, 4=rain OK + ##bow)
  const showBow = s.value(0);
  const showPrompt = s.value(0);
  const revealCommit = s.value(0); // strictly withheld until commit!
  const revealDeadEnd = s.value(0);
  const revealUnk = s.value(0);

  const bgAura = aura(0, 10, 740, '#3e1a3626', '#16355c18');
  const title = heroTitle(['Greedy WordPiece', 'on "rainbow"'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.merge,
  });

  const stageVis = s.value(1);
  const letters = [...'rainbow'];
  const baseXs = letters.map((_, i) => -540 + i * 118);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const trap = passMode.value > 0.5;
    const pIdx = Math.round(probeIdx.value);
    const bow = showBow.value;
    const pr = showPrompt.value;
    const com = revealCommit.value;
    const dead = revealDeadEnd.value;
    const unk = revealUnk.value;
    const vocab = trap ? TRAP_VOCAB : FIRST_VOCAB;
    const nodes = [];

    // Active vocabulary bar (floating pills, no box container)
    nodes.push(
      txt(
        trap ? 'VOCABULARY (+ "rainb" ADDED)' : 'VOCABULARY',
        -855,
        -220,
        26,
        trap ? ROLE.merge : ROLE.piece,
        'mono',
        'left',
      ).opacity(alpha),
    );
    vocab.forEach((item, idx) => {
      const isTrap = item === 'rainb';
      nodes.push(
        tokenPill(item, -730 + idx * 230, -140, {
          w: 196,
          h: 68,
          color: isTrap ? ROLE.merge : ROLE.piece,
          size: 32,
          glow: isTrap ? 12 : 6,
          opacity: alpha,
        }),
      );
    });

    // Letter strip for "rainbow"
    const stripY = 20;
    letters.forEach((ch, idx) => {
      let col = COSMOS.muted;
      if (!trap) {
        const probeLen = pIdx === 1 ? 7 : pIdx === 2 ? 6 : pIdx === 3 ? 5 : pIdx >= 4 ? 4 : 0;
        if (idx < probeLen) col = pIdx >= 4 ? ROLE.ok : ROLE.warn;
        if (bow > 0.5 && idx >= 4) col = ROLE.ok;
      } else {
        if (com > 0.5 && idx < 5) col = ROLE.merge;
        if (dead > 0.5 && idx >= 5) col = ROLE.warn;
      }
      nodes.push(
        tokenPill(ch, baseXs[idx], stripY, {
          w: 96,
          h: 84,
          color: col,
          size: 42,
          glow: col === COSMOS.muted ? 2 : 10,
          opacity: alpha,
        }),
      );
    });

    // Probe status / prediction / output (concise so quick probes stay readable)
    if (!trap) {
      const probeLabels = [
        'Scan longest prefix...',
        'rainbow: miss',
        'rainbo: miss',
        'rainb: miss',
        bow > 0.5 ? `Match: ${FIRST_PASS.pieces.join(' + ')}` : 'rain: MATCH!',
      ];
      const lbl = probeLabels[Math.min(4, Math.max(0, pIdx))];
      const col = pIdx >= 4 ? ROLE.ok : pIdx === 0 ? COSMOS.muted : ROLE.warn;
      nodes.push(
        txt(lbl, -855, 175, 36, col, 'mono', 'left')
          .glow(pIdx >= 4 ? 8 : 0, col)
          .opacity(alpha),
      );
    } else {
      if (pr > 0.05 && com < 0.2) {
        nodes.push(
          txt(
            'What does the greedy matcher return for "rainbow"?',
            0,
            215,
            38,
            ROLE.merge,
            'serif',
            'center',
          )
            .glow(8, ROLE.merge)
            .opacity(pr * (1 - com * 5) * alpha),
        );
      }
      if (com > 0.5) {
        nodes.push(
          txt(
            'Commits to longest prefix: "rainb" (no backtracking)',
            -855,
            165,
            32,
            ROLE.merge,
            'mono',
            'left',
          ).opacity(alpha),
        );
      }
      if (dead > 0.5) {
        nodes.push(
          txt(
            'Remainder "##ow" and "##o" missing → dead end',
            -855,
            235,
            32,
            ROLE.warn,
            'mono',
            'left',
          ).opacity(alpha),
        );
      }
      if (unk > 0.5) {
        nodes.push(
          tokenPill(TRAP_PASS.pieces[0], 560, 200, {
            w: 230,
            h: 88,
            color: ROLE.warn,
            fill: '#2c1120',
            size: 44,
            glow: 14,
            opacity: alpha,
          }),
          txt(
            'Adding "rainb" collapsed the entire word to [UNK]',
            -855,
            350,
            32,
            ROLE.warn,
            'serif',
            'left',
          )
            .glow(8, ROLE.warn)
            .opacity(alpha),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'try-all', (d) => s.play(probeIdx.to(1, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'try-rainbo', (d) => s.play(probeIdx.to(2, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'try-rainb', (d) => s.play(probeIdx.to(3, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'try-rain', (d) => s.play(probeIdx.to(4, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'bow-there', (d) => s.play(showBow.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'add-piece', (d) => s.play(passMode.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'predict', (d) => s.play(showPrompt.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold outcome until commit/no-continuation/unk!
  playCue(s, c, 'commit', (d) => s.play(revealCommit.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'no-continuation', (d) => s.play(revealDeadEnd.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'unk', (d) => s.play(revealUnk.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), [
    'clean',
    'longest',
    'vocab',
    'answer-all',
    'answer-rainbo',
    'answer-rainb',
    'answer-rain',
    'result',
    'no-back',
    'worse',
    'compare',
    'whole',
  ]);
}
