# 空室チェックアプリ

キャンプ場・宿泊施設の空室情報をスクレイピングで取得し、カレンダー表示するWebアプリ。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + Vite + TypeScript + Tailwind CSS v4 |
| バックエンド | Node.js + Express + TypeScript |
| スクレイピング | Playwright（Chromium） |
| データ保存 | JSONファイル（backend/data/） |

## プロジェクト構成

```
vacancyCheck/
├── frontend/         # React + Vite + TypeScript
│   └── src/
│       ├── api/client.ts          # APIクライアント
│       ├── components/
│       │   ├── AddFacilityModal.tsx
│       │   ├── FacilityCard.tsx
│       │   ├── FacilityList.tsx
│       │   └── VacancyCalendar.tsx
│       ├── hooks/useFacilities.ts
│       ├── pages/Home.tsx
│       └── types/index.ts
│
├── backend/          # Node.js + Express + Playwright
│   └── src/
│       ├── scrapers/
│       │   ├── base.ts            # スクレイパーレジストリ
│       │   ├── napcamp.ts         # なっぷ対応
│       │   └── generic.ts         # 汎用フォールバック
│       ├── routes/
│       │   ├── facilities.ts      # 施設CRUD
│       │   └── vacancy.ts         # 空室チェックAPI
│       ├── data/storage.ts        # JSONストレージ
│       ├── types/index.ts
│       └── server.ts
│
├── TODO.md
└── CLAUDE.md
```

## 起動方法

```bash
# バックエンド（ポート3001）
cd backend && npm run dev

# フロントエンド（ポート5173）
cd frontend && npm run dev
```

## API

```
GET    /api/facilities         # 施設一覧
POST   /api/facilities         # 施設登録
PUT    /api/facilities/:id     # 施設更新
DELETE /api/facilities/:id     # 施設削除
POST   /api/vacancy/check      # 空室チェック実行
GET    /api/vacancy/:id        # 空室結果取得
```

## スクレイパー拡張方法

1. `backend/src/scrapers/` に新しいファイルを作成
2. `ScraperPlugin` インターフェースを実装
3. `backend/src/server.ts` で `register〇〇Scraper()` を呼ぶ（汎用より前に登録）

## コーディング規約

- コメントは日本語で記述
- シンプルで読みやすいコードを優先
- 型安全を重視（TypeScript strict mode）
- スクレイパーはサイト変更に追従しやすいよう変更コストを最小化
