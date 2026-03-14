import express from 'express';
import cors from 'cors';
import facilitiesRouter from './routes/facilities';
import vacancyRouter from './routes/vacancy';
import { registerNapcampScraper, initNapcampBrowser } from './scrapers/napcamp';
import { registerGenericScraper } from './scrapers/generic';

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
registerGenericScraper(); // フォールバック用として最後に登録

// 改善A: サーバー起動後にブラウザを事前起動しておく
initNapcampBrowser().catch((err) => {
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
