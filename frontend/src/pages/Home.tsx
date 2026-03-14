import { useState } from 'react';
import { useFacilities } from '../hooks/useFacilities';
import { FacilityList } from '../components/FacilityList';
import { AddFacilityModal } from '../components/AddFacilityModal';
import { checkAllVacancies } from '../api/client';

export function Home() {
  const { facilities, loading, error, serverWaking, add, update, remove, refetch } = useFacilities();
  const [showModal, setShowModal] = useState(false);
  // 改善D: 全施設チェック中フラグ
  const [checkingAll, setCheckingAll] = useState(false);

  // 全施設の空室チェックを一括実行
  const handleCheckAll = async () => {
    setCheckingAll(true);
    try {
      await checkAllVacancies();
      // 結果反映のためページリロードに近い再取得
      await refetch();
    } finally {
      setCheckingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">空室チェッカー</h1>
            <p className="text-xs text-gray-400">キャンプ場・宿泊施設の空室を一括管理</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 改善D: 全施設チェックボタン */}
            {facilities.length > 0 && (
              <button
                onClick={handleCheckAll}
                disabled={checkingAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingAll ? 'チェック中...' : '全施設チェック'}
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              + 施設を追加
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ローディング */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2 animate-spin inline-block">⟳</div>
            <p>読み込み中...</p>
            {/* 改善C: サーバー起動中メッセージ */}
            {serverWaking && (
              <p className="mt-3 text-sm text-amber-500 font-medium">
                サーバー起動中です...
                <br />
                <span className="text-xs font-normal text-amber-400">
                  初回アクセスは30〜60秒かかる場合があります
                </span>
              </p>
            )}
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600">
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-red-400">
              バックエンドサーバー（http://localhost:3001）が起動しているか確認してください
            </p>
          </div>
        )}

        {/* 施設一覧 */}
        {!loading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {facilities.length > 0
                  ? `${facilities.length}件の施設`
                  : ''}
              </p>
            </div>
            <FacilityList
              facilities={facilities}
              onUpdate={async (id, data) => { await update(id, data); }}
              onDelete={remove}
            />
          </>
        )}
      </main>

      {/* 施設追加モーダル */}
      {showModal && (
        <AddFacilityModal
          onClose={() => setShowModal(false)}
          onAdd={async (data) => { await add(data); }}
        />
      )}
    </div>
  );
}
