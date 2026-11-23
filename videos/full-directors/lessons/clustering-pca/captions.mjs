const phraseStarts = {
  'c02-b01': [
    'Move two tenths to the right',
    'then eight tenths up to B',
    'Square those changes and add them',
    'The square root of zero point six eight',
    'gives the diagonal, about zero point eight two',
  ],
  'c03-b01': [
    'Documents have n rows and d features',
    'while centers have k rows and the same d features',
    'Reject a center matrix with the wrong feature width',
    'and reject nonfinite coordinates',
  ],
  'c03-b03': [
    'differentiate the sum of squared distances to a center',
    'The gradient is minus two times',
    'Setting it to zero makes the center',
  ],
  'c05-b01': [
    'Put two seeds on the billing pair',
    'and the third at one hundred, one hundred instead',
    'The same nearest-center rule assigns one point to the first seed',
    'five to the second and none to the third',
  ],
  'c05-b04': [
    'stops when assignments repeat',
    'Exact assignments and means',
    'reach a fixed assignment',
    'a tolerance or iteration cap may stop a library run earlier',
  ],
  'c05-b05': [
    'Average each shelf to update its center',
    'B, C and D pull the middle center',
    'to about three point four, three point two seven',
    'B is still at one point two, one point eight',
    'Measure from B to each updated center',
    'Which shelf should B join on the next assignment',
  ],
  'c05-b06': [
    'It is about zero point eight two five from that center',
    'and two point six four four from C one',
    'Only B changes shelves',
    'Average the new pairs',
    'Now A and B share a center at one point one, one point four',
    'Assign all six once more',
    'The assignments repeat',
    'Across restarts, compare total squared error',
    'under the same metric and restart budget',
    'Each group number belongs to its run',
  ],
  'c07-b03': [
    'Three groups have the strongest silhouette here',
    'Four still reduce inertia',
    'but their singleton points receive silhouette zero',
    'Use the scores to nominate a partition',
    'Cluster numbers identify groups within a run',
  ],
  'c08-b04': [
    'give about zero point five six',
    'zero point seven six and zero point five one',
  ],
  'c08-b06': [
    'is closer on average to another group’s members',
    'Equal average distances give zero',
    'Read messages to decide what the groups mean',
  ],
  'c09-b01': [
    'Splitting left from right gives inertia four',
    'Now turn the split',
    'Splitting bottom from top also gives four',
    'Every message has a different partner',
  ],
  'c11-b02': [
    'For the short billing note',
    'the topic coordinate becomes about minus one point zero seven',
    'Its hundred characters become about minus one point two four',
    'Recompute the two distances',
    'The longer billing note is now nearer',
    'Cluster all six standardized rows',
  ],
  'c12-b01': [
    'on the six messages',
    'To scale a value, subtract the column mean',
    'and divide by its standard deviation',
    'Here comes a query with three hundred characters',
  ],
  'c13-b01': [
    'Principal component analysis',
    'First subtract the same coordinate-wise mean',
    'The cloud moves together around zero',
    'distances between its points stay unchanged',
  ],
  'c14-b05': [
    'The first still accounts for about eighty-five percent',
    'of their combined length',
    "That's its explained variance ratio",
    'If every row is identical',
    'both lengths are zero and the ratio is undefined',
  ],
  'c14-b07': [
    'forming that matrix squares the ratio',
    'of the largest to the smallest singular value',
    'Rounding can bury a small direction',
    'Direct SVD avoids forming the square',
    'Covariance can be efficient',
    'Randomized SVD approximates the leading directions',
    'Oversampling and power iterations',
  ],
  'c17-b03': [
    'For unit vectors, squared Euclidean distance',
    'is two minus twice the dot product',
    'As cosine rises, distance falls, so the rankings agree',
    'Use the same metric and normalization',
    'for index construction, query routing and evaluation',
    'Mixing in raw metadata changes the vectors',
  ],
  'c21-b05': [
    'Its supplied coordinates put it next to the reset-link page',
    'The index returns exactly the same page as flat search',
    "That's a geometric hit",
    'A reviewer chose the duplicate-payment page',
    'so the same result is a relevance miss',
    'ANN recall uses the exact neighbors',
    'under the same representation and tie rule',
  ],
  'c23-b03': [
    'keeps almost ninety-eight percent of the corpus variance',
    'Sight along the missing height',
    'As we flatten the search copy onto the horizontal line',
    'watch what happens to those three page pins',
  ],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
