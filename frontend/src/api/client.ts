import type { Facility, VacancyResult } from '../types';

// 本番環境では VITE_API_BASE_URL にバックエンドのURLを設定する
// 開発環境ではViteのプロキシ経由で /api → localhost:3001 に転送される
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

// 施設一覧取得
export async function getFacilities(): Promise<Facility[]> {
  const res = await fetch(`${BASE_URL}/facilities`);
  if (!res.ok) throw new Error('施設一覧の取得に失敗しました');
  return res.json();
}

// 施設登録
export async function addFacility(data: {
  name?: string;
  url: string;
  notes?: string;
}): Promise<Facility> {
  const res = await fetch(`${BASE_URL}/facilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? '施設の登録に失敗しました');
  }
  return res.json();
}

// 施設更新
export async function updateFacility(
  id: string,
  data: Partial<Facility>
): Promise<Facility> {
  const res = await fetch(`${BASE_URL}/facilities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('施設情報の更新に失敗しました');
  return res.json();
}

// 施設削除
export async function deleteFacility(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/facilities/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('施設の削除に失敗しました');
}

// 空室チェック実行
export async function checkVacancy(
  facilityId: string,
  url: string
): Promise<VacancyResult> {
  const res = await fetch(`${BASE_URL}/vacancy/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ facilityId, url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? '空室チェックに失敗しました');
  }
  return res.json();
}

// 空室チェック結果取得
export async function getVacancyResult(
  facilityId: string
): Promise<VacancyResult> {
  const res = await fetch(`${BASE_URL}/vacancy/${facilityId}`);
  if (!res.ok) throw new Error('空室データの取得に失敗しました');
  return res.json();
}
