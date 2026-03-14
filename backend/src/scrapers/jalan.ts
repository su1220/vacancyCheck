import { ScraperPlugin, VacancyDay } from '../types/index';
import { registerScraper } from './base';
import { getBrowser } from './browser';

// じゃらんnet（https://www.jalan.net）対応スクレイパー
// ホテル詳細ページの空室カレンダー（SSRで初期描画済み）をDOMスクレイピングで取得
const jalanScraper: ScraperPlugin = {
  name: 'jalan',

  matchUrl: (url: string): boolean => url.includes('jalan.net'),

  scrape: async (url: string): Promise<VacancyDay[]> => {
    // URLから宿番号を抽出（例: /yad362809/ → 362809）
    const match = url.match(/jalan\.net\/yad(\d+)/);
    if (!match) {
      throw new Error(`じゃらんのURLから宿番号を取得できませんでした: ${url}`);
    }
    const yadNo = match[1];

    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // ロケールを日本語に設定
      locale: 'ja-JP',
      extraHTTPHeaders: {
        'Accept-Language': 'ja-JP,ja;q=0.9',
      },
    });
    const page = await context.newPage();

    try {
      // ホテル詳細ページを開く
      // networkidle は広告・アナリティクス系リクエストが永続するため使わない
      await page.goto(
        `https://www.jalan.net/yad${yadNo}/`,
        { waitUntil: 'domcontentloaded', timeout: 30000 }
      );

      // カレンダーのロード完了 or 失敗（APIブロック等）を待機（最大20秒）
      // - 成功: .calendar-cell.day が出現
      // - 失敗: .jsc-room-calendar が非表示または削除される
      const calendarLoaded = await page.waitForFunction(
        () => {
          const cells = document.querySelectorAll('.calendar-cell.day');
          if (cells.length > 0) return true;
          const cal = document.querySelector('.jsc-room-calendar') as HTMLElement | null;
          // カレンダーが削除済み or 非表示 → ロード失敗と判断
          if (!cal) return true;
          if (cal.style.display === 'none' || window.getComputedStyle(cal).display === 'none') return true;
          return false;
        },
        { timeout: 20000 }
      ).catch(() => null);

      // セルが存在するか最終確認
      const cellCount = await page.$$eval('.calendar-cell.day', (els) => els.length).catch(() => 0);
      if (cellCount === 0) {
        console.warn(`[jalan] 宿番号 ${yadNo}: カレンダーを取得できませんでした（APIブロックまたはタイムアウト）`);
        return [];
      }

      // カレンダーからセルを抽出する関数
      const extractCells = (): Promise<VacancyDay[]> =>
        page.evaluate((): VacancyDay[] => {
          const cells = Array.from(
            document.querySelectorAll('.calendar-cell.day:not(.adjacent-month)')
          );
          return cells
            .filter((c) => !c.classList.contains('past') && !c.classList.contains('inactive'))
            .flatMap((c) => {
              const dateMatch = c.className.match(/calendar-day-(\d{4}-\d{2}-\d{2})/);
              if (!dateMatch) return [];

              const date = dateMatch[1];
              const numEl = c.querySelector('.calendar-number');
              const availableCount = numEl
                ? parseInt(numEl.textContent?.trim() ?? '', 10)
                : undefined;

              let status: VacancyDay['status'];
              if (c.querySelector('.in-stock')) {
                status = 'available';
              } else if (c.querySelector('.little-stock')) {
                status = 'available';
              } else if (c.querySelector('.out-of-stock')) {
                status = 'full';
              } else {
                return []; // ステータス不明はスキップ
              }

              return [{ date, status, availableCount: isNaN(availableCount!) ? undefined : availableCount }];
            }) as VacancyDay[];
        });

      // 今月のデータを取得
      const thisMonthDays = await extractCells();

      // 次月ボタンをクリックしてカレンダーを更新
      const currentMonth = await page.$eval('.calendar-month', (el) => el.textContent?.trim());
      await page.$eval('.clndr-next-button', (el) => (el as HTMLElement).click());

      // 月表示が変わるまで待機（最大3秒）
      await page.waitForFunction(
        (prevMonth: string) => {
          const monthEl = document.querySelector('.calendar-month');
          return monthEl?.textContent?.trim() !== prevMonth;
        },
        currentMonth,
        { timeout: 3000 }
      ).catch(() => {
        console.warn('[jalan] 次月への移動がタイムアウトしました');
      });

      // 次月のデータを取得
      const nextMonthDays = await extractCells();

      // 全データをマージ（日付をキーに重複排除）
      const today = new Date().toISOString().split('T')[0];
      const daysMap = new Map<string, VacancyDay>();

      for (const day of [...thisMonthDays, ...nextMonthDays]) {
        if (day.date < today) continue;
        daysMap.set(day.date, day);
      }

      console.log(`[jalan] 宿番号 ${yadNo}: ${daysMap.size}日分のデータを取得`);
      return Array.from(daysMap.values());
    } finally {
      await context.close();
    }
  },
};

export function registerJalanScraper(): void {
  registerScraper(jalanScraper);
}
