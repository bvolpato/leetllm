export const documents = [
  {
    id: 'api-guide',
    title: 'payment retry API guide',
    source: 'platform',
    current: true,
    permitted: true,
    retrieval: 0.96,
    queryFit: 0.98,
    reliability: 0.88,
    relevance: 3,
  },
  {
    id: 'blog-post',
    title: 'general release blog',
    source: 'community',
    current: true,
    permitted: true,
    retrieval: 0.91,
    queryFit: 0.35,
    reliability: 0.97,
    relevance: 0,
  },
  {
    id: 'legacy-changelog',
    title: 'legacy changelog',
    source: 'community',
    current: true,
    permitted: true,
    retrieval: 0.9,
    queryFit: 0.15,
    reliability: 0.99,
    relevance: 0,
  },
  {
    id: 'retry-runbook',
    title: 'checkout troubleshooting runbook',
    source: 'platform',
    current: true,
    permitted: true,
    retrieval: 0.84,
    queryFit: 0.92,
    reliability: 0.98,
    relevance: 2,
  },
  {
    id: 'sdk-example',
    title: 'idempotency SDK example',
    source: 'platform',
    current: true,
    permitted: true,
    retrieval: 0.8,
    queryFit: 0.86,
    reliability: 0.96,
    relevance: 2,
  },
  {
    id: 'private-draft',
    title: 'private incident draft',
    source: 'platform',
    current: true,
    permitted: false,
    retrieval: 0.99,
    queryFit: 0.99,
    reliability: 0.99,
    relevance: 3,
  },
  {
    id: 'stale-guide',
    title: 'stale v1 migration page',
    source: 'community',
    current: false,
    permitted: true,
    retrieval: 0.95,
    queryFit: 0.94,
    reliability: 0.7,
    relevance: 2,
  },
];
export const shortTitles = {
  'api-guide': 'API guide',
  'blog-post': 'general blog',
  'legacy-changelog': 'changelog',
  'retry-runbook': 'runbook',
  'sdk-example': 'SDK example',
};
export const queryVector = [1, 0];
export const itemVectors = [
  {
    id: 'API guide',
    vector: [0.9, 0.1],
  },
  {
    id: 'runbook',
    vector: [0.8, 0.2],
  },
  {
    id: 'blog',
    vector: [0.2, 0.9],
  },
];
export const clickExamples = [
  {
    position: 1,
    impressions: 100,
    clicks: 40,
    propensity: 1,
  },
  {
    position: 2,
    impressions: 100,
    clicks: 20,
    propensity: 0.5,
  },
];
export const TOWER_OBSERVED = {
  'catalogCount': 1000,
  'dimensions': 16,
  'query': [
    0.36884976450418994, -0.00582912195674036, 0.06315571628424312, -0.28713470713154654,
    -0.906968531212131, -0.75568517882496, 0.2987657282438115, -0.7857007673203188,
    0.8959886570926169, -1.6266255453604934, 0.9051191256212999, -0.43106113890988057,
    -2.377265122103905, -1.870674760699052, -0.9289624796866149, -1.106991347652036,
  ],
  'selected': [
    {
      'id': 725,
      'embedding': [
        -1.3061991374389246, 0.06563416068523861, -1.0816970403390793, -1.2172566821197275,
        -2.480429097820802, -1.0790592423499694, 0.23530426703323218, -1.2092108583845773,
        0.5817310200077014, -1.8458292746828808, 1.9266268582057604, 1.1844758960765203,
        -2.425114281032369, -2.007037172389923, 0.02045860449385482, -1.7070456681480952,
      ],
      'score': 20.03178204071747,
    },
    {
      'id': 869,
      'embedding': [
        0.235279410382746, 0.48082366193758397, 0.9509380209374817, -0.09772671569131844,
        -0.7364943559969369, -1.7215401544110918, -0.8129624979243648, 1.018009489229211,
        2.0458392678191197, 0.5311758134826904, -0.1360040010023765, 0.2468693238341221,
        -2.5846065033274024, -1.4820674179887818, -1.3972692628531498, -1.2219596352774054,
      ],
      'score': 13.405260799682605,
    },
    {
      'id': 311,
      'embedding': [
        -1.1349926426688104, 0.5575857706024162, -0.14293885938751286, 0.5182374972412448,
        -0.2731224644439433, -0.7529727687985162, -1.2020108059385561, -0.20630531146778944,
        -0.45939813297651044, -1.297200943970485, 1.250897190245364, 1.0256280539262181,
        -2.0346262279964247, -2.138980947526366, -1.519605001250113, 0.15653535592075898,
      ],
      'score': 12.505078703854284,
    },
    {
      'id': 426,
      'embedding': [
        0.8028621684242807, -1.2227910348216389, 0.5660675574774319, 0.6116630973328852,
        -0.6091167998046463, -2.461081240815044, 0.7456479712610296, -1.296246757765336,
        -0.17242488256307956, -1.7746189013960092, 0.593395609611801, -1.835893012167861,
        -0.5874435186791938, -0.5645843763705455, -0.006948798557263854, -1.4830766582110453,
      ],
      'score': 11.978369016128411,
    },
    {
      'id': 433,
      'embedding': [
        -0.3352609729506816, -1.430855611380154, -0.8309021232640711, -0.10379198658943314,
        -1.2338272595674602, 0.872919174398434, -0.8040286009963807, -0.2815629387501529,
        -0.10047742321437876, -2.1883272094427277, 0.8091862153938151, 0.04021011252680073,
        -2.215838739348068, -0.3909125278815379, -0.3340259563182243, -1.0345484304589707,
      ],
      'score': 11.941483509897445,
    },
  ],
  'crossDimension': 32,
  'crossCalls': 5,
};
export const SHORT = {
  ...shortTitles,
  'private-draft': 'private draft',
  'stale-guide': 'stale guide',
};
