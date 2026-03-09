import { useState } from 'react';
import type { VacancyDay } from '../types';

interface VacancyCalendarProps {
  days: VacancyDay[];
  fetchedAt: string;
}

const PAGE_SIZE = 28; // 4週分

// 空室ステータスに応じたスタイル
function getStatusStyle(status: VacancyDay['status']): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'full':
      return 'bg-red-100 text-red-600 border-red-200';
    case 'unknown':
      return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

// 空室ステータスの表示テキスト
function getStatusText(status: VacancyDay['status']): string {
  switch (status) {
    case 'available':
      return '○';
    case 'full':
      return '×';
    case 'unknown':
      return '-';
  }
}

// 日付を "M/D (曜日)" 形式にフォーマット
function formatDate(dateStr: string): { md: string; weekday: string } {
  const date = new Date(dateStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const md = `${date.getMonth() + 1}/${date.getDate()}`;
  const weekday = weekdays[date.getDay()] ?? '';
  return { md, weekday };
}

// 曜日に応じたテキスト色
function getWeekdayColor(dateStr: string): string {
  const day = new Date(dateStr).getDay();
  if (day === 0) return 'text-red-500';  // 日曜
  if (day === 6) return 'text-blue-500'; // 土曜
  return 'text-gray-600';
}

export function VacancyCalendar({ days, fetchedAt }: VacancyCalendarProps) {
  const [page, setPage] = useState(0);

  if (days.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        空室データがありません
      </div>
    );
  }

  const totalPages = Math.ceil(days.length / PAGE_SIZE);
  const visibleDays = days.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // 表示期間のラベル（例: 3/9 〜 4/5）
  const firstDay = visibleDays[0];
  const lastDay = visibleDays[visibleDays.length - 1];
  const periodLabel = firstDay && lastDay
    ? `${formatDate(firstDay.date).md} 〜 ${formatDate(lastDay.date).md}`
    : '';

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">
        最終取得: {new Date(fetchedAt).toLocaleString('ja-JP')}
      </p>

      {/* ページナビゲーション */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 0}
          className="px-2 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          ⏪ 前の4週
        </button>
        <span className="text-sm text-gray-600 font-medium">{periodLabel}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages - 1}
          className="px-2 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          次の4週 ⏩
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {visibleDays.map((day) => {
          const { md, weekday } = formatDate(day.date);
          const weekdayColor = getWeekdayColor(day.date);
          return (
            <div
              key={day.date}
              className={`border rounded-lg p-2 text-center text-xs ${getStatusStyle(day.status)}`}
              title={day.note}
            >
              <div className={`font-medium ${weekdayColor}`}>{md}</div>
              <div className={`text-xs mb-1 ${weekdayColor}`}>({weekday})</div>
              <div className="font-bold text-base">{getStatusText(day.status)}</div>
              {day.availableCount !== undefined && (
                <div className="text-xs mt-0.5">残{day.availableCount}</div>
              )}
              {day.price !== undefined && (
                <div className="text-xs mt-0.5">¥{day.price.toLocaleString()}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ページ数表示 */}
      <div className="text-center text-xs text-gray-400 mt-2">
        {page + 1} / {totalPages} ページ
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-green-100 border border-green-200 rounded inline-block" />
          空室あり
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-red-100 border border-red-200 rounded inline-block" />
          満室
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-gray-100 border border-gray-200 rounded inline-block" />
          不明
        </span>
      </div>
    </div>
  );
}
