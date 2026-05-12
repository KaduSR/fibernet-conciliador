'use client'

import { useState, useCallback, useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// const EMPRESA = 'Telecom Fiber Net Ltda'
// const CNPJ = '22.969.088/0001-97'
// const CONTA = '46.752-9 — Sicoob Credirochas'

const TIPO_STYLE = {
  Boleto: { bg: '#DDEAF9', color: '#0C3F7A' },
  PIX: { bg: '#D4EEE5', color: '#064535' },
  Estorno: { bg: '#DCEDC8', color: '#2E5009' },
  Tarifa: { bg: '#FDE8C6', color: '#6B3700' },
  'Déb.Conv.': { bg: '#EDE9FE', color: '#4C1D95' },
  'Débito': { bg: '#FEE2E0', color: '#991B1B' },
}

const LIQ_LABELS = { '58': 'Compensação', '68': 'Déb. Conta', '82': 'Baixa Cedente', '212': 'PIX', '215': 'Intercredis' }
const LIQ_COLORS = { '58': '#1B5FAA', '68': '#0F6E56', '82': '#C0392B', '212': '#4A7C23', '215': '#B86A10' }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const R = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const N = v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const sum = (arr, fn) => arr.reduce((s, x) => s + (fn ? fn(x) : x), 0)

function Badge({ tipo }) {
  const s = TIPO_STYLE[tipo] || { bg: '#F3F4F6', color: '#374151' }
  return <span style={{ background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap' }}>{tipo}</span>
}

function SCard({ label, value, sub, color = '#1B5FAA', warn = false }) {
  return (
    <div style={{ background: warn ? '#FEF3F2' : '#fff', border: `1px solid ${warn ? '#FDA29B' : '#E8EDF5'}`, borderRadius: 10, padding: '13px 16px' }}>
      <p style={{ fontSize: 10, color: '#6B7A96', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'DM Mono',monospace" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#8A95A8', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ─── PDF EXTRACTION ───────────────────────────────────────────────────────────
async function extractPDFText(file) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const ab = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise
  let text = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    text += content.items.map(i => i.str).join(' ') + '\n'
  }
  return text
}

// ─── PARSERS ──────────────────────────────────────────────────────────────────
function parseSicoobExtrato(text) {
  const entries = []
  const re = /(\d{2}\/\d{2})\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇÀÜ][^\d\n]{2,65}?)\s+([\d.]+,\d{2})\s*([CD])/g
  let m
  while ((m = re.exec(text)) !== null) {
    const [, data, histRaw, valStr, cd] = m
    const hist = histRaw.trim().replace(/\s+/g, ' ')
    const valor = parseFloat(valStr.replace(/\./g, '').replace(',', '.'))
    let tipo = null
    if (/CR[EÉ]D\.LIQ\.COBRAN/i.test(hist)) tipo = 'Boleto'
    else if (/PIX RECEB|TRANSF\.RECEB|TRANSF RECEB/i.test(hist)) tipo = 'PIX'
    else if (/OUTROS CR[EÉ]DITOS/i.test(hist) && cd === 'C') tipo = 'Estorno'
    else if (/TARIFA COBRAN/i.test(hist)) tipo = 'Tarifa'
    else if (/D[EÉ]B\.?\s*(CONV|CNV)|DB\.CONV/i.test(hist)) tipo = 'Déb.Conv.'
    else if (cd === 'D' && /PIX EMIT|TRANSF\.?\s*PIX\s*SIC/i.test(hist)) tipo = 'Débito'
    else if (cd === 'D' && /DÉB\.TIT|DEB\.TIT|DÉB\.PGTO|DEB\.PGTO|COMP\s+MASTER|SAQUE\s+NA/i.test(hist)) tipo = 'Débito'
    if (!tipo) continue
    const docM = text.slice(m.index, m.index + 300).match(/DOC\.:\s*(\S+)/)
    const doc = docM ? docM[1] : (tipo === 'PIX' || tipo === 'Débito' ? 'Pix' : '—')
    let contraparte = ""
    if (tipo === "PIX" || tipo === "Débito") {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 400)
      // Nome entre "Recebimento/Pagamento Pix" e CPF mascarado (ou nome de empresa)
      const nm1 = after.match(/(?:Recebimento Pix|Pagamento Pix|Transferência Pix|Recebimento pix)\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇa-záéíóúâêîôûãõç][^\n*]{4,55}?)\s+\*{3}/)
      // Nome de pessoa após CNPJ/CPF da empresa (formato: CNPJ\nNome)
      const nm3 = after.match(/\d{2}\.\d{3}\.\d{3}\s+\d{4}-\d{2}\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]{5,50})\n/)
      // Fallback: linha isolada com nome em maiúsculas
      const nm2 = after.match(/\n([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]{5,50})\n/)
      const nome = (nm1?.[1] || nm3?.[1] || nm2?.[1] || "").trim()
      if (nome) {
        contraparte = nome
        if (tipo === "PIX") hist = cd === "C" ? `PIX recebido — ${nome}` : `PIX enviado — ${nome}`
        if (tipo === "Débito" && /PIX EMIT|TRANSF.*PIX/i.test(hist)) hist = `PIX enviado — ${nome}`
      } else if (tipo === "Débito" && /SAQUE/i.test(hist)) {
        // Tenta pegar o nome do sacador
        const sacM = after.match(/NOME:\s*([^\n]+)/)
        if (sacM) contraparte = sacM[1].trim()
      }
    }
    entries.push({ data, hist, doc, tipo, cd, valor, contraparte })
  }
  return entries
}

function parseSicoobMovim(text) {
  // Extract type totals
  const typeTotals = {}
  const tRe = /(58|68|82|212|215)[^\d]+([\d.]+,\d{2})/g
  let m
  while ((m = tRe.exec(text)) !== null) {
    const k = m[1], v = parseFloat(m[2].replace(/\./g, '').replace(',', '.'))
    if (!typeTotals[k]) typeTotals[k] = 0
    typeTotals[k] += v
  }
  // Individual records
  const records = []
  const rRe = /(\d{5,8}-\d)\s+(\d+)\s+([\d.]+,\d{2})\s+(.{3,50}?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([\d.]+,\d{2})/g
  while ((m = rRe.exec(text)) !== null)
    records.push({ nossoNum: m[1], seuNum: m[2], valOrig: parseFloat(m[3].replace(/\./g, '').replace(',', '.')), sacado: m[4].trim(), dataVenc: m[5], dataLiq: m[6], valCobrado: parseFloat(m[7].replace(/\./g, '').replace(',', '.')) })

  const liquidados = Object.entries(typeTotals).filter(([k]) => k !== '82').reduce((s, [, v]) => s + v, 0)
  return { records, typeTotals, totalLiquidado: liquidados, totalBaixas: typeTotals['82'] || 0 }
}

function parseIXCRelatorio(text) {
  const records = [], dailyMap = {}
  const rRe = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+Rec\.\s*(.*?)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/g
  let m
  while ((m = rRe.exec(text)) !== null) {
    const key = m[2].substring(0, 5)
    const rec = { dataVenc: m[1], dataRec: key, cliente: m[3].trim().substring(0, 40), baixa: parseFloat(m[4].replace(/\./g, '').replace(',', '.')), acre: parseFloat(m[5].replace(/\./g, '').replace(',', '.')), desc: parseFloat(m[6].replace(/\./g, '').replace(',', '.')), liq: parseFloat(m[8].replace(/\./g, '').replace(',', '.')) }
    records.push(rec)
    if (!dailyMap[key]) dailyMap[key] = { data: key, tit: 0, bruto: 0, desc: 0, acre: 0, liq: 0 }
    dailyMap[key].tit++; dailyMap[key].bruto += rec.baixa; dailyMap[key].desc += rec.desc; dailyMap[key].acre += rec.acre; dailyMap[key].liq += rec.liq
  }
  const daily = Object.values(dailyMap).sort((a, b) => {
    const [da, ma] = a.data.split('/').map(Number), [db, mb] = b.data.split('/').map(Number)
    return ma !== mb ? ma - mb : da - db
  })
  return { records, daily }
}

// ─── RECONCILIATION ENGINE ────────────────────────────────────────────────────
function reconcile(extrato, ixcDaily) {
  const totBoleto = sum(extrato.filter(e => e.tipo === 'Boleto'), e => e.valor)
  const totTarifa = sum(extrato.filter(e => e.tipo === 'Tarifa'), e => e.valor)
  const totDebConv = sum(extrato.filter(e => e.tipo === 'Déb.Conv.'), e => e.valor)
  const totPIX = sum(extrato.filter(e => e.tipo === 'PIX'), e => e.valor)
  const totEstorno = sum(extrato.filter(e => e.tipo === 'Estorno'), e => e.valor)
  const totIXC = sum(ixcDaily, r => r.liq)
  const diff = parseFloat((totBoleto - totIXC).toFixed(2))

  const allDates = [...new Set([
    ...extrato.filter(e => e.tipo === 'Boleto').map(e => e.data),
    ...ixcDaily.map(d => d.data),
  ])].sort((a, b) => { const [da, ma] = a.split('/').map(Number), [db, mb] = b.split('/').map(Number); return ma !== mb ? ma - mb : da - db })

  const porDia = allDates.map(data => {
    const banco = sum(extrato.filter(e => e.tipo === 'Boleto' && e.data === data), e => e.valor)
    const ixc = ixcDaily.find(d => d.data === data)?.liq || 0
    const d = parseFloat((banco - ixc).toFixed(2))
    return { data, banco, ixc, diff: d, ok: Math.abs(d) < 0.02 }
  })

  return { totBoleto, totTarifa, totDebConv, totPIX, totEstorno, totIXC, diff, porDia, divergencias: porDia.filter(d => !d.ok), conciliado: Math.abs(diff) < 0.02 }
}

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
async function exportarExcel({ extrato, ixcDaily, ixcRecords, movim, conc, periodo }) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const addSheet = (rows, name, cols) => {
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = cols.map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  addSheet([
    [`CONCILIAÇÃO FINANCEIRA — ${EMPRESA}`], ['CNPJ:', CNPJ], ['Conta:', CONTA], ['Período:', periodo], ['Gerado em:', new Date().toLocaleString('pt-BR')], [],
    ['RESUMO', 'Valor (R$)'],
    ['IXC — Total recebimentos (líquido)', conc.totIXC],
    ['Banco — CRÉD.LIQ.COBRANÇA', conc.totBoleto],
    ['Banco — PIX recebidos', conc.totPIX],
    ['Banco — Estorno tarifas', conc.totEstorno],
    ['(–) Tarifas de cobrança', -conc.totTarifa],
    ['(–) Déb. Conv. (Seguros + Demais Empresas)', -conc.totDebConv],
    ['Diferença IXC × Banco', conc.diff],
    ['Status', conc.conciliado ? '✓ CONCILIADO' : '⚠ DIVERGÊNCIA'],
    [], ['Sicoob Movimentação — Total liquidado', movim?.totalLiquidado || 0],
    ['Sicoob Movimentação — Baixas (cancelados)', movim?.totalBaixas || 0],
  ], 'Resumo', [42, 18])

  // Extrato Sicoob
  const diasMap = {}
  extrato.forEach(e => { if (!diasMap[e.data]) diasMap[e.data] = []; diasMap[e.data].push(e) })
  const extRows = [['Data', 'Tipo', 'Histórico / Depositante', 'Documento', 'C/D', 'Valor (R$)', 'Saldo Dia (R$)']]
  Object.values(diasMap).forEach(rows => {
    const saldo = sum(rows, r => r.cd === 'C' ? r.valor : -r.valor)
    rows.forEach((r, i) => {
      const descricao = (r.tipo === 'PIX' && r.contraparte) ? `PIX ${r.cd === 'C' ? 'recebido' : 'enviado'} — ${r.contraparte}` : r.hist
      extRows.push([r.data, r.tipo, descricao, r.doc, r.cd, r.cd === 'C' ? r.valor : -r.valor, i === 0 ? saldo : ''])
    })
  })
  addSheet(extRows, 'Extrato Sicoob', [8, 12, 52, 12, 5, 16, 18])

  // Tarifas e Débitos (TODOS os débitos exceto Tarifa)
  const debRows = [['Data', 'Tipo', 'Histórico / Destinatário', 'Documento', 'Valor (R$)']]
  extrato.filter(e => e.cd === 'D').forEach(r => {
    const desc = (r.tipo === 'Débito' && r.contraparte) ? `${r.hist} — ${r.contraparte}` : r.hist
    debRows.push([r.data, r.tipo, desc, r.doc, -r.valor])
  })
  debRows.push([])
  debRows.push(['Total Tarifas', '', '', '', -sum(extrato.filter(e => e.tipo === 'Tarifa'), e => e.valor)])
  debRows.push(['Total Déb. Conv.', '', '', '', -sum(extrato.filter(e => e.tipo === 'Déb.Conv.'), e => e.valor)])
  debRows.push(['Total Débitos (PIX/pgtos)', '', '', '', -sum(extrato.filter(e => e.tipo === 'Débito'), e => e.valor)])
  debRows.push(['TOTAL SAÍDAS', '', '', '', -sum(extrato.filter(e => e.cd === 'D'), e => e.valor)])
  addSheet(debRows, 'Débitos e Tarifas', [8, 12, 52, 12, 16])

  // IXC por dia
  const ixcRows = [['Data', 'Títulos', 'Valor Bruto (R$)', 'Descontos (R$)', 'Acréscimos (R$)', 'Valor Líquido (R$)']]
  ixcDaily.forEach(r => ixcRows.push([r.data, r.tit, r.bruto, -r.desc, r.acre, r.liq]))
  ixcRows.push([], ['TOTAL', sum(ixcDaily, r => r.tit), sum(ixcDaily, r => r.bruto), -sum(ixcDaily, r => r.desc), sum(ixcDaily, r => r.acre), conc.totIXC])
  addSheet(ixcRows, 'IXC por Dia', [8, 8, 18, 18, 18, 20])

  // IXC Registros
  if (ixcRecords.length > 0) {
    const rRows = [['Data Venc.', 'Data Rec.', 'Cliente', 'Baixa (R$)', 'Acréscimo (R$)', 'Desconto (R$)', 'Vlr. Líquido (R$)']]
    ixcRecords.forEach(r => rRows.push([r.dataVenc, r.dataRec, r.cliente, r.baixa, r.acre, r.desc, r.liq]))
    rRows.push([], ['TOTAL', '', '', sum(ixcRecords, r => r.baixa), sum(ixcRecords, r => r.acre), sum(ixcRecords, r => r.desc), conc.totIXC])
    addSheet(rRows, 'IXC Registros', [12, 12, 40, 14, 14, 14, 18])
  }

  // Sicoob Movimentação
  if (movim?.records.length > 0) {
    const mRows = [['Nosso Núm.', 'Seu Núm.', 'Sacado', 'Vencimento', 'Data Liq.', 'Vlr. Original (R$)', 'Vlr. Cobrado (R$)']]
    movim.records.forEach(r => mRows.push([r.nossoNum, r.seuNum, r.sacado, r.dataVenc, r.dataLiq, r.valOrig, r.valCobrado]))
    mRows.push([], ['TOTAL', '', '', '', '', sum(movim.records, r => r.valOrig), sum(movim.records, r => r.valCobrado)])
    addSheet(mRows, 'Sicoob Movimentação', [12, 10, 40, 12, 12, 18, 18])
  }

  // Conciliação
  const cRows = [['Data', 'IXC (R$)', 'Banco CRÉD.LIQ. (R$)', 'Diferença (R$)', 'Status']]
  conc.porDia.forEach(d => cRows.push([d.data, d.ixc, d.banco, d.diff, d.ok ? 'Conciliado' : 'Divergência']))
  cRows.push([], ['TOTAL', conc.totIXC, conc.totBoleto, conc.diff, conc.conciliado ? 'Conciliado' : 'Divergência'])
  addSheet(cRows, 'Conciliação', [8, 16, 22, 16, 14])

  XLSX.writeFile(wb, `conciliacao_fibernet_${periodo.toLowerCase().replace(/\s/g, '_')}.xlsx`)
}

// ─── UPLOAD CARD ──────────────────────────────────────────────────────────────
function UploadCard({ icon, title, subtitle, bg, file, onFile, onRemove }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(false)
  const drop = e => { e.preventDefault(); setHover(false); const f = e.dataTransfer.files[0]; if (f?.type === 'application/pdf') onFile(f) }
  return (
    <div onDragOver={e => { e.preventDefault(); setHover(true) }} onDragLeave={() => setHover(false)} onDrop={drop}
      style={{ background: file ? '#F0FBF4' : hover ? '#F0F5FF' : '#fff', border: `2px ${file ? 'solid #1A8A55' : 'dashed ' + (hover ? '#1B5FAA' : '#CBD5E8')}`, borderRadius: 12, padding: '22px 18px', textAlign: 'center', transition: 'all .2s' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#2A3348', marginBottom: 5 }}>{title}</p>
      <p style={{ fontSize: 11, color: '#6B7A96', marginBottom: 14, lineHeight: 1.5 }}>{subtitle}</p>
      {file ? (
        <div style={{ background: '#D4EEE5', border: '1px solid #A3E0BB', borderRadius: 8, padding: '10px 12px', textAlign: 'left' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#145C35', marginBottom: 2 }}>✓ {file.name}</p>
          <p style={{ fontSize: 11, color: '#1A8A55' }}>{(file.size / 1024).toFixed(0)} KB</p>
          <button onClick={onRemove} style={{ marginTop: 5, fontSize: 11, color: '#6B7A96', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Remover</button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} style={{ cursor: 'pointer', border: '1.5px dashed #CBD5E8', borderRadius: 8, padding: 14 }}>
          <p style={{ fontSize: 12, color: '#8A95A8', marginBottom: 3 }}>📄 Arraste o PDF aqui</p>
          <p style={{ fontSize: 11, color: '#B0BAD0' }}>ou clique para selecionar</p>
        </div>
      )}
      <input type="file" ref={ref} accept=".pdf" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  )
}

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────
function TableCard({ children }) {
  return <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, overflow: 'hidden' }}>{children}</div>
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────
function ScreenUpload({ onProcess, onDemo }) {
  const [files, setFiles] = useState({ extrato: null, movim: null, ixc: null })
  const [mes, setMes] = useState('04')
  const [ano, setAno] = useState('2026')
  const MESES = { '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro' }
  const ready = files.extrato && files.movim && files.ixc && mes && ano
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2A3348', marginBottom: 4 }}>Nova conciliação</h1>
        <p style={{ fontSize: 13, color: '#6B7A96' }}>Selecione o período e suba os três arquivos para iniciar.</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: '14px 20px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2A3348' }}>📅 Período:</span>
        <select value={mes} onChange={e => setMes(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #CBD5E8', borderRadius: 7, fontSize: 13, background: '#fff', color: '#2A3348' }}>
          {Object.entries(MESES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={ano} onChange={e => setAno(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #CBD5E8', borderRadius: 7, fontSize: 13, background: '#fff', color: '#2A3348' }}>
          {['2024', '2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, marginBottom: 22 }}>
        <UploadCard icon="🏦" title="Extrato Sicoob" subtitle={"Extrato Conta Corrente\nLayout 1 — PDF"} bg="#EBF2FF" file={files.extrato} onFile={f => setFiles(p => ({ ...p, extrato: f }))} onRemove={() => setFiles(p => ({ ...p, extrato: null }))} />
        <UploadCard icon="📑" title="Movimentação Sicoob" subtitle={"Relatório Liquidação/Baixa\nSicoobNet — PDF"} bg="#D4EEE5" file={files.movim} onFile={f => setFiles(p => ({ ...p, movim: f }))} onRemove={() => setFiles(p => ({ ...p, movim: null }))} />
        <UploadCard icon="📋" title="IXC Recebimentos" subtitle={"Relatório de Recebimentos\nIXC Provedor — PDF"} bg="#FDE8C6" file={files.ixc} onFile={f => setFiles(p => ({ ...p, ixc: f }))} onRemove={() => setFiles(p => ({ ...p, ixc: null }))} />
      </div>
      <button disabled={!ready} onClick={() => onProcess(files, MESES[mes] + ' ' + ano)}
        style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, background: ready ? '#1B5FAA' : '#C5D3E8', color: ready ? '#fff' : '#8A95A8', border: 'none', borderRadius: 10, cursor: ready ? 'pointer' : 'not-allowed', marginBottom: 10, transition: 'all .2s' }}>
        ⚡ Processar conciliação
      </button>
      {/* <button onClick={() => onDemo('Abril 2026')}
        style={{ width: '100%', padding: 10, fontSize: 13, fontWeight: 500, background: 'none', color: '#1B5FAA', border: '1.5px solid #1B5FAA', borderRadius: 10, cursor: 'pointer' }}>
        🗂 Usar dados de exemplo (Abril 2026)
      </button> */}
    </div>
  )
}

function ScreenProcessing({ steps }) {
  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 12, padding: '24px 28px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#2A3348', marginBottom: 20 }}>⚡ Processando arquivos...</p>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '11px 0', borderBottom: i < steps.length - 1 ? '1px solid #F0F3FA' : 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              background: s.status === 'ok' ? '#D4EEE5' : s.status === 'run' ? '#EBF2FF' : s.status === 'err' ? '#FEE2E0' : '#F0F3FA',
              color: s.status === 'ok' ? '#064535' : s.status === 'run' ? '#1B5FAA' : s.status === 'err' ? '#C0392B' : '#8A95A8',
              animation: s.status === 'run' ? 'pulse 1.2s infinite' : 'none'
            }}>
              {s.status === 'ok' ? '✓' : s.status === 'err' ? '✗' : s.status === 'run' ? '⟳' : '⏳'}
            </div>
            <div><p style={{ fontSize: 13, fontWeight: 500, color: '#2A3348' }}>{s.label}</p>{s.sub && <p style={{ fontSize: 11, color: '#8A95A8', marginTop: 3 }}>{s.sub}</p>}</div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}

// ─── TABS ────────────────────────────────────────────────────────────────────
function TabDashboard({ extrato, ixcDaily, movim, conc, periodo }) {
  const { totBoleto, totTarifa, totDebConv, totIXC, totPIX, totEstorno, diff, conciliado } = conc
  const chartData = (() => {
    const map = {}
    extrato.forEach(e => {
      if (!map[e.data]) map[e.data] = { data: e.data, Boleto: 0, PIX: 0, Estorno: 0, Tarifa: 0, DebConv: 0, Debito: 0 }
      if (e.tipo === 'Boleto') map[e.data].Boleto += e.valor
      else if (e.tipo === 'PIX') map[e.data].PIX += e.valor
      else if (e.tipo === 'Estorno') map[e.data].Estorno += e.valor
      else if (e.tipo === 'Tarifa') map[e.data].Tarifa -= e.valor
      else if (e.tipo === 'Déb.Conv.') map[e.data].DebConv -= e.valor
      else if (e.tipo === 'Débito') map[e.data].Debito -= e.valor
    })
    return Object.values(map)
  })()
  const totDebito = sum(extrato.filter(e => e.tipo === 'Débito'), e => e.valor)

  return (
    <div>
      <div style={{ background: conciliado ? '#F0FBF4' : '#FEF3F2', border: `1px solid ${conciliado ? '#A3E0BB' : '#FDA29B'}`, borderRadius: 10, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>{conciliado ? '✅' : '⚠️'}</span>
        <div>
          <p style={{ fontWeight: 700, color: conciliado ? '#145C35' : '#912018', fontSize: 14, marginBottom: 2 }}>{conciliado ? 'Conciliação 100% positiva' : `${conc.divergencias.length} divergência(s) encontrada(s)`} — {periodo}</p>
          <p style={{ color: conciliado ? '#1A8A55' : '#B42318', fontSize: 12 }}>{conciliado ? 'IXC e Sicoob idênticos. Zero divergências.' : `Diferença de ${R(Math.abs(diff))} entre IXC e banco. Verifique a aba Conciliação.`}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12, marginBottom: 18 }}>
        <SCard label="IXC Recebimentos" value={R(totIXC)} sub={`${sum(ixcDaily, r => r.tit)} títulos`} />
        <SCard label="Banco — Boletos" value={R(totBoleto)} sub={`${chartData.filter(d => d.Boleto > 0).length} dias úteis`} />
        <SCard label="Tarifas + Conv." value={R(totTarifa + totDebConv)} color="#7C3AED" sub="tarifas + convênios" />
        <SCard label="Débitos (saídas)" value={R(totDebito)} color="#DC2626" sub="PIX, pgtos, saques" />
        <SCard label="Divergência" value={R(Math.abs(diff))} color={conciliado ? '#1A8A55' : '#C0392B'} sub={conciliado ? '✓ Zero' : '⚠ Verificar'} warn={!conciliado} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 18 }}>
        <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2A3348', marginBottom: 12 }}>Créditos e débitos diários — {periodo}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 9, fill: '#8A95A8' }} axisLine={false} tickLine={false} angle={-40} textAnchor="end" height={46} />
              <YAxis tick={{ fontSize: 10, fill: '#8A95A8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? Math.round(v / 1000) + 'k' : v} />
              <Tooltip formatter={(v, n) => ['R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), n]} />
              <Bar dataKey="Boleto" stackId="c" fill="#1B5FAA" />
              <Bar dataKey="PIX" stackId="c" fill="#0F6E56" />
              <Bar dataKey="Estorno" stackId="c" fill="#4A7C23" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Tarifa" stackId="d" fill="#F5A623" />
              <Bar dataKey="DebConv" stackId="d" fill="#7C3AED" />
              <Bar dataKey="Debito" stackId="d" fill="#DC2626" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            {[['#1B5FAA', 'Boleto'], ['#0F6E56', 'PIX receb.'], ['#4A7C23', 'Estorno'], ['#F5A623', 'Tarifa'], ['#7C3AED', 'Déb.Conv.'], ['#DC2626', 'Débitos']].map(([c, n]) => (
              <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7A96' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{n}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: '14px 18px', flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2A3348', marginBottom: 10 }}>Resumo financeiro</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}><tbody>
              {[['CRÉD.LIQ.COBRANÇA', R(totBoleto), '#1B5FAA'], ['PIX + Estorno', R(totPIX + totEstorno), '#0F6E56'], ['(–) Tarifas', '– ' + R(totTarifa), '#B86A10'], ['(–) Déb. Conv.', '– ' + R(totDebConv), '#7C3AED'], ['IXC Valor Líquido', R(totIXC), '#2A3348'], ['Diferença', R(Math.abs(diff)), conciliado ? '#1A8A55' : '#C0392B']].map(([l, v, c]) => (
                <tr key={l} style={{ borderBottom: '1px solid #F0F3FA' }}>
                  <td style={{ padding: '6px 0', color: '#5A6478', fontSize: 11 }}>{l}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontWeight: 700, color: c, fontSize: 11 }}>{v}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
          {movim && Object.keys(movim.typeTotals).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: '14px 18px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#2A3348', marginBottom: 8 }}>Liquidação por tipo</p>
              {Object.entries(movim.typeTotals).map(([code, val]) => (
                <div key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#5A6478' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: LIQ_COLORS[code] || '#888', display: 'inline-block' }} />{LIQ_LABELS[code] || code}
                  </span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 600, color: code === '82' ? '#C0392B' : '#2A3348' }}>{R(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabExtrato({ extrato }) {
  const [filtro, setFiltro] = useState('Todos')
  const TIPOS = ['Todos', 'Boleto', 'PIX', 'Estorno', 'Tarifa', 'Déb.Conv.', 'Débito']
  const diasMap = {}
  extrato.forEach(e => { if (!diasMap[e.data]) diasMap[e.data] = []; diasMap[e.data].push(e) })
  const dias = Object.entries(diasMap).map(([data, rows]) => ({ data, rows, saldo: sum(rows, r => r.cd === 'C' ? r.valor : -r.valor) }))
  const filtrado = filtro === 'Todos' ? dias : dias.map(d => ({ ...d, rows: d.rows.filter(r => r.tipo === filtro) })).filter(d => d.rows.length > 0)
  const isD = filtro === 'Tarifa' || filtro === 'Déb.Conv.' || filtro === 'Débito'
  const totF = filtro === 'Todos' ? sum(extrato.filter(e => e.cd === 'C'), e => e.valor) : sum(extrato.filter(e => e.tipo === filtro), e => e.valor)
  return (
    <div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
        {TIPOS.map(f => <button key={f} onClick={() => setFiltro(f)} style={{ padding: '5px 13px', fontSize: 12, borderRadius: 20, border: 'none', background: f === filtro ? '#1B5FAA' : '#F0F4FB', color: f === filtro ? '#fff' : '#4A5568', fontWeight: f === filtro ? 600 : 400, cursor: 'pointer', transition: 'all .15s' }}>{f}</button>)}
      </div>
      <TableCard>
        <table>
          <thead><tr>
            <th style={{ width: 56 }}>Data</th>
            <th>Histórico / Depositante</th>
            <th style={{ width: 80 }}>Doc.</th>
            <th style={{ width: 70 }}>Tipo</th>
            <th style={{ textAlign: 'center', width: 40 }}>C/D</th>
            <th style={{ textAlign: 'right', width: 110 }}>Valor (R$)</th>
            <th style={{ textAlign: 'right', width: 115 }}>Saldo Dia</th>
          </tr></thead>
          <tbody>
            {filtrado.flatMap((d, di) => d.rows.map((r, ri) => (
              <tr key={`${d.data}-${ri}`} style={{ background: di % 2 === 0 ? '#fff' : '#FAFBFE' }}>
                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: ri === 0 ? '#2A3348' : '#CCC' }}>{ri === 0 ? r.data : ''}</td>
                <td style={{ maxWidth: 0, overflow: 'hidden' }} title={r.contraparte || r.hist}>
                  {r.tipo === 'PIX' && r.contraparte ? (
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0F6E56' }}>{r.contraparte}</span>
                      <span style={{ fontSize: 10, color: '#8A95A8', marginLeft: 6 }}>
                        {r.cd === 'C' ? 'recebido' : 'enviado'}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.hist}</span>
                  )}
                </td>
                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#8A95A8' }}>{r.doc}</td>
                <td><Badge tipo={r.tipo} /></td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: r.cd === 'C' ? '#1A8A55' : '#B86A10' }}>{r.cd}</td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: r.cd === 'C' ? '#1B5FAA' : '#B86A10', fontWeight: 600 }}>{r.cd === 'C' ? '+' : '–'} {N(r.valor)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: d.saldo >= 0 ? '#1B5FAA' : '#C0392B', fontWeight: ri === 0 ? 700 : 400, opacity: ri === 0 ? 1 : 0 }}>{ri === 0 ? (d.saldo >= 0 ? '+' : '–') + ' ' + N(Math.abs(d.saldo)) : ''}</td>
              </tr>
            )))}
          </tbody>
          <tfoot><tr>
            <td colSpan={5}>TOTAL</td>
            <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: isD ? '#B86A10' : '#1B5FAA', fontWeight: 700 }}>{isD ? '– ' : '+  '}{N(totF)}</td>
            <td />
          </tr></tfoot>
        </table>
      </TableCard>
    </div>
  )
}

function TabMovimentacao({ movim }) {
  if (!movim || (movim.records.length === 0 && Object.keys(movim.typeTotals).length === 0))
    return <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8A95A8', fontSize: 13 }}>Nenhum dado de movimentação disponível.</div>
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 18 }}>
        {Object.entries(movim.typeTotals).map(([code, val]) => (
          <div key={code} style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 10, color: '#6B7A96', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{LIQ_LABELS[code] || 'Tipo ' + code}</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: code === '82' ? '#C0392B' : '#1B5FAA', fontFamily: "'DM Mono',monospace" }}>{R(val)}</p>
            <span style={{ fontSize: 10, background: code === '82' ? '#FEE2E0' : '#DDEAF9', color: code === '82' ? '#991B1B' : '#0C3F7A', padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>Tipo {code}</span>
          </div>
        ))}
      </div>
      {movim.totalBaixas > 0 && (
        <div style={{ background: '#FEF3F2', border: '1px solid #FDA29B', borderRadius: 10, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, color: '#912018', fontSize: 13, marginBottom: 2 }}>Baixas (Tipo 82) — {R(movim.totalBaixas)}</p>
            <p style={{ color: '#B42318', fontSize: 12 }}>Títulos cancelados/baixados pelo cedente. NÃO foram creditados na conta.</p>
          </div>
        </div>
      )}
      {movim.records.length > 0 && (
        <TableCard>
          <table>
            <thead><tr><th>Nosso Núm.</th><th>Seu Núm.</th><th>Sacado</th><th>Vencimento</th><th>Data Liq.</th><th className="r">Vlr. Original</th><th className="r">Vlr. Cobrado</th></tr></thead>
            <tbody>
              {movim.records.slice(0, 200).map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFE' }}>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{r.nossoNum}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{r.seuNum}</td>
                  <td style={{ color: '#4A5568', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sacado}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A95A8' }}>{r.dataVenc}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A95A8' }}>{r.dataLiq}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#5A6478' }}>{N(r.valOrig)}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA', fontWeight: 600 }}>{N(r.valCobrado)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={5}>TOTAL ({movim.records.length} registros)</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace" }}>{N(sum(movim.records, r => r.valOrig))}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace" }}>{N(sum(movim.records, r => r.valCobrado))}</td></tr></tfoot>
          </table>
        </TableCard>
      )}
    </div>
  )
}

function TabIXC({ ixcDaily, ixcRecords }) {
  const [view, setView] = useState('diario')
  const totT = sum(ixcDaily, r => r.tit), totL = sum(ixcDaily, r => r.liq)
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        <SCard label="Total títulos" value={String(totT)} sub="recebidos no período" />
        <SCard label="Valor líquido" value={R(totL)} sub="após descontos e acréscimos" />
        <SCard label="Valor bruto" value={R(sum(ixcDaily, r => r.bruto))} color="#5A6478" sub="antes dos descontos" />
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
        {[['diario', 'Por dia'], ['registros', 'Registros individuais']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', fontSize: 12, borderRadius: 20, border: 'none', background: v === view ? '#1B5FAA' : '#F0F4FB', color: v === view ? '#fff' : '#4A5568', fontWeight: v === view ? 600 : 400, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>
      {view === 'diario' && (
        <TableCard>
          <table>
            <thead><tr><th>Data</th><th>Títulos</th><th className="r">Valor Bruto</th><th className="r">Descontos</th><th className="r">Acréscimos</th><th className="r">Valor Líquido</th></tr></thead>
            <tbody>
              {ixcDaily.map((r, i) => (
                <tr key={r.data} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFE' }}>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{r.data}</td><td>{r.tit}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#5A6478' }}>{N(r.bruto)}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#B86A10' }}>– {N(r.desc)}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1A8A55' }}>+ {N(r.acre)}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA', fontWeight: 700 }}>{N(r.liq)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td>TOTAL</td><td>{totT}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace" }}>{N(sum(ixcDaily, r => r.bruto))}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#B86A10' }}>– {N(sum(ixcDaily, r => r.desc))}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1A8A55' }}>+ {N(sum(ixcDaily, r => r.acre))}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA' }}>{N(totL)}</td></tr></tfoot>
          </table>
        </TableCard>
      )}
      {view === 'registros' && (
        ixcRecords.length > 0 ? (
          <TableCard>
            <table>
              <thead><tr><th>Vencimento</th><th>Recebimento</th><th>Cliente</th><th className="r">Baixa</th><th className="r">Acre.</th><th className="r">Desc.</th><th className="r">Líquido</th></tr></thead>
              <tbody>
                {ixcRecords.slice(0, 300).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFE' }}>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#8A95A8' }}>{r.dataVenc?.substring(0, 5)}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{r.dataRec}</td>
                    <td style={{ color: '#4A5568', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{N(r.baixa)}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#1A8A55' }}>{r.acre > 0 ? '+' + N(r.acre) : '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#B86A10' }}>{r.desc > 0 ? '–' + N(r.desc) : '—'}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA', fontWeight: 600 }}>{N(r.liq)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}>{ixcRecords.length} registros</td><td style={{ textAlign: 'right' }}>{N(sum(ixcRecords, r => r.baixa))}</td><td style={{ textAlign: 'right', color: '#1A8A55' }}>+{N(sum(ixcRecords, r => r.acre))}</td><td style={{ textAlign: 'right', color: '#B86A10' }}>–{N(sum(ixcRecords, r => r.desc))}</td><td style={{ textAlign: 'right', color: '#1B5FAA' }}>{N(totL)}</td></tr></tfoot>
            </table>
          </TableCard>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #E8EDF5', borderRadius: 10, padding: 24, textAlign: 'center', color: '#8A95A8', fontSize: 13 }}>Registros individuais não foram extraídos. Verifique o formato do relatório IXC.</div>
        )
      )}
    </div>
  )
}

function TabConciliacao({ conc, periodo }) {
  const { porDia, divergencias, totIXC, totBoleto, diff, conciliado } = conc
  return (
    <div>
      <div style={{ background: conciliado ? '#F0FBF4' : '#FEF3F2', border: `1px solid ${conciliado ? '#A3E0BB' : '#FDA29B'}`, borderRadius: 10, padding: '14px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 28 }}>{conciliado ? '✅' : '⚠️'}</span>
        <div>
          <p style={{ fontWeight: 700, color: conciliado ? '#145C35' : '#912018', fontSize: 15, marginBottom: 3 }}>{conciliado ? 'Conciliação aprovada' : `${divergencias.length} dia(s) com divergência`} — {periodo}</p>
          <p style={{ color: conciliado ? '#1A8A55' : '#B42318', fontSize: 12 }}>IXC: {R(totIXC)} &nbsp;·&nbsp; Banco: {R(totBoleto)} &nbsp;·&nbsp; Diferença: {R(Math.abs(diff))}</p>
        </div>
      </div>
      {divergencias.length > 0 && (
        <div style={{ background: '#FEF3F2', border: '1px solid #FDA29B', borderRadius: 10, padding: '14px 18px', marginBottom: 18 }}>
          <p style={{ fontWeight: 600, color: '#912018', fontSize: 13, marginBottom: 10 }}>⚠ Dias com divergência</p>
          <TableCard>
            <table>
              <thead><tr><th>Data</th><th className="r">IXC (R$)</th><th className="r">Banco (R$)</th><th className="r">Diferença (R$)</th></tr></thead>
              <tbody>
                {divergencias.map((d, i) => (
                  <tr key={i} style={{ background: '#fff' }}>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{d.data}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA' }}>{N(d.ixc)}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA' }}>{N(d.banco)}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#C0392B', fontWeight: 700 }}>{N(Math.abs(d.diff))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>
      )}
      <TableCard>
        <table>
          <thead><tr><th>Data</th><th style={{ textAlign: 'right' }}>IXC Valor Líquido</th><th style={{ textAlign: 'right' }}>Banco CRÉD.LIQ.</th><th style={{ textAlign: 'right' }}>Diferença</th><th style={{ textAlign: 'right' }}>Status</th></tr></thead>
          <tbody>
            {porDia.map((d, i) => (
              <tr key={d.data} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFE' }}>
                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{d.data}</td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA', fontWeight: 600 }}>{N(d.ixc)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA', fontWeight: 600 }}>{N(d.banco)}</td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: d.ok ? '#1A8A55' : '#C0392B', fontWeight: 700 }}>{N(Math.abs(d.diff))}</td>
                <td style={{ textAlign: 'right' }}><span style={{ background: d.ok ? '#D4EEE5' : '#FEE2E0', color: d.ok ? '#064535' : '#C0392B', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{d.ok ? '✓ OK' : '⚠ VER'}</span></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr>
            <td>TOTAL</td>
            <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA' }}>{N(totIXC)}</td>
            <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: '#1B5FAA' }}>{N(totBoleto)}</td>
            <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", color: conciliado ? '#1A8A55' : '#C0392B' }}>{N(Math.abs(diff))}</td>
            <td style={{ textAlign: 'right' }}><span style={{ background: conciliado ? '#D4EEE5' : '#FEE2E0', color: conciliado ? '#064535' : '#C0392B', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{conciliado ? '✓ CONCILIADO' : '⚠ DIVERGÊNCIA'}</span></td>
          </tr></tfoot>
        </table>
      </TableCard>
    </div>
  )
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
// function loadDemo() {
//   const extrato = [
//     { data: "01/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3439901", tipo: "Boleto", cd: "C", valor: 3883.40, contraparte: '' },
//     { data: "01/04", hist: "PIX receb. — Simone Rocha dos Santos", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Simone Rocha dos Santos' },
//     { data: "01/04", hist: "TARIFA COBRANÇA", doc: "3445214", tipo: "Tarifa", cd: "D", valor: 28.00, contraparte: '' },
//     { data: "02/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3443768", tipo: "Boleto", cd: "C", valor: 2483.05, contraparte: '' },
//     { data: "02/04", hist: "OUTROS CRÉDITOS — estorno tarifa", doc: "ESTORNO", tipo: "Estorno", cd: "C", valor: 1685.60, contraparte: '' },
//     { data: "02/04", hist: "PIX receb. — Jose Luis de Paula", doc: "Pix", tipo: "PIX", cd: "C", valor: 100.00, contraparte: 'Jose Luis de Paula' },
//     { data: "02/04", hist: "TARIFA COBRANÇA", doc: "3448207", tipo: "Tarifa", cd: "D", valor: 16.80, contraparte: '' },
//     { data: "06/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3447406", tipo: "Boleto", cd: "C", valor: 2980.58, contraparte: '' },
//     { data: "06/04", hist: "PIX receb. — Lucia Helena da Silva Valente", doc: "Pix", tipo: "PIX", cd: "C", valor: 80.00, contraparte: 'Lucia Helena da Silva Valente' },
//     { data: "06/04", hist: "PIX Sicoob — Jose Cesario Rodegheri", doc: "31211047", tipo: "PIX", cd: "C", valor: 30.00, contraparte: 'Jose Cesario Rodegheri de Castro' },
//     { data: "06/04", hist: "PIX receb. — Tatiana Santos Figueira", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Tatiana Santos Figueira' },
//     { data: "06/04", hist: "PIX receb. — Isabelli da Cruz Florencio", doc: "Pix", tipo: "PIX", cd: "C", valor: 50.00, contraparte: 'Isabelli da Cruz Florencio' },
//     { data: "06/04", hist: "PIX receb. — Rita Cristina C. Machado", doc: "Pix", tipo: "PIX", cd: "C", valor: 54.95, contraparte: 'Rita Cristina Coutinho Machado' },
//     { data: "06/04", hist: "PIX receb. — Andreza Rocha Beltrao", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Andreza Rocha Beltrao' },
//     { data: "06/04", hist: "TARIFA COBRANÇA", doc: "3452007", tipo: "Tarifa", cd: "D", valor: 16.80, contraparte: '' },
//     { data: "07/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3450210", tipo: "Boleto", cd: "C", valor: 9065.17, contraparte: '' },
//     { data: "07/04", hist: "TARIFA COBRANÇA", doc: "3455425", tipo: "Tarifa", cd: "D", valor: 47.60, contraparte: '' },
//     { data: "08/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3454164", tipo: "Boleto", cd: "C", valor: 5377.18, contraparte: '' },
//     { data: "08/04", hist: "TARIFA COBRANÇA", doc: "3458983", tipo: "Tarifa", cd: "D", valor: 69.30, contraparte: '' },
//     { data: "09/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3457551", tipo: "Boleto", cd: "C", valor: 7113.29, contraparte: '' },
//     { data: "09/04", hist: "PIX receb. — Gilmar Guilherme", doc: "Pix", tipo: "PIX", cd: "C", valor: 65.00, contraparte: 'Gilmar Guilherme' },
//     { data: "09/04", hist: "PIX receb. — Brenda Moraes de Rezende", doc: "Pix", tipo: "PIX", cd: "C", valor: 80.00, contraparte: 'Brenda Moraes de Rezende' },
//     { data: "09/04", hist: "TARIFA COBRANÇA", doc: "3502311", tipo: "Tarifa", cd: "D", valor: 46.90, contraparte: '' },
//     { data: "10/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3460625", tipo: "Boleto", cd: "C", valor: 6913.98, contraparte: '' },
//     { data: "10/04", hist: "PIX receb. — Valeria Thuller", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Valeria Thuller' },
//     { data: "10/04", hist: "PIX receb. — Mariane Gifoni de Souza", doc: "Pix", tipo: "PIX", cd: "C", valor: 79.90, contraparte: 'Mariane Gifoni de Souza' },
//     { data: "10/04", hist: "DÉB. CONV. SEGUROS", doc: "SICOOB SEG", tipo: "Déb.Conv.", cd: "D", valor: 92.07, contraparte: '' },
//     { data: "10/04", hist: "TARIFA COBRANÇA", doc: "3505989", tipo: "Tarifa", cd: "D", valor: 70.70, contraparte: '' },
//     { data: "13/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3503729", tipo: "Boleto", cd: "C", valor: 11933.90, contraparte: '' },
//     { data: "13/04", hist: "PIX receb. — Maria Eduarda D. Ferreira", doc: "Pix", tipo: "PIX", cd: "C", valor: 30.00, contraparte: 'Maria Eduarda Damasceno Ferreira' },
//     { data: "13/04", hist: "PIX receb. — Izabel Cristina Cardozo", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Izabel Cristina Cardozo' },
//     { data: "13/04", hist: "TARIFA COBRANÇA", doc: "3509517", tipo: "Tarifa", cd: "D", valor: 2.10, contraparte: '' },
//     { data: "14/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3507707", tipo: "Boleto", cd: "C", valor: 6880.94, contraparte: '' },
//     { data: "14/04", hist: "TARIFA COBRANÇA", doc: "3509518", tipo: "Tarifa", cd: "D", valor: 32.20, contraparte: '' },
//     { data: "14/04", hist: "TARIFA COBRANÇA", doc: "3513232", tipo: "Tarifa", cd: "D", valor: 2.80, contraparte: '' },
//     { data: "15/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3511082", tipo: "Boleto", cd: "C", valor: 3112.99, contraparte: '' },
//     { data: "15/04", hist: "PIX receb. — Elayne Aparecida Amorim", doc: "Pix", tipo: "PIX", cd: "C", valor: 100.00, contraparte: 'Elayne Aparecida Amorim' },
//     { data: "15/04", hist: "PIX receb. — Francisco Sandro da Silva", doc: "Pix", tipo: "PIX", cd: "C", valor: 80.00, contraparte: 'Francisco Sandro da Silva' },
//     { data: "15/04", hist: "TARIFA COBRANÇA", doc: "3513233", tipo: "Tarifa", cd: "D", valor: 17.50, contraparte: '' },
//     { data: "15/04", hist: "TARIFA COBRANÇA", doc: "3516996", tipo: "Tarifa", cd: "D", valor: 1.40, contraparte: '' },
//     { data: "16/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3515963", tipo: "Boleto", cd: "C", valor: 4236.76, contraparte: '' },
//     { data: "16/04", hist: "PIX receb. — Kauani Alves Rosa da Silva", doc: "Pix", tipo: "PIX", cd: "C", valor: 50.00, contraparte: 'Kauani Alves Rosa da Silva' },
//     { data: "16/04", hist: "TARIFA COBRANÇA", doc: "3516997", tipo: "Tarifa", cd: "D", valor: 12.60, contraparte: '' },
//     { data: "16/04", hist: "TARIFA COBRANÇA", doc: "3520324", tipo: "Tarifa", cd: "D", valor: 2.80, contraparte: '' },
//     { data: "17/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3518886", tipo: "Boleto", cd: "C", valor: 4473.45, contraparte: '' },
//     { data: "17/04", hist: "PIX receb. — Willian Antunes Goncalves", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Willian Antunes Goncalves' },
//     { data: "17/04", hist: "PIX receb. — Patrick Ferreira dos Santos", doc: "Pix", tipo: "PIX", cd: "C", valor: 79.90, contraparte: 'Patrick Ferreira dos Santos' },
//     { data: "17/04", hist: "TARIFA COBRANÇA", doc: "3520325", tipo: "Tarifa", cd: "D", valor: 16.80, contraparte: '' },
//     { data: "20/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3522054", tipo: "Boleto", cd: "C", valor: 4361.19, contraparte: '' },
//     { data: "20/04", hist: "PIX receb. — Maria Beatriz D. A. Pacheco", doc: "Pix", tipo: "PIX", cd: "C", valor: 70.00, contraparte: 'Maria Beatriz Durco Alves Pacheco' },
//     { data: "20/04", hist: "PIX receb. — Gabriela Goncalves Ignacio", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Gabriela Goncalves Ignacio' },
//     { data: "20/04", hist: "TARIFA COBRANÇA", doc: "3559468", tipo: "Tarifa", cd: "D", valor: 21.00, contraparte: '' },
//     { data: "22/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3558463", tipo: "Boleto", cd: "C", valor: 19499.76, contraparte: '' },
//     { data: "22/04", hist: "PIX receb. — John Lenon Carvalho Rodrigues", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'John Lenon Carvalho Rodrigues' },
//     { data: "22/04", hist: "DÉB.CONV.DEM.EMPRES", doc: "DBAUTO VIS", tipo: "Déb.Conv.", cd: "D", valor: 9.90, contraparte: '' },
//     { data: "22/04", hist: "TARIFA COBRANÇA", doc: "3562657", tipo: "Tarifa", cd: "D", valor: 90.30, contraparte: '' },
//     { data: "23/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3561698", tipo: "Boleto", cd: "C", valor: 6545.64, contraparte: '' },
//     { data: "23/04", hist: "TARIFA COBRANÇA", doc: "3565451", tipo: "Tarifa", cd: "D", valor: 25.20, contraparte: '' },
//     { data: "24/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3564311", tipo: "Boleto", cd: "C", valor: 1946.22, contraparte: '' },
//     { data: "24/04", hist: "TARIFA COBRANÇA", doc: "3568267", tipo: "Tarifa", cd: "D", valor: 7.00, contraparte: '' },
//     { data: "27/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3567027", tipo: "Boleto", cd: "C", valor: 4785.57, contraparte: '' },
//     { data: "27/04", hist: "TARIFA COBRANÇA", doc: "3572050", tipo: "Tarifa", cd: "D", valor: 22.40, contraparte: '' },
//     { data: "28/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3569985", tipo: "Boleto", cd: "C", valor: 6233.21, contraparte: '' },
//     { data: "28/04", hist: "PIX receb. — Arcendino Raimundo Fontes", doc: "Pix", tipo: "PIX", cd: "C", valor: 100.00, contraparte: 'Arcendino Raimundo Fontes' },
//     { data: "28/04", hist: "TARIFA COBRANÇA", doc: "3572051", tipo: "Tarifa", cd: "D", valor: 22.40, contraparte: '' },
//     { data: "28/04", hist: "TARIFA COBRANÇA", doc: "3575894", tipo: "Tarifa", cd: "D", valor: 9.10, contraparte: '' },
//     { data: "29/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3574507", tipo: "Boleto", cd: "C", valor: 3783.69, contraparte: '' },
//     { data: "29/04", hist: "PIX receb. — Arcendino Raimundo Fontes", doc: "Pix", tipo: "PIX", cd: "C", valor: 25.00, contraparte: 'Arcendino Raimundo Fontes' },
//     { data: "29/04", hist: "PIX receb. — Angelica Maria Pacheco Leao", doc: "Pix", tipo: "PIX", cd: "C", valor: 100.00, contraparte: 'Angelica Maria Pacheco Leao' },
//     { data: "29/04", hist: "TARIFA COBRANÇA", doc: "3575895", tipo: "Tarifa", cd: "D", valor: 12.60, contraparte: '' },
//     { data: "30/04", hist: "CRÉD.LIQ.COBRANÇA", doc: "3577545", tipo: "Boleto", cd: "C", valor: 2317.66, contraparte: '' },
//     { data: "30/04", hist: "TARIFA COBRANÇA", doc: "3578948", tipo: "Tarifa", cd: "D", valor: 10.50, contraparte: '' },
//     { data: "30/04", hist: "TARIFA COBRANÇA", doc: "3583099", tipo: "Tarifa", cd: "D", valor: 18.90, contraparte: '' },
//     ── DÉBITOS (PIX enviados, pagamentos, saques, cartão) ──
//     { data: "01/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 290.00, contraparte: '' },
//     { data: "01/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 22.95, contraparte: '10.573.521' },
//     { data: "01/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 150.00, contraparte: '' },
//     { data: "02/04", hist: "PIX enviado — Andreia Cordeiro", doc: "Pix", tipo: "Débito", cd: "D", valor: 739.35, contraparte: 'Andreia Cordeiro de Carvalho' },
//     { data: "02/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 298.42, contraparte: '31.423.015' },
//     { data: "06/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 200.00, contraparte: '' },
//     { data: "06/04", hist: "PIX enviado — Andreia Cordeiro de Carvalho", doc: "Pix", tipo: "Débito", cd: "D", valor: 253.26, contraparte: 'Andreia Cordeiro de Carvalho' },
//     { data: "06/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 400.00, contraparte: '' },
//     { data: "06/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31250651", tipo: "Débito", cd: "D", valor: 146.50, contraparte: '' },
//     { data: "06/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 820.00, contraparte: '' },
//     { data: "06/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 37.50, contraparte: '10.573.521' },
//     { data: "06/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 97.88, contraparte: '10.573.521' },
//     { data: "06/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31251003", tipo: "Débito", cd: "D", valor: 871.91, contraparte: '' },
//     { data: "07/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 3000.00, contraparte: '' },
//     { data: "07/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 5500.00, contraparte: '' },
//     { data: "07/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 1950.00, contraparte: '' },
//     { data: "07/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 2800.00, contraparte: '' },
//     { data: "07/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 11000.00, contraparte: '' },
//     { data: "07/04", hist: "DÉB.CONV.TELECOMUN", doc: "31271720", tipo: "Déb.Conv.", cd: "D", valor: 106.12, contraparte: '' },
//     { data: "07/04", hist: "DÉB.CONV.TELECOMUN", doc: "31271815", tipo: "Déb.Conv.", cd: "D", valor: 115.00, contraparte: '' },
//     { data: "07/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31274606", tipo: "Débito", cd: "D", valor: 300.00, contraparte: '' },
//     { data: "08/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 100.00, contraparte: '' },
//     { data: "08/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 3753.03, contraparte: '26.994.558' },
//     { data: "09/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 100.00, contraparte: '' },
//     { data: "13/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 150.00, contraparte: '' },
//     { data: "13/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 1454.90, contraparte: '10.573.521' },
//     { data: "13/04", hist: "DÉB.PGTO.BOLETO INT", doc: "31362579", tipo: "Débito", cd: "D", valor: 89.90, contraparte: '' },
//     { data: "13/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31362609", tipo: "Débito", cd: "D", valor: 450.00, contraparte: '' },
//     { data: "13/04", hist: "DÉB.CNV.EN.ELET.GAS", doc: "31362664", tipo: "Déb.Conv.", cd: "D", valor: 1362.78, contraparte: '' },
//     { data: "13/04", hist: "DÉB.CONV.TELECOMUN", doc: "31363020", tipo: "Déb.Conv.", cd: "D", valor: 48.22, contraparte: '' },
//     { data: "13/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 76.99, contraparte: '02.421.421' },
//     { data: "13/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 35.00, contraparte: '' },
//     { data: "13/04", hist: "COMP MASTER MAESTRO — JR FRANCA", doc: "460849", tipo: "Débito", cd: "D", valor: 53.98, contraparte: 'JR FRANCA RIO DAS FLORES' },
//     { data: "14/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 380.00, contraparte: '' },
//     { data: "14/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 79.90, contraparte: '' },
//     { data: "14/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 100.00, contraparte: '53.537.091' },
//     { data: "14/04", hist: "COMP MASTER MAESTRO — Posto Benfica", doc: "071094", tipo: "Débito", cd: "D", valor: 100.00, contraparte: 'POSTO BENFICA VALENCA' },
//     { data: "15/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 140.00, contraparte: '' },
//     { data: "15/04", hist: "PIX enviado — Academia Olimpo Training", doc: "31406982", tipo: "Débito", cd: "D", valor: 99.90, contraparte: 'ACADEMIA OLIMPO TRAINING LTDA' },
//     { data: "15/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 2191.05, contraparte: '32.356.784' },
//     { data: "16/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 630.00, contraparte: '' },
//     { data: "20/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 150.00, contraparte: '' },
//     { data: "20/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31466630", tipo: "Débito", cd: "D", valor: 714.90, contraparte: '' },
//     { data: "20/04", hist: "DB.CONV.TR FD-RFB", doc: "31466672", tipo: "Déb.Conv.", cd: "D", valor: 534.93, contraparte: 'FGTS / Receita Federal' },
//     { data: "20/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 1200.00, contraparte: '' },
//     { data: "20/04", hist: "DB.CONV.TR FD-RFB", doc: "31466743", tipo: "Déb.Conv.", cd: "D", valor: 8580.57, contraparte: 'FGTS / Receita Federal' },
//     { data: "20/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 226.80, contraparte: '10.573.521' },
//     { data: "20/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31470246", tipo: "Débito", cd: "D", valor: 12000.00, contraparte: '' },
//     { data: "20/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31471941", tipo: "Débito", cd: "D", valor: 72.09, contraparte: '' },
//     { data: "20/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31471962", tipo: "Débito", cd: "D", valor: 90.37, contraparte: '' },
//     { data: "20/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31471993", tipo: "Débito", cd: "D", valor: 476.08, contraparte: '' },
//     { data: "22/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 430.00, contraparte: '14.353.611' },
//     { data: "22/04", hist: "SAQUE NA AGENCIA", doc: "28", tipo: "Débito", cd: "D", valor: 40000.00, contraparte: 'WANDERSON M MORAES' },
//     { data: "22/04", hist: "COMP MASTER MAESTRO — Posto Comafel", doc: "542056", tipo: "Débito", cd: "D", valor: 150.00, contraparte: 'POSTO COMAFEL VALENCA' },
//     { data: "24/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 20000.00, contraparte: '43.590.288' },
//     { data: "24/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 100.00, contraparte: '' },
//     { data: "24/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 20000.00, contraparte: '' },
//     { data: "27/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 8.70, contraparte: '18.033.552' },
//     { data: "27/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31557335", tipo: "Débito", cd: "D", valor: 632.40, contraparte: '' },
//     { data: "27/04", hist: "DÉB.TIT.COMPE.EFETI", doc: "31557365", tipo: "Débito", cd: "D", valor: 2394.44, contraparte: '' },
//     { data: "28/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 150.00, contraparte: '' },
//     { data: "30/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 4605.00, contraparte: '59.557.746' },
//     { data: "30/04", hist: "PIX enviado", doc: "Pix", tipo: "Débito", cd: "D", valor: 20.00, contraparte: '' },
//   ]
//   const ixcDaily = [
//     { data: "01/04", tit: 39, bruto: 3883.40, desc: 350.00, acre: 172.99, liq: 3706.39 },
//     { data: "02/04", tit: 36, bruto: 2834.40, desc: 281.60, acre: 0, liq: 2483.05 },
//     { data: "06/04", tit: 62, bruto: 3262.18, desc: 331.60, acre: 50.00, liq: 2980.58 },
//     { data: "07/04", tit: 161, bruto: 9936.27, desc: 1020.20, acre: 149.10, liq: 9065.17 },
//     { data: "08/04", tit: 87, bruto: 5887.66, desc: 580.70, acre: 70.22, liq: 5377.18 },
//     { data: "09/04", tit: 108, bruto: 7786.29, desc: 742.50, acre: 69.50, liq: 7113.29 },
//     { data: "10/04", tit: 104, bruto: 7576.28, desc: 730.40, acre: 68.10, liq: 6913.98 },
//     { data: "13/04", tit: 191, bruto: 13097.89, desc: 1294.00, acre: 130.01, liq: 11933.90 },
//     { data: "14/04", tit: 112, bruto: 7543.14, desc: 742.59, acre: 80.39, liq: 6880.94 },
//     { data: "15/04", tit: 51, bruto: 3419.09, desc: 337.70, acre: 31.60, liq: 3112.99 },
//     { data: "16/04", tit: 63, bruto: 4631.36, desc: 440.60, acre: 46.00, liq: 4236.76 },
//     { data: "17/04", tit: 73, bruto: 4893.25, desc: 470.20, acre: 50.40, liq: 4473.45 },
//     { data: "20/04", tit: 63, bruto: 4771.39, desc: 460.20, acre: 50.00, liq: 4361.19 },
//     { data: "22/04", tit: 303, bruto: 21358.26, desc: 2098.80, acre: 240.30, liq: 19499.76 },
//     { data: "23/04", tit: 101, bruto: 7166.14, desc: 701.50, acre: 81.00, liq: 6545.64 },
//     { data: "24/04", tit: 30, bruto: 2128.42, desc: 210.40, acre: 28.20, liq: 1946.22 },
//     { data: "27/04", tit: 75, bruto: 5237.57, desc: 502.50, acre: 50.50, liq: 4785.57 },
//     { data: "28/04", tit: 101, bruto: 6826.41, desc: 660.00, acre: 66.80, liq: 6233.21 },
//     { data: "29/04", tit: 60, bruto: 4140.39, desc: 400.50, acre: 43.80, liq: 3783.69 },
//     { data: "30/04", tit: 35, bruto: 2530.66, desc: 253.00, acre: 40.00, liq: 2317.66 },
//   ]
//   const movim = { records: [], typeTotals: { '58': 71621.52, '212': 47286.19, '68': 191.59, '215': 119.90 }, totalLiquidado: 119219.20, totalBaixas: 6108.10 }
//   return { extrato, ixcDaily, ixcRecords: [], movim }
// }

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'import', label: '📤 Importar', lock: false },
  { id: 'dashboard', label: '📊 Dashboard', lock: true },
  { id: 'extrato', label: '🏦 Extrato', lock: true },
  { id: 'movimentacao', label: '📑 Movimentação', lock: true },
  { id: 'ixc', label: '📋 IXC', lock: true },
  { id: 'conciliacao', label: '🔗 Conciliação', lock: true },
]

export default function ConciliadorApp() {
  const [screen, setScreen] = useState('upload')
  const [activeTab, setActiveTab] = useState('import')
  const [periodo, setPeriodo] = useState('')
  const [extrato, setExtrato] = useState([])
  const [movim, setMovim] = useState(null)
  const [ixcDaily, setIxcDaily] = useState([])
  const [ixcRecs, setIxcRecs] = useState([])
  const [conc, setConc] = useState(null)
  const [steps, setSteps] = useState([])
  const [exporting, setExporting] = useState(false)
  const hasData = extrato.length > 0 && ixcDaily.length > 0

  const upd = (id, status, sub = '') => setSteps(p => p.map(s => s.id === id ? { ...s, status, sub } : s))

  const handleDemo = useCallback(p => {
    const { extrato: e, ixcDaily: d, ixcRecords: r, movim: mv } = loadDemo()
    setExtrato(e); setIxcDaily(d); setIxcRecs(r); setMovim(mv)
    setConc(reconcile(e, d)); setPeriodo(p)
    setScreen('results'); setActiveTab('dashboard')
  }, [])

  const handleProcess = useCallback(async (files, p) => {
    setSteps([
      { id: 's1', label: 'Lendo Extrato Sicoob...', status: 'wait', sub: '' },
      { id: 's2', label: 'Lendo Movimentação Sicoob...', status: 'wait', sub: '' },
      { id: 's3', label: 'Lendo Relatório IXC...', status: 'wait', sub: '' },
      { id: 's4', label: 'Motor de conciliação...', status: 'wait', sub: '' },
    ])
    setScreen('processing'); setPeriodo(p)
    try {
      upd('s1', 'run')
      const t1 = await extractPDFText(files.extrato), e = parseSicoobExtrato(t1)
      upd('s1', 'ok', `${e.length} lançamentos · créditos: ${R(sum(e.filter(x => x.cd === 'C'), x => x.valor))}`)
      upd('s2', 'run')
      const t2 = await extractPDFText(files.movim), mv = parseSicoobMovim(t2)
      upd('s2', 'ok', `${mv.records.length} registros · liquidado: ${R(mv.totalLiquidado)}`)
      upd('s3', 'run')
      const t3 = await extractPDFText(files.ixc), { daily, records } = parseIXCRelatorio(t3)
      upd('s3', 'ok', `${sum(daily, d => d.tit)} títulos · ${R(sum(daily, d => d.liq))}`)
      upd('s4', 'run')
      await new Promise(r => setTimeout(r, 500))
      const c = reconcile(e, daily)
      upd('s4', 'ok', c.conciliado ? '✓ Zero divergências' : `⚠ ${c.divergencias.length} divergência(s)`)
      await new Promise(r => setTimeout(r, 400))
      setExtrato(e); setMovim(mv); setIxcDaily(daily); setIxcRecs(records); setConc(c)
      setScreen('results'); setActiveTab('dashboard')
    } catch (err) {
      console.error(err)
      setSteps(p => p.map(s => s.status === 'run' || s.status === 'wait' ? { ...s, status: 'err', sub: err.message } : s))
    }
  }, [])

  const handleExport = useCallback(async () => {
    if (!hasData) return
    setExporting(true)
    try { await exportarExcel({ extrato, ixcDaily, ixcRecords: ixcRecs, movim, conc, periodo }) }
    finally { setExporting(false) }
  }, [extrato, ixcDaily, ixcRecs, movim, conc, periodo, hasData])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6FB' }}>
      <div style={{ background: '#0F2D6B', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#3B82F6,#1B5FAA)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>💠</div>
            {/* <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>FiberNet Conciliador</p>
              <p style={{ color: '#8BAADD', fontSize: 11 }}>{EMPRESA} · {CNPJ}</p>
            </div> */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', marginRight: 4 }}>
              {/* <p style={{ color: '#C8D8F0', fontSize: 11 }}>{CONTA}</p> */}
              <p style={{ color: '#8BAADD', fontSize: 11 }}>{periodo ? `Período: ${periodo}` : 'Nenhum período carregado'}</p>
            </div>
            <button disabled={!hasData || exporting} onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', background: hasData ? '#2563EB' : '#1A3A7A', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: hasData ? 'pointer' : 'not-allowed', opacity: hasData ? 1 : .5, transition: 'all .2s' }}>
              {exporting ? '⟳ Exportando...' : '⬇ Exportar Excel'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, paddingTop: 4 }}>
          {TABS.map(t => (
            <button key={t.id} disabled={t.lock && !hasData} onClick={() => { setActiveTab(t.id); if (screen !== 'results') setScreen('results') }}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#fff' : (t.lock && !hasData) ? '#3A5080' : '#8BAADD', background: activeTab === t.id ? 'rgba(255,255,255,.12)' : 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid #60A5FA' : '2px solid transparent', cursor: (t.lock && !hasData) ? 'not-allowed' : 'pointer', borderRadius: '6px 6px 0 0', fontFamily: 'inherit', transition: 'all .15s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '22px 24px', maxWidth: 1240, margin: '0 auto', width: '100%', flex: 1 }}>
        {screen === 'upload' && <ScreenUpload onProcess={handleProcess} onDemo={handleDemo} />}
        {screen === 'processing' && <ScreenProcessing steps={steps} />}
        {screen === 'results' && hasData && conc && (
          <>
            {activeTab === 'dashboard' && <TabDashboard extrato={extrato} ixcDaily={ixcDaily} movim={movim} conc={conc} periodo={periodo} />}
            {activeTab === 'extrato' && <TabExtrato extrato={extrato} />}
            {activeTab === 'movimentacao' && <TabMovimentacao movim={movim} />}
            {activeTab === 'ixc' && <TabIXC ixcDaily={ixcDaily} ixcRecords={ixcRecs} />}
            {activeTab === 'conciliacao' && <TabConciliacao conc={conc} periodo={periodo} />}
          </>
        )}
      </div>
      {/* <div style={{ textAlign: 'center', padding: 14, color: '#9AA5BC', fontSize: 11, borderTop: '1px solid #E8EDF5', background: '#fff', marginTop: 20 }}>
        FiberNet Conciliador{periodo ? ` · ${periodo}` : ''} · {EMPRESA}
      </div> */}
    </div>
  )
}