// Russian has three plural forms depending on the last one/two digits:
// 1, 21, 31... -> one ("1 рецензия")
// 2-4, 22-24... -> few ("2 рецензии")
// 0, 5-20, 25-30... -> many ("5 рецензий")
export function pluralize(n, [one, few, many]) {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function withCount(n, forms) {
  return `${n} ${pluralize(n, forms)}`;
}
