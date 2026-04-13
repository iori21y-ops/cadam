import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import fs from 'fs'

async function check(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.ok || res.status < 500
  } catch { return false }
}

function checkPort(port: number): boolean {
  try {
    const result = execSync(`lsof -i :${port} -sTCP:LISTEN 2>/dev/null`).toString()
    return result.length > 0
  } catch { return false }
}

export async function GET() {
  const [ollama, n8n, naver] = await Promise.all([
    check('http://127.0.0.1:11434'),
    check('http://127.0.0.1:5678'),
    check('http://127.0.0.1:3100'),
  ])

  let disk = 'N/A'
  let blogCount = 0
  let ollamaModel = null
  let ramInfo = { used: 0, free: 0, total: 32 }
  let lastBlog = null
  let lastBackup = null
  let cookieStatus = null
  let workflows: {name: string, active: boolean}[] = []
  let cronJobs: {name: string, schedule: string, status: string, lastRun: string | null}[] = []
  let heartbeat = null
  let services = [
    { name: 'OpenClaw Gateway', port: 18789, active: false },
    { name: 'n8n 워크플로우', port: 5678, active: false },
    { name: 'cadam-naver 서버', port: 3100, active: false },
    { name: 'RenTailor 웹사이트', port: 3000, active: false },
    { name: 'Ollama', port: 11434, active: false },
  ]
  let heartbeatChecks: {name: string, type: string}[] = []
  let ollamaModels: {name: string, size: string, role: string}[] = []
  let sysCrontab: {schedule: string, script: string}[] = []
  let telegramCmds: {key: string, desc: string, custom?: boolean}[] = []

  try {
    disk = execSync("df -h / | awk 'NR==2 {print $5}'").toString().trim()
  } catch {}

  try {
    blogCount = parseInt(execSync("grep -c '발행 완료' /Users/kim/projects/cadam/cadam-naver/publish.log 2>/dev/null || echo 0").toString().trim())
  } catch {}

  try {
    const ps = await fetch('http://127.0.0.1:11434/api/ps')
    const data = await ps.json()
    if (data.models && data.models.length > 0) {
      const m = data.models[0]
      ollamaModel = {
        name: m.name,
        size: (m.size / 1024 / 1024 / 1024).toFixed(1) + 'GB',
        processor: m.details?.quantization_level || '-',
      }
    }
  } catch {}

  try {
    const vmstat = execSync("vm_stat").toString()
    const pageSize = 16384
    const freeMatch = vmstat.match(/Pages free:\s+(\d+)/)
    const activeMatch = vmstat.match(/Pages active:\s+(\d+)/)
    const wiredMatch = vmstat.match(/Pages wired down:\s+(\d+)/)
    const compMatch = vmstat.match(/occupied by compressor:\s+(\d+)/)
    const free = freeMatch ? parseInt(freeMatch[1]) * pageSize / 1024 / 1024 / 1024 : 0
    const active = activeMatch ? parseInt(activeMatch[1]) * pageSize / 1024 / 1024 / 1024 : 0
    const wired = wiredMatch ? parseInt(wiredMatch[1]) * pageSize / 1024 / 1024 / 1024 : 0
    const comp = compMatch ? parseInt(compMatch[1]) * pageSize / 1024 / 1024 / 1024 : 0
    ramInfo = {
      free: parseFloat(free.toFixed(1)),
      used: parseFloat((active + wired + comp).toFixed(1)),
      total: 32
    }
  } catch {}

  try {
    const log = execSync("grep '발행 완료' /Users/kim/projects/cadam/cadam-naver/publish.log | tail -1").toString().trim()
    const match = log.match(/\[(.+?)\]/)
    if (match) lastBlog = match[1]
  } catch {}

  try {
    const log = execSync("tail -1 /Users/kim/backup.log").toString().trim()
    if (log) lastBackup = log.replace(': 백업 완료 →', '').split('/backups')[0].trim()
  } catch {}

  try {
    const stat = execSync("stat -f %m /Users/kim/projects/cadam/cadam-naver/naver-cookies.json").toString().trim()
    const modified = new Date(parseInt(stat) * 1000)
    const daysSince = Math.floor((Date.now() - modified.getTime()) / 1000 / 60 / 60 / 24)
    cookieStatus = {
      daysSince,
      status: daysSince < 14 ? 'good' : daysSince < 21 ? 'warn' : 'expired'
    }
  } catch {}

  try {
    const apiKey = process.env.N8N_API_KEY || ''
    const res = await fetch('http://127.0.0.1:5678/api/v1/workflows', {
      headers: { 'X-N8N-API-KEY': apiKey }
    })
    const data = await res.json()
    workflows = (data.data || [])
      .filter((w: any) => !w.name.includes('copy'))
      .map((w: any) => ({ name: w.name, active: w.active }))
  } catch {}

  try {
    const jobs = JSON.parse(fs.readFileSync('/Users/kim/.openclaw/cron/jobs.json', 'utf8'))
    cronJobs = jobs.jobs.map((j: any) => ({
      name: j.name,
      schedule: j.schedule.expr,
      status: j.state?.lastRunStatus || 'idle',
      lastRun: j.state?.lastRunAtMs ? new Date(j.state.lastRunAtMs).toISOString() : null
    }))
  } catch {}

  try {
    const config = JSON.parse(fs.readFileSync('/Users/kim/.openclaw/openclaw.json', 'utf8'))
    const hb = config.agents?.defaults?.heartbeat
    let lastHbTime = null
    let lastHbResult = 'unknown'
    const sessionsDir = '/Users/kim/.openclaw/agents/main/sessions'
    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({ f, mt: fs.statSync(`${sessionsDir}/${f}`).mtimeMs }))
      .sort((a, b) => b.mt - a.mt)
      .slice(0, 3)
    for (const { f } of files) {
      const lines = fs.readFileSync(`${sessionsDir}/${f}`, 'utf8').split('\n').filter(Boolean)
      for (const line of lines.reverse()) {
        try {
          const d = JSON.parse(line)
          if (d.type === 'message' && d.message?.role === 'assistant') {
            const text = d.message.content?.map((c: any) => c.text || '').join('')
            if (text.includes('HEARTBEAT_OK') || text.includes('하트비트')) {
              lastHbTime = d.timestamp
              lastHbResult = text.includes('HEARTBEAT_OK') ? 'ok' : 'alert'
              break
            }
          }
        } catch {}
      }
      if (lastHbTime) break
    }
    heartbeat = {
      every: hb?.every || '1h',
      model: hb?.model || '-',
      activeHours: `${hb?.activeHours?.start || '08:00'}~${hb?.activeHours?.end || '23:00'}`,
      lastTime: lastHbTime,
      lastResult: lastHbResult
    }
  } catch {}

  services = services.map(s => ({ ...s, active: checkPort(s.port) }))

  // 하트비트 체크 항목 (HEARTBEAT.md 읽기)
  try {
    const hbMd = fs.readFileSync('/Users/kim/.openclaw/workspace/HEARTBEAT.md', 'utf8')
    const lines = hbMd.split('\n')
    let currentType = '항상'
    for (const line of lines) {
      if (line.includes('## 항상')) currentType = '항상'
      else if (line.includes('## 운영시간')) currentType = '운영시간'
      else if (line.trim().startsWith('- [ ]')) {
        const name = line.replace('- [ ]', '').trim()
        if (name && name !== 'HEARTBEAT_OK') {
          heartbeatChecks.push({ name, type: currentType })
        }
      }
    }
  } catch {}

  // AI 모델 목록 (ollama list)
  try {
    const list = execSync('/usr/local/bin/ollama list 2>/dev/null || /opt/homebrew/bin/ollama list').toString()
    const lines = list.split('\n').slice(1).filter(Boolean)
    const roleMap: {[key: string]: string} = {
      'qwen3.5:27b': '📝 메인 모델 · 블로그 작성',
      'qwen3.5:27b-nothink': '⚡ 폴백 모델 · 메인 실패 시',
      'qwen2.5:3b': '💓 하트비트 전용 · 경량',
    }
    ollamaModels = lines.map(line => {
      const parts = line.trim().split(/\s+/)
      const name = parts[0]
      const size = parts[2] + ' ' + parts[3]
      return { name, size, role: roleMap[name] || '기타' }
    })
  } catch {}

  // 시스템 crontab
  try {
    const cron = execSync('crontab -l 2>/dev/null').toString()
    sysCrontab = cron.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(line => {
      const parts = line.trim().split(/\s+/)
      const cronMap: {[key: string]: string} = {
        '*/20 * * * *': '20분마다',
        '0 4 * * 0': '매주 일 04:00',
        '0 5 * * *': '매일 05:00',
        '0 8 * * *': '매일 08:00',
      }
      const rawSchedule = parts.slice(0, 5).join(' ')
      const schedule = cronMap[rawSchedule] || rawSchedule
      const scriptPath = parts.slice(5).join(' ')
      const script = scriptPath.split('/').pop() || scriptPath
      const descMap: {[key: string]: string} = {
        'watch_openclaw.sh': 'OpenClaw 프로세스 감시 · 죽으면 자동 재시작',
        'cleanup_logs.sh':   '오래된 로그 파일 정리',
        'backup_cadam.sh':   'RenTailor 전체 백업 실행',
        'daily_report.sh':   '일일 운영 리포트 텔레그램 전송',
      }
      const desc = descMap[script] || ''
      return { schedule, script, desc }
    })
  } catch {}

  // 텔레그램 명령어 (TOOLS.md 읽기)
  try {
    const tools = fs.readFileSync('/Users/kim/.openclaw/workspace/TOOLS.md', 'utf8')
    const lines = tools.split('\n')
    let inCmd = false
    for (const line of lines) {
      if (line.includes('텔레그램 봇 명령어 목록')) { inCmd = true; continue }
      if (inCmd && line.startsWith('## /help')) { inCmd = false; continue }
      if (inCmd && line.includes('→')) {
        const parts = line.split('→')
        const key = parts[0].replace(/[-"\s]/g, '').trim()
        const desc = parts[1].trim()
        if (key && desc) telegramCmds.push({ key, desc })
      }
    }
  } catch {}

  // 커스텀 명령어 (custom-commands.json 읽기)
  try {
    const customCmds = JSON.parse(fs.readFileSync('/Users/kim/.openclaw/workspace/custom-commands.json', 'utf8'))
    for (const c of customCmds) {
      if (c.key && c.desc) telegramCmds.push({ key: c.key, desc: c.desc, custom: true })
    }
  } catch {}


  // ── Ollama 메모리 + tok/s + 컨텍스트 ─────────────────
  let ollamaMemory = 'N/A'
  let tokensPerSec = 'N/A'
  let contextUsage = { prompt: 0, completion: 0 }
  try {
    const ps2 = await fetch('http://127.0.0.1:11434/api/ps')
    const ps2d = await ps2.json()
    if (ps2d.models?.[0]?.size_vram) {
      ollamaMemory = (ps2d.models[0].size_vram / 1024 / 1024 / 1024).toFixed(1) + 'GB'
    }
  } catch {}
  try {
    const sd = '/Users/kim/.openclaw/agents/main/sessions'
    const sf = fs.readdirSync(sd).filter((f: string) => f.endsWith('.jsonl'))
      .map((f: string) => ({ f, mt: fs.statSync(`${sd}/${f}`).mtimeMs }))
      .sort((a: any, b: any) => b.mt - a.mt).slice(0, 5)
    outerTps: for (const { f } of sf) {
      const ln = fs.readFileSync(`${sd}/${f}`, 'utf8').split('\n').filter(Boolean)
      for (const l of [...ln].reverse()) {
        try {
          const d = JSON.parse(l)
          if (d.usage?.eval_count && d.usage?.eval_duration) {
            tokensPerSec = (d.usage.eval_count / (d.usage.eval_duration / 1e9)).toFixed(1) + ' tok/s'
            contextUsage = { prompt: d.usage.prompt_eval_count || 0, completion: d.usage.eval_count || 0 }
            break outerTps
          }
        } catch {}
      }
    }
  } catch {}

  // ── 최근 발행 글 + 통계 + 다음 발행 ──────────────────
  let recentPosts: {title: string, time: string}[] = []
  let blogStats = { success: 0, fail: 0 }
  let nextPublish = 'N/A'
  try {
    const plog = execSync('cat /Users/kim/projects/cadam/cadam-naver/publish.log 2>/dev/null').toString()
    for (const l of plog.split('\n').filter(Boolean)) {
      if (l.includes('발행 완료')) blogStats.success++
      else if (l.includes('발행 실패') || l.includes('ERROR')) blogStats.fail++
    }
    recentPosts = plog.split('\n').filter((l: string) => l.includes('발행 완료')).slice(-5).reverse().map((line: string) => ({
      time: line.match(/\[(.+?)\]/)?.[1] || '-',
      title: line.match(/제목[:\s]+(.+?)(?:\s*\||$)/)?.[1]?.trim() || line.slice(0, 40)
    }))
  } catch {}
  try {
    const ct = execSync('crontab -l 2>/dev/null').toString()
    const pl = ct.split('\n').find((l: string) => !l.startsWith('#') && (l.includes('publish') || l.includes('naver')))
    if (pl) {
      const expr = pl.trim().split(/\s+/).slice(0, 5).join(' ')
      const sm: {[k: string]: string} = { '*/20 * * * *':'20분마다','0 5 * * *':'매일 05:00','0 8 * * *':'매일 08:00' }
      nextPublish = sm[expr] || expr
    }
  } catch {}

  // ── CPU + 온도 + 네트워크 ─────────────────────────────
  let cpuUsage = 'N/A'
  let cpuTemp = 'N/A'
  let networkIn = 'N/A'
  let networkOut = 'N/A'
  try {
    const top = execSync("top -l 1 -n 0 | grep 'CPU usage'").toString()
    const m = top.match(/([\d.]+)% user.*?([\d.]+)% sys/)
    if (m) cpuUsage = (parseFloat(m[1]) + parseFloat(m[2])).toFixed(1) + '%'
  } catch {}
  cpuTemp = 'N/A' // Apple Silicon 온도 미지원
  try {
    const getBytes = () => {
      const r = execSync("netstat -ib | awk 'NR>1 && $7>0 && $1 ~ /^en/ {print $7, $10; exit}'").toString().trim().split(/\s+/)
      return [parseInt(r[0]) || 0, parseInt(r[1]) || 0]
    }
    const [in1, out1] = getBytes()
    execSync('sleep 1')
    const [in2, out2] = getBytes()
    const inMbps = ((in2 - in1) * 8 / 1024 / 1024).toFixed(2)
    const outMbps = ((out2 - out1) * 8 / 1024 / 1024).toFixed(2)
    networkIn = inMbps + ' Mbps'
    networkOut = outMbps + ' Mbps'
  } catch {}

  // ── n8n 실행 통계 ─────────────────────────────────────
  let workflowStats: {name: string, success: number, fail: number}[] = []
  try {
    const ak = process.env.N8N_API_KEY || ''
    // 워크플로우 ID → 이름 맵 생성
    const wfListRes = await fetch('http://127.0.0.1:5678/api/v1/workflows', { headers: { 'X-N8N-API-KEY': ak } })
    const wfListData = await wfListRes.json()
    const wfIdMap: {[k: string]: string} = {}
    for (const w of (wfListData.data || [])) { wfIdMap[w.id] = w.name }
    const er = await fetch('http://127.0.0.1:5678/api/v1/executions?limit=100', { headers: { 'X-N8N-API-KEY': ak } })
    const ed = await er.json()
    const sm2: {[k: string]: {name: string, success: number, fail: number}} = {}
    for (const e of (ed.data || [])) {
      const wfName = wfIdMap[e.workflowId] || e.workflowData?.name || e.workflowId
      if (!sm2[e.workflowId]) sm2[e.workflowId] = { name: wfName, success: 0, fail: 0 }
      if (e.status === 'success') sm2[e.workflowId].success++
      else if (e.status === 'error' || e.status === 'crashed') sm2[e.workflowId].fail++
    }
    workflowStats = Object.values(sm2)
  } catch {}

  // ── 하트비트 히스토리 (최근 10회) ────────────────────
  let hbHistory: {time: string, result: string}[] = []
  try {
    const sd2 = '/Users/kim/.openclaw/agents/main/sessions'
    const sf2 = fs.readdirSync(sd2).filter((f: string) => f.endsWith('.jsonl'))
      .map((f: string) => ({ f, mt: fs.statSync(`${sd2}/${f}`).mtimeMs }))
      .sort((a: any, b: any) => b.mt - a.mt).slice(0, 20)
    for (const { f } of sf2) {
      for (const l of fs.readFileSync(`${sd2}/${f}`, 'utf8').split('\n').filter(Boolean)) {
        try {
          const d = JSON.parse(l)
          if (d.type === 'message' && d.message?.role === 'assistant') {
            const txt = d.message.content?.map((c: any) => c.text || '').join('')
            if (txt.includes('HEARTBEAT_OK') || txt.includes('하트비트')) {
              hbHistory.push({ time: d.timestamp, result: txt.includes('HEARTBEAT_OK') ? 'ok' : 'alert' })
              if (hbHistory.length >= 10) break
            }
          }
        } catch {}
      }
      if (hbHistory.length >= 10) break
    }
  } catch {}

  return NextResponse.json({
    ollama, n8n, naver, disk, blogCount,
    ollamaModel, ramInfo, lastBlog, lastBackup,
    cookieStatus, workflows, cronJobs, heartbeat, services,
    heartbeatChecks, ollamaModels, sysCrontab, telegramCmds,
    ollamaMemory, tokensPerSec, contextUsage,
    recentPosts, blogStats, nextPublish,
    cpuUsage, cpuTemp, networkIn, networkOut,
    workflowStats, hbHistory,
    time: new Date().toISOString()
  })
}
