import { NextResponse } from 'next/server'
import fs from 'fs'

const CUSTOM_CMDS_PATH = '/Users/kim/.openclaw/workspace/custom-commands.json'

export async function POST(req: Request) {
  try {
    const { key, desc } = await req.json()
    if (!key || !desc) return NextResponse.json({ error: '명령어와 설명을 입력하세요' }, { status: 400 })

    let cmds = []
    try {
      cmds = JSON.parse(fs.readFileSync(CUSTOM_CMDS_PATH, 'utf8'))
    } catch {}

    // 중복 체크
    if (cmds.find((c: any) => c.key === key)) {
      return NextResponse.json({ error: '이미 존재하는 명령어입니다' }, { status: 400 })
    }

    cmds.push({ key, desc })
    fs.writeFileSync(CUSTOM_CMDS_PATH, JSON.stringify(cmds, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: '저장 실패' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { key } = await req.json()
    let cmds = []
    try {
      cmds = JSON.parse(fs.readFileSync(CUSTOM_CMDS_PATH, 'utf8'))
    } catch {}
    cmds = cmds.filter((c: any) => c.key !== key)
    fs.writeFileSync(CUSTOM_CMDS_PATH, JSON.stringify(cmds, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
