import { readFile, writeFile } from 'node:fs/promises'
import config from './config.mjs'

const KHAO_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
const THONG_URL = 'https://api.chnwt.dev/thai-gold-api/latest'
const BLS_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'
const DUAN_URL = 'https://investinglive.com/feed/news'
const PLAE_URL = 'https://api.mymemory.translated.net/get'
const UA = 'Mozilla/5.0 (compatible; prontera-discord/1.0)'
const STATE = new URL('./state.json', import.meta.url)
const HOOK_OK = /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/
const TZ = 'Asia/Bangkok'
const NATHI = 60_000
const KEP_TUAN = 2 * 24 * 60 * NATHI
const KHAO_TUK = 60 * NATHI
const KHAO_TUK_KAI = 15 * NATHI
const KHAO_KAI = 2 * 60 * NATHI
const KHAO_PHAK = 30 * NATHI
const DUAN_TUK = 5 * NATHI
const DUAN_MAX = 5
const KEP_DUAN = 3 * 24 * 60 * NATHI
const YAO_MAX = 3600
const KHAO_KAO = 24 * 60 * NATHI
const OK_NAN = 90 * NATHI
const PANG_NAN = 2 * 60 * NATHI
const PANG_BOK = 6 * 60 * NATHI
const FAO_KON = 15 * NATHI
const FAO_LANG = 30 * NATHI
const FAO_MAX = 50 * NATHI
const FAO_TICK = 15_000
const FAO_REO = 3_000
const FAO_REO_NAN = 2 * NATHI
const thongchat = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CNY: '🇨🇳', CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿', CHF: '🇨🇭' }

const dry = process.argv.includes('--dry')
const non = (ms) => new Promise((r) => setTimeout(r, ms))

const dujson = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': 'prontera-discord' }, signal: AbortSignal.timeout(15_000) })
  if (!r.ok) throw new Error(`${url} -> ${r.status}`)
  return r.json()
}

const sendka = async (hook, embed) => {
  if (dry) return console.log(JSON.stringify(embed, null, 2))
  if (!HOOK_OK.test(hook)) throw new Error('webhook url ไม่ใช่ของ discord')
  for (let rop = 0; ; rop++) {
    const r = await fetch(hook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(15_000),
    })
    if (r.status === 429 && rop < 3) {
      const j = await r.json().catch(() => ({}))
      await non(Math.min((Number(j.retry_after) || 1) * 1000 + 250, 30_000))
      continue
    }
    if (!r.ok) throw new Error(`discord -> ${r.status} ${await r.text()}`)
    return
  }
}

export const wanthai = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(ms)
export const mongthai = (ms) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(ms))
export const tad = (s) => Number(String(s).replaceAll(',', ''))
const ngern = (n) => n.toLocaleString('en-US')
const unix = (ms) => Math.floor(ms / 1000)

export const kadkhao = (puang) =>
  puang
    .filter((e) => config.sakul.includes(e.country) && config.radab.includes(e.impact))
    .map((e) => ({ ...e, ts: Date.parse(e.date), key: `${e.date}|${e.country}|${e.title}` }))
    .filter((e) => Number.isFinite(e.ts))
    .sort((a, b) => a.ts - b.ts)

export const jubklum = (puang) => {
  const klum = new Map()
  for (const e of puang) klum.set(e.ts, [...(klum.get(e.ts) ?? []), e])
  return klum
}

const CHUE = [
  { re: /ADP/i, tha: 'ตัวเลขจ้างงานเอกชน (ADP)', usd: 1, thong: -1, nas: 0 },
  { re: /Non-Farm Employment/i, tha: 'ตัวเลขจ้างงานนอกภาคเกษตร (NFP)', usd: 1, thong: -1, nas: 0 },
  { re: /Unemployment Rate/i, tha: 'อัตราคนว่างงาน', usd: -1, thong: 1, nas: 0 },
  { re: /Unemployment Claims|Jobless/i, tha: 'คนขอรับเงินว่างงาน', usd: -1, thong: 1, nas: 0 },
  { re: /Hourly Earnings/i, tha: 'ค่าแรงรายชั่วโมง', usd: 1, thong: -1, nas: -1 },
  { re: /JOLTS/i, tha: 'ตำแหน่งงานว่าง (JOLTS)', usd: 1, thong: -1, nas: 0 },
  { re: /PCE/i, tha: 'เงินเฟ้อที่ Fed ใช้ดู (PCE)', usd: 1, thong: -1, nas: -1 },
  { re: /CPI/i, tha: 'เงินเฟ้อ (CPI)', usd: 1, thong: -1, nas: -1 },
  { re: /PPI/i, tha: 'ราคาสินค้าหน้าโรงงาน (PPI)', usd: 1, thong: -1, nas: -1 },
  { re: /Retail Sales/i, tha: 'ยอดขายปลีกอเมริกา (Retail Sales)', usd: 1, thong: -1, nas: 0 },
  { re: /GDP/i, tha: 'การเติบโตเศรษฐกิจ (GDP)', usd: 1, thong: -1, nas: 0 },
  { re: /Services PMI/i, tha: 'ภาคบริการ (PMI)', usd: 1, thong: -1, nas: 0 },
  { re: /Manufacturing PMI|Philly Fed|Empire State/i, tha: 'ภาคการผลิต (PMI)', usd: 1, thong: -1, nas: 0 },
  { re: /Consumer Confidence|Sentiment/i, tha: 'ความเชื่อมั่นผู้บริโภค', usd: 1, thong: -1, nas: 0 },
  { re: /Durable/i, tha: 'ยอดสั่งซื้อสินค้าคงทน', usd: 1, thong: -1, nas: 0 },
  { re: /Federal Funds Rate/i, tha: 'ประกาศดอกเบี้ยอเมริกา', usd: 1, thong: -1, nas: -1 },
  { re: /FOMC Statement|Press Conference|Minutes/i, tha: 'แถลงการณ์ Fed', phut: true, usd: 1, thong: -1, nas: -1 },
  { re: /Fed Chair.*(Speaks|Testifies)/i, tha: 'ประธาน Fed ออกมาพูด', phut: true, usd: 1, thong: -1, nas: -1 },
  { re: /FOMC Member.*Speaks/i, tha: 'กรรมการ Fed ออกมาพูด', phut: true, usd: 1, thong: -1, nas: -1 },
]
const SI_RADAB = { High: '🔴 ', Medium: '🟠 ', Low: '🟡 ' }
const DUAN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const FF = 'https://www.forexfactory.com/calendar'
const TAIKHAO = 'แกว่ง = ขึ้นหรือลงก็ได้ · เป็นแนวโน้มที่เกิดบ่อย ไม่ใช่ทุกครั้ง · ไม่ใช่คำแนะนำลงทุน'
const LUKSON = { 1: '🔺', '-1': '🔻', 0: 'แกว่ง' }
const phon = (c, thit) => `GOLD ${LUKSON[c.thong * thit]} · USD ${LUKSON[c.usd * thit]} · NAS ${LUKSON[c.nas * thit]}`

export const duchue = (e) => (e?.country === 'USD' ? CHUE.find((c) => c.re.test(e.title)) : undefined)
export const linkff = (date) => {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return `${FF}?day=${DUAN[m - 1]}${d}.${y}`
}
const linkla = (url) => `[📅 กดดูตัวเลขที่ออกจริง](${url})`

const huakhao = (e, c) => `${SI_RADAB[e.impact] ?? ''}${thongchat[e.country] ?? e.country} **${c?.tha ?? e.title}**`

export const banthat = (e) => {
  const c = duchue(e)
  const bandai = [huakhao(e, c)]
  if (c?.phut) return [...bandai, `พูดไปทางขึ้นดอกเบี้ย → ${phon(c, 1)}`, `พูดไปทางลดดอกเบี้ย → ${phon(c, -1)}`].join('\n')
  const lek = [e.forecast && `คาดไว้ ${e.forecast}`, e.previous && `ครั้งก่อน ${e.previous}`].filter(Boolean).join(' · ')
  if (lek) bandai.push(lek)
  if (c) {
    const tue = e.forecast ? ` ${e.forecast}` : 'ที่คาด'
    bandai.push(`ออกมากกว่า${tue} → ${phon(c, 1)}`, `ออกน้อยกว่า${tue} → ${phon(c, -1)}`)
  }
  return bandai.join('\n')
}

const yae = (e) => (/core/i.test(e.title) ? 2 : 0) + (/y\/y/i.test(e.title) ? 1 : 0)

export const kadsam = (klum) => {
  const hen = new Map()
  for (const e of klum) {
    const k = duchue(e)?.tha ?? e.key
    const kao = hen.get(k)
    if (!kao || yae(e) < yae(kao)) hen.set(k, e)
  }
  return [...hen.values()]
}

export const banklum = (klum) => kadsam(klum).map(banthat).join('\n\n')

const huawela = (ts, wela) => `🕢 **<t:${unix(ts)}:${wela}>** · <t:${unix(ts)}:R>`

export const embedkhao = ({ title, ts, klum, color, wela = 't' }) => ({
  title,
  url: linkff(klum[0].date),
  description: `${huawela(ts, wela)}\n\n${banklum(klum)}\n\n${linkla(linkff(klum[0].date))}`,
  color,
  footer: { text: TAIKHAO },
})

export const wanroem = (ts) => {
  const roem = Date.parse(`${wanthai(ts)}T${String(config.chuamong).padStart(2, '0')}:00:00+07:00`)
  return roem > ts ? roem - 24 * 60 * NATHI : roem
}

export const wansao = (now) => ['Sat', 'Sun'].includes(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(now))

export const songsarup = (puang, now) => !(wansao(now) && !nai24(puang, now).length)

export const nai24 = (puang, now) => puang.filter((e) => e.ts >= now && e.ts < now + 24 * 60 * NATHI)

export const khaomai = (puang, now, sarupKey) => puang.filter((e) => e.ts > now && e.ts < wanroem(now) + 24 * 60 * NATHI && !sarupKey[e.key])

export const sarupwan = (puang, now) => {
  const nai24 = puang.filter((e) => e.ts >= now && e.ts < now + 24 * 60 * NATHI)
  const wan = new Date(now).toLocaleString('th-TH', { timeZone: TZ, day: 'numeric', month: 'short' })
  const klumtang = [...jubklum(nai24)].map(([ts, klum]) => `${huawela(ts, 't')}\n\n${banklum(klum)}`)
  const url = nai24.length ? linkff(nai24[0].date) : FF
  const bandai = []
  let yao = 0
  for (const k of klumtang) {
    if (yao + k.length > YAO_MAX) break
    bandai.push(k)
    yao += k.length + 14
  }
  const lua = klumtang.length - bandai.length
  const tai = lua ? `\n\n…ยังมีอีก ${lua} ช่วงเวลา กดลิงก์ด้านล่างดูทั้งหมด` : ''
  return {
    title: `📰 ข่าววันนี้ · ${wan}`,
    url,
    description: `${bandai.length ? bandai.join('\n\n━━━━━━━━━━\n\n') + tai : 'วันนี้ไม่มีข่าวแรง เทรดตามกราฟได้เลย'}\n\n🔴 ข่าวแรงมาก · 🟠 ข่าวแรงปานกลาง\n${linkla(url)}`,
    color: config.si.thong,
    footer: { text: TAIKHAO },
  }
}

export const hatuan = (puang, now, tuanlaew) =>
  [...jubklum(puang.filter((e) => config.tuanRadab.includes(e.impact) && e.ts > now && e.ts <= now + config.tuanKon * NATHI && !tuanlaew[e.key]))]

export const raikhao = (puang, now) => (puang.some((e) => e.ts > now && e.ts <= now + KHAO_KAI) ? KHAO_TUK_KAI : KHAO_TUK)

export const dupuang = async (state, now, dueng = () => dujson(KHAO_URL)) => {
  const k = state.khao
  if (k && (now - k.at < raikhao(k.puang, now) || now < (k.phak ?? 0))) return k.puang
  try {
    const puang = kadkhao(await dueng())
    state.khao = { at: now, puang }
    return puang
  } catch (e) {
    if (!k || now - k.at > KHAO_KAO) throw e
    k.phak = now + KHAO_PHAK
    console.error('ดึงปฏิทินไม่ได้ ใช้ของเก่าไปก่อน พักดึง 30 นาที:', e.message)
    return k.puang
  }
}

const dukhao = async (state, hook, now) => {
  const puang = await dupuang(state, now)
  const wan = wanthai(now)

  if (dry || (state.sarup !== wan && mongthai(now) >= config.chuamong)) {
    if (dry || songsarup(puang, now)) await sendka(hook, sarupwan(puang, now))
    state.sarup = wan
    state.sarupKey = Object.fromEntries(nai24(puang, now).map((e) => [e.key, e.ts]))
  } else if (state.sarup === wan) {
    state.sarupKey ??= {}
    const mai = khaomai(puang, now, state.sarupKey)
    for (const [ts, klum] of jubklum(mai)) {
      await sendka(hook, embedkhao({ title: '📌 อัปเดตตารางข่าววันนี้ (เพิ่มใหม่ / เลื่อนเวลา)', ts, klum, color: config.si.thong }))
      for (const e of klum) state.sarupKey[e.key] = e.ts
    }
  }
  for (const [k, ts] of Object.entries(state.sarupKey ?? {})) if (ts < now - KEP_TUAN) delete state.sarupKey[k]

  state.tuan ??= {}
  for (const [ts, klum] of hatuan(puang, now, state.tuan)) {
    await sendka(hook, embedkhao({ title: '⚠️ อีกไม่กี่นาทีข่าวแรงออก ระวังกราฟวิ่งแรง', ts, klum, color: config.si.long }))
    for (const e of klum) state.tuan[e.key] = e.ts
  }
  for (const [k, ts] of Object.entries(state.tuan)) if (ts < now - KEP_TUAN) delete state.tuan[k]

  await duok(state, hook, now, puang)
}

const BLS = [
  { re: /^CPI m\/m$/i, id: 'CUSR0000SA0', bep: 'pct' },
  { re: /^Core CPI m\/m$/i, id: 'CUSR0000SA0L1E', bep: 'pct' },
  { re: /^PPI m\/m$/i, id: 'WPSFD4', bep: 'pct' },
  { re: /^Core PPI m\/m$/i, id: 'WPSFD49104', bep: 'pct' },
  { re: /^Non-Farm Employment Change$/i, id: 'CES0000000001', bep: 'diff' },
  { re: /^Unemployment Rate$/i, id: 'LNS14000000', bep: 'level' },
  { re: /^Average Hourly Earnings m\/m$/i, id: 'CES0500000003', bep: 'pct' },
]

export const habls = (e) => (e?.country === 'USD' ? BLS.find((b) => b.re.test(e.title)) : undefined)

export const duanthi = (date) => {
  const [y, m] = date.slice(0, 7).split('-').map(Number)
  return m === 1 ? { year: String(y - 1), period: 'M12' } : { year: String(y), period: `M${String(m - 1).padStart(2, '0')}` }
}

export const anlek = (b, data, duan) => {
  const [ni, kon] = data
  if (!ni || !kon || ni.year !== duan.year || ni.period !== duan.period) return
  const a = Number(ni.value)
  const p = Number(kon.value)
  if (!Number.isFinite(a) || !Number.isFinite(p) || p === 0) return
  if (b.bep === 'level') return `${a}%`
  if (b.bep === 'diff') return `${Math.round(a - p)}K`
  return `${ni.calculations?.pct_changes?.['1'] ?? ((a / p - 1) * 100).toFixed(1)}%`
}

export const thiap = (ok, kad) => {
  const a = parseFloat(ok)
  const f = parseFloat(kad)
  return Number.isFinite(a) && Number.isFinite(f) ? Math.sign(a - f) : undefined
}

export const banok = (e, lek) => {
  const c = duchue(e)
  const bandai = [huakhao(e, c), `ออกจริง **${lek}**${e.forecast ? ` · คาดไว้ ${e.forecast}` : ''}`]
  const t = thiap(lek, e.forecast)
  if (c && t) bandai.push(`ออก${t > 0 ? 'มากกว่า' : 'น้อยกว่า'}คาด → ${phon(c, t)}`)
  else if (c && t === 0) bandai.push('ออกตรงคาด → กราฟมักไม่วิ่งแรง')
  return bandai.join('\n')
}

export const embedok = ({ title, ts, klum, sam, lek }) => {
  const uen = kadsam(klum).length > sam.length ? '\n\nข่าวอื่นในเวลาเดียวกัน กดดูตัวเลขในลิงก์ด้านล่าง' : ''
  return {
    title,
    url: linkff(klum[0].date),
    description: `${huawela(ts, 't')}\n\n${sam.map((e, i) => banok(e, lek[i])).join('\n\n')}${uen}\n\n${linkla(linkff(klum[0].date))}`,
    color: config.si.thong,
    footer: { text: `${TAIKHAO} · ตัวเลขจาก BLS` },
  }
}

const dungbls = async (ids, pi) => {
  const body = { seriesid: ids, startyear: String(pi - 1), endyear: String(pi) }
  if (BLS_KEY) Object.assign(body, { registrationkey: BLS_KEY, calculations: true })
  const r = await fetch(BLS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })
  if (!r.ok) throw new Error(`BLS -> ${r.status}`)
  const j = await r.json()
  if (j.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS: ${j.message?.join(' ')}`)
  return Object.fromEntries(j.Results.series.map((x) => [x.seriesID, x.data]))
}

export const haok = (puang, now, oklaew, nan = OK_NAN) =>
  [...jubklum(puang.filter((e) => e.ts <= now && e.ts > now - nan && !oklaew[e.key]))]
    .map(([ts, klum]) => ({ ts, klum, sam: kadsam(klum).filter(habls) }))
    .filter((k) => k.sam.length)

export const duok = async (state, hook, now, puang, dueng = dungbls, title = '✅ ตัวเลขออกแล้ว', nan = OK_NAN) => {
  state.ok ??= {}
  const ror = haok(puang, now, state.ok, nan)
  if (!ror.length) return 0
  const ids = [...new Set(ror.flatMap((k) => k.sam.map((e) => habls(e).id)))]
  const data = await dueng(ids, new Date(now).getUTCFullYear())
  let song = 0
  for (const k of ror) {
    const lek = k.sam.map((e) => anlek(habls(e), data[habls(e).id] ?? [], duanthi(e.date)))
    if (lek.some((l) => !l)) continue
    await sendka(hook, embedok({ title, ...k, lek }))
    for (const e of k.klum) state.ok[e.key] = e.ts
    song++
  }
  for (const [key, ts] of Object.entries(state.ok)) if (ts < now - KEP_TUAN) delete state.ok[key]
  return song
}

export const rorbls = (puang, now, oklaew) =>
  [...jubklum(puang.filter((e) => e.ts > now - FAO_LANG && e.ts <= now + FAO_KON && !oklaew[e.key]))].filter(([, klum]) =>
    kadsam(klum).some(habls),
  )

export const raitick = (raek, now) => (raek > now ? Math.min(raek - now, FAO_TICK) : now - raek < FAO_REO_NAN ? FAO_REO : FAO_TICK)

export const faokhao = async (state, { ropni, duokni, gep = async () => {}, non: rorni = non, wela = Date.now }) => {
  const roem = wela()
  let ropLasud = roem
  let pang = false
  while (wela() - roem < FAO_MAX) {
    const ror = rorbls(state.khao?.puang ?? [], wela(), state.ok ?? {})
    if (!ror.length) break
    await rorni(raitick(Math.min(...ror.map(([ts]) => ts)), wela()))
    const now = wela()
    try {
      if (now - ropLasud >= NATHI) {
        ropLasud = now
        pang = (await ropni(state, now)) || pang
      } else await duokni(state, now)
    } catch (e) {
      pang = true
      console.error('เฝ้าข่าวพัง:', e.message)
    }
    await gep(state)
  }
  return pang
}

const KHAM_DUAN = [
  { re: /ceasefire|truce|peace (deal|talks|agreement|plan)|de-?escalat|hostages? (deal|released)/i, tha: 'ข่าวคลายความตึงเครียด', usd: 0, thong: -1, nas: 1 },
  { re: /\bwar\b|missile|air ?strikes?|strikes? on|attack|invasion|invade|troops|military|drone|nuclear|explosion|bomb|escalat|retaliat|hormuz|houthi/i, tha: 'สงคราม / ความตึงเครียด', usd: 0, thong: 1, nas: -1 },
  { re: /emergency|unscheduled|inter-?meeting/i, tha: 'ประกาศฉุกเฉิน', usd: 0, thong: 0, nas: 0 },
  { re: /tariff|trade war|sanction/i, tha: 'ภาษีนำเข้า / สงครามการค้า', usd: 0, thong: 1, nas: -1 },
  { re: /shutdown|debt ceiling|debt default/i, tha: 'การเมืองสหรัฐ', usd: 0, thong: 1, nas: -1 },
  { re: /crash|circuit breaker|trading halt|bank (failure|collapse|run)|bankrupt/i, tha: 'ตลาดผันผวนรุนแรง', usd: 0, thong: 1, nas: -1 },
]
const MAI_AO = /what next|technical|price forecast|news wrap|levels to watch|chart/i

const THONG_PRATHET = [
  [/\b(US|USA|Fed|FOMC)\b|\bU\.S\./, '🇺🇸'],
  [/united states|america|washington|white house|pentagon|trump/i, '🇺🇸'],
  [/\bchin(a|ese)\b|beijing|\bxi\b|\bpboc\b/i, '🇨🇳'],
  [/\brussia|kremlin|moscow|putin/i, '🇷🇺'],
  [/\bukrain|kyiv|kiev|zelensk/i, '🇺🇦'],
  [/\biran|tehran|khamenei/i, '🇮🇷'],
  [/\bisrael|netanyahu|\bidf\b|tel aviv/i, '🇮🇱'],
  [/\bgaza|hamas|palestin|west bank/i, '🇵🇸'],
  [/\blebanon|hezbollah|beirut/i, '🇱🇧'],
  [/\byemen|houthi/i, '🇾🇪'],
  [/\bsyria|damascus/i, '🇸🇾'],
  [/\biraq|baghdad/i, '🇮🇶'],
  [/\bsaudi|riyadh|\bopec\b/i, '🇸🇦'],
  [/\bqatar|doha/i, '🇶🇦'],
  [/\buae\b|emirates|dubai|abu dhabi/i, '🇦🇪'],
  [/\btaiwan|taipei/i, '🇹🇼'],
  [/north korea|pyongyang|kim jong/i, '🇰🇵'],
  [/south korea|seoul/i, '🇰🇷'],
  [/\bjapan|tokyo|\bboj\b/i, '🇯🇵'],
  [/\bindia\b|indian|new delhi|modi/i, '🇮🇳'],
  [/pakistan|islamabad/i, '🇵🇰'],
  [/\b(uk|britain|british|england)\b|london|\bboe\b/i, '🇬🇧'],
  [/\b(eu|ecb|eurozone|european union)\b|brussels/i, '🇪🇺'],
  [/german|berlin/i, '🇩🇪'],
  [/\bfranc(e|h)\b|paris|macron/i, '🇫🇷'],
  [/canad|ottawa/i, '🇨🇦'],
  [/mexic/i, '🇲🇽'],
  [/turkey|turkish|ankara|erdogan/i, '🇹🇷'],
  [/venezuela|caracas/i, '🇻🇪'],
  [/egypt|cairo|suez/i, '🇪🇬'],
  [/thailand|\bthai\b|bangkok/i, '🇹🇭'],
]

export const hathong = (title) =>
  [...new Set(THONG_PRATHET.map(([re, f]) => [title.search(re), f]).filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0]).map(([, f]) => f))].slice(0, 4)

export const kaeduan = (title) => (MAI_AO.test(title) ? undefined : KHAM_DUAN.find((k) => k.re.test(title)))

const thod = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()

export const anrss = (xml) =>
  [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, it]) => {
      const du = (tag) => it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
      const link = thod(du('link') ?? '')
      return { title: thod(du('title') ?? ''), link, id: thod(du('guid') ?? link), ts: Date.parse(du('pubDate') ?? '') }
    })
    .filter((x) => x.title && x.link.startsWith('https://investinglive.com/') && Number.isFinite(x.ts))

const plae = async (text) => {
  try {
    const r = await fetch(`${PLAE_URL}?${new URLSearchParams({ q: text, langpair: 'en|th' })}`, { signal: AbortSignal.timeout(10_000) })
    const j = await r.json()
    const t = j?.responseData?.translatedText
    return j?.responseStatus === 200 && t && !j.quotaFinished ? thod(t) : undefined
  } catch {
    return undefined
  }
}

export const embedduan = (x, k, thai) => {
  const phonduan = k.thong || k.usd || k.nas ? `ข่าวแบบนี้มัก → ${phon(k, 1)}` : 'ตลาดอาจวิ่งแรงได้ทั้งสองทาง'
  return {
    title: `🚨 ข่าวด่วน · ${k.tha}`,
    url: x.link,
    description: `${[...hathong(x.title), ''].join(' ')}${thai ? `**${thai}**\n-# ${x.title}` : `**${x.title}**`}\n\n${phonduan}\n\n[📰 อ่านข่าวเต็ม](${x.link})`,
    color: config.si.long,
    timestamp: new Date(x.ts).toISOString(),
    footer: { text: 'แปลอัตโนมัติ · คัดจากคำในหัวข่าว อาจพลาดได้ · ไม่ใช่คำแนะนำลงทุน · ที่มา investingLive' },
  }
}

const dungduan = async (etag) => {
  const r = await fetch(DUAN_URL, { headers: { 'user-agent': UA, ...(etag && { 'if-none-match': etag }) }, signal: AbortSignal.timeout(15_000) })
  if (r.status === 304) return { mai: false }
  if (!r.ok) throw new Error(`investingLive -> ${r.status}`)
  return { mai: true, etag: r.headers.get('etag'), xml: await r.text() }
}

export const duduan = async (state, hook, now, dueng = dungduan, plaeni = plae) => {
  const d = (state.duan ??= {})
  if (now - (d.at ?? 0) < DUAN_TUK) return 0
  d.at = now
  const r = await dueng(d.etag)
  if (!r.mai) return 0
  const puang = anrss(r.xml)
  const raek = !d.hen
  d.hen ??= {}
  let song = 0
  let khang = false
  for (const x of puang.toSorted((a, b) => a.ts - b.ts)) {
    if (d.hen[x.id]) continue
    const k = kaeduan(x.title)
    if (raek || !k) {
      d.hen[x.id] = x.ts
      continue
    }
    if (song >= DUAN_MAX) {
      khang = true
      break
    }
    await sendka(hook, embedduan(x, k, await plaeni(x.title)))
    d.hen[x.id] = x.ts
    song++
  }
  d.etag = khang ? undefined : (r.etag ?? undefined)
  for (const [id, ts] of Object.entries(d.hen)) if (ts < now - KEP_DUAN) delete d.hen[id]
  return song
}

export const tampang = (state, chue, pang, now) => {
  state.pang ??= {}
  if (pang) state.pang[chue] ??= now
  else delete state.pang[chue]
}

export const khuanbok = (state, now) => {
  const nan = Object.values(state.pang ?? {}).some((t) => now - t > PANG_NAN)
  if (!nan) {
    delete state.bokLasud
    return false
  }
  if (state.bokLasud != null && now - state.bokLasud < PANG_BOK) return false
  state.bokLasud = now
  return true
}

export const anthong = (d) => {
  if (d?.status !== 'success') throw new Error('thai-gold-api ตอบไม่ success')
  const { update_date, update_time, price } = d.response
  const raka = {
    rob: `${update_date} ${update_time}`,
    baengSue: tad(price.gold_bar.buy),
    baengKhai: tad(price.gold_bar.sell),
    rupSue: tad(price.gold.buy),
    rupKhai: tad(price.gold.sell),
  }
  if (![raka.baengSue, raka.baengKhai, raka.rupSue, raka.rupKhai].every((n) => Number.isFinite(n) && n > 0))
    throw new Error(`ราคาทองแปลก: ${JSON.stringify(price)}`)
  return raka
}

export const embedthong = (raka, kao) => {
  const tang = kao ? raka.baengKhai - kao.baengKhai : 0
  const lukson = tang > 0 ? `ขึ้น ${ngern(tang)} บาท 🔺` : tang < 0 ? `ลง ${ngern(-tang)} บาท 🔻` : kao ? 'ราคาเท่าเดิม' : 'ราคาล่าสุด'
  return {
    title: `🇹🇭 ทองไทยปรับราคา · ${lukson}`,
    url: 'https://www.goldtraders.or.th/',
    color: tang > 0 ? config.si.khuen : tang < 0 ? config.si.long : config.si.thong,
    fields: [
      { name: 'ทองแท่ง 96.5%', value: `รับซื้อ **${ngern(raka.baengSue)}**\nขายออก **${ngern(raka.baengKhai)}**`, inline: true },
      { name: 'ทองรูปพรรณ', value: `รับซื้อ **${ngern(raka.rupSue)}**\nขายออก **${ngern(raka.rupKhai)}**`, inline: true },
    ],
    footer: { text: `${raka.rob.replace('เวลา ', '')} · สมาคมค้าทองคำ` },
  }
}

const duthong = async (state, hook) => {
  const raka = anthong(await dujson(THONG_URL))
  if (state.thong?.rob === raka.rob) return
  await sendka(hook, embedthong(raka, state.thong))
  state.thong = raka
}

const luang = async (file = STATE) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (e) {
    if (e.code === 'ENOENT') return {}
    throw e
  }
}

const luanglocal = async () => {
  try {
    return (await import('./config.local.mjs')).default
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND') return {}
    throw e
  }
}
const local = import.meta.main ? await luanglocal() : {}
const hook = {
  khao: process.env.WEBHOOK_KHAO || local.webhook?.khao,
  thong: process.env.WEBHOOK_THONG || local.webhook?.thong,
  duan: process.env.WEBHOOK_DUAN || local.webhook?.duan,
}
const BLS_KEY = process.env.BLS_KEY || local.blsKey

const TEST = '🧪 ทดสอบ · '

const STATE_TEST = new URL('./state.test.json', import.meta.url)

const yingtest = async () => {
  const now = Date.now()
  const st = await luang(STATE_TEST)
  let pang = false
  if (dry || hook.khao) {
    try {
      const puang = await dupuang(st, now)
      const phan = puang.filter((e) => e.ts < now)
      if (!phan.length) throw new Error('สัปดาห์นี้ยังไม่มีข่าวที่ผ่านไปแล้ว')
      const sarup = sarupwan(puang, wanroem(phan.at(-1).ts))
      await sendka(hook.khao, { ...sarup, title: `${TEST}${sarup.title}` })
      const daeng = [...jubklum(phan.filter((e) => config.tuanRadab.includes(e.impact)))].at(-1)
      if (daeng) {
        const [ts, klum] = daeng
        await sendka(hook.khao, embedkhao({ title: `${TEST}⚠️ อีกไม่กี่นาทีข่าวแรงออก ระวังกราฟวิ่งแรง`, ts, klum, color: config.si.long }))
      }
      const lasud = haok(phan, now, {}, Infinity).at(-1)
      if (lasud) {
        const nub = await duok({}, hook.khao, now, lasud.klum, dungbls, `${TEST}✅ ตัวเลขออกแล้ว`, Infinity)
        if (!nub) console.error('ทดสอบตัวเลขออก: BLS ยังไม่มีตัวเลขของข่าวล่าสุด')
      }
    } catch (e) {
      pang = true
      console.error('ทดสอบข่าวพัง:', e.message)
    }
  }
  if (dry || hook.thong) {
    try {
      const embed = embedthong(anthong(await dujson(THONG_URL)))
      await sendka(hook.thong, { ...embed, title: `${TEST}🇹🇭 ราคาทองไทยล่าสุด` })
    } catch (e) {
      pang = true
      console.error('ทดสอบทองพัง:', e.message)
    }
  }
  if (dry || hook.duan) {
    try {
      const r = await dungduan()
      const puang = anrss(r.xml).toSorted((a, b) => b.ts - a.ts)
      const x = puang.find((y) => kaeduan(y.title)) ?? puang[0]
      const k = kaeduan(x.title) ?? { tha: 'ตัวอย่างหน้าตา (ข่าวนี้ไม่ได้เข้าเงื่อนไขข่าวด่วน)', usd: 0, thong: 0, nas: 0 }
      const embed = embedduan(x, k, await plae(x.title))
      await sendka(hook.duan, { ...embed, title: `${TEST}${embed.title}` })
    } catch (e) {
      pang = true
      console.error('ทดสอบข่าวด่วนพัง:', e.message)
    }
  }
  await writeFile(STATE_TEST, JSON.stringify(st) + '\n')
  if (pang) process.exitCode = 1
}

if (import.meta.main && process.argv.includes('--test')) await yingtest()
else if (import.meta.main) {
  const ropni = async (state, now) => {
    let pang = false
    for (const [chue, ngan, h] of [
      ['khao', dukhao, hook.khao],
      ['thong', duthong, hook.thong],
      ['duan', duduan, hook.duan],
    ]) {
      if (!h && !dry) {
        console.log(`ข้าม ${chue}: ยังไม่ได้ตั้ง webhook`)
        continue
      }
      try {
        await ngan(state, h, now)
        tampang(state, chue, false, now)
      } catch (e) {
        pang = true
        tampang(state, chue, true, now)
        console.error(`${chue} พัง:`, e.message)
      }
    }
    return pang
  }
  const gep = async (state) => {
    if (!dry) await writeFile(STATE, JSON.stringify(state, null, 2) + '\n')
  }
  const state = await luang()
  await ropni(state, Date.now())
  await gep(state)
  if (hook.khao && !dry && rorbls(state.khao?.puang ?? [], Date.now(), state.ok ?? {}).length) {
    console.log('มีข่าวใกล้ออก เข้าโหมดเฝ้าข่าว')
    const duokni = (st, now) => duok(st, hook.khao, now, st.khao?.puang ?? [])
    await faokhao(state, { ropni, duokni, gep })
  }
  const bok = khuanbok(state, Date.now())
  await gep(state)
  if (bok) {
    console.error('มีงานพังติดกันเกิน 2 ชั่วโมง:', JSON.stringify(state.pang))
    process.exitCode = 1
  }
}
