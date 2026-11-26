// Scene 16: Apply identifier and secret policies to the retained source: Span tagging, <EMAIL> tokenizer registration, and context-aware safety review.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function privacy(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const spansOn = s.value(0);

  const showPart2 = s.value(0);
  const replaceOn = s.value(0);
  const registerOn = s.value(0);

  const showPart3 = s.value(0);
  const contextOn = s.value(0);
  const secretOn = s.value(0);

  const bgAura = aura(0, 0, 640, '#1e164028', '#ff6b8b14');

  // Part 1: Three distinct sensitive spans on one retained technical source
  const part1Live = guardedDynamic(showPart1, (a) => {
    const sp = spansOn.value;
    const rows = [
      {
        text: 'contact: alice@example.test',
        tag: 'STRUCTURED PII · REGEX',
        color: COSMOS.cyan,
        y: -110,
      },
      {
        text: '-----BEGIN PRIVATE KEY-----',
        tag: 'SECRET · ALWAYS SCRUB',
        color: COSMOS.rose,
        y: 35,
      },
      {
        text: 'Author: Dr. Rivera',
        tag: 'NAME · NEEDS CONTEXT',
        color: COSMOS.gold,
        y: 180,
      },
    ];

    const nodes = [
      heroTitle(['Privacy, Secrets,', '& Context'], {
        x: -855,
        y: -435,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.rose,
        eyebrow: 'IDENTIFIER SCRUBBING · ONE RETAINED SOURCE',
      }).opacity(a),
    ];

    rows.forEach((r) => {
      nodes.push(
        glassCell(0, r.y, 1520, 108, r.color, { fill: '#101628', glow: 7, opacity: a }),
        txt(r.text, -715, r.y + 2, 34, r.color, 'mono', 'left').opacity(a),
        txt(r.tag, 715, r.y + 2, 26, r.color, 'mono', 'right').opacity(a),
      );
    });

    if (sp > 0.02) {
      nodes.push(
        txt(
          'Attach policy version & exact source spans while raw HTML is still inspectable',
          0,
          365,
          30,
          COSMOS.emerald,
          'sans',
        )
          .glow(6, COSMOS.emerald)
          .opacity(sp * a),
      );
    }
    return group(...nodes);
  });

  // Part 2: Regex <EMAIL> replacement & tokenizer special-token registry trap
  const part2Live = guardedDynamic(showPart2, (a) => {
    const rp = replaceOn.value;
    const rg = registerOn.value;
    const ph = phase.value;
    const replaced = rp > 0.5;

    const nodes = [
      txt(
        'REGEX SCRUBBING & TOKENIZER REGISTRATION',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Register Placeholder Tokens', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(a),

      glassCell(0, -145, 1340, 118, replaced ? COSMOS.emerald : COSMOS.cyan, {
        fill: replaced ? '#0e2326' : '#10182d',
        glow: 9,
        opacity: a,
      }),
      txt(
        replaced ? 'contact: <EMAIL>' : 'contact: alice@example.test',
        0,
        -143,
        42,
        replaced ? COSMOS.emerald : COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(0, 15, 1340, 102, COSMOS.rose, { fill: '#22101d', glow: 8, opacity: a }),
      txt(
        '-----BEGIN PRIVATE KEY-----   (still unaddressed!)',
        0,
        17,
        32,
        COSMOS.rose,
        'mono',
      ).opacity(a),

      ...photonStream([0, 68], [0, 124], 0, ph, {
        color: COSMOS.gold,
        count: 3,
        opacity: rg * a,
      }),
    ];

    if (rg > 0.02) {
      const pieces = ['<', 'EM', 'AIL', '>'];
      nodes.push(
        txt('UNREGISTERED (ORDINARY PIECES)', -430, 146, 26, COSMOS.amber, 'mono').opacity(rg * a),
        ...pieces.flatMap((p, i) => [
          glassCell(-655 + i * 150, 224, 126, 74, COSMOS.amber, {
            fill: '#231912',
            glow: 6,
            opacity: rg * a,
          }),
          txt(p, -655 + i * 150, 226, 32, COSMOS.amber, 'mono').opacity(rg * a),
        ]),
        txt('REGISTERED SPECIAL TOKEN', 445, 146, 26, COSMOS.emerald, 'mono').opacity(rg * a),
        glassCell(445, 224, 340, 74, COSMOS.emerald, {
          fill: '#0e2522',
          glow: 9,
          opacity: rg * a,
        }),
        txt('<EMAIL> (1 ID)', 445, 226, 30, COSMOS.emerald, 'mono').opacity(rg * a),
        txt(
          'Even hashed identifiers link records when the same hash repeats',
          0,
          375,
          30,
          COSMOS.muted,
          'sans',
        ).opacity(rg * a),
      );
    }

    return group(...nodes);
  });

  // Part 3: Same flagged word in two contexts + private key still requires secret scan
  const part3Live = guardedDynamic(showPart3, (a) => {
    const cx = contextOn.value;
    const sc = secretOn.value;
    const nodes = [
      txt(
        'CONTEXT-AWARE MODERATION & SECRET SCANNING',
        -855,
        -425,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ).opacity(a),
      txt('Same Word, Different Decisions', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(a),

      glassCell(-445, -80, 700, 195, COSMOS.emerald, { fill: '#0e2026', glow: 8, opacity: a }),
      txt('CLINICAL EXPLANATION', -445, -125, 30, COSMOS.emerald, 'mono').opacity(a),
      txt('Contains flagged term in medical prose', -445, -62, 26, COSMOS.ink, 'sans').opacity(a),
      txt(
        cx > 0.5 ? 'RETAIN · EDUCATIONAL' : 'EVALUATE IN CONTEXT',
        -445,
        -8,
        28,
        COSMOS.emerald,
        'mono',
      ).opacity(a),

      glassCell(445, -80, 700, 195, COSMOS.rose, { fill: '#23101b', glow: 8, opacity: a }),
      txt('ABUSIVE MESSAGE', 445, -125, 30, COSMOS.rose, 'mono').opacity(a),
      txt('Same flagged term in targeted harassment', 445, -62, 26, COSMOS.ink, 'sans').opacity(a),
      txt(
        cx > 0.5 ? 'REMOVE · UNSAFE' : 'EVALUATE IN CONTEXT',
        445,
        -8,
        28,
        COSMOS.rose,
        'mono',
      ).opacity(a),

      txt(
        'Sample both kept and removed slices across every served group',
        0,
        88,
        28,
        COSMOS.cyan,
        'sans',
      ).opacity((0.35 + 0.65 * cx) * a),
    ];

    if (sc > 0.02) {
      nodes.push(
        glassCell(0, 228, 1480, 114, COSMOS.rose, { fill: '#22101a', glow: 9, opacity: sc * a }),
        txt(
          'contact: <EMAIL>   ·   -----BEGIN PRIVATE KEY-----  -> DEDICATED SECRET SCAN',
          0,
          230,
          28,
          COSMOS.rose,
          'mono',
        ).opacity(sc * a),
        txt(
          'Apply identical secret & license checks to synthetic variants too',
          0,
          380,
          30,
          COSMOS.gold,
          'sans',
        ).opacity(sc * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);

  c.on('pt-privacy-spans', () =>
    s.play(spansOn.to(1, { duration: remainDuration(c, 'pt-privacy-spans', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-privacy-replace', () =>
    s.play(replaceOn.to(1, { duration: remainDuration(c, 'pt-privacy-replace', 0.6) })),
  );
  c.on('pt-privacy-register', () =>
    s.play(registerOn.to(1, { duration: remainDuration(c, 'pt-privacy-register', 0.6) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-privacy-context', () =>
    s.play(contextOn.to(1, { duration: remainDuration(c, 'pt-privacy-context', 0.6) })),
  );
  c.on('pt-privacy-secret', () =>
    s.play(secretOn.to(1, { duration: remainDuration(c, 'pt-privacy-secret', 0.6) })),
  );
}
