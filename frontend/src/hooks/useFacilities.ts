import { useState, useEffect, useCallback } from 'react';
import type { Facility } from '../types';
import { getFacilities, addFacility, updateFacility, deleteFacility } from '../api/client';

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 施設一覧の取得
  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFacilities();
      setFacilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // 施設を追加
  const add = useCallback(
    async (data: { name?: string; url: string; notes?: string }) => {
      const newFacility = await addFacility(data);
      setFacilities((prev) => [...prev, newFacility]);
      return newFacility;
    },
    []
  );

  // 施設を更新
  const update = useCallback(async (id: string, data: Partial<Facility>) => {
    const updated = await updateFacility(id, data);
    setFacilities((prev) => prev.map((f) => (f.id === id ? updated : f)));
    return updated;
  }, []);

  // 施設を削除
  const remove = useCallback(async (id: string) => {
    await deleteFacility(id);
    setFacilities((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { facilities, loading, error, refetch: fetchFacilities, add, update, remove };
}
