export interface PriceRangeRow {
  contract_months: number;
  annual_km: number;
  min_monthly: number;
  max_monthly: number;
}

interface PriceCompareTableProps {
  priceRanges: PriceRangeRow[];
}

const CONTRACT_MONTHS = [36, 48, 60] as const;
const ANNUAL_KM = [10000, 20000, 30000, 40000] as const;

const KM_LABELS: Record<number, string> = {
  10000: '연 1만 km',
  20000: '연 2만 km',
  30000: '연 3만 km',
  40000: '연 4만 km+',
};

function formatManwon(value: number): string {
  return `${(value / 10000).toLocaleString()}만`;
}

export function PriceCompareTable({ priceRanges }: PriceCompareTableProps) {
  const priceMap = new Map<string, { min: number; max: number }>();
  for (const row of priceRanges) {
    const key = `${row.contract_months}-${row.annual_km}`;
    priceMap.set(key, { min: row.min_monthly, max: row.max_monthly });
  }

  const minOverall = priceRanges.length > 0
    ? Math.min(...priceRanges.map((r) => r.min_monthly))
    : null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-accent bg-white">
      <table className="w-full min-w-[280px] border-collapse">
        <thead>
          <tr>
            <th className="bg-primary text-white py-2.5 px-2 text-xs font-semibold text-left pl-4">
              계약 기간
            </th>
            {ANNUAL_KM.map((km) => (
              <th
                key={km}
                className="bg-primary text-white py-2.5 px-2 text-xs font-semibold text-center"
              >
                {KM_LABELS[km]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CONTRACT_MONTHS.map((months, rowIdx) => (
            <tr
              key={months}
              className={rowIdx % 2 === 1 ? 'bg-surface-secondary' : 'bg-white'}
            >
              <td className="py-2.5 px-2 pl-4 text-[13px] text-text border-b border-border-solid">
                {months}개월
              </td>
              {ANNUAL_KM.map((km) => {
                const price = priceMap.get(`${months}-${km}`);
                const cellContent = price ? (
                  <span
                    className={
                      minOverall != null && price.min === minOverall
                        ? 'text-primary font-semibold'
                        : 'text-text'
                    }
                  >
                    {formatManwon(price.min)}~
                  </span>
                ) : (
                  <span className="text-text-sub text-sm">상담 문의</span>
                );
                return (
                  <td
                    key={km}
                    className="py-2.5 px-2 text-[13px] text-center border-b border-border-solid"
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
