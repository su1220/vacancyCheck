import { useState } from 'react';

interface AddFacilityModalProps {
  onClose: () => void;
  onAdd: (data: { name?: string; url: string; notes?: string }) => Promise<void>;
}

export function AddFacilityModal({ onClose, onAdd }: AddFacilityModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('URLを入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onAdd({ url: url.trim(), name: name.trim() || undefined, notes: notes.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    // モーダル背景
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">施設を追加</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                施設URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.nap-camp.com/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* 名前入力（任意） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                施設名 <span className="text-gray-400 font-normal">（空欄の場合はURLから自動設定）</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：〇〇キャンプ場"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* メモ入力（任意） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メモ <span className="text-gray-400 font-normal">（任意）</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例：電源サイトのみ確認"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* ボタン */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '登録中...' : '追加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
