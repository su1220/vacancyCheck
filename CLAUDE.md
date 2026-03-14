# 空室チェックアプリ

キャンプ場・宿泊施設の空室情報をスクレイピングで取得し、カレンダー表示するWebアプリ。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + Vite + TypeScript + Tailwind CSS v4 |
| バックエンド | Node.js + Express + TypeScript |
| スクレイピング | Playwright（Chromium） |
| データ保存 | Supabase（施設データ）/ メモリ（空室データ） |

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
│       │   └── VacancyCalendar.tsx  # 月曜始まり固定カレンダー
│       ├── hooks/useFacilities.ts   # serverWaking状態管理含む
│       ├── pages/Home.tsx
│       └── types/index.ts
│
├── backend/          # Node.js + Express + Playwright
│   └── src/
│       ├── scrapers/
│       │   ├── base.ts            # スクレイパーレジストリ
│       │   ├── browser.ts         # 共有ブラウザインスタンス管理
│       │   ├── napcamp.ts         # なっぷ対応
│       │   ├── rakuten.ts         # 楽天トラベル対応
│       │   ├── jalan.ts           # じゃらんnet対応
│       │   └── generic.ts         # 汎用フォールバック
│       ├── routes/
│       │   ├── facilities.ts      # 施設CRUD
│       │   └── vacancy.ts         # 空室チェックAPI（一括チェック含む）
│       ├── data/storage.ts        # Supabaseストレージ
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
GET    /api/facilities           # 施設一覧
POST   /api/facilities           # 施設登録
PUT    /api/facilities/:id       # 施設更新
DELETE /api/facilities/:id       # 施設削除
POST   /api/vacancy/check        # 空室チェック実行
POST   /api/vacancy/check-all    # 全施設一括チェック
GET    /api/vacancy/:id          # 空室結果取得
```

## スクレイパー拡張方法

1. `backend/src/scrapers/` に新しいファイルを作成
2. `ScraperPlugin` インターフェースを実装
3. `backend/src/server.ts` で `register〇〇Scraper()` を呼ぶ（汎用より前に登録）

登録順: napcamp → rakuten → jalan → generic（フォールバック）

## 各スクレイパーの仕組み

### なっぷ（napcamp.ts）
- 公式内部APIを直接呼び出す方式（DOMスクレイピング不要）
- `GET /api/campsite/{id}/plans` → プラン一覧
- `GET /api/campsite/{id}/plans/{planId}/reservation?month=YYYY-MM` → 空室データ
- 今月・来月を `Promise.all` で並列取得

### 楽天トラベル（rakuten.ts）
- プラン一覧ページ（`hotel.travel.rakuten.co.jp/hotelinfo/plan/{hotelNo}`）を開く
- `a.thickbox` リンクから `f_camp_id` と `f_syu` を抽出
- カレンダーページ（`?f_hizuke=YYYYMMDD&f_thick=1&TB_iframe=true`）を `networkidle` で取得
- テーブルセルをパース：リンクあり→空室（URLパラメータから日付・価格取得）、リンクなし×→満室

### じゃらんnet（jalan.ts）
- ホテル詳細ページ（`www.jalan.net/yad{yadNo}/`）を `domcontentloaded` で開く
- カレンダーデータはZAM API（`jlnzam.net/v2/search`）経由でJS描画される
- `waitForFunction` でセル出現 or API失敗（カレンダー非表示）を検知
- セル状態: `.in-stock` → available、`.little-stock` → available（残室数付き）、`.out-of-stock` → full
- **注意**: RenderなどデータセンターIPからZAM APIがブロックされる場合、空データを返す

## ブラウザ共有（browser.ts）

サーバー起動時に1度だけChromiumを起動し、スクレイプごとに `newContext()` で分離。
`--disable-blink-features=AutomationControlled` でbot検出を回避。

## カレンダー表示（VacancyCalendar.tsx）

- 月曜日始まり固定（最初のデータ日の週の月曜から表示）
- パディング日（データなし）はグレーの薄いセルで表示
- 4週（28日）ページング

## コーディング規約

- コメントは日本語で記述
- シンプルで読みやすいコードを優先
- 型安全を重視（TypeScript strict mode）
- スクレイパーはサイト変更に追従しやすいよう変更コストを最小化
