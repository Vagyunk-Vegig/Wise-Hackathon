type Named = {
  id: string;
  username: string;
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function damerau(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1).fill(0));
  for (let leftIndex = 0; leftIndex <= left.length; leftIndex += 1) rows[leftIndex][0] = leftIndex;
  for (let rightIndex = 0; rightIndex <= right.length; rightIndex += 1) rows[0][rightIndex] = rightIndex;
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      rows[leftIndex][rightIndex] = Math.min(rows[leftIndex - 1][rightIndex] + 1, rows[leftIndex][rightIndex - 1] + 1, rows[leftIndex - 1][rightIndex - 1] + cost);
      const swapped = leftIndex > 1 && rightIndex > 1 && left[leftIndex - 1] === right[rightIndex - 2] && left[leftIndex - 2] === right[rightIndex - 1];
      if (swapped) rows[leftIndex][rightIndex] = Math.min(rows[leftIndex][rightIndex], rows[leftIndex - 2][rightIndex - 2] + 1);
    }
  }
  return rows[left.length][right.length];
}

function scoreUsername(name: string, query: string) {
  if (!name || !query) return null;
  if (name === query) return 1000;
  if (name.startsWith(query)) return 800 - (name.length - query.length);
  const containsAt = name.indexOf(query);
  if (containsAt >= 0) return 600 - containsAt * 5 - (name.length - query.length);
  if (query.length < 3) return null;

  if (name[0] !== query[0]) return null;
  const limit = Math.max(1, Math.floor(query.length / 4));
  let best = Infinity;
  for (const size of [query.length - 1, query.length, query.length + 1]) {
    if (size > 0 && size <= name.length) best = Math.min(best, damerau(query, name.slice(0, size)));
  }
  if (Math.abs(name.length - query.length) <= limit) best = Math.min(best, damerau(query, name));
  if (best > limit) return null;
  return 300 - best * 50;
}

export function searchByUsername<T extends Named>(users: T[], query: string, excludeId?: string | null, limit = 8) {
  const needle = normalize(query);
  if (!needle) return [];
  return users
    .filter((user) => user.id !== excludeId)
    .map((user) => ({ user, score: scoreUsername(normalize(user.username), needle) }))
    .filter((entry): entry is { user: T; score: number } => entry.score !== null)
    .sort((left, right) => right.score - left.score || left.user.username.localeCompare(right.user.username))
    .slice(0, limit)
    .map((entry) => entry.user);
}
