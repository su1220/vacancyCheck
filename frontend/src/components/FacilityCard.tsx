import { useState } from 'react';
import type { Facility, VacancyResult } from '../types';
import { checkVacancy, getVacancyResult } from '../api/client';
import { VacancyCalendar } from './VacancyCalendar';

interface FacilityCardProps {
  facility: Facility;
  onUpdate: (id: string, data: Partial<Facility>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FacilityCard({ facility, onUpdate, onDelete }: FacilityCardProps) {
  const [vacancyResult, setVacancyResult] = useState<VacancyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 空室チェック実行
  const handleCheck = async () => {
    try {
      setChecking(true);
      setError(null);
      const result = await checkVacancy(facility.id, facility.url);
      setVacancyResult(result);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '空室チェックに失敗しました');
    } finally {
      setChecking(false);
    }
  };

  // 既存の結果を表示
  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (vacancyResult) {
      setExpanded(true);
      return;
    }
    // まだ取得していない場合はサーバーから取得
    try {
      const result = await getVacancyResult(facility.id);
      setVacancyResult(result);
      setExpanded(true);
    } catch {
      // 結果がない場合は無視
      setExpanded(true);
    }
  };

  // お気に入りトグル
  const handleFavoriteToggle = async () => {
    await onUpdate(facility.id, { isFavorite: !facility.isFavorite });
  };

  // スクレイパータイプのバッジ色
  const scraperBadgeColor: Record<Facility['scraperType'], string> = {
    napcamp: 'bg-green-100 text-green-700',
    jalan: 'bg-blue-100 text-blue-700',
    rakuten: 'bg-red-100 text-red-700',
    generic: 'bg-gray-100 text-gray-600',
  };

  const scraperLabel: Record<Facility['scraperType'], string> = {
    napcamp: 'なっぷ',
    jalan: 'じゃらん',
    rakuten: '楽天トラベル',
    generic: '汎用',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* カードヘッダー */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* 施設名 */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800 truncate">{facility.name}</h3>
              <button
                onClick={handleFavoriteToggle}
                className="text-lg leading-none flex-shrink-0 hover:scale-110 transition-transform"
                title={facility.isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
              >
                {facility.isFavorite ? '★' : '☆'}
              </button>
            </div>
            {/* スクレイパーバッジ */}
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${scraperBadgeColor[facility.scraperType]}`}>
              {scraperLabel[facility.scraperType]}
            </span>
            {/* URL */}
            <a
              href={facility.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-500 hover:underline truncate mt-1"
            >
              {facility.url}
            </a>
            {/* メモ */}
            {facility.notes && (
              <p className="text-xs text-gray-500 mt-1">{facility.notes}</p>
            )}
            {/* 最終チェック日時 */}
            {facility.lastChecked && (
              <p className="text-xs text-gray-400 mt-1">
                最終チェック: {new Date(facility.lastChecked).toLocaleString('ja-JP')}
              </p>
            )}
          </div>

          {/* 操作ボタン */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {checking ? '確認中...' : '空室確認'}
            </button>
            {facility.lastChecked && (
              <button
                onClick={handleExpand}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {expanded ? '閉じる' : '結果を見る'}
              </button>
            )}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* 空室カレンダー（展開時） */}
      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {vacancyResult ? (
            <VacancyCalendar days={vacancyResult.days} fetchedAt={vacancyResult.fetchedAt} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              まだ空室データがありません。「空室確認」ボタンで取得してください。
            </p>
          )}
        </div>
      )}

      {/* 削除ボタン（フッター） */}
      <div className="px-4 pb-3 flex justify-end">
        <button
          onClick={() => {
            if (window.confirm(`「${facility.name}」を削除しますか？`)) {
              onDelete(facility.id);
            }
          }}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
