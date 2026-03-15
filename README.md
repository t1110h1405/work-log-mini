# Work Log Mini

Notion database に作業ログを保存する、1画面の軽量 PWA です。

## できること

- 作業内容を入力
- ストップウォッチで計測
- 手動で分入力して保存
- Notion Database に 1 件ずつ追加
- iPhone のホーム画面に追加して使う

## セットアップ

1. `cp .env.example .env`
2. `.env` に `NOTION_TOKEN` と `NOTION_DATABASE_ID` を設定
3. `npm install`
4. `npm run dev`
5. `http://localhost:3000` を開く

## Vercel で公開

1. Vercel アカウントを作成してログイン
2. このフォルダを GitHub に置くか、Vercel CLI で読み込む
3. Vercel の Project Settings > Environment Variables に次を設定
4. `NOTION_TOKEN`
5. `NOTION_DATABASE_ID`
6. デプロイ

デプロイ後は、発行された `https://...vercel.app` の URL をそのまま使えます。iPhone ではその URL を開いてホーム画面に追加してください。

## GitHub に置く

1. `git init`
2. `git add .`
3. `git commit -m "Initial commit"`
4. GitHub で空の repository を作成
5. `git remote add origin <YOUR_GITHUB_REPO_URL>`
6. `git branch -M main`
7. `git push -u origin main`

## Notion 側の準備

統合を作成して、保存先 Database に接続してください。Database のプロパティ名は次の前提です。

- `Title` : タイトル
- `Date` : 日付
- `DurationMin` : 数値
- `StartAt` : 日付
- `EndAt` : 日付
- `Device` : テキスト

`StartAt` と `EndAt` は空でも保存できます。

## API

### `GET /api/health`

Notion の設定有無を返します。

### `POST /api/logs`

JSON 例:

```json
{
  "content": "LP修正",
  "date": "2026-03-15T02:30:00.000Z",
  "durationMin": 25,
  "startAt": "2026-03-15T02:00:00.000Z",
  "endAt": "2026-03-15T02:25:00.000Z"
}
```
