import assert from 'node:assert/strict'
process.argv.push('--dry')
const { kadkhao, hatuan, sarupwan, anthong, embedthong, wanthai, mongthai, tad, duchue, linkff, banklum, dupuang, wanroem, habls, duanthi, anlek, thiap, banok, haok, duok, rorbls, faokhao, raitick, raikhao, khaomai, kaeduan, anrss, duduan, hathong, kadsam, songsarup, tampang, khuanbok } = await import('./kao.mjs')

const now = Date.parse('2026-10-14T12:00:00Z')
const puang = kadkhao([
  { title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:15:00-04:00', impact: 'High', forecast: '0.6%', previous: '0.4%' },
  { title: 'Core CPI m/m', country: 'USD', date: '2026-10-14T08:15:00-04:00', impact: 'High', forecast: '0.2%', previous: '0.3%' },
  { title: 'Retail Sales', country: 'USD', date: '2026-10-14T09:00:00-04:00', impact: 'High', forecast: '', previous: '' },
  { title: 'Bank Holiday', country: 'USD', date: '2026-10-14T08:00:00-04:00', impact: 'Holiday', forecast: '', previous: '' },
  { title: 'GDP', country: 'EUR', date: '2026-10-14T08:10:00-04:00', impact: 'High', forecast: '', previous: '' },
])
assert.equal(puang.length, 3)

const tuan = hatuan(puang, now, {})
assert.equal(tuan.length, 1)
assert.equal(tuan[0][1].length, 2)
assert.equal(hatuan(puang, now, { [puang[0].key]: 1, [puang[1].key]: 1 }).length, 0)
assert.equal(hatuan(puang, Date.parse('2026-10-14T12:20:00Z'), {}).length, 0)

const sarup = sarupwan(puang, now)
assert.match(sarup.description, /🇺🇸 \*\*เงินเฟ้อ \(CPI\)\*\*\nคาดไว้ 0\.6% · ครั้งก่อน 0\.4%\nออกมากกว่า 0\.6% → GOLD 🔻 · USD 🔺 · NAS 🔻\nออกน้อยกว่า 0\.6% → GOLD 🔺 · USD 🔻 · NAS 🔺/)
assert.doesNotMatch(sarup.description, /0\.2%/)
assert.match(sarup.description, /ออกมากกว่าที่คาด → GOLD 🔻 · USD 🔺 · NAS แกว่ง/)
assert.equal(sarup.url, 'https://www.forexfactory.com/calendar?day=oct14.2026')
assert.match(sarupwan([], now).description, /ไม่มีข่าว/)

assert.equal(linkff('2026-10-05T08:30:00-04:00'), 'https://www.forexfactory.com/calendar?day=oct5.2026')
const chue = (title) => duchue({ country: 'USD', title })
assert.equal(chue('Core CPI m/m').tha, 'เงินเฟ้อ (CPI)')
assert.equal(chue('Core PCE Price Index m/m').tha, 'เงินเฟ้อที่ Fed ใช้ดู (PCE)')
assert.equal(chue('Unemployment Claims').thong, 1)
assert.match(sarupwan(kadkhao([{ title: 'Unemployment Claims', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High', forecast: '225K', previous: '230K' }]), now).description, /ออกน้อยกว่า 225K → GOLD 🔻 · USD 🔺 · NAS แกว่ง/)
assert.equal(chue('Philly Fed Manufacturing Index').tha, 'ภาคการผลิต (PMI)')
assert.equal(chue('Fed Chairman Warsh Speaks').tha, 'ประธาน Fed ออกมาพูด')
assert.equal(chue('FOMC Member Bowman Speaks').tha, 'กรรมการ Fed ออกมาพูด')
assert.equal(chue('Treasury Secretary Bessent Speaks'), undefined)
assert.equal(chue('President Trump Speaks'), undefined)
assert.equal(duchue({ country: 'EUR', title: 'CPI y/y' }), undefined)
const klum = banklum(kadkhao([
  { title: 'Core PPI m/m', country: 'USD', date: '2026-10-15T08:30:00-04:00', impact: 'High', forecast: '0.3%', previous: '0.2%' },
  { title: 'Retail Sales m/m', country: 'USD', date: '2026-10-15T08:30:00-04:00', impact: 'High', forecast: '0.3%', previous: '1.2%' },
  { title: 'PPI m/m', country: 'USD', date: '2026-10-15T08:30:00-04:00', impact: 'High', forecast: '0.6%', previous: '0.4%' },
  { title: 'Fed Chairman Warsh Speaks', country: 'USD', date: '2026-10-15T08:30:00-04:00', impact: 'High', forecast: '', previous: '' },
  { title: 'Mystery Index', country: 'USD', date: '2026-10-15T08:30:00-04:00', impact: 'High', forecast: '1%', previous: '2%' },
]))
assert.equal(klum.split('\n\n').length, 4)
assert.match(klum, /PPI\)\*\*\nคาดไว้ 0\.6%/)
assert.doesNotMatch(klum, /0\.3% · ครั้งก่อน 0\.2%/)
assert.match(klum, /พูดไปทางขึ้นดอกเบี้ย → GOLD 🔻 · USD 🔺 · NAS 🔻/)
assert.match(klum, /🇺🇸 \*\*Mystery Index\*\*\nคาดไว้ 1% · ครั้งก่อน 2%$/)

assert.equal(wanthai(Date.parse('2026-10-14T17:30:00Z')), '2026-10-15')
assert.equal(mongthai(Date.parse('2026-10-14T00:00:00Z')), 7)
assert.equal(tad('65,950.00'), 65950)

const dib = (khai) => ({
  status: 'success',
  response: { update_date: '15/10/2569', update_time: 'เวลา 16:22 น. (ครั้งที่ 18)', price: { gold: { buy: '64,430.00', sell: '66,750.00' }, gold_bar: { buy: '65,750.00', sell: khai } } },
})
const kao = anthong(dib('65,950.00'))
assert.match(embedthong(anthong(dib('66,050.00')), kao).title, /ขึ้น 100 บาท ▲/)
assert.match(embedthong(anthong(dib('65,900.00')), kao).title, /ลง 50 บาท ▼/)
assert.equal(embedthong(kao, undefined).title, 'ราคาทองวันนี้')
assert.match(embedthong(kao, kao).title, /เท่าเดิม/)
const wankon = { ...kao, rob: '14/10/2569 เวลา 17:00 น. (ครั้งที่ 9)', baengKhai: 65800 }
assert.equal(embedthong(anthong(dib('66,050.00')), kao, wankon).description, 'รวมทั้งวัน ขึ้น 250 บาท ▲')
assert.equal(embedthong(kao, wankon, wankon).description, undefined)
assert.match(embedthong(kao, kao).fields[1].value, /\*\*64,430\*\*/)
assert.match(embedthong({ ...kao, rupSue: 64733.2 }, kao).fields[1].value, /64,733\.20/)
assert.throws(() => anthong(dib('')))
assert.throws(() => anthong({ status: 'error' }))

const st = {}
let nub = 0
const dueng = async () => (nub++, [{ title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High' }])
const pang = async () => { throw new Error('429') }
assert.equal((await dupuang(st, now, dueng)).length, 1)
await dupuang(st, now + 30 * 60_000, dueng)
assert.equal(nub, 1)
assert.equal((await dupuang(st, now + 2 * 3600_000, pang)).length, 1)
await assert.rejects(dupuang(st, now + 25 * 3600_000, pang))
await assert.rejects(dupuang({}, now, pang))

assert.equal(wanroem(Date.parse('2026-10-15T12:30:00Z')), Date.parse('2026-10-15T07:00:00+07:00'))
assert.equal(wanroem(Date.parse('2026-10-15T23:30:00Z')), Date.parse('2026-10-15T07:00:00+07:00'))
assert.equal(wanroem(Date.parse('2026-10-16T01:00:00Z')), Date.parse('2026-10-16T07:00:00+07:00'))
assert.equal(wanroem(Date.parse('2026-10-15T18:00:00Z')), Date.parse('2026-10-15T07:00:00+07:00'))
const sm = sarupwan(kadkhao([{ title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'Medium', forecast: '1%', previous: '' }]), now)
assert.match(sm.description, /🟠 🇺🇸 \*\*เงินเฟ้อ/)
assert.equal(hatuan(kadkhao([{ title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:15:00-04:00', impact: 'Medium' }]), now, {}).length, 0)

assert.deepEqual(duanthi('2026-10-14T08:30:00-04:00'), { year: '2026', period: 'M09' })
assert.deepEqual(duanthi('2027-01-13T08:30:00-05:00'), { year: '2026', period: 'M12' })
const g = (v, p = 'M09') => ({ year: '2026', period: p, value: v })
assert.equal(anlek(habls({ country: 'USD', title: 'CPI m/m' }), [g('336.298'), g('334.131', 'M08')], { year: '2026', period: 'M09' }), '0.6%')
assert.equal(anlek(habls({ country: 'USD', title: 'Core CPI m/m' }), [g('338.896'), g('337.765', 'M08')], { year: '2026', period: 'M09' }), '0.3%')
assert.equal(anlek(habls({ country: 'USD', title: 'Non-Farm Employment Change' }), [g('159044'), g('159015', 'M08')], { year: '2026', period: 'M09' }), '29K')
assert.equal(anlek(habls({ country: 'USD', title: 'Unemployment Rate' }), [g('4.2'), g('4.1', 'M08')], { year: '2026', period: 'M09' }), '4.2%')
assert.equal(anlek(habls({ country: 'USD', title: 'CPI m/m' }), [{ ...g('336.298'), calculations: { pct_changes: { 1: '0.7' } } }, g('334.131', 'M08')], { year: '2026', period: 'M09' }), '0.7%')
assert.equal(anlek(habls({ country: 'USD', title: 'CPI m/m' }), [g('334.131', 'M08'), g('332', 'M07')], { year: '2026', period: 'M09' }), undefined)
assert.equal(habls({ country: 'USD', title: 'CPI y/y' }), undefined)
assert.equal(thiap('0.7%', '0.6%'), 1)
assert.equal(thiap('29K', '89K'), -1)
assert.equal(thiap('0.6%', '0.6%'), 0)
assert.equal(thiap('0.6%', ''), undefined)
const cpi = kadkhao([{ title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High', forecast: '0.6%', previous: '0.4%' }])[0]
assert.equal(banok(cpi, '0.7%'), '🔴 🇺🇸 **เงินเฟ้อ (CPI)**\nออกจริง **0.7%** · คาดไว้ 0.6%\nออกมากกว่าคาด → GOLD 🔻 · USD 🔺 · NAS 🔻')
assert.match(banok(cpi, '0.6%'), /ออกตรงคาด/)
const nfp = kadkhao([{ title: 'Non-Farm Employment Change', country: 'USD', date: '2026-10-02T08:30:00-04:00', impact: 'High', forecast: '89K', previous: '133K' }])[0]
assert.match(banok(nfp, '29K'), /ออกน้อยกว่าคาด → GOLD 🔺 · USD 🔻 · NAS แกว่ง/)

const wanCpi = kadkhao([
  { title: 'Core CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High', forecast: '0.2%', previous: '0.3%' },
  { title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High', forecast: '0.6%', previous: '0.4%' },
  { title: 'Retail Sales m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High', forecast: '0.3%', previous: '' },
])
const lang = Date.parse('2026-10-14T12:35:00Z')
assert.equal(haok(wanCpi, Date.parse('2026-10-14T12:20:00Z'), {}).length, 0)
assert.equal(haok(wanCpi, lang, {})[0].sam.length, 1)
assert.equal(haok(wanCpi, Date.parse('2026-10-14T14:10:00Z'), {}).length, 0)
const stOk = {}
let riak = 0
const blsKao = async () => (riak++, { CUSR0000SA0: [g('334.131', 'M08'), g('332', 'M07')] })
assert.equal(await duok(stOk, '', lang, wanCpi, blsKao), 0)
assert.deepEqual(stOk.ok, {})
const blsMai = async () => (riak++, { CUSR0000SA0: [g('336.298'), g('334.131', 'M08')] })
assert.equal(await duok(stOk, '', lang, wanCpi, blsMai), 1)
assert.equal(Object.keys(stOk.ok).length, 3)
assert.equal(await duok(stOk, '', lang + 300_000, wanCpi, blsMai), 0)
assert.equal(riak, 2)

const ok830 = Date.parse('2026-10-14T12:30:00Z')
assert.equal(rorbls(wanCpi, ok830 - 20 * 60_000, {}).length, 0)
assert.equal(rorbls(wanCpi, ok830 - 10 * 60_000, {}).length, 1)
assert.equal(rorbls(wanCpi, ok830 + 31 * 60_000, {}).length, 0)
assert.equal(rorbls(kadkhao([{ title: 'Retail Sales m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High' }]), ok830, {}).length, 0)

assert.equal(raitick(ok830, ok830 - 60_000), 15_000)
assert.equal(raitick(ok830, ok830 - 4_000), 4_000)
assert.equal(raitick(ok830, ok830), 3_000)
assert.equal(raitick(ok830, ok830 + 119_000), 3_000)
assert.equal(raitick(ok830, ok830 + 121_000), 15_000)

let khlok = ok830 - 52_000
const fao = { khao: { puang: wanCpi }, ok: {} }
const thamBLS = []
await faokhao(fao, {
  wela: () => khlok,
  non: async (ms) => { khlok += ms },
  ropni: async () => false,
  duokni: async (st, now) => {
    if (now >= ok830) thamBLS.push(now - ok830)
    if (now >= ok830 + 4_000) for (const e of wanCpi) st.ok[e.key] = e.ts
  },
})
assert.equal(thamBLS[0], 0)
assert.deepEqual(thamBLS, [0, 3_000, 6_000])
assert.equal(khlok, ok830 + 6_000)

khlok = ok830
await faokhao({ khao: { puang: wanCpi }, ok: {} }, { wela: () => khlok, non: async (ms) => { khlok += ms }, ropni: async () => false, duokni: async () => {} })
assert.equal(khlok, ok830 + 30 * 60_000)

const p15 = kadkhao([{ title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High' }])
assert.equal(raikhao(p15, ok830 - 90 * 60_000), 15 * 60_000)
assert.equal(raikhao(p15, ok830 - 3 * 3600_000), 60 * 60_000)
const stK = {}
let dungK = 0
const okK = async () => (dungK++, [{ title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High' }])
const ph = async () => (dungK++, Promise.reject(new Error('429')))
await dupuang(stK, ok830 - 3 * 3600_000, okK)
await dupuang(stK, ok830 - 90 * 60_000, ph)
assert.equal(dungK, 2)
await dupuang(stK, ok830 - 80 * 60_000, okK)
await dupuang(stK, ok830 - 61 * 60_000, okK)
assert.equal(dungK, 2)
await dupuang(stK, ok830 - 59 * 60_000, okK)
assert.equal(dungK, 3)

const chao = Date.parse('2026-10-14T00:30:00Z')
const wanni = kadkhao([
  { title: 'CPI m/m', country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High' },
  { title: 'Fed Chairman Warsh Speaks', country: 'USD', date: '2026-10-14T14:00:00-04:00', impact: 'High' },
])
assert.equal(khaomai(wanni, chao, { [wanni[0].key]: 1 }).length, 1)
assert.equal(khaomai(wanni, chao, { [wanni[0].key]: 1, [wanni[1].key]: 1 }).length, 0)

assert.equal(kaeduan('Iran launches missiles at Israel').tha, 'สงคราม / ความตึงเครียด')
assert.equal(kaeduan('Israel and Iran agree to ceasefire, war ends').tha, 'ข่าวคลายความตึงเครียด')
assert.equal(kaeduan('Trump announces 50% tariffs on China').tha, 'ภาษีนำเข้า / สงครามการค้า')
assert.equal(kaeduan('Fed announces emergency rate cut').tha, 'ประกาศฉุกเฉิน')
assert.equal(kaeduan('US September CPI 3.7% vs 3.6% expected'), undefined)
assert.equal(kaeduan('Gold attacks resistance. What next technically?'), undefined)
assert.equal(kaeduan('UK workers strike over pay'), undefined)

const rss = (items) => `<rss><channel>${items.map(([t, id, d]) => `<item><title><![CDATA[${t}]]></title><pubDate>${d}</pubDate><guid isPermaLink="true">https://investinglive.com/news/${id}/</guid><link>https://investinglive.com/news/${id}/</link></item>`).join('')}</channel></rss>`
const x1 = rss([['Iran launches missiles at Israel &amp; oil jumps', 'a', 'Thu, 15 Oct 2026 14:00:03 GMT'], ['US CPI 3.7% vs 3.6%', 'b', 'Thu, 15 Oct 2026 12:30:00 GMT']])
const pr = anrss(x1)
assert.equal(pr.length, 2)
assert.equal(pr[0].title, 'Iran launches missiles at Israel & oil jumps')
assert.equal(anrss('<item><title>x</title><link>https://evil.example/x</link><pubDate>Thu, 15 Oct 2026 14:00:03 GMT</pubDate></item>').length, 0)

const stD = {}
const ng = Date.parse('2026-10-15T15:00:00Z')
let xmlNi = x1
let riakD = 0
const dungD = async (etag) => (riakD++, etag === 'E' + xmlNi.length ? { mai: false } : { mai: true, etag: 'E' + xmlNi.length, xml: xmlNi })
const plaeD = async (t) => `แปล:${t}`
assert.equal(await duduan(stD, '', ng, dungD, plaeD), 0)
assert.equal(Object.keys(stD.duan.hen).length, 2)
assert.equal(await duduan(stD, '', ng + 60_000, dungD, plaeD), 0)
assert.equal(riakD, 1)
assert.equal(await duduan(stD, '', ng + 5 * 60_000, dungD, plaeD), 0)
assert.equal(riakD, 2)
xmlNi = rss([['Russia troops invade', 'c', 'Thu, 15 Oct 2026 15:04:00 GMT'], ['Stocks close mixed', 'd', 'Thu, 15 Oct 2026 15:03:00 GMT'], ['Iran launches missiles at Israel &amp; oil jumps', 'a', 'Thu, 15 Oct 2026 14:00:03 GMT']])
assert.equal(await duduan(stD, '', ng + 10 * 60_000, dungD, plaeD), 1)
assert.equal(await duduan(stD, '', ng + 15 * 60_000, dungD, plaeD), 0)
xmlNi = rss(Array.from({ length: 8 }, (_, i) => [`Missile attack ${i}`, `m${i}`, 'Thu, 15 Oct 2026 15:20:00 GMT']))
assert.equal(await duduan(stD, '', ng + 25 * 60_000, dungD, plaeD), 5)
assert.equal(await duduan(stD, '', ng + 30 * 60_000, dungD, plaeD), 3)
assert.equal(await duduan(stD, '', ng + 35 * 60_000, dungD, plaeD), 0)
const stS = { duan: { hen: {} } }
const sendPang = async () => ({ mai: true, etag: 'X', xml: rss([['Missile attack Z', 'z', 'Thu, 15 Oct 2026 15:20:00 GMT']]) })
await assert.rejects(duduan(stS, '', ng, sendPang, async () => { throw new Error('ส่งไม่ได้') }))
assert.equal(stS.duan.hen['https://investinglive.com/news/z/'], undefined)
assert.equal(stS.duan.etag, undefined)

assert.deepEqual(hathong('Iran launches missiles at Israel, oil jumps'), ['🇮🇷', '🇮🇱'])
assert.deepEqual(hathong('Israeli strikes on Iranian nuclear sites'), ['🇮🇱', '🇮🇷'])
assert.deepEqual(hathong('Trump announces 50% tariffs on Chinese goods'), ['🇺🇸', '🇨🇳'])
assert.deepEqual(hathong('Houthis attack ship in Red Sea'), ['🇾🇪'])
assert.deepEqual(hathong('Putin says Russia ready for talks with Ukraine, US'), ['🇷🇺', '🇺🇦', '🇺🇸'])
assert.deepEqual(hathong('Stocks crash as bank collapses'), [])
assert.deepEqual(hathong('Focus on business inventories'), [])
assert.deepEqual(hathong('Bus driver in Uk'), ['🇬🇧'])
assert.deepEqual(hathong('Analysts tell us gold is fed by fear'), [])
assert.deepEqual(hathong('U.S. and Japan sign deal'), ['🇺🇸', '🇯🇵'])

assert.equal(chue('ADP Non-Farm Employment Change').tha, 'ตัวเลขจ้างงานเอกชน (ADP)')
assert.equal(chue('Non-Farm Employment Change').tha, 'ตัวเลขจ้างงานนอกภาคเกษตร (NFP)')
assert.equal(chue('Fed Chair Powell Testifies').tha, 'ประธาน Fed ออกมาพูด')
const cpiSalab = kadkhao(['CPI y/y', 'Core CPI y/y', 'Core CPI m/m', 'CPI m/m'].map((title) => ({ title, country: 'USD', date: '2026-10-14T08:30:00-04:00', impact: 'High' })))
assert.deepEqual(kadsam(cpiSalab).map((e) => e.title), ['CPI m/m'])
assert.equal(haok(cpiSalab, ok830 + 60_000, {})[0].sam[0].title, 'CPI m/m')

const sao = Date.parse('2026-10-17T01:00:00Z')
const jan = Date.parse('2026-10-19T01:00:00Z')
assert.equal(songsarup([], sao), false)
assert.equal(songsarup([], jan), true)
assert.equal(songsarup(kadkhao([{ title: 'CPI m/m', country: 'USD', date: '2026-10-17T20:00:00-04:00', impact: 'High' }]), sao), true)

const sp = {}
tampang(sp, 'thong', true, 0)
tampang(sp, 'thong', true, 60_000)
assert.equal(sp.pang.thong, 0)
assert.equal(khuanbok(sp, 3600_000), false)
assert.equal(khuanbok(sp, 3 * 3600_000), true)
assert.equal(khuanbok(sp, 3 * 3600_000 + 300_000), false)
assert.equal(khuanbok(sp, 10 * 3600_000), true)
tampang(sp, 'thong', false, 10 * 3600_000)
assert.deepEqual(sp.pang, {})
assert.equal(khuanbok(sp, 20 * 3600_000), false)

console.log('ผ่านหมด')
