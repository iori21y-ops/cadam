'use client';

export interface CallbackItem {
  id: string;
  name: string;
  phone: string;
  carDisplay: string;
  callbackTime: string | null;
  memo: string | null;
}

interface CallbackListProps {
  items: CallbackItem[];
}

function formatCallbackTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function truncateMemo(memo: string | null, maxLen: number): string {
  if (!memo) return '—';
  return memo.length > maxLen ? `${memo.slice(0, maxLen)}...` : memo;
}

export function CallbackList({ items }: CallbackListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-[#FEF9E7] border border-warning/30 p-4">
        <p className="text-sm text-gray-500">오늘 예정된 콜백이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 rounded-xl bg-[#FEF9E7] border border-warning/30 p-4"
        >
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="font-bold text-gray-900">{item.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                {item.carDisplay}
              </span>
            </div>
            <span className="text-sm font-semibold text-warning shrink-0">
              {formatCallbackTime(item.callbackTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${item.phone.replace(/\D/g, '')}`}
              className="text-sm font-medium text-accent hover:underline"
            >
              {item.phone}
            </a>
          </div>
          {item.memo && (
            <p className="text-xs text-gray-500">
              메모: {truncateMemo(item.memo, 50)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
