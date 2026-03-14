import { ScraperPlugin, ScrapeOptions, VacancyDay } from '../types/index';
import { registerScraper } from './base';
import { getBrowser } from './browser';

// 空室カレンダーの1セルのデータ
interface CalendarDay {
  date: string;
  status: 'available' | 'full';
  price?: number;
}

// 楽天トラベル（https://travel.rakuten.co.jp）対応スクレイパー
// 空室カレンダーページのテーブルをDOMスクレイピングで取得する
const rakutenScraper: ScraperPlugin = {
  name: 'rakuten',

  matchUrl: (url: string): boolean => url.includes('travel.rakuten.co.jp'),

  scrape: async (url: string, options?: ScrapeOptions): Promise<VacancyDay[]> => {
    // URLからホテル番号を抽出（例: /HOTEL/138028/ → 138028）
    const match = url.match(/travel\.rakuten\.co\.jp\/HOTEL\/(\d+)/);
    if (!match) {
      throw new Error(`楽天トラベルのURLからホテル番号を取得できませんでした: ${url}`);
    }
    const hotelNo = match[1];

    // 改善A: 共有ブラウザを使い回し、コンテキストのみ新規作成
    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      // プラン一覧ページを開き、空室カレンダーリンクを取得
      await page.goto(
        `https://hotel.travel.rakuten.co.jp/hotelinfo/plan/${hotelNo}?f_flg=PLAN&f_heya_su=1&f_otona_su=2`,
        { waitUntil: 'domcontentloaded', timeout: 30000 }
      );

      // 空室カレンダーリンク（camp_id・f_syu）を抽出
      const calLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.thickbox')).filter(
          (el) => (el.textContent || '').includes('空室カレンダー')
        ) as HTMLAnchorElement[];

        // 重複を排除して返す（f_otona_su=2 のみ）
        const seen = new Set<string>();
        return links
          .map((a) => {
            const params = new URLSearchParams(a.href.split('?')[1] || '');
            const campId = params.get('f_camp_id') || '';
            const syu = params.get('f_syu') || '1';
            const planArea = a.closest('[data-role="planArea"]');
            const planName = planArea?.querySelector('h4')?.textContent?.trim() || '';
            return { campId, syu, planName };
          })
          .filter(({ campId, syu }) => {
            const key = `${campId}:${syu}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return campId !== '';
          });
      });

      if (!calLinks.length) {
        console.warn(`[rakuten] ホテル ${hotelNo} の空室カレンダーが見つかりませんでした`);
        return [];
      }

      // キーワード指定がある場合はプラン名で絞り込み、なければ最初のプランを使用
      const keyword = options?.planKeyword;
      let selected = calLinks[0];
      if (keyword) {
        const found = calLinks.find((l) => l.planName.includes(keyword));
        if (found) {
          selected = found;
        } else {
          console.warn(`[rakuten] キーワード "${keyword}" に一致するプランが見つかりません。最初のプランを使用します。`);
        }
      }
      console.log(`[rakuten] プラン選択: ${selected.planName} (campId: ${selected.campId}, syu: ${selected.syu})`);

      // 今月と来月のカレンダーページを取得
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1〜12
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      // f_hizuke: 今月は今日の日付、来月は来月1日（YYYYMMDD形式）
      const todayStr = `${year}${String(month).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const nextMonthStr = `${nextYear}${String(nextMonth).padStart(2, '0')}01`;
      const hizukeDates = [todayStr, nextMonthStr];

      const today = now.toISOString().split('T')[0];
      // 日付をキーにMapで重複排除
      const daysMap = new Map<string, VacancyDay>();

      for (const hizuke of hizukeDates) {
        const calUrl =
          `https://hotel.travel.rakuten.co.jp/hotelinfo/plan/` +
          `?f_no=${hotelNo}&f_flg=PLAN&f_heya_su=1` +
          `&f_camp_id=${selected.campId}&f_syu=${selected.syu}` +
          `&f_hizuke=${hizuke}&f_otona_su=2&f_thick=1&TB_iframe=true`;

        // networkidleで待機（カレンダーテーブルはJS実行後に表示される）
        await page.goto(calUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // カレンダーテーブルをパース
        const days = await page.evaluate((): CalendarDay[] => {
          const table = document.querySelector('table');
          if (!table) return [];

          // ページの月情報を取得（例: "2026年03月"）
          const monthLi = Array.from(document.querySelectorAll('li')).find((li) =>
            /\d{4}年\d{2}月/.test(li.textContent?.trim() || '')
          );
          const monthMatch = (monthLi?.textContent?.trim() || '').match(/(\d{4})年(\d{2})月/);
          if (!monthMatch) return [];
          const calYear = monthMatch[1];
          const calMonth = monthMatch[2];

          const results: CalendarDay[] = [];
          const rows = table.querySelectorAll('tbody tr');

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell) => {
              const link = cell.querySelector('a');

              if (link) {
                // 空室あり：リンクのURLパラメータから正確な日付を取得
                const params = new URLSearchParams(link.href.split('?')[1] || '');
                const y = params.get('f_nen1');
                const m = params.get('f_tuki1');
                const d = params.get('f_hi1');
                if (!y || !m || !d) return;

                const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                // 価格はリンク内の3番目の子要素（span）から取得
                const priceText = (link.children[2]?.textContent || '').trim();
                const priceNum = parseInt(priceText.replace(/,/g, ''), 10);
                results.push({
                  date,
                  status: 'available',
                  price: isNaN(priceNum) ? undefined : priceNum,
                });
              } else {
                // ×（満室）のみ処理。-（過去/対象外）はスキップ
                const children = Array.from(cell.children);
                const dayText = (children[0]?.textContent || '').trim();
                const statusText = (children[1]?.textContent || '').trim();
                if (statusText !== '×') return;

                // 日付を計算：「4/1」形式（月をまたぐ場合）と「14」形式（通常）
                let date = '';
                if (dayText.includes('/')) {
                  const parts = dayText.split('/');
                  const m = parseInt(parts[0], 10);
                  const d = parseInt(parts[1], 10);
                  // 12月カレンダーに1月が表示される場合のみ翌年、それ以外は同年
                  const dateYear = (parseInt(calMonth, 10) === 12 && m === 1) ? String(parseInt(calYear, 10) + 1) : calYear;
                  date = `${dateYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                } else {
                  const d = parseInt(dayText, 10);
                  if (isNaN(d)) return;
                  date = `${calYear}-${calMonth}-${String(d).padStart(2, '0')}`;
                }
                results.push({ date, status: 'full' });
              }
            });
          });

          return results;
        });

        for (const day of days) {
          if (day.date < today) continue;
          daysMap.set(day.date, { date: day.date, status: day.status, price: day.price });
        }
      }

      return Array.from(daysMap.values());
    } finally {
      // 改善A: ブラウザは閉じずコンテキストのみ閉じる
      await context.close();
    }
  },
};

export function registerRakutenScraper(): void {
  registerScraper(rakutenScraper);
}
