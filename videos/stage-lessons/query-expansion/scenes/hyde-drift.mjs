// Scene 10: Change one clause in the search text (HyDE hallucination drift trap)
import {
  COSMOS,
  PROXY_CORPUS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  proxyEvidence,
  remainDuration,
  search,
  txt,
} from '../parts.mjs';

export default function hydeDrift(s, c) {
  const showInitial = s.value(0);
  const showEdit = s.value(0);
  const showCause = s.value(0);

  const bgAura = aura(0, 10, 720, '#10305828', '#3314261a');
  const title = heroTitle(['Change One Clause', 'in the Search Text'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'HyDE DRIFT · HOW ONE INVENTED CLAUSE DISPLACES A REQUIRED POLICY',
  });

  const cleanRun = proxyEvidence(false);
  const driftRun = proxyEvidence(true);

  const live = guardedDynamic(s.value(1), () => {
    const sInit = showInitial.value;
    const sEdit = showEdit.value;
    const sCause = showCause.value;

    const edited = sEdit > 0.4;
    const initialDone = sInit > 0.5;
    const driftRevealed = sCause > 0.5;
    const scored = edited ? driftRevealed : initialDone;
    const activeRun = edited ? driftRun : cleanRun;

    const nodes = [
      // Generated search proxy bar
      glassCell(0, -190, 1710, 86, edited ? COSMOS.amber : COSMOS.blue, {
        fill: edited ? '#261b10' : '#10203a',
        glow: 8,
      }),
      txt('GENERATED PROXY:', -832, -188, 26, COSMOS.muted, 'mono', 'left'),
      txt('"For batch jobs,', -525, -188, 32, COSMOS.ink, 'sans', 'left'),
      txt(
        `${activeRun.proposal}"`,
        -255,
        -188,
        32,
        edited ? COSMOS.amber : COSMOS.cyan,
        'sans',
        'left',
      ),

      // Table column labels
      txt('SOURCE ID', -832, -112, 26, COSMOS.muted, 'mono', 'left'),
      txt('INDEXED CORPUS EXCERPT', -515, -112, 26, COSMOS.muted, 'mono', 'left'),
      txt('MATCHES', 330, -112, 26, COSMOS.muted, 'mono'),
      txt(edited ? 'OLD RANK' : 'TOP-2 RANK', 540, -112, 26, COSMOS.muted, 'mono'),
      txt(edited ? 'NEW RANK' : 'REQUIRED', 745, -112, 26, COSMOS.muted, 'mono'),
    ];

    PROXY_CORPUS.forEach((doc, idx) => {
      const y = -36 + idx * 122;
      const isReq = activeRun.required.includes(doc.id);
      const hitsCount = search(activeRun.proxy, [doc])[0]?.score ?? 0;
      const oldPos = cleanRun.hits.findIndex((h) => h.document.id === doc.id);
      const newPos = activeRun.hits.findIndex((h) => h.document.id === doc.id);
      const dropped = edited && driftRevealed && isReq && newPos < 0;
      const inTop2 = scored && newPos >= 0;

      const border = dropped
        ? COSMOS.rose
        : inTop2
          ? isReq
            ? COSMOS.emerald
            : COSMOS.amber
          : COSMOS.dim;

      nodes.push(
        glassCell(0, y, 1710, 102, border, {
          fill: dropped ? '#2a121c' : inTop2 && isReq ? '#0d2723' : '#10182d',
          glow: dropped ? 10 : inTop2 ? 6 : 2,
        }),
        txt(doc.id, -832, y + 2, 30, dropped ? COSMOS.rose : COSMOS.ink, 'mono', 'left'),
        txt(doc.text, -515, y + 2, 28, COSMOS.ink, 'sans', 'left'),
        txt(String(hitsCount), 330, y + 2, 34, COSMOS.cyan, 'mono'),
      );

      if (edited) {
        nodes.push(
          txt(oldPos >= 0 ? `#${oldPos + 1}` : 'out', 540, y + 2, 30, COSMOS.muted, 'mono'),
          txt(
            driftRevealed ? (newPos >= 0 ? `#${newPos + 1}` : 'OUT!') : '?',
            745,
            y + 2,
            34,
            driftRevealed
              ? dropped
                ? COSMOS.rose
                : newPos >= 0
                  ? COSMOS.amber
                  : COSMOS.muted
              : COSMOS.gold,
            'mono',
          ),
        );
      } else {
        nodes.push(
          txt(
            initialDone ? (oldPos >= 0 ? `#${oldPos + 1}` : 'out') : '?',
            540,
            y + 2,
            34,
            initialDone ? (oldPos >= 0 ? COSMOS.emerald : COSMOS.muted) : COSMOS.gold,
            'mono',
          ),
          txt(
            isReq ? 'required' : 'overview',
            745,
            y + 2,
            26,
            isReq ? COSMOS.emerald : COSMOS.dim,
            'mono',
          ),
        );
      }
    });

    const bottomCol = driftRevealed
      ? COSMOS.rose
      : initialDone && !edited
        ? COSMOS.emerald
        : COSMOS.gold;
    const bottomMsg = driftRevealed
      ? 'quota-policy falls out (1/2 required) · keep exact lookups for IDs, dates & codes'
      : edited
        ? 'Invented scaling clause matches overview: which required policy falls out?'
        : initialDone
          ? 'Both required policies (quota-policy + batch-policy) make the top 2 (2/2)'
          : 'Keep top 2 by matching words: required pages are quota-policy and batch-policy';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.after('hyde-find-policies', () => s.play(showInitial.to(1, { duration: 0.45 })));
  c.on('hyde-edit-proxy', () => s.play(showEdit.to(1, { duration: 0.45 })));
  c.after('hyde-change-cause', () =>
    s.play(showCause.to(1, { duration: remainDuration(c, 'hyde-change-cause', 0.45) })),
  );
}
