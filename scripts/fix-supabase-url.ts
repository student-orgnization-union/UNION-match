#!/usr/bin/env node
/**
 * .env.localのSupabase URLを修正するスクリプト
 * SERVICE_ROLE_KEYからrefを抽出して正しいURLを構築
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(process.cwd(), '.env.local')

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local が見つかりません')
  process.exit(1)
}

// JWTトークンからrefを抽出
function extractRefFromToken(token: string): string | null {
  try {
    // JWTのペイロード部分を取得
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload.ref || null
  } catch {
    return null
  }
}

// .env.localを読み込む
const envContent = fs.readFileSync(envPath, 'utf-8')
const lines = envContent.split('\n')

let serviceRoleKey = ''
let hasVercelUrl = false
let correctRef = ''

// SERVICE_ROLE_KEYを取得
for (const line of lines) {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    serviceRoleKey = line.split('=')[1].trim().replace(/^["']|["']$/g, '')
    correctRef = extractRefFromToken(serviceRoleKey)
    break
  }
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY が見つかりません')
  process.exit(1)
}

if (!correctRef) {
  console.error('❌ JWTトークンからrefを抽出できませんでした')
  console.log('手動で .env.local の NEXT_PUBLIC_SUPABASE_URL を以下に設定してください:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co')
  process.exit(1)
}

const correctUrl = `https://${correctRef}.supabase.co`
console.log(`✅ Supabaseプロジェクトのref: ${correctRef}`)
console.log(`✅ 正しいURL: ${correctUrl}\n`)

// .env.localを更新
const newLines = lines.map((line: string) => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    const currentValue = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '')
    if (currentValue.includes('vercel.app') || !currentValue.includes('.supabase.co')) {
      hasVercelUrl = true
      return `NEXT_PUBLIC_SUPABASE_URL=${correctUrl}`
    }
  }
  if (line.startsWith('SUPABASE_URL=')) {
    const currentValue = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '')
    if (currentValue.includes('vercel.app') || !currentValue.includes('.supabase.co')) {
      hasVercelUrl = true
      return `SUPABASE_URL=${correctUrl}`
    }
  }
  return line
})

if (hasVercelUrl) {
  fs.writeFileSync(envPath, newLines.join('\n'), 'utf-8')
  console.log('✅ .env.local を更新しました')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL=${correctUrl}`)
} else {
  console.log('ℹ️  .env.local は既に正しいURLが設定されています')
}

console.log('\n次のステップ:')
console.log('  node -r dotenv/config scripts/setup-supabase-direct.ts dotenv_config_path=.env.local')
