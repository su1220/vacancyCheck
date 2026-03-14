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

// YYYY-MM-DD文字列をローカル時刻でパース（タイムゾーンずれ防止）
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 指定日付の週の月曜日を返す
function getWeekMonday(dateStr: string): Date {
  const date = parseLocalDate(dateStr);
  const day = date.getDay(); // 0=日, 1=月, ..., 6=土
  const diff = day === 0 ? -6 : 1 - day; // 月曜日まで遡る
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

// DateをYYYY-MM-DD文字列に変換
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  // 日付→データのマップ
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // 最初のデータ日の週の月曜日からスタート
  const startMonday = getWeekMonday(days[0].date);

  // 総ページ数：月曜日から最終データ日まで何ページ分か
  const lastDate = parseLocalDate(days[days.length - 1].date);
  const totalDays = Math.ceil((lastDate.getTime() - startMonday.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalPages = Math.ceil(totalDays / PAGE_SIZE);

  // 現在ページの28日分の日付配列を生成
  const pageStart = new Date(startMonday);
  pageStart.setDate(startMonday.getDate() + page * PAGE_SIZE);
  const pageDates: string[] = [];
  for (let i = 0; i < PAGE_SIZE; i++) {
    const d = new Date(pageStart);
    d.setDate(pageStart.getDate() + i);
    pageDates.push(toDateStr(d));
  }

  // 表示期間のラベル（例: 3/9 〜 4/5）
  const periodLabel = pageDates[0] && pageDates[pageDates.length - 1]
    ? `${formatDate(pageDates[0]).md} 〜 ${formatDate(pageDates[pageDates.length - 1]).md}`
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
        {pageDates.map((dateStr) => {
          const day = dayMap.get(dateStr);
          const { md, weekday } = formatDate(dateStr);
          const weekdayColor = getWeekdayColor(dateStr);

          // データなし（月曜始まりのパディング日）
          if (!day) {
            return (
              <div
                key={dateStr}
                className="border rounded-lg p-2 text-center text-xs bg-gray-50 border-gray-100 opacity-40"
              >
                <div className={`font-medium ${weekdayColor}`}>{md}</div>
                <div className={`text-xs mb-1 ${weekdayColor}`}>({weekday})</div>
                <div className="text-gray-300">-</div>
              </div>
            );
          }

          return (
            <div
              key={dateStr}
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
