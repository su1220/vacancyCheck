import type { Facility } from '../types';
import { FacilityCard } from './FacilityCard';

interface FacilityListProps {
  facilities: Facility[];
  onUpdate: (id: string, data: Partial<Facility>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FacilityList({ facilities, onUpdate, onDelete }: FacilityListProps) {
  if (facilities.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-4">⛺</div>
        <p className="text-lg font-medium mb-2">施設が登録されていません</p>
        <p className="text-sm">「施設を追加」ボタンでURLを登録してください</p>
      </div>
    );
  }

  // お気に入りを先頭に表示
  const sorted = [...facilities].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((facility) => (
        <FacilityCard
          key={facility.id}
          facility={facility}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
