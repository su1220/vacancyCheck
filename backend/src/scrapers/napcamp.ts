import { chromium } from 'playwright';
import { ScraperPlugin, ScrapeOptions, VacancyDay } from '../types/index';
import { registerScraper } from './base';

// なっぷAPIのレスポンス型
interface NapcampPlan {
  id: number;
  site_name: string;
  status: number;
}

interface NapcampReservationDay {
  date: [number, number, number]; // [year, month, day]
  status: number; // 1=空室, 2=残りわずか, 3=過去/設定なし, 4=満室
  price: {
    guideline: number;
    base: number;
    unit: number;
  };
}

// なっぷAPIのstatusコードを変換
function convertStatus(status: number): VacancyDay['status'] {
  switch (status) {
    case 1: return 'available'; // 空室あり
    case 2: return 'available'; // 残りわずか（空室扱い）
    case 4: return 'full';      // 満室
    default: return 'unknown';  // 過去日・設定なし
  }
}

// なっぷ（https://www.nap-camp.com）対応スクレイパー
// DOMスクレイピングではなく公式APIを直接呼び出す
const napcampScraper: ScraperPlugin = {
  name: 'napcamp',

  matchUrl: (url: string): boolean => url.includes('nap-camp.com'),

  scrape: async (url: string, options?: ScrapeOptions): Promise<VacancyDay[]> => {
    // URLからキャンプ場IDを抽出（例: /nagano/12204 → 12204）
    const match = url.match(/nap-camp\.com\/[^/]+\/(\d+)/);
    if (!match) {
      throw new Error(`なっぷのURLからキャンプ場IDを取得できませんでした: ${url}`);
    }
    const campsiteId = match[1];

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      // まずページを開いてCookieを取得（API認証に必要）
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // プラン一覧をAPIで取得
      const plansRes = await page.evaluate(async (id: string) => {
        const res = await fetch(`/api/campsite/${id}/plans`);
        return res.ok ? res.json() : [];
      }, campsiteId);

      // APIレスポンスは { list: [...] } 形式
      const plans = ((plansRes as { list?: NapcampPlan[] }).list ?? []) as NapcampPlan[];
      if (!plans || plans.length === 0) {
        console.warn(`[napcamp] キャンプ場 ${campsiteId} のプランが見つかりませんでした`);
        return [];
      }

      // キーワード指定がある場合はプラン名で絞り込み、なければ最初の有効プランを使用
      const keyword = options?.planKeyword;
      let activePlan: NapcampPlan | undefined;
      if (keyword) {
        activePlan = plans.find(
          (p: NapcampPlan) => p.status === 1 && p.site_name.includes(keyword)
        );
        if (!activePlan) {
          console.warn(`[napcamp] キーワード "${keyword}" に一致するプランが見つかりません。最初のプランを使用します。`);
        }
      }
      activePlan ??= plans.find((p: NapcampPlan) => p.status === 1) ?? plans[0];
      console.log(`[napcamp] プラン選択: ${activePlan.site_name} (ID: ${activePlan.id})`);

      // 今月と来月の空室データを取得
      const now = new Date();
      const months = [
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`,
      ];

      const allDays: VacancyDay[] = [];

      for (const month of months) {
        const reservationData = await page.evaluate(
          async (params: { id: string; planId: number; month: string }) => {
            const res = await fetch(
              `/api/campsite/${params.id}/plans/${params.planId}/reservation?month=${params.month}`
            );
            return res.ok ? res.json() : [];
          },
          { id: campsiteId, planId: activePlan.id, month }
        );

        const days = reservationData as NapcampReservationDay[];
        const today = new Date().toISOString().split('T')[0];

        for (const day of days) {
          const [y, m, d] = day.date;
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

          // 過去の日付はスキップ
          if (dateStr < today) continue;

          allDays.push({
            date: dateStr,
            status: convertStatus(day.status),
            price: day.price.guideline > 0 ? day.price.guideline : undefined,
          });
        }
      }

      return allDays;
    } finally {
      await browser.close();
    }
  },
};

export function registerNapcampScraper(): void {
  registerScraper(napcampScraper);
}
