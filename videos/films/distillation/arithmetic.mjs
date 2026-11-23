import assert from 'node:assert/strict';
export const kl = (teacher, student) => {
  assert(teacher.length === student.length && teacher.length > 0);
  for (const p of [...teacher, ...student]) assert(Number.isFinite(p) && p >= 0);
  return teacher.reduce(
    (sum, v, i) =>
      v === 0 ? sum : student[i] === 0 ? Infinity : sum + v * Math.log(v / student[i]),
    0,
  );
};
