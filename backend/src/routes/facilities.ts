import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Facility } from '../types/index';
import { loadFacilities, saveFacilities } from '../data/storage';

const router = Router();

// 施設一覧取得
router.get('/', (_req: Request, res: Response) => {
  const facilities = loadFacilities();
  res.json(facilities);
});

// 施設登録
router.post('/', (req: Request, res: Response) => {
  const { name, url, notes } = req.body as {
    name?: string;
    url?: string;
    notes?: string;
  };

  if (!url) {
    res.status(400).json({ error: 'URLは必須です' });
    return;
  }

  // URLからスクレイパーの種類を自動判定
  let scraperType: Facility['scraperType'] = 'generic';
  if (url.includes('nap-camp.com')) {
    scraperType = 'napcamp';
  } else if (url.includes('jalan.net')) {
    scraperType = 'jalan';
  } else if (url.includes('travel.rakuten.co.jp')) {
    scraperType = 'rakuten';
  }

  const newFacility: Facility = {
    id: randomUUID(),
    name: name ?? new URL(url).hostname,
    url,
    scraperType,
    notes,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };

  const facilities = loadFacilities();
  facilities.push(newFacility);
  saveFacilities(facilities);

  res.status(201).json(newFacility);
});

// 施設情報更新
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as Partial<Facility>;

  const facilities = loadFacilities();
  const index = facilities.findIndex((f) => f.id === id);

  if (index === -1) {
    res.status(404).json({ error: '施設が見つかりません' });
    return;
  }

  // idとcreatedAtは変更不可
  const { id: _id, createdAt: _createdAt, ...safeUpdates } = updates;
  facilities[index] = { ...facilities[index], ...safeUpdates };
  saveFacilities(facilities);

  res.json(facilities[index]);
});

// 施設削除
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const facilities = loadFacilities();
  const filtered = facilities.filter((f) => f.id !== id);

  if (filtered.length === facilities.length) {
    res.status(404).json({ error: '施設が見つかりません' });
    return;
  }

  saveFacilities(filtered);
  res.status(204).send();
});

export default router;
