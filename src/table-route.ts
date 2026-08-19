export type TableFilters = Record<string, string>;

export interface TableRoute {
  query: string;
  filters: TableFilters;
}

/** Never resolve a private workspace module after its browser-local snapshot has been cleared. */
export function safeWorkbenchModuleId(active: string, hasPeakSnapshot: boolean, availableIds: string[]): string {
  if (!hasPeakSnapshot) return 'dashboard';
  return availableIds.includes(active) ? active : 'dashboard';
}

export function parseTableRoute(hash: string): TableRoute {
  const raw = hash.split('?')[1];
  if (!raw) return { query: '', filters: {} };
  const params = new URLSearchParams(raw);
  const filters: TableFilters = {};
  params.forEach((value, key) => {
    if (key !== 'q' && value) filters[key] = value;
  });
  return { query: params.get('q') ?? '', filters };
}

export function buildTableHash(id: string, query = '', filters: TableFilters = {}): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  Object.entries(filters)
    .filter(([key, value]) => key !== 'q' && Boolean(value))
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => params.set(key, value));
  const search = params.toString();
  return `#${id}${search ? `?${search}` : ''}`;
}
