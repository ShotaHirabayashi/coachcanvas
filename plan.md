# CoachCanvas（コーチキャンバス）実装計画

## プロジェクト概要

**名前**: CoachCanvas（コーチキャンバス）

**説明**: 日本のプロコーチ・個人コンサルタント向けセッション管理アプリ。セッション記録のAI要約、フォローアップメール自動生成、クライアント進捗管理を一気通貫で提供する。

**ターゲットユーザー**: 35-50歳の独立系プロコーチ（ICF/日本コーチ連盟等の資格保持者）。月10-30件のセッションを実施。現在はNotionやGoogleドキュメントで管理し、毎セッション後に30分以上かけて記録・フォローアップメール作成している。クライアントが15名を超えると管理が破綻し始める層。

**差別化ポイント**:
1. 日本語ネイティブUI × AIセッション記録自動化（メモ→AI要約→フォローアップメール生成が5分以内で完了）
2. フォローアップメール自動生成（競合にこの機能を持つサービスはほぼない）
3. クライアント進捗ダッシュボード（日本のコーチング文化の定性的な気づき重視に対応）

**技術スタック**: Next.js（App Router）, Tailwind CSS, SQLite（better-sqlite3）, TypeScript

**制約事項（MVP段階）**:
- 認証なし（シングルユーザー前提、localhostアクセスのみ）
- 環境変数なし（AI機能はモックで実装、本番化時にOpenAI APIへ差し替え）
- SQLiteのみ（ファイルベース、Vercel本番化時はTurso/libSQLに移行）
- `npm run build` が通ること

---

## 収益化戦略

- **Phase 1（MVP）**: ローカル動作するデモアプリ。全コア機能をAIモックで実装。ビルド・動作確認。
- **Phase 2（本番化）**: Turso移行、NextAuth.js + Google OAuth認証追加、OpenAI API統合、Vercelデプロイ
- **Phase 3（収益化）**: Stripe連携による課金
  - **Free**: クライアント3名、AI要約月5回
  - **Pro（月額4,980円）**: 無制限、LINE連携、請求書発行
  - **Team（月額14,800円〜）**: コーチ5名まで、管理者ダッシュボード

---

## ページ構成

### 1. ランディングページ `/`
- **目的**: 未ログインユーザーへのプロダクト訴求・新規登録誘導
- **要素**:
  - ヒーローセクション（キャッチコピー「セッション記録を、5分で完了。」＋スクリーンショット）
  - 課題提起（3つのペイン: 記録に30分、クライアント管理の混乱、フォローアップ質低下）
  - 機能ハイライト3つ（カルテ管理・AI要約・フォローアップメール）
  - 料金プラン比較表（Free / Pro / Team）
  - CTAボタン「無料で始める」
  - フッター（利用規約・プライバシーポリシー）
- **MVP注記**: 認証なしのため、CTAボタンは `/dashboard` への直リンク

### 2. オンボーディング `/onboarding`
- **目的**: 初回アクセス時に1回だけ表示。コーチのプロフィール設定と最初のクライアント登録まで誘導
- **要素**:
  - ステッププログレスバー（3ステップ）
  - Step 1: 名前・専門分野選択（ライフ/ビジネス/キャリア/その他）
  - Step 2: 最初のクライアント登録（名前＋メールのみ）
  - Step 3: サンプルセッションノートの体験（AI要約ボタンのデモ）
  - 各ステップにスキップリンク
- **実装**: onboarding完了フラグをSQLiteに保持。完了済みなら `/dashboard` にリダイレクト

### 3. ダッシュボード `/dashboard`
- **目的**: ログイン後のホーム。今日やるべきことが一目でわかるコックピット
- **要素**:
  - 今日のセッション予定カード（時刻・クライアント名・ワンクリックでノート作成）
  - フォローアップ未送信アラートバッジ（赤・件数表示）
  - 直近のセッション履歴（3件）
  - KPI: クライアント数 / 今月のセッション数 / AI利用残数（Free向け）
  - クイックアクションFAB（＋新規セッションノート作成）
  - 左サイドナビゲーション（デスクトップ）/ ボトムタブバー（モバイル）
- **空状態**: インタラクティブチュートリアルカード（「1. クライアントを登録」「2. セッションノートを書く」「3. AI要約を体験」）

### 4. クライアント一覧 `/clients`
- **目的**: 全クライアントの俯瞰管理
- **要素**:
  - 検索バー（名前・メールでインクリメンタル検索）
  - フィルタ（ステータス: アクティブ/アーカイブ）
  - カード表示/リスト表示の切替
  - 各カード: 名前・次回セッション日・最終セッションからの経過日数
  - 新規クライアント追加ボタン
  - 無料プラン上限到達時のアップグレード誘導バナー
- **空状態**: イラスト＋「最初のクライアントを登録して、コーチングを始めましょう」＋CTAボタン
- **レスポンシブ**: デスクトップ3カラムグリッド / モバイル1カラムリスト

### 5. クライアント詳細（カルテ） `/clients/[id]`
- **目的**: 1クライアントの全情報を集約。セッション前にここを開けば全体像を把握できる
- **要素**:
  - ヘッダー: 名前・ステータス・契約期間・セッション残回数
  - タブ構成:
    - **プロフィール**: 基本情報・コーチング目標・契約情報の編集フォーム
    - **セッション履歴**: タイムライン表示（日付・要約プレビュー・クリックで詳細）
    - **目標・進捗**: 目標カード（進捗バー・マイルストーン）。目標ごとに1-10スコアを毎セッション記録→折れ線グラフ表示
    - **メモ**: 自由記述の永続メモ
  - 右上: 新規セッションノート作成ボタン
- **空状態（セッション履歴）**: 「まだセッション記録がありません。最初のセッションノートを作成しましょう」＋CTAボタン

### 6. セッションノート詳細 `/sessions/[id]`
- **目的**: 個別セッションの記録・AI生成の中核画面。**最重要ページ**
- **要素**:
  - セッション情報ヘッダー（クライアント名・日時・所要時間・通算回数）
  - 前回のAI要約＋次回アジェンダ案の自動表示（折りたたみ可。セッション間のコンテキスト引き継ぎ）
  - テキストエリア（Markdown対応。MVPではtextarea、将来Tiptap移行）
  - テンプレート選択ドロップダウン（ライフ/ビジネス/キャリア）
  - 自動保存インジケーター（「保存済み」「保存中...」）。500msデバウンスで自動保存
  - **AI要約生成ボタン**（目立つ配色）
    - 生成結果パネル: 構造化サマリー＋アクションアイテム＋次回アジェンダ案（編集可能）
    - 再生成ボタン
  - **フォローアップメール生成ボタン**
    - スライドオーバーパネル（右から）: 件名・本文プレビュー・編集可・送信/コピーボタン
    - モバイルではフルスクリーンモーダル
- **レスポンシブ**: デスクトップ=左エディタ・右AI結果の2カラム / モバイル=シングルカラム、AI結果はエディタ下にスタック
- **自動保存**: サーバーへのdebounced autosave（500ms）＋ localStorageへのバックアップ

### 7. 新規セッション作成 `/sessions/new`
- **目的**: クライアント選択→テンプレート選択→ノート画面へ遷移のショートカット
- **要素**:
  - クライアント選択コンボボックス（検索可能）
  - テンプレート選択
  - セッション日時ピッカー
  - 所要時間入力（分）
  - 作成ボタン→セッションノート詳細へ遷移

### 8. 全セッション一覧 `/sessions`
- **目的**: 日付・クライアント横断でセッションを検索・閲覧
- **要素**:
  - 日付範囲フィルタ
  - クライアントフィルタ
  - ステータスフィルタ（予定/完了/キャンセル）
  - テーブルビュー（日時・クライアント名・ステータス・要約有無）
  - ページネーション（20件/ページ）

### 9. 設定 `/settings`
- **目的**: プロフィール・テンプレート・メール設定の管理
- **要素**:
  - プロフィール編集（名前・肩書き・専門分野・タイムゾーン）
  - メール設定（送信元名・署名テンプレート）
  - ノートテンプレート管理（Pro以上: カスタムテンプレートの作成・編集・削除）
  - CSVエクスポート（Pro以上）
  - データ削除・アカウント削除

### 10. 全文検索 `/search`
- **目的**: クライアント名・セッションノート内容の横断検索
- **要素**:
  - 検索バー
  - 結果表示（クライアント/セッションをタブ切替）
  - 検索結果ハイライト
  - 空結果: 「該当するクライアントが見つかりません」＋全クライアント表示リンク

---

## ユーザーフロー

### フロー1: 初回アクセス〜初期設定（2分以内）
```
LP → 「無料で始める」→ オンボーディング Step1（名前+専門分野）
→ Step2（最初のクライアント名+メール）→ Step3（サンプルAI要約体験）
→ ダッシュボード
```

### フロー2: セッション記録（セッション後5分以内で完了）
```
ダッシュボードで「今日のセッション」カードをタップ
→ セッションノートエディタが開く（前回のコンテキスト自動表示）
→ 箇条書きでメモ入力
→ 「AI要約を生成」ボタンをクリック
→ 構造化サマリーが自動生成（編集可能）
```

### フロー3: フォローアップ送信（追加1分以内）
```
AI要約画面の「フォローアップメールを作成」ボタン
→ メールプレビューがスライドオーバーで表示
→ 必要に応じ編集
→ 「コピー」or「送信」ボタン
```

### フロー4: セッション前の確認
```
ダッシュボード → 次回セッションカードのクライアント名クリック
→ クライアントカルテ → セッション履歴タブ
→ 前回の要約・アクションアイテム・目標進捗を確認
```

---

## 機能一覧

### Must（MVP必須）

| # | 機能 | 説明 |
|---|------|------|
| M1 | クライアントカルテCRUD | 基本情報、コーチング目標、契約情報、メモの一元管理。一覧・検索・フィルタ |
| M2 | セッションノート | テキストエリアでセッション記録作成。テンプレート3種（ライフ/ビジネス/キャリア）。日時・所要時間記録 |
| M3 | セッションノート自動保存 | 500msデバウンスでサーバー保存 + localStorageバックアップ。保存状態インジケーター表示 |
| M4 | AIセッション要約（モック） | ノート入力→ワンクリックで構造化サマリー（話題・気づき・アクションアイテム・次回アジェンダ案）を生成。MVP段階ではモック応答（テンプレートベースの要約風テキスト） |
| M5 | AIフォローアップメール生成（モック） | セッション内容に基づきメール文面を自動ドラフト。編集後にクリップボードコピー。MVPではモック |
| M6 | ダッシュボード | 次回セッション予定、未送信フォローアップアラート、直近セッション履歴、KPIサマリー |
| M7 | 全文検索 | クライアント名・セッションノート内容の横断検索。SQLite FTS5使用 |
| M8 | レスポンシブUI | モバイルファースト設計。デスクトップ=サイドバー、モバイル=ボトムタブ |
| M9 | プラン制限エンフォースメント | Free: クライアント3名上限、AI月5回上限。上限到達時のソフトなアップグレード誘導モーダル |
| M10 | オンボーディング | 初回アクセス時の3ステップガイド。サンプルAI要約体験 |
| M11 | 前回コンテキスト引き継ぎ | 新規セッションノート作成時、前回のAI要約+次回アジェンダ案をエディタ上部に自動表示 |
| M12 | ランディングページ | プロダクト訴求・機能紹介・料金比較 |
| M13 | 設定ページ | プロフィール編集、メール署名設定 |

### Should（本番化で追加）

| # | 機能 | 説明 |
|---|------|------|
| S1 | 認証（Google OAuth） | NextAuth.js + Googleログイン。マルチテナント対応 |
| S2 | AI機能の実API統合 | OpenAI API連携。ストリーミング表示対応 |
| S3 | メール送信 | SendGrid/Resend連携。フォローアップメールをアプリ内から直接送信 |
| S4 | Stripe課金 | Free/Pro/Team プラン切替。月額課金・請求履歴 |
| S5 | カスタムテンプレート | Pro以上でセッションノートテンプレートの作成・編集・削除 |
| S6 | CSVエクスポート | クライアント一覧・セッション履歴のCSVダウンロード（Pro以上） |
| S7 | 通知・リマインダー | セッション前日リマインダー、フォローアップ未送信警告 |
| S8 | セッション前ブリーフィング | セッション30分前に前回のポイント・未達成宿題を自動通知 |

### Nice-to-have（将来拡張）

| # | 機能 | 説明 |
|---|------|------|
| N1 | 音声文字起こし | Whisper API連携。録音ファイル→テキスト変換 |
| N2 | LINE連携 | LINE公式アカウント連携でリマインダー・フォローアップ送信 |
| N3 | Google Calendar連携 | セッション予定の双方向同期 |
| N4 | チーム機能 | 組織作成、メンバー招待、クライアント共有・引継ぎ |
| N5 | クライアントポータル | クライアント自身がアクション進捗を入力、事前アンケート記入 |
| N6 | ICF時間自動集計 | ICF資格更新に必要な実績時間を自動計算 |
| N7 | コーチ向けAIインサイト | 複数セッション横断分析。行動パターン・停滞シグナル検出 |
| N8 | Cmd+Kコマンドパレット | クライアント名検索・ページ遷移のショートカット |
| N9 | ダークモード | 長時間使用時の目の負担軽減 |

---

## DBスキーマ

### テーブル定義（schema.sql）

```sql
-- ユーザー（コーチ）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                          -- nanoid
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT,                                   -- 肩書き
  specialty TEXT,                               -- 専門分野: life/business/career/other
  plan TEXT NOT NULL DEFAULT 'free',            -- free/pro/enterprise
  ai_usage_count INTEGER NOT NULL DEFAULT 0,
  ai_usage_reset_at TEXT,                       -- 月次リセット日時 ISO8601
  timezone TEXT DEFAULT 'Asia/Tokyo',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  email_signature TEXT,                         -- メール署名テンプレート
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- クライアント
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,                          -- nanoid
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  goals TEXT,                                   -- コーチング目標（長文テキスト）
  notes TEXT,                                   -- カルテメモ
  status TEXT NOT NULL DEFAULT 'active',        -- active/archived
  contract_start_date TEXT,
  contract_end_date TEXT,
  contract_total_sessions INTEGER,
  contract_fee INTEGER,                         -- 円単位
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT                               -- 論理削除（30日後に物理削除可）
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- セッション
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                          -- nanoid
  client_id TEXT NOT NULL REFERENCES clients(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  scheduled_at TEXT NOT NULL,                   -- ISO8601日時
  duration_minutes INTEGER,                     -- 所要時間（分）
  status TEXT NOT NULL DEFAULT 'scheduled',     -- scheduled/completed/cancelled/no_show
  session_number INTEGER,                       -- 通算回数（自動採番）
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);

-- セッションノート
CREATE TABLE IF NOT EXISTS session_notes (
  id TEXT PRIMARY KEY,                          -- nanoid
  session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id),
  template_id TEXT REFERENCES templates(id),
  content TEXT,                                 -- ノート本文（Markdown）
  plain_text TEXT,                              -- 検索用プレーンテキスト
  is_draft INTEGER NOT NULL DEFAULT 1,
  auto_saved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI要約
CREATE TABLE IF NOT EXISTS ai_summaries (
  id TEXT PRIMARY KEY,                          -- nanoid
  session_id TEXT NOT NULL REFERENCES sessions(id),
  summary_text TEXT NOT NULL,                   -- 構造化サマリー
  action_items TEXT,                            -- JSON配列 [{"item": "...", "done": false}]
  next_agenda TEXT,                             -- 次回アジェンダ案
  model TEXT NOT NULL DEFAULT 'mock',           -- 使用モデル名
  version INTEGER NOT NULL DEFAULT 1,           -- 再生成時にインクリメント
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_session_id ON ai_summaries(session_id);

-- フォローアップメール
CREATE TABLE IF NOT EXISTS follow_up_emails (
  id TEXT PRIMARY KEY,                          -- nanoid
  session_id TEXT NOT NULL REFERENCES sessions(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',         -- draft/sent/failed
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_follow_up_emails_session_id ON follow_up_emails(session_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_status ON follow_up_emails(status);

-- セッションテンプレート
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,                          -- nanoid
  user_id TEXT REFERENCES users(id),            -- NULLならシステムデフォルト
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,                         -- テンプレート本文（Markdown）
  category TEXT,                                 -- life/business/career/custom
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI利用ログ
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id TEXT PRIMARY KEY,                          -- nanoid
  user_id TEXT NOT NULL REFERENCES users(id),
  feature TEXT NOT NULL,                        -- summary/follow_up
  session_id TEXT REFERENCES sessions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);

-- 目標進捗スコア
CREATE TABLE IF NOT EXISTS goal_scores (
  id TEXT PRIMARY KEY,                          -- nanoid
  client_id TEXT NOT NULL REFERENCES clients(id),
  session_id TEXT REFERENCES sessions(id),
  goal_label TEXT NOT NULL,                     -- 目標名
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 10),
  note TEXT,                                    -- 補足メモ
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goal_scores_client_id ON goal_scores(client_id);

-- 全文検索（FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS session_notes_fts USING fts5(
  plain_text,
  content='session_notes',
  content_rowid='rowid'
);
```

### リレーション図

```
users 1──N clients 1──N sessions 1──1 session_notes
                                  1──N ai_summaries
                                  1──N follow_up_emails
                                  1──N goal_scores
users 1──N templates
users 1──N ai_usage_logs
```

---

## API設計

### クライアント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/clients` | 一覧取得（?search=&status=&page=&limit=20） |
| POST | `/api/clients` | 新規作成（Freeプラン3名上限チェック。`WHERE deleted_at IS NULL`でCOUNT） |
| GET | `/api/clients/[id]` | 詳細取得（カルテ情報＋直近セッション5件） |
| PUT | `/api/clients/[id]` | 情報更新 |
| DELETE | `/api/clients/[id]` | 論理削除（`deleted_at`をセット） |
| PATCH | `/api/clients/[id]/archive` | アーカイブ/復元トグル（`status`をactive↔archived） |

### セッション

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/sessions` | 全セッション一覧（?client_id=&from=&to=&status=&page=） |
| POST | `/api/sessions` | 新規作成（client_id, scheduled_at, template_id。session_number自動採番） |
| GET | `/api/sessions/[id]` | 詳細取得（ノート、最新AI要約、フォローアップメール含む） |
| PUT | `/api/sessions/[id]` | 更新（日時変更、ステータス変更） |
| DELETE | `/api/sessions/[id]` | 削除 |

### セッションノート

| メソッド | パス | 説明 |
|----------|------|------|
| PUT | `/api/sessions/[id]/note` | ノート保存（upsert。content → plain_text自動抽出。FTSインデックス更新） |
| PATCH | `/api/sessions/[id]/note/autosave` | 自動保存（contentのみ部分更新。auto_saved_at記録） |

### AI機能

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/api/sessions/[id]/ai/summary` | AI要約生成。Freeプラン月5回チェック。ai_usage_logs記録。MVPはモック応答 |
| GET | `/api/sessions/[id]/ai/summaries` | AI要約履歴一覧（バージョン別） |
| PUT | `/api/sessions/[id]/ai/summaries/[summaryId]` | AI要約の手動編集保存 |
| POST | `/api/sessions/[id]/ai/follow-up` | フォローアップメール生成。Freeプラン月5回チェック（要約と共通カウント） |

### フォローアップメール

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/sessions/[id]/follow-up-emails` | メール一覧 |
| PUT | `/api/sessions/[id]/follow-up-emails/[emailId]` | メール編集 |
| POST | `/api/sessions/[id]/follow-up-emails/[emailId]/send` | 送信実行（MVPではステータスをsentに変更するのみ） |
| DELETE | `/api/sessions/[id]/follow-up-emails/[emailId]` | メール削除 |

### テンプレート

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/templates` | 一覧取得（システム＋ユーザー作成） |
| POST | `/api/templates` | カスタムテンプレート作成 |
| PUT | `/api/templates/[id]` | 更新（システムテンプレートは更新不可） |
| DELETE | `/api/templates/[id]` | 削除（システムテンプレートは削除不可） |

### ダッシュボード・検索・その他

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/dashboard` | ダッシュボードデータ（次回セッション、未送信フォローアップ数、統計） |
| GET | `/api/search` | 全文検索（?q=&type=clients\|sessions&limit=20）FTS5使用 |
| GET | `/api/users/me` | コーチ情報取得（プラン、AI残数） |
| PUT | `/api/users/me` | プロフィール更新 |
| POST | `/api/onboarding/complete` | オンボーディング完了フラグ設定 |
| GET | `/api/clients/[id]/goal-scores` | 目標進捗スコア一覧（グラフ用） |
| POST | `/api/clients/[id]/goal-scores` | スコア記録 |

---

## UIコンポーネント一覧

### 共通レイアウト
- **Sidebar**: 左固定サイドバー（幅240px、折りたたみ可）。ダッシュボード・クライアント・セッション・検索・設定の5項目
- **BottomTabBar**: モバイル用ボトムタブ3項目（ダッシュボード・クライアント・設定）
- **PageContainer**: ページ共通のmax-width + padding
- **Header**: ページタイトル + アクションボタン

### 基礎UI
- **Button**: primary / secondary / destructive / ghost バリアント。サイズ: sm / md / lg
- **Card**: 影付きカード。ヘッダー・ボディ・フッター構成
- **Input**: Floating Labelパターン。バリデーションエラー表示対応
- **Select / Combobox**: 検索可能なドロップダウン
- **Badge**: ステータスバッジ（active=緑, archived=灰, scheduled=青, completed=緑）
- **Dialog**: 確認ダイアログ（破壊的操作のみ使用。赤い実行ボタン）
- **Toast**: 右下通知（成功=緑, エラー=赤, 情報=青。3秒自動消去）
- **Skeleton**: データ読み込み中のプレースホルダー
- **EmptyState**: 空状態のイラスト＋CTAボタン
- **PlanLimitBanner**: 無料プラン上限到達時のアップグレード誘導バナー

### 機能コンポーネント
- **ClientCard**: アバター・名前・次回予定・最終接触日。クリックでカルテへ
- **ClientForm**: クライアント作成/編集フォーム
- **SessionCard**: 日時・クライアント名・ステータスバッジ。クリックでノートへ
- **SessionNote**: テキストエリア + 自動保存 + テンプレート選択
- **AISummaryPanel**: AI生成結果表示（薄い紫背景。編集・コピー・再生成ボタン）
- **FollowUpEmailPanel**: スライドオーバーパネル（件名・本文プレビュー・編集・送信/コピー）
- **GoalScoreChart**: 目標スコア推移の折れ線グラフ（CSS or 軽量ライブラリ）
- **StatsCard**: KPI表示カード（数値＋ラベル＋前月比）
- **TabGroup**: タブ切替UI（プロフィール/セッション/目標/メモ）
- **SearchBar**: インクリメンタル検索入力
- **TemplateSelector**: テンプレート選択ドロップダウン（プレビュー付き）
- **OnboardingWizard**: ステッププログレスバー + 各ステップフォーム

---

## バリデーションルール

全API Routeの入口でzodスキーマによるparse。不正入力は400エラーで即リジェクト。

| フィールド | ルール |
|-----------|--------|
| User.name | 必須、1-100文字、前後空白トリム |
| User.email | 必須、メール形式（RFC5322）、最大255文字、小文字正規化、一意制約 |
| User.specialty | 任意、enum: life/business/career/other |
| Client.name | 必須、1-100文字、前後空白トリム |
| Client.email | 任意、メール形式、最大255文字。フォローアップメール送信時は必須チェック |
| Client.phone | 任意、最大20文字 |
| Client.company | 任意、最大200文字 |
| Client.goals | 任意、最大5,000文字 |
| Session.scheduled_at | 必須、ISO8601日時形式。過去日も許可（記録用途） |
| Session.duration_minutes | 任意、正の整数、1-480の範囲 |
| SessionNote.content | 任意（下書き保存時）。AI要約実行時は最低100文字以上。最大50,000文字 |
| FollowUpEmail.subject | 必須（送信時）、最大200文字 |
| FollowUpEmail.body | 必須（送信時）、最大10,000文字 |
| FollowUpEmail.recipientEmail | 必須（送信時）、メール形式 |
| Template.name | 必須、1-100文字、同一ユーザー内で一意 |
| Template.content | 必須、最大20,000文字 |
| Contract.startDate | 任意、ISO8601日付形式 |
| Contract.endDate | 任意、startDate以降であること |
| Contract.totalSessions | 任意、正の整数、1-999 |
| Contract.fee | 任意、0以上の整数（円単位） |
| GoalScore.score | 必須、整数、1-10 |
| GoalScore.goal_label | 必須、1-100文字 |
| 検索クエリ | 最大200文字、特殊文字エスケープ、空文字時は検索実行しない |

---

## エラーハンドリング

### 空状態

| 画面 | 表示内容 |
|------|---------|
| ダッシュボード（初回） | チュートリアルカード3枚（クライアント登録→ノート作成→AI要約体験） |
| クライアント一覧（0件） | イラスト＋「最初のクライアントを登録して、コーチングを始めましょう」＋CTA |
| セッション履歴（0件） | 「まだセッション記録がありません」＋テンプレートプレビュー＋CTA |
| 検索結果（0件） | 「該当する結果が見つかりません」＋全件表示リンク |

### エラー表示

| エラー種別 | 表示方法 |
|-----------|---------|
| ネットワークエラー | トースト: 「インターネット接続を確認してください。入力内容はローカルに保存されています」 |
| AI生成失敗 | インラインエラー: 「要約の生成に失敗しました」＋リトライボタン。3回連続失敗→「しばらく時間をおいてからお試しください」 |
| AI利用上限到達 | モーダル: 「今月のAI利用回数（5回）に達しました。Proプランで制限を解除しませんか？」 |
| メール送信失敗 | インラインエラー: 「メールの送信に失敗しました。メールアドレスを確認してください」＋下書き保存ボタン |
| フォームバリデーション | リアルタイム（フォーカスアウト時検証）。赤枠＋エラーメッセージをフィールド直下に表示。送信時にエラーフィールドへ自動スクロール |
| Free上限到達（クライアント追加） | モーダル: 「無料プランではクライアント3名まで登録できます。Proプランで制限を解除しませんか？」。既存機能は制限せず新規追加のみブロック |
| 自動保存失敗 | エディタ上部にイエローバナー: 「自動保存に失敗しました。手動で保存してください」＋保存ボタン（dismiss不可） |
| ページ読み込みエラー | エラーページ: 「申し訳ございません。ページの読み込みに失敗しました」＋リロードボタン＋ダッシュボードリンク |

### ローディング
- 全データ取得画面でスケルトンローダー表示
- AI生成中: ボタン内にスピナー＋「生成中...」テキスト
- 自動保存中: ヘッダーに「保存中...」→完了で「保存済み ✓」

---

## セキュリティ対策

| 対策 | 詳細 |
|------|------|
| SQLインジェクション | better-sqlite3のPrepared Statement（パラメータバインド）を100%使用。文字列結合によるクエリ構築は全面禁止 |
| XSS | ReactのJSX自動エスケープに依拠。`dangerouslySetInnerHTML`は禁止。セッションノートのMarkdown表示時はサニタイズ |
| 入力バリデーション | 全API Routeの入口でzodスキーマによるparse。文字数上限を設定 |
| CSRF | Next.js App RouterのRoute Handlerのsame-origin制約に依拠 |
| レート制限 | API Route単位でインメモリレート制限（Map<IP, count>）。AI生成エンドポイントは10req/min |
| 認証（MVP） | なし。localhostアクセスのみ前提。本番化時にNextAuth.js + Google OAuth追加 |

---

## ファイル構成

```
coachcanvas/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── plan.md
├── data/
│   └── coachcanvas.db              # SQLiteデータベース（gitignore）
├── public/
│   └── images/                     # 空状態イラスト等
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 共通レイアウト（html lang="ja"、サイドバー/ボトムタブ）
│   │   ├── page.tsx                # ランディングページ
│   │   ├── dashboard/
│   │   │   └── page.tsx            # ダッシュボード
│   │   ├── onboarding/
│   │   │   └── page.tsx            # オンボーディング
│   │   ├── clients/
│   │   │   ├── page.tsx            # クライアント一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx        # クライアント詳細（カルテ）
│   │   ├── sessions/
│   │   │   ├── page.tsx            # 全セッション一覧
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # 新規セッション作成
│   │   │   └── [id]/
│   │   │       └── page.tsx        # セッションノート詳細
│   │   ├── search/
│   │   │   └── page.tsx            # 全文検索
│   │   ├── settings/
│   │   │   └── page.tsx            # 設定
│   │   └── api/
│   │       ├── clients/
│   │       │   ├── route.ts        # GET一覧 / POST作成
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET / PUT / DELETE
│   │       │       ├── archive/
│   │       │       │   └── route.ts # PATCH アーカイブ
│   │       │       └── goal-scores/
│   │       │           └── route.ts # GET / POST
│   │       ├── sessions/
│   │       │   ├── route.ts        # GET一覧 / POST作成
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET / PUT / DELETE
│   │       │       ├── note/
│   │       │       │   ├── route.ts     # PUT保存
│   │       │       │   └── autosave/
│   │       │       │       └── route.ts # PATCH自動保存
│   │       │       ├── ai/
│   │       │       │   ├── summary/
│   │       │       │   │   └── route.ts # POST生成
│   │       │       │   ├── summaries/
│   │       │       │   │   ├── route.ts      # GET履歴
│   │       │       │   │   └── [summaryId]/
│   │       │       │   │       └── route.ts  # PUT編集
│   │       │       │   └── follow-up/
│   │       │       │       └── route.ts # POST生成
│   │       │       └── follow-up-emails/
│   │       │           ├── route.ts     # GET一覧
│   │       │           └── [emailId]/
│   │       │               ├── route.ts # PUT / DELETE
│   │       │               └── send/
│   │       │                   └── route.ts # POST送信
│   │       ├── templates/
│   │       │   ├── route.ts        # GET / POST
│   │       │   └── [id]/
│   │       │       └── route.ts    # PUT / DELETE
│   │       ├── dashboard/
│   │       │   └── route.ts        # GET
│   │       ├── search/
│   │       │   └── route.ts        # GET
│   │       ├── users/
│   │       │   └── me/
│   │       │       └── route.ts    # GET / PUT
│   │       └── onboarding/
│   │           └── complete/
│   │               └── route.ts    # POST
│   ├── lib/
│   │   ├── db.ts                   # better-sqlite3接続（WAL + foreign_keys + busy_timeout）
│   │   ├── schema.sql              # テーブル定義（CREATE TABLE IF NOT EXISTS、冪等性確保）
│   │   ├── seed.ts                 # 初期データ（デフォルトユーザー、システムテンプレート3種）
│   │   ├── ai.ts                   # AI呼び出しラッパー（モック/実API切替。generateSummary, generateFollowUp）
│   │   ├── validators.ts           # zodスキーマ定義
│   │   ├── utils.ts                # cn()ユーティリティ（clsx + tailwind-merge）、日付フォーマット
│   │   └── queries/
│   │       ├── clients.ts          # クライアントCRUDクエリ
│   │       ├── sessions.ts         # セッションCRUDクエリ
│   │       ├── notes.ts            # ノートCRUDクエリ
│   │       ├── ai-summaries.ts     # AI要約クエリ
│   │       ├── follow-up-emails.ts # フォローアップメールクエリ
│   │       ├── templates.ts        # テンプレートクエリ
│   │       ├── dashboard.ts        # ダッシュボード集計クエリ
│   │       ├── search.ts           # FTS5検索クエリ
│   │       └── goal-scores.ts      # 目標スコアクエリ
│   └── components/
│       ├── ui/
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── input.tsx
│       │   ├── select.tsx
│       │   ├── badge.tsx
│       │   ├── dialog.tsx
│       │   ├── toast.tsx
│       │   ├── skeleton.tsx
│       │   ├── empty-state.tsx
│       │   ├── plan-limit-banner.tsx
│       │   └── tab-group.tsx
│       ├── layout/
│       │   ├── sidebar.tsx
│       │   ├── bottom-tab-bar.tsx
│       │   ├── header.tsx
│       │   └── page-container.tsx
│       ├── clients/
│       │   ├── client-card.tsx
│       │   ├── client-form.tsx
│       │   └── client-list.tsx
│       ├── sessions/
│       │   ├── session-card.tsx
│       │   ├── session-form.tsx
│       │   ├── session-note.tsx
│       │   ├── ai-summary-panel.tsx
│       │   ├── follow-up-email-panel.tsx
│       │   └── template-selector.tsx
│       ├── dashboard/
│       │   ├── upcoming-sessions.tsx
│       │   ├── pending-followups.tsx
│       │   ├── stats-cards.tsx
│       │   └── tutorial-cards.tsx
│       ├── goals/
│       │   └── goal-score-chart.tsx
│       ├── search/
│       │   └── search-bar.tsx
│       └── onboarding/
│           └── onboarding-wizard.tsx
```

---

## npmパッケージ

| パッケージ | 用途 |
|-----------|------|
| next | App Router フレームワーク |
| react / react-dom | UIライブラリ |
| typescript | 型安全 |
| tailwindcss / postcss / autoprefixer | スタイリング |
| better-sqlite3 + @types/better-sqlite3 | SQLiteドライバ（同期API） |
| zod | 入力バリデーション + 型推論 |
| nanoid | URLセーフなID生成 |
| date-fns | 日付操作・フォーマット（「2月26日（木）」形式） |
| clsx | 条件付きクラス名結合 |
| tailwind-merge | Tailwindクラス競合解決 |
| lucide-react | アイコンセット（tree-shakable） |

---

## AIモック実装仕様

MVP段階ではAI機能をモックで実装し、`npm run build`を通す。`src/lib/ai.ts`に集約。

### generateSummary(noteContent: string): AISummary

入力のノート内容から、テンプレートベースで要約風テキストを生成。

```typescript
// モック実装の骨格
export function generateSummary(noteContent: string) {
  const lines = noteContent.split('\n').filter(l => l.trim());
  const bulletPoints = lines.slice(0, 5).map(l => l.replace(/^[-*]\s*/, ''));

  return {
    summaryText: `## セッション要約\n\n### 主な話題\n${bulletPoints.map(b => `- ${b}`).join('\n')}\n\n### 気づき\n- クライアントは前回からの進捗を報告しました\n- 新たな課題が明確になりました`,
    actionItems: JSON.stringify([
      { item: bulletPoints[0] || '次回までの宿題を整理する', done: false },
      { item: '前回のアクションアイテムの進捗を確認する', done: false },
    ]),
    nextAgenda: `次回のアジェンダ案：\n- 今回のアクションアイテムの振り返り\n- ${bulletPoints[1] || '中長期目標の進捗確認'}`,
    model: 'mock',
  };
}
```

### generateFollowUp(noteContent: string, clientName: string, summary: string): FollowUpEmail

セッション内容とクライアント名から、丁寧語のフォローアップメールを生成。

```typescript
export function generateFollowUp(noteContent: string, clientName: string, summary: string) {
  return {
    subject: `【セッション振り返り】本日のセッションありがとうございました`,
    body: `${clientName}様\n\nお疲れさまでした。本日のセッションの振り返りをお送りいたします。\n\n${summary}\n\n次回のセッションまでに、上記のアクションアイテムに取り組んでいただければ幸いです。\nご不明な点がございましたら、お気軽にご連絡ください。\n\n引き続きよろしくお願いいたします。`,
  };
}
```

**本番化時**: 環境変数`OPENAI_API_KEY`の有無で自動切替。API呼び出し時はストリーミング対応。

---

## テスト戦略

| 優先度 | 対象 | ツール | 内容 |
|--------|------|--------|------|
| 1 | データ層 | vitest + better-sqlite3(:memory:) | queries/*.tsの全関数CRUD。外部キー制約、エッジケース（空文字、長文、日本語、絵文字） |
| 2 | APIルート | vitest | リクエスト/レスポンス。正常系（201, 200）、異常系（400, 404）。zodバリデーション境界値 |
| 3 | コンポーネント | React Testing Library + vitest | ClientForm、SessionNote、OnboardingWizard。フォーム送信、バリデーションエラー、空状態 |
| 4 | E2E | Playwright | クライアント作成→セッション記録→要約生成→フォローアップ生成の一連フロー |

---

## レスポンシブ設計

| 画面 | デスクトップ | タブレット | モバイル |
|------|-------------|-----------|---------|
| ナビ | 左固定サイドバー（240px、折りたたみ可） | アイコンのみサイドバー | ボトムタブバー3項目 |
| クライアント一覧 | 3カラムカードグリッド | 2カラム | 1カラムリスト |
| セッションノート | 左エディタ・右AI結果の2カラム | 同左 | シングルカラム（AI結果は下にスタック） |
| フォローアップ | 右スライドオーバー | 同左 | フルスクリーンモーダル |
| フォント | 本文16px | 本文16px | 本文16px以上（iOS自動ズーム防止） |
| タッチ | — | タップターゲット44x44px | タップターゲット44x44px |

---

## アクセシビリティ

- カラーコントラスト WCAG 2.1 AA準拠（通常テキスト4.5:1以上）
- 全機能がキーボード操作可能。Tab順序が論理的。フォーカスリング視認可能
- 全画像にalt属性。アイコンボタンにaria-label
- AI生成完了時・トースト表示時に`aria-live="polite"`でアナウンス
- 全入力フィールドにlabel要素紐付け（placeholder単体でのラベル代用禁止）
- `prefers-reduced-motion`で不要なアニメーション無効化
- `lang="ja"`をhtml要素に設定
- 日付表示は「2026年2月26日（木）」形式

---

## 日本市場特有の考慮

- UIテキストは「です・ます」調で統一
- エラーメッセージは「申し訳ございません」系の丁寧表現
- 日付は「○月○日（曜日）」形式（和暦対応は不要）
- メール生成のデフォルト文体は丁寧語
- 金額は円単位、カンマ区切り表示

---

## 実装手順

### Phase 1: プロジェクト基盤（Day 1）
1. `create-next-app` でプロジェクト作成（TypeScript, App Router, Tailwind CSS）
2. 必要パッケージのインストール（better-sqlite3, zod, nanoid, date-fns, clsx, tailwind-merge, lucide-react）
3. `src/lib/db.ts` — better-sqlite3接続（WAL, foreign_keys, busy_timeout, HMR対策のglobalThis.__dbパターン）
4. `src/lib/schema.sql` — 全テーブル定義（CREATE TABLE IF NOT EXISTS）
5. `src/lib/seed.ts` — デフォルトユーザー作成、システムテンプレート3種（ライフ/ビジネス/キャリア）挿入
6. `src/lib/utils.ts` — cn()ユーティリティ、日付フォーマットヘルパー
7. `src/lib/validators.ts` — zodスキーマ全定義

### Phase 2: データ層（Day 2）
8. `src/lib/queries/clients.ts` — クライアントCRUDクエリ（一覧ページネーション、検索、フィルタ、Free上限チェック）
9. `src/lib/queries/sessions.ts` — セッションCRUDクエリ（session_number自動採番）
10. `src/lib/queries/notes.ts` — ノートupsert、自動保存、FTSインデックス更新
11. `src/lib/queries/ai-summaries.ts` — AI要約CRUD（バージョン管理）
12. `src/lib/queries/follow-up-emails.ts` — フォローアップメールCRUD
13. `src/lib/queries/templates.ts` — テンプレートCRUD（システムテンプレート保護）
14. `src/lib/queries/dashboard.ts` — ダッシュボード集計（次回セッション、未送信数、KPI）
15. `src/lib/queries/search.ts` — FTS5全文検索
16. `src/lib/queries/goal-scores.ts` — 目標スコアCRUD
17. `src/lib/ai.ts` — AIモック実装（generateSummary, generateFollowUp）

### Phase 3: APIルート（Day 3）
18. 全APIルートの実装（上記API設計テーブルに従い、クライアント→セッション→ノート→AI→メール→テンプレート→ダッシュボード→検索の順）
19. 各ルートにzodバリデーション適用
20. エラーレスポンスの統一フォーマット（`{ error: string, details?: unknown }`）

### Phase 4: 共通UIコンポーネント（Day 4）
21. `src/components/ui/` — 基礎コンポーネント全種（Button, Card, Input, Select, Badge, Dialog, Toast, Skeleton, EmptyState, PlanLimitBanner, TabGroup）
22. `src/components/layout/` — Sidebar, BottomTabBar, Header, PageContainer
23. `src/app/layout.tsx` — 共通レイアウト（html lang="ja"、サイドバー/ボトムタブ切替、Toastプロバイダー）

### Phase 5: ページ実装（Day 5-7）
24. ランディングページ `/` — ヒーロー、機能紹介、料金、CTA
25. オンボーディング `/onboarding` — 3ステップウィザード
26. ダッシュボード `/dashboard` — セッション予定、アラート、KPI、チュートリアルカード（空状態）
27. クライアント一覧 `/clients` — 検索、フィルタ、カード/リスト切替、空状態
28. クライアント詳細 `/clients/[id]` — タブUI（プロフィール/セッション/目標/メモ）、目標スコアグラフ
29. 新規セッション `/sessions/new` — フォーム（クライアント選択、テンプレート、日時）
30. セッション一覧 `/sessions` — フィルタ、テーブル表示、ページネーション
31. セッションノート `/sessions/[id]` — テキストエリア、自動保存、前回コンテキスト表示、AI要約パネル、フォローアップパネル
32. 全文検索 `/search` — 検索バー、結果タブ切替
33. 設定 `/settings` — プロフィール編集、メール署名、テンプレート管理

### Phase 6: 仕上げ（Day 8）
34. レスポンシブ対応の検証・修正
35. 空状態・エラー状態の全パターン実装
36. アクセシビリティチェック（キーボード操作、aria属性、コントラスト）
37. `npm run build` 通過確認
38. テスト実装（データ層 → APIルート → 主要コンポーネント）
