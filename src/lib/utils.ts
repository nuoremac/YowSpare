export function fmtDate(ts: number) {
  return new Date(ts).toLocaleString();
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
