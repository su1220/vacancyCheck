# 空室チェックアプリ TODO

## Phase 1: 基盤構築 ✅
- [x] monorepo構成でfrontend/backendディレクトリ作成
- [x] バックエンド: Express + TypeScript セットアップ
- [x] バックエンド: JSONファイルストレージ実装
- [x] バックエンド: 型定義（Facility, VacancyDay, VacancyResult）
- [x] バックエンド: スクレイパー基底クラス・レジストリ
- [x] バックエンド: Playwright インストール
- [x] フロントエンド: React + Vite + TypeScript セットアップ
- [x] フロントエンド: Tailwind CSS セットアップ

## Phase 2: UI実装 ✅
- [x] 施設登録モーダル（AddFacilityModal）
- [x] 施設一覧（FacilityList）
- [x] 施設カード（FacilityCard）
- [x] 週次カレンダー（VacancyCalendar）
- [x] ホームページ（Home）
- [x] API クライアント
- [x] useFacilities カスタムフック

## Phase 3: スクレイピング実装 ✅
- [x] スクレイパー基底クラス・selectScraper 関数
- [x] 汎用スクレイパー（generic.ts）
- [x] なっぷ対応スクレイパー（napcamp.ts）

## Phase 4: 統合・UX改善
- [ ] Playwright ブラウザのインストール確認 (`npx playwright install chromium`)
- [ ] バックエンド・フロントエンドの動作確認
- [ ] エラーハンドリングの改善
- [ ] ローディングアニメーション改善

## 将来の拡張
- [ ] 複数施設の比較表示
- [ ] じゃらん対応スクレイパー
- [ ] 楽天トラベル対応スクレイパー
- [ ] お気に入り・ウィッシュリスト（日程を登録して自動チェック）
- [ ] 空室通知・アラート
- [ ] 自動定期更新
- [ ] データベース移行（SQLite等）
- [ ] 施設検索機能
