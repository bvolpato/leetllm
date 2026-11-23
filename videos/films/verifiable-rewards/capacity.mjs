export function capacityPair(expected, revision) {
  const first = String.raw`\boxed{${expected}}`;
  const second = String.raw`\boxed{${revision}}`;
  return [[first], [first, second]];
}

export function capacityScore(response, expected, singleBox) {
  const markers = response.split('\\boxed').length - 1;
  const first = /\\boxed\{([0-9]{1,20})\}/.exec(response);
  if (!first || (singleBox && markers !== 1)) return 0;
  return Number(BigInt(first[1]) === BigInt(expected));
}

export const openingFields = capacityPair(14 * 12, 148);
export const freshProduct = 18 * 14;
const freshFields = capacityPair(freshProduct, 251);
export const freshRecords = [
  ...freshFields.map((fields, i) => ({
    id: `R${i + 1}`,
    status: 'completed',
    response: fields.join(' then '),
  })),
  { id: 'R3', status: 'candidate-timeout', description: 'Time limit reached on a healthy runner' },
  { id: 'R4', status: 'host-crash', description: 'Host lost during the check' },
];
