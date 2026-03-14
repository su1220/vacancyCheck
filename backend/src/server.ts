import express from 'express';
import cors from 'cors';
import facilitiesRouter from './routes/facilities';
import vacancyRouter from './routes/vacancy';
import { registerNapcampScraper } from './scrapers/napcamp';
import { registerRakutenScraper } from './scrapers/rakuten';
import { registerJalanScraper } from './scrapers/jalan';
import { registerGenericScraper } from './scrapers/generic';
import { initBrowser } from './scrapers/browser';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ミドルウェア設定（本番環境では環境変数FRONTEND_URLを使用）
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// スクレイパーの登録（特定サイト → 汎用の順）
registerNapcampScraper();
registerRakutenScraper();
registerJalanScraper();
registerGenericScraper(); // フォールバック用として最後に登録

// サーバー起動後にブラウザを事前起動しておく（改善A: 起動コスト削減）
initBrowser().catch((err) => {
  console.error('[server] ブラウザ事前起動に失敗:', err);
});

// APIルート
app.use('/api/facilities', facilitiesRouter);
app.use('/api/vacancy', vacancyRouter);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`バックエンドサーバー起動: http://localhost:${PORT}`);
});

export default app;
