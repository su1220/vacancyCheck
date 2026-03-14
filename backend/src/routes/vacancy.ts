import { Router, Request, Response } from 'express';
import { VacancyResult } from '../types/index';
import { loadFacilities, saveFacilities, saveVacancyResult, getVacancyResult } from '../data/storage';
import { selectScraper, safeScrape } from '../scrapers/base';

const router = Router();

// 空室チェック実行（スクレイピング）
router.post('/check', async (req: Request, res: Response) => {
  const { facilityId, url } = req.body as { facilityId?: string; url?: string };

  if (!facilityId || !url) {
    res.status(400).json({ error: 'facilityIdとurlは必須です' });
    return;
  }

  // 施設の存在確認
  const facilities = await loadFacilities();
  const facility = facilities.find((f) => f.id === facilityId);
  if (!facility) {
    res.status(404).json({ error: '施設が見つかりません' });
    return;
  }

  try {
    // URLに対応するスクレイパーを選択して実行
    const scraper = selectScraper(url);
    console.log(`[vacancy] スクレイパー選択: ${scraper.name}, URL: ${url}`);

    // notesをプランキーワードとして渡す
    const options = facility.notes ? { planKeyword: facility.notes } : undefined;
    if (options) {
      console.log(`[vacancy] プランキーワード: "${facility.notes}"`);
    }
    const days = await safeScrape(url, scraper, options);

    const result: VacancyResult = {
      facilityId,
      fetchedAt: new Date().toISOString(),
      days,
    };

    // 結果を保存
    saveVacancyResult(result);

    // 施設のlastCheckedを更新
    facility.lastChecked = result.fetchedAt;
    const updatedFacilities = facilities.map((f) =>
      f.id === facilityId ? facility : f
    );
    await saveFacilities(updatedFacilities);

    res.json(result);
  } catch (error) {
    console.error('[vacancy] スクレイピングエラー:', error);
    res.status(500).json({
      error: 'スクレイピングに失敗しました',
      details: error instanceof Error ? error.message : '不明なエラー',
    });
  }
});

// 全施設の空室チェックを並列実行
router.post('/check-all', async (_req: Request, res: Response) => {
  const facilities = await loadFacilities();
  if (facilities.length === 0) {
    res.json({ results: [], errors: [] });
    return;
  }

  // 改善D: 全施設を並列スクレイピング
  const settled = await Promise.allSettled(
    facilities.map(async (facility) => {
      const scraper = selectScraper(facility.url);
      const options = facility.notes ? { planKeyword: facility.notes } : undefined;
      const days = await safeScrape(facility.url, scraper, options);

      const result: VacancyResult = {
        facilityId: facility.id,
        fetchedAt: new Date().toISOString(),
        days,
      };
      saveVacancyResult(result);

      facility.lastChecked = result.fetchedAt;
      return result;
    })
  );

  // lastCheckedを一括保存
  const updatedFacilities = await loadFacilities();
  const latestCheckedMap = new Map(
    settled
      .filter((s): s is PromiseFulfilledResult<VacancyResult> => s.status === 'fulfilled')
      .map((s) => [s.value.facilityId, s.value.fetchedAt])
  );
  const saved = updatedFacilities.map((f) => {
    const checkedAt = latestCheckedMap.get(f.id);
    return checkedAt ? { ...f, lastChecked: checkedAt } : f;
  });
  await saveFacilities(saved);

  const results = settled
    .filter((s): s is PromiseFulfilledResult<VacancyResult> => s.status === 'fulfilled')
    .map((s) => s.value);
  const errors = settled
    .filter((s): s is PromiseRejectedResult => s.status === 'rejected')
    .map((s, i) => ({ facilityId: facilities[i]?.id, error: String(s.reason) }));

  res.json({ results, errors });
});

// 最後の空室チェック結果取得
router.get('/:facilityId', (req: Request, res: Response) => {
  const facilityId = req.params['facilityId'] as string;
  const result = getVacancyResult(facilityId);

  if (!result) {
    res.status(404).json({ error: 'この施設の空室データがありません' });
    return;
  }

  res.json(result);
});

export default router;
