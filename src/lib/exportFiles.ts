export type ExportRows = Array<Array<unknown>>;

function toCsvCell(value: unknown) {
  const s = value == null ? "" : String(value);
  return `"${s.replaceAll('"', '""')}"`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadCsv(filename: string, headers: string[], rows: ExportRows) {
  const content = [headers.map(toCsvCell).join(","), ...rows.map((r) => r.map(toCsvCell).join(","))].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printTablePdf({
  title,
  headers,
  rows,
  subtitle,
}: {
  title: string;
  headers: string[];
  rows: ExportRows;
  subtitle?: string;
}) {
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return false;

  const safeTitle = escapeHtml(title);
  const generatedAt = escapeHtml(new Date().toLocaleString());

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 32px; color: #0f172a; font-family: Inter, Arial, sans-serif; }
    h1 { margin: 0; font-size: 24px; line-height: 1.2; }
    .meta { margin-top: 8px; color: #64748b; font-size: 12px; }
    table { width: 100%; margin-top: 24px; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    @page { margin: 18mm; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${subtitle ? `<div class="meta">${escapeHtml(subtitle)}</div>` : ""}
  <div class="meta">Generated ${generatedAt}</div>
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${
        rows.length
          ? rows
              .map((row) => `<tr>${headers.map((_, index) => `<td>${escapeHtml(row[index])}</td>`).join("")}</tr>`)
              .join("")
          : `<tr><td colspan="${headers.length}">No data</td></tr>`
      }
    </tbody>
  </table>
  <script>window.onload=function(){setTimeout(function(){window.print()},100)}<\/script>
</body>
</html>`);
  win.document.close();
  win.focus();
  return true;
}
