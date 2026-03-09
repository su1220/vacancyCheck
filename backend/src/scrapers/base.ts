import { ScraperPlugin, ScrapeOptions, VacancyDay } from '../types/index';

// スクレイパーレジストリ（登録済みスクレイパーの管理）
const scraperRegistry: ScraperPlugin[] = [];

// スクレイパーを登録
export function registerScraper(scraper: ScraperPlugin): void {
  scraperRegistry.push(scraper);
}

// URLに対応するスクレイパーを選択
export function selectScraper(url: string): ScraperPlugin {
  const matched = scraperRegistry.find((s) => s.matchUrl(url));
  if (matched) {
    return matched;
  }
  // マッチしない場合は汎用スクレイパーを返す（最後に登録されている想定）
  const generic = scraperRegistry.find((s) => s.name === 'generic');
  if (!generic) {
    throw new Error('汎用スクレイパーが登録されていません');
  }
  return generic;
}

// スクレイパーの共通エラーハンドリングラッパー
export async function safeScrape(
  url: string,
  scraper: ScraperPlugin,
  options?: ScrapeOptions
): Promise<VacancyDay[]> {
  try {
    return await scraper.scrape(url, options);
  } catch (error) {
    console.error(`[${scraper.name}] スクレイピングエラー:`, error);
    throw error;
  }
}
