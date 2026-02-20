'use client';

const MAX_ROWS = 500;

function parseCsv(raw: string): string[][] {
  const lines = raw.trim().split('\n');
  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

interface CsvViewerProps {
  content: string;
}

export function CsvViewer({ content }: CsvViewerProps) {
  if (!content.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">This CSV file is empty.</p>
      </div>
    );
  }

  const allRows = parseCsv(content);
  if (allRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">Could not parse CSV data.</p>
      </div>
    );
  }

  const [headerRow, ...dataRows] = allRows;
  const displayRows = dataRows.slice(0, MAX_ROWS);
  const hiddenCount = dataRows.length - displayRows.length;

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{headerRow.length} column{headerRow.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{dataRows.length} row{dataRows.length !== 1 ? 's' : ''}</span>
        {hiddenCount > 0 && (
          <>
            <span>·</span>
            <span className="text-orange-500 font-medium">
              Showing first {MAX_ROWS} rows
            </span>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headerRow.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {header || `Column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {displayRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
              >
                {headerRow.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-2.5 text-gray-700 max-w-[200px] truncate"
                    title={row[colIdx] || ''}
                  >
                    {row[colIdx] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Truncation notice */}
      {hiddenCount > 0 && (
        <div className="text-center py-3 text-sm text-gray-500 bg-orange-50 rounded-xl border border-orange-200">
          <span className="text-orange-600 font-medium">
            {hiddenCount.toLocaleString()} more row{hiddenCount !== 1 ? 's' : ''} not shown.
          </span>{' '}
          Download the file to see the full dataset.
        </div>
      )}
    </div>
  );
}
