#!/usr/bin/env node

/**
 * codex.js (v1)
 * -----------------------------------
 * Cursor / Node.js 環境で動く簡易CLIテンプレート。
 * 後でLLM API呼び出しを追加可能。
 *
 * 実行例：
 *   npm run codex
 *   npm run codex "generate Next.js API route for /users"
 */

const args = process.argv.slice(2);

// 引数がないとき：ヘルプ表示
if (args.length === 0) {
  console.log("codex CLI 起動 OK ✅");
  console.log("例: `npm run codex \"create api route for /users\"`");
  process.exit(0);
}

// 引数を受け取って表示
console.log("あなたが投げたリクエスト:", args.join(" "));

// ↓ここにAI呼び出しを今後実装予定
// console.log("AIからの提案コードをここに出力予定...");
