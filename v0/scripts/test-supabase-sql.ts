// Quick connectivity test to pg-meta SQL endpoint (select 1;).
// Usage in v0: Click "Run" for this script
// Usage locally: node --env-file=.env.local scripts/test-supabase-sql.ts

function extractOrigin(raw: string): string {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    const u2 = new URL(`https://${raw}`)
    return `${u2.protocol}//${u2.host}`
  }
}

async function run() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です")
    process.exit(1)
  }

  const origin = extractOrigin(SUPABASE_URL)
  const endpoint = `${origin}/postgres/v1/query`

  console.log("➡️  Testing:", endpoint)
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query: "select 1;" }),
  })

  const text = await res.text().catch(() => "")

  if (!res.ok) {
    console.error("❌ 失敗:", res.status, text || "(no body)")
    if (/requested path is invalid/i.test(text)) {
      console.error("ヒント: SUPABASE_URL は https://{ref}.supabase.co（パスなし）にしてください。")
    }
    process.exit(1)
  }

  console.log("✅ OK:", text || "(no body)")
}

run().catch((e) => {
  console.error("❌ 予期せぬエラー:", e?.message || e)
  process.exit(1)
})
