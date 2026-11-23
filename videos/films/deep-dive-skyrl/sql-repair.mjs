export const customers = [
  ['Ada', 1, 4],
  ['Ben', 1, 3],
  ['Cy', 0, 5],
];

export function queryLines(column = 'open_incidents', operator = '>') {
  return ['SELECT name FROM customers', 'WHERE active = 1', `  AND ${column} ${operator} 3;`];
}

export function drawCustomers(ctx, api) {
  const { C } = api;
  api.text(ctx, 'customers', 120, 288, 46, C.ink, 'left', 'serif');
  const columns = [130, 425, 640];
  ['name', 'active', 'open_incidents'].forEach((name, i) =>
    api.text(ctx, name, columns[i], 370, 29, C.cyan, 'left', 'mono'),
  );
  customers.forEach((row, r) =>
    row.forEach((value, c) =>
      api.text(ctx, String(value), columns[c], 445 + r * 75, 43, C.ink, 'left', 'mono'),
    ),
  );
}

export function drawQuery(ctx, api, column, operator = '>', linesVisible = 3) {
  const { C } = api;
  api.text(ctx, 'query-42_0', 1020, 288, 44, C.ink, 'left', 'mono');
  queryLines(column, operator)
    .slice(0, linesVisible)
    .forEach((line, i) =>
      api.text(ctx, line, 1020, 380 + i * 74, 37, i === 2 ? C.yellow : C.ink, 'left', 'mono'),
    );
}
