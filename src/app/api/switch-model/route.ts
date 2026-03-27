import { NextResponse } from 'next/server'
import fs from 'fs'

const PREF = '/Users/kim/.openclaw/workspace/preferred-model.json'

export async function POST(req: Request) {
  try {
    const { model } = await req.json()
    if (!model) return NextResponse.json({ error: '모델명 필요' }, { status: 400 })
    fs.writeFileSync(PREF, JSON.stringify({ model, updatedAt: new Date().toISOString() }, null, 2))
    return NextResponse.json({ ok: true, model })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json(JSON.parse(fs.readFileSync(PREF, 'utf8')))
  } catch {
    return NextResponse.json({ model: null })
  }
}
