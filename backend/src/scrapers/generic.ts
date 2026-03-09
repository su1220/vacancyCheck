import { chromium } from 'playwright';
import { ScraperPlugin, ScrapeOptions, VacancyDay } from '../types/index';
import { registerScraper } from './base';

// 汎用スクレイパー（フォールバック用）
// DOM解析で空室情報を推測する
const genericScraper: ScraperPlugin = {
  name: 'generic',

  // 汎用スクレイパーはすべてのURLにマッチ（フォールバック用）
  matchUrl: (_url: string): boolean => true,

  scrape: async (url: string, _options?: ScrapeOptions): Promise<VacancyDay[]> => {
    const browser = await chromium.launch({
      headless: true,
      // Linuxサーバー（Renderなど）ではサンドボックスを無効化する必要がある
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // ページ内のカレンダー要素を探す
      const days = await page.evaluate(() => {
        const results: Array<{
          date: string;
          status: 'available' | 'full' | 'unknown';
          availableCount?: number;
          price?: number;
          note?: string;
        }> = [];

        // 一般的なカレンダーのセレクタパターンを試みる
        const calendarCells = document.querySelectorAll(
          'td[data-date], .calendar-day, .fc-day, [class*="calendar"] td, table.calendar td'
        );

        calendarCells.forEach((cell: Element) => {
          const dateAttr =
            cell.getAttribute('data-date') ||
            cell.getAttribute('data-day') ||
            cell.getAttribute('data-ymd');

          if (!dateAttr) return;

          // 空室/満室の判定（テキストやクラスから推測）
          const text = cell.textContent?.trim() ?? '';
          const classList = cell.className;

          let status: 'available' | 'full' | 'unknown' = 'unknown';
          if (
            classList.includes('available') ||
            classList.includes('open') ||
            text.includes('○') ||
            text.includes('空')
          ) {
            status = 'available';
          } else if (
            classList.includes('full') ||
            classList.includes('closed') ||
            classList.includes('booked') ||
            text.includes('×') ||
            text.includes('満')
          ) {
            status = 'full';
          }

          // 料金の抽出（数字+円パターン）
          const priceMatch = text.match(/([0-9,]+)円/);
          const price = priceMatch
            ? parseInt(priceMatch[1].replace(',', ''), 10)
            : undefined;

          results.push({ date: dateAttr, status, price });
        });

        return results;
      });

      return days as VacancyDay[];
    } finally {
      await browser.close();
    }
  },
};

// 汎用スクレイパーを最後に登録（フォールバック）
export function registerGenericScraper(): void {
  registerScraper(genericScraper);
}
