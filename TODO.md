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
- [x] カレンダー（VacancyCalendar）
- [x] ホームページ（Home）
- [x] API クライアント
- [x] useFacilities カスタムフック

## Phase 3: スクレイピング実装 ✅
- [x] スクレイパー基底クラス・selectScraper 関数
- [x] 汎用スクレイパー（generic.ts）
- [x] なっぷ対応スクレイパー（napcamp.ts）

## Phase 4: 本番デプロイ・UX改善 ✅
- [x] Supabaseで施設データを永続化
- [x] Renderへデプロイ（フロントエンド・バックエンド）
- [x] ブラウザインスタンス共有（browser.ts）で起動コスト削減
- [x] 並列月データ取得（Promise.all）
- [x] Renderスリープ時のUX改善（サーバー起動中メッセージ）
- [x] 全施設一括チェックボタン

## Phase 5: マルチサイト対応 ✅（2026-03-14）
- [x] 楽天トラベル対応スクレイパー（rakuten.ts）
- [x] じゃらんnet対応スクレイパー（jalan.ts）
- [x] カレンダーを月曜始まり固定表示に変更
- [x] bot検出回避（--disable-blink-features=AutomationControlled）

## 残タスク
- [ ] 施設の編集UI（メモ・名前を後から変更できるようにする）

## 将来の拡張
- [ ] 複数施設の比較表示
- [ ] お気に入り・ウィッシュリスト（日程を登録して自動チェック）
- [ ] 空室通知・アラート
- [ ] 自動定期更新
- [ ] 施設検索機能
