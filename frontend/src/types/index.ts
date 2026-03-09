// 施設情報
export interface Facility {
  id: string;
  name: string;
  url: string;
  scraperType: 'napcamp' | 'jalan' | 'rakuten' | 'generic';
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  lastChecked?: string;
}

// 空室情報（日付ごと）
export interface VacancyDay {
  date: string; // "2026-03-08"
  status: 'available' | 'full' | 'unknown';
  availableCount?: number;
  price?: number;
  note?: string;
}

// 空室チェック結果
export interface VacancyResult {
  facilityId: string;
  fetchedAt: string;
  days: VacancyDay[];
}
