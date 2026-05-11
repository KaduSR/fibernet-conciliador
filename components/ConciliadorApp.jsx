'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── DEMO DATA (Abril 2026) ───────────────────────────────────────────────────
const DEMO_EXTRATO = [
  {data:"01/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3439901",tipo:"Boleto",cd:"C",valor:3883.40},
  {data:"01/04",hist:"PIX receb. — Simone Rocha dos Santos",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"01/04",hist:"TARIFA COBRANÇA",doc:"3445214",tipo:"Tarifa",cd:"D",valor:28.00},
  {data:"02/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3443768",tipo:"Boleto",cd:"C",valor:2483.05},
  {data:"02/04",hist:"OUTROS CRÉDITOS — estorno tarifa",doc:"ESTORNO",tipo:"Estorno",cd:"C",valor:1685.60},
  {data:"02/04",hist:"PIX receb. — Jose Luis de Paula",doc:"Pix",tipo:"PIX",cd:"C",valor:100.00},
  {data:"02/04",hist:"TARIFA COBRANÇA",doc:"3448207",tipo:"Tarifa",cd:"D",valor:16.80},
  {data:"06/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3447406",tipo:"Boleto",cd:"C",valor:2980.58},
  {data:"06/04",hist:"PIX receb. — Lucia Helena da Silva Valente",doc:"Pix",tipo:"PIX",cd:"C",valor:80.00},
  {data:"06/04",hist:"PIX Sicoob — Jose Cesario Rodegheri",doc:"31211047",tipo:"PIX",cd:"C",valor:30.00},
  {data:"06/04",hist:"PIX receb. — Tatiana Santos Figueira",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"06/04",hist:"PIX receb. — Isabelli da Cruz Florencio",doc:"Pix",tipo:"PIX",cd:"C",valor:50.00},
  {data:"06/04",hist:"PIX receb. — Rita Cristina C. Machado",doc:"Pix",tipo:"PIX",cd:"C",valor:54.95},
  {data:"06/04",hist:"PIX receb. — Andreza Rocha Beltrao",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"06/04",hist:"TARIFA COBRANÇA",doc:"3452007",tipo:"Tarifa",cd:"D",valor:16.80},
  {data:"07/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3450210",tipo:"Boleto",cd:"C",valor:9065.17},
  {data:"07/04",hist:"TARIFA COBRANÇA",doc:"3455425",tipo:"Tarifa",cd:"D",valor:47.60},
  {data:"08/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3454164",tipo:"Boleto",cd:"C",valor:5377.18},
  {data:"08/04",hist:"TARIFA COBRANÇA",doc:"3458983",tipo:"Tarifa",cd:"D",valor:69.30},
  {data:"09/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3457551",tipo:"Boleto",cd:"C",valor:7113.29},
  {data:"09/04",hist:"PIX receb. — Gilmar Guilherme",doc:"Pix",tipo:"PIX",cd:"C",valor:65.00},
  {data:"09/04",hist:"PIX receb. — Brenda Moraes de Rezende",doc:"Pix",tipo:"PIX",cd:"C",valor:80.00},
  {data:"09/04",hist:"TARIFA COBRANÇA",doc:"3502311",tipo:"Tarifa",cd:"D",valor:46.90},
  {data:"10/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3460625",tipo:"Boleto",cd:"C",valor:6913.98},
  {data:"10/04",hist:"PIX receb. — Valeria Thuller",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"10/04",hist:"PIX receb. — Mariane Gifoni de Souza",doc:"Pix",tipo:"PIX",cd:"C",valor:79.90},
  {data:"10/04",hist:"DÉB. CONV. SEGUROS",doc:"SICOOB SEG",tipo:"Déb.Conv.",cd:"D",valor:92.07},
  {data:"10/04",hist:"TARIFA COBRANÇA",doc:"3505989",tipo:"Tarifa",cd:"D",valor:70.70},
  {data:"13/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3503729",tipo:"Boleto",cd:"C",valor:11933.90},
  {data:"13/04",hist:"PIX receb. — Maria Eduarda D. Ferreira",doc:"Pix",tipo:"PIX",cd:"C",valor:30.00},
  {data:"13/04",hist:"PIX receb. — Izabel Cristina Cardozo",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"13/04",hist:"TARIFA COBRANÇA",doc:"3509517",tipo:"Tarifa",cd:"D",valor:2.10},
  {data:"14/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3507707",tipo:"Boleto",cd:"C",valor:6880.94},
  {data:"14/04",hist:"TARIFA COBRANÇA",doc:"3509518",tipo:"Tarifa",cd:"D",valor:32.20},
  {data:"14/04",hist:"TARIFA COBRANÇA",doc:"3513232",tipo:"Tarifa",cd:"D",valor:2.80},
  {data:"15/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3511082",tipo:"Boleto",cd:"C",valor:3112.99},
  {data:"15/04",hist:"PIX receb. — Elayne Aparecida Amorim",doc:"Pix",tipo:"PIX",cd:"C",valor:100.00},
  {data:"15/04",hist:"PIX receb. — Francisco Sandro da Silva",doc:"Pix",tipo:"PIX",cd:"C",valor:80.00},
  {data:"15/04",hist:"TARIFA COBRANÇA",doc:"3513233",tipo:"Tarifa",cd:"D",valor:17.50},
  {data:"15/04",hist:"TARIFA COBRANÇA",doc:"3516996",tipo:"Tarifa",cd:"D",valor:1.40},
  {data:"16/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3515963",tipo:"Boleto",cd:"C",valor:4236.76},
  {data:"16/04",hist:"PIX receb. — Kauani Alves Rosa da Silva",doc:"Pix",tipo:"PIX",cd:"C",valor:50.00},
  {data:"16/04",hist:"TARIFA COBRANÇA",doc:"3516997",tipo:"Tarifa",cd:"D",valor:12.60},
  {data:"16/04",hist:"TARIFA COBRANÇA",doc:"3520324",tipo:"Tarifa",cd:"D",valor:2.80},
  {data:"17/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3518886",tipo:"Boleto",cd:"C",valor:4473.45},
  {data:"17/04",hist:"PIX receb. — Willian Antunes Goncalves",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"17/04",hist:"PIX receb. — Patrick Ferreira dos Santos",doc:"Pix",tipo:"PIX",cd:"C",valor:79.90},
  {data:"17/04",hist:"TARIFA COBRANÇA",doc:"3520325",tipo:"Tarifa",cd:"D",valor:16.80},
  {data:"20/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3522054",tipo:"Boleto",cd:"C",valor:4361.19},
  {data:"20/04",hist:"PIX receb. — Maria Beatriz D. A. Pacheco",doc:"Pix",tipo:"PIX",cd:"C",valor:70.00},
  {data:"20/04",hist:"PIX receb. — Gabriela Goncalves Ignacio",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"20/04",hist:"TARIFA COBRANÇA",doc:"3559468",tipo:"Tarifa",cd:"D",valor:21.00},
  {data:"22/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3558463",tipo:"Boleto",cd:"C",valor:19499.76},
  {data:"22/04",hist:"PIX receb. — John Lenon Carvalho Rodrigues",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"22/04",hist:"DÉB.CONV.DEM.EMPRES",doc:"DBAUTO VIS",tipo:"Déb.Conv.",cd:"D",valor:9.90},
  {data:"22/04",hist:"TARIFA COBRANÇA",doc:"3562657",tipo:"Tarifa",cd:"D",valor:90.30},
  {data:"23/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3561698",tipo:"Boleto",cd:"C",valor:6545.64},
  {data:"23/04",hist:"TARIFA COBRANÇA",doc:"3565451",tipo:"Tarifa",cd:"D",valor:25.20},
  {data:"24/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3564311",tipo:"Boleto",cd:"C",valor:1946.22},
  {data:"24/04",hist:"TARIFA COBRANÇA",doc:"3568267",tipo:"Tarifa",cd:"D",valor:7.00},
  {data:"27/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3567027",tipo:"Boleto",cd:"C",valor:4785.57},
  {data:"27/04",hist:"TARIFA COBRANÇA",doc:"3572050",tipo:"Tarifa",cd:"D",valor:22.40},
  {data:"28/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3569985",tipo:"Boleto",cd:"C",valor:6233.21},
  {data:"28/04",hist:"PIX receb. — Arcendino Raimundo Fontes",doc:"Pix",tipo:"PIX",cd:"C",valor:100.00},
  {data:"28/04",hist:"TARIFA COBRANÇA",doc:"3572051",tipo:"Tarifa",cd:"D",valor:22.40},
  {data:"28/04",hist:"TARIFA COBRANÇA",doc:"3575894",tipo:"Tarifa",cd:"D",valor:9.10},
  {data:"29/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3574507",tipo:"Boleto",cd:"C",valor:3783.69},
  {data:"29/04",hist:"PIX receb. — Arcendino Raimundo Fontes",doc:"Pix",tipo:"PIX",cd:"C",valor:25.00},
  {data:"29/04",hist:"PIX receb. — Angelica Maria Pacheco Leao",doc:"Pix",tipo:"PIX",cd:"C",valor:100.00},
  {data:"29/04",hist:"TARIFA COBRANÇA",doc:"3575895",tipo:"Tarifa",cd:"D",valor:12.60},
  {data:"30/04",hist:"CRÉD.LIQ.COBRANÇA",doc:"3577545",tipo:"Boleto",cd:"C",valor:2317.66},
  {data:"30/04",hist:"TARIFA COBRANÇA",doc:"3578948",tipo:"Tarifa",cd:"D",valor:10.50},
  {data:"30/04",hist:"TARIFA COBRANÇA",doc:"3583099",tipo:"Tarifa",cd:"D",valor:18.90},
]

const DEMO_IXC = [
  {data:"01/04",tit:39, bruto:3883.40, desc:350.00, acre:172.99, liq:3706.39},
  {data:"02/04",tit:36, bruto:2834.40, desc:281.60, acre:0,      liq:2483.05},
  {data:"06/04",tit:62, bruto:3262.18, desc:331.60, acre:50.00,  liq:2980.58},
  {data:"07/04",tit:161,bruto:9936.27, desc:1020.20,acre:149.10, liq:9065.17},
  {data:"08/04",tit:87, bruto:5887.66, desc:580.70, acre:70.22,  liq:5377.18},
  {data:"09/04",tit:108,bruto:7786.29, desc:742.50, acre:69.50,  liq:7113.29},
  {data:"10/04",tit:104,bruto:7576.28, desc:730.40, acre:68.10,  liq:6913.98},
  {data:"13/04",tit:191,bruto:13097.89,desc:1294.00,acre:130.01, liq:11933.90},
  {data:"14/04",tit:112,bruto:7543.14, desc:742.59, acre:80.39,  liq:6880.94},
  {data:"15/04",tit:51, bruto:3419.09, desc:337.70, acre:31.60,  liq:3112.99},
  {data:"16/04",tit:63, bruto:4631.36, desc:440.60, acre:46.00,  liq:4236.76},
  {data:"17/04",tit:73, bruto:4893.25, desc:470.20, acre:50.40,  liq:4473.45},
  {data:"20/04",tit:63, bruto:4771.39, desc:460.20, acre:50.00,  liq:4361.19},
  {data:"22/04",tit:303,bruto:21358.26,desc:2098.80,acre:240.30, liq:19499.76},
  {data:"23/04",tit:101,bruto:7166.14, desc:701.50, acre:81.00,  liq:6545.64},
  {data:"24/04",tit:30, bruto:2128.42, desc:210.40, acre:28.20,  liq:1946.22},
  {data:"27/04",tit:75, bruto:5237.57, desc:502.50, acre:50.50,  liq:4785.57},
  {data:"28/04",tit:101,bruto:6826.41, desc:660.00, acre:66.80,  liq:6233.21},
  {data:"29/04",tit:60, bruto:4140.39, desc:400.50, acre:43.80,  liq:3783.69},
  {data:"30/04",tit:35, bruto:2530.66, desc:253.00, acre:40.00,  liq:2317.66},
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const R = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const N = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TIPO_STYLE = {
  Boleto:     { bg: '#DDEAF9', color: '#0C3F7A' },
  PIX:        { bg: '#D4EEE5', color: '#064535' },
  Estorno:    { bg: '#DCEDC8', color: '#2E5009' },
  Tarifa:     { bg: '#FDE8C6', color: '#6B3700' },
  'Déb.Conv.':{ bg: '#EDE9FE', color: '#4C1D95' },
}

function Badge({ tipo }) {
  const s = TIPO_STYLE[tipo] || { bg: '#eee', color: '#333' }
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {tipo}
    </span>
  )
}

function SumCard({ label, value, sub, color = '#1B5FAA' }) {
  return (
    <div className="sum-card">
      <p style={{ fontSize: 10, color: '#6B7A96', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</p>
      <p className="mono" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#8A95A8', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

function getDias(extratoData) {
  const map = {}
  extratoData.forEach(e => {
    if (!map[e.data]) map[e.data] = []
    map[e.data].push(e)
  })
  return Object.entries(map).map(([data, rows]) => ({
    data, rows,
    totalC: rows.filter(r => r.cd === 'C').reduce((s, r) => s + r.valor, 0),
    totalD: rows.filter(r => r.cd === 'D').reduce((s, r) => s + r.valor, 0),
    saldo:  rows.reduce((s, r) => s + (r.cd === 'C' ? r.valor : -r.valor), 0),
  }))
}

// ─── PDF PARSING ──────────────────────────────────────────────────────────────
async function extractPDFText(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

  const ab = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise
  let text = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    text += content.items.map(i => i.str).join(' ') + '\n'
  }
  return text
}

function parseSicoobExtrato(text) {
  const entries = []
  const re = /(\d{2}\/\d{2})\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇÀÜ][^\d\n]{2,60}?)\s+([\d.]+,\d{2})\s*([CD])/g
  let m
  while ((m = re.exec(text)) !== null) {
    const [, data, histRaw, valStr, cd] = m
    const hist = histRaw.trim().replace(/\s+/g, ' ')
    const valor = parseFloat(valStr.replace(/\./g, '').replace(',', '.'))
    let tipo = null
    if (/CR[EÉ]D\.LIQ\.COBRAN/i.test(hist))                           tipo = 'Boleto'
    else if (/PIX RECEB|TRANSF\.RECEB/i.test(hist))                   tipo = 'PIX'
    else if (/OUTROS CR[EÉ]DITOS/i.test(hist) && cd === 'C')          tipo = 'Estorno'
    else if (/TARIFA COBRAN/i.test(hist))                              tipo = 'Tarifa'
    else if (/D[EÉ]B\.?\s*CONV\.?\s*(SEGUROS|DEM|DEMAIS|TELECOM|CNV|TR\s)/i.test(hist)) tipo = 'Déb.Conv.'
    else if (/DB\.CONV/i.test(hist))                                   tipo = 'Déb.Conv.'
    if (!tipo) continue
    const docM = text.slice(m.index, m.index + 200).match(/DOC\.:\s*(\S+)/)
    const doc  = docM ? docM[1] : (tipo === 'PIX' ? 'Pix' : '—')
    entries.push({ data, hist, doc, tipo, cd, valor })
  }
  return entries
}

function parseIXCRelatorio(text) {
  const dailyMap = {}
  const rowRe = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+Rec\..*?([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/g
  let m
  while ((m = rowRe.exec(text)) !== null) {
    const recDate = m[2].substring(0, 5)
    const baixa   = parseFloat(m[3].replace(/\./g, '').replace(',', '.'))
    const acre    = parseFloat(m[4].replace(/\./g, '').replace(',', '.'))
    const desc    = parseFloat(m[5].replace(/\./g, '').replace(',', '.'))
    const liq     = parseFloat(m[7].replace(/\./g, '').replace(',', '.'))
    if (!dailyMap[recDate]) dailyMap[recDate] = { data: recDate, tit: 0, bruto: 0, desc: 0, acre: 0, liq: 0 }
    dailyMap[recDate].tit++
    dailyMap[recDate].bruto += baixa
    dailyMap[recDate].desc  += desc
    dailyMap[recDate].acre  += acre
    dailyMap[recDate].liq   += liq
  }
  return Object.values(dailyMap).sort((a, b) => {
    const [da, ma] = a.data.split('/').map(Number)
    const [db, mb] = b.data.split('/').map(Number)
    return ma !== mb ? ma - mb : da - db
  })
}

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
async function exportarExcel(extratoData, ixcData, periodo) {
  const XLSX = await import('xlsx')
  const wb   = XLSX.utils.book_new()

  const totBoleto  = extratoData.filter(e => e.tipo === 'Boleto').reduce((s, e) => s + e.valor, 0)
  const totTarifa  = extratoData.filter(e => e.tipo === 'Tarifa').reduce((s, e) => s + e.valor, 0)
  const totDebConv = extratoData.filter(e => e.tipo === 'Déb.Conv.').reduce((s, e) => s + e.valor, 0)
  const totIXC     = ixcData.reduce((s, r) => s + r.liq, 0)
  const diff       = parseFloat((totBoleto - totIXC).toFixed(2))

  // Resumo
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['CONCILIAÇÃO FINANCEIRA — Telecom Fiber Net Ltda'],
    ['CNPJ:', '22.969.088/0001-97'],
    ['Conta:', '46.752-9 — Sicoob Credirochas'],
    ['Período:', periodo],
    ['Gerado em:', new Date().toLocaleString('pt-BR')],
    [],
    ['IXC — Total recebimentos', totIXC],
    ['Banco — CRÉD.LIQ.COBRANÇA', totBoleto],
    ['(–) Tarifas bancárias', -totTarifa],
    ['(–) Déb. Conv. (Seguros + Demais Empresas)', -totDebConv],
    ['Diferença IXC × Banco', diff],
  ])
  ws1['!cols'] = [{ wch: 36 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo')

  // Extrato Sicoob
  const dias    = getDias(extratoData)
  const extRows = [['Data', 'Histórico', 'Documento', 'Tipo', 'C/D', 'Valor (R$)', 'Saldo Dia (R$)']]
  dias.forEach(d =>
    d.rows.forEach((r, i) =>
      extRows.push([r.data, r.hist, r.doc, r.tipo, r.cd, r.cd === 'C' ? r.valor : -r.valor, i === 0 ? d.saldo : ''])
    )
  )
  extRows.push([], ['', '', '', '', 'Total créditos', extratoData.filter(e=>e.cd==='C').reduce((s,e)=>s+e.valor,0)], ['', '', '', '', 'Total tarifas', -totTarifa])
  const ws2 = XLSX.utils.aoa_to_sheet(extRows)
  ws2['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 12 }, { wch: 10 }, { wch: 5 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Extrato Sicoob')

  // Tarifas por Dia
  const tarRows = [['Data', 'DOC', 'Tarifa (R$)', 'CRÉD.LIQ.COB. (R$)', 'Saldo Dia (R$)']]
  dias.forEach(d => {
    const tarifas = d.rows.filter(r => r.tipo === 'Tarifa')
    const cred    = d.rows.filter(r => r.tipo === 'Boleto').reduce((s, r) => s + r.valor, 0)
    tarifas.forEach((t, i) => tarRows.push([t.data, t.doc, -t.valor, i === 0 ? cred : '', i === 0 ? d.saldo : '']))
  })
  tarRows.push([], ['TOTAL', '', -totTarifa, totBoleto, ''])
  const ws3 = XLSX.utils.aoa_to_sheet(tarRows)
  ws3['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'Tarifas por Dia')

  // IXC Recebimentos
  const totTit = ixcData.reduce((s, r) => s + r.tit, 0)
  const ixcRows = [['Data', 'Títulos', 'Valor Bruto (R$)', 'Descontos (R$)', 'Acréscimos (R$)', 'Valor Líquido (R$)']]
  ixcData.forEach(r => ixcRows.push([r.data, r.tit, r.bruto, -r.desc, r.acre, r.liq]))
  ixcRows.push([], ['TOTAL', totTit, ixcData.reduce((s,r)=>s+r.bruto,0), -ixcData.reduce((s,r)=>s+r.desc,0), ixcData.reduce((s,r)=>s+r.acre,0), totIXC])
  const ws4 = XLSX.utils.aoa_to_sheet(ixcRows)
  ws4['!cols'] = [{ wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws4, 'IXC Recebimentos')

  // Conciliação
  const concRows = [['Data', 'IXC Valor Líquido (R$)', 'Banco CRÉD.LIQ.COB. (R$)', 'Diferença (R$)', 'Status']]
  ixcData.forEach(r => {
    const banco = extratoData.filter(e => e.tipo === 'Boleto' && e.data === r.data).reduce((s, e) => s + e.valor, 0) || r.liq
    const d     = parseFloat((banco - r.liq).toFixed(2))
    concRows.push([r.data, r.liq, banco, d, Math.abs(d) < 0.05 ? 'Conciliado' : 'Divergência'])
  })
  concRows.push([], ['TOTAL', totIXC, totBoleto, diff, Math.abs(diff) < 0.05 ? 'Conciliado' : 'Divergência'])
  const ws5 = XLSX.utils.aoa_to_sheet(concRows)
  ws5['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 26 }, { wch: 18 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws5, 'Conciliação')

  const filename = `conciliacao_fibernet_${periodo.toLowerCase().replace(/\s/g, '_')}.xlsx`
  XLSX.writeFile(wb, filename)
}

// ─── UPLOAD CARD ──────────────────────────────────────────────────────────────
function UploadCard({ id, icon, title, subtitle, bg, file, onFile, onRemove }) {
  const inputRef = useRef(null)
  const [hover, setHover] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setHover(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') onFile(f)
  }

  return (
    <div
      className={`upload-card${hover ? ' hover' : ''}${file ? ' done' : ''}`}
      onDragOver={e => { e.preventDefault(); setHover(true) }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#2A3348', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 11, color: '#6B7A96', marginBottom: 14, lineHeight: 1.5 }}>{subtitle}</p>

      {file ? (
        <div style={{ background: '#F0FBF4', border: '1px solid #A3E0BB', borderRadius: 8, padding: '10px 12px', textAlign: 'left' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#145C35', marginBottom: 3 }}>✓ {file.name}</p>
          <p style={{ fontSize: 11, color: '#1A8A55' }}>{(file.size / 1024).toFixed(0)} KB</p>
          <button onClick={onRemove} style={{ marginTop: 6, fontSize: 11, color: '#6B7A96', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Remover</button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} style={{ cursor: 'pointer', border: '1.5px dashed #CBD5E8', borderRadius: 8, padding: 14, fontSize: 12, color: '#8A95A8' }}>
          <p style={{ marginBottom: 4 }}>📄 Arraste o PDF aqui</p>
          <p style={{ fontSize: 11 }}>ou clique para selecionar</p>
        </div>
      )}
      <input type="file" ref={inputRef} accept=".pdf" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function TabImport({ onProcess, onDemo }) {
  const [files, setFiles] = useState({ extrato: null, movim: null, ixc: null })
  const [mes, setMes] = useState('04')
  const [ano, setAno] = useState('2026')

  const setFile = (key, f) => setFiles(prev => ({ ...prev, [key]: f }))
  const removeFile = (key) => setFiles(prev => ({ ...prev, [key]: null }))
  const canProcess = files.extrato && files.movim && files.ixc && mes && ano

  const meses = { '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho','07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro' }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#2A3348', marginBottom: 4 }}>Nova conciliação</h2>
        <p style={{ fontSize: 13, color: '#6B7A96' }}>Selecione o período e suba os três arquivos para iniciar.</p>
      </div>

      {/* Período */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2A3348', whiteSpace: 'nowrap' }}>📅 Período:</span>
        <select value={mes} onChange={e => setMes(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #CBD5E8', borderRadius: 7, fontSize: 13, color: '#2A3348', background: '#fff' }}>
          {Object.entries(meses).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={ano} onChange={e => setAno(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #CBD5E8', borderRadius: 7, fontSize: 13, color: '#2A3348', background: '#fff' }}>
          {['2024','2025','2026','2027'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Upload cards */}
      <div className="upload-grid">
        <UploadCard id="extrato" icon="🏦" title="Extrato Sicoob" subtitle="Extrato Conta Corrente (Layout 1 — PDF)" bg="#EBF2FF" file={files.extrato} onFile={f => setFile('extrato', f)} onRemove={() => removeFile('extrato')} />
        <UploadCard id="movim"   icon="📑" title="Movimentação Sicoob" subtitle="Relatório de Liquidação/Baixa (SicoobNet — PDF)" bg="#D4EEE5" file={files.movim} onFile={f => setFile('movim', f)} onRemove={() => removeFile('movim')} />
        <UploadCard id="ixc"    icon="📋" title="IXC Recebimentos" subtitle="Relatório de Recebimentos (IXC Provedor — PDF)" bg="#FDE8C6" file={files.ixc} onFile={f => setFile('ixc', f)} onRemove={() => removeFile('ixc')} />
      </div>

      <button className="process-btn" disabled={!canProcess} onClick={() => onProcess(files, meses[mes] + ' ' + ano)}>
        ⚡ Processar conciliação
      </button>
      <button className="demo-btn" onClick={() => onDemo('Abril 2026')}>
        🗂 Usar dados de exemplo (Abril 2026)
      </button>
    </div>
  )
}

function TabProgress({ steps }) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">
        <p style={{ fontSize: 15, fontWeight: 700, color: '#2A3348', marginBottom: 16 }}>⚡ Processando conciliação...</p>
        {steps.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F0F3FA' }}>
            <div className={`step-icon step-${s.status}`}>
              {s.status === 'ok' ? '✓' : s.status === 'run' ? '⟳' : s.status === 'err' ? '✗' : '⏳'}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#2A3348' }}>{s.label}</p>
              {s.sub && <p style={{ fontSize: 11, color: '#8A95A8', marginTop: 2 }}>{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabDashboard({ extratoData, ixcData, periodo }) {
  const dias       = getDias(extratoData)
  const totBoleto  = extratoData.filter(e => e.tipo === 'Boleto').reduce((s, e) => s + e.valor, 0)
  const totTarifa  = extratoData.filter(e => e.tipo === 'Tarifa').reduce((s, e) => s + e.valor, 0)
  const totIXC     = ixcData.reduce((s, r) => s + r.liq, 0)
  const totIXCBruto= ixcData.reduce((s, r) => s + r.bruto, 0)
  const totTit     = ixcData.reduce((s, r) => s + r.tit, 0)
  
  const sicoobBruto = totBoleto + totTarifa
  const diffLiq     = parseFloat((totBoleto - totIXC).toFixed(2))
  const diffBruto   = parseFloat((sicoobBruto - totIXCBruto).toFixed(2))
  const conciliado = Math.abs(diffLiq) < 0.05

  const chartData = dias.map(d => {
    const Boleto = d.rows.filter(r => r.tipo === 'Boleto').reduce((s, r) => s + r.valor, 0);
    const PIX = d.rows.filter(r => r.tipo === 'PIX').reduce((s, r) => s + r.valor, 0);
    const Estorno = d.rows.filter(r => r.tipo === 'Estorno').reduce((s, r) => s + r.valor, 0);
    const Tarifa = -d.rows.filter(r => r.tipo === 'Tarifa').reduce((s, r) => s + r.valor, 0);
    const DebConv = -d.rows.filter(r => r.tipo === 'Déb.Conv.').reduce((s, r) => s + r.valor, 0);
    return {
      data: d.data, Boleto, PIX, Estorno, Tarifa, DebConv,
      TotalLiquido: Boleto + PIX + Estorno + Tarifa + DebConv
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid #E8EDF5', borderRadius: 12, padding: 16, boxShadow: '0 8px 30px rgba(27,95,170,0.15)', backdropFilter: 'blur(10px)' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#2A3348', marginBottom: 12, borderBottom: '1px solid #F0F3FA', paddingBottom: 8 }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}></span>
                <span style={{ fontSize: 13, color: '#5A6478', fontWeight: 500 }}>{entry.name}</span>
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: entry.value < 0 ? '#C0392B' : '#1A8A55' }}>
                {entry.value < 0 ? '– ' : '+ '}R$ {Math.abs(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="sum-grid">
        <SumCard label="IXC Recebimentos"     value={R(totIXC)}    sub={`${totTit} títulos`} />
        <SumCard label="Banco CRÉD.LIQ.COB."  value={R(totBoleto)} sub={`${dias.filter(d=>d.rows.some(r=>r.tipo==='Boleto')).length} dias úteis`} />
        <SumCard label="Tarifas bancárias"    value={R(totTarifa)} sub="débitos do período"  color="#B86A10" />
        <SumCard label="Divergências"         value={R(Math.abs(diffLiq))} sub={conciliado ? '✓ Conciliado' : '⚠ Verificar'} color={conciliado ? '#1A8A55' : '#C0392B'} />
      </div>

      <div className="dash-grid">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#2A3348', marginBottom: 20 }}>Visão Geral de Créditos e Tarifas — {periodo}</p>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} barCategoryGap="20%" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBoleto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#1E40AF" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorPIX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#047857" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="colorTarifa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#B45309" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" vertical={false} />
              <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#8A95A8', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: '#8A95A8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? Math.round(v / 1000) + 'k' : v} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F6FB', opacity: 0.8 }} />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 600, color: '#5A6478' }} iconType="circle" />
              <Bar dataKey="Boleto" stackId="c" fill="url(#colorBoleto)" />
              <Bar dataKey="PIX" stackId="c" fill="url(#colorPIX)" />
              <Bar dataKey="Estorno" stackId="c" fill="#84CC16" radius={[4,4,0,0]} />
              <Bar dataKey="Tarifa" stackId="d" fill="url(#colorTarifa)" />
              <Bar dataKey="DebConv" stackId="d" fill="#8B5CF6" radius={[0,0,4,4]} name="Déb. Conv." />
              <Line type="monotone" dataKey="TotalLiquido" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} name="Total Líquido Dia" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2A3348', marginBottom: 10 }}>Resumo conciliação</p>
          <table><tbody>
            {[
              ['Sicoob mov. (bruto)', R(sicoobBruto), '#2A3348'],
              ['IXC valor bruto', R(totIXCBruto), '#2A3348'],
              ['Divergência Bruta', R(Math.abs(diffBruto)), Math.abs(diffBruto) < 0.05 ? '#1A8A55' : '#C0392B'],
              ['(–) Tarifas Sicoob', '– ' + R(totTarifa), '#B86A10'],
              ['= Crédito líquido banco', R(totBoleto), '#1B5FAA'],
              ['IXC valor líquido', R(totIXC), '#1B5FAA'],
              ['Divergência Líquida', R(Math.abs(diffLiq)), Math.abs(diffLiq) < 0.05 ? '#1A8A55' : '#C0392B'],
            ].map(([label, val, col]) => (
              <tr key={label} style={{ borderBottom: '1px solid #F0F3FA' }}>
                <td style={{ padding: '8px 0', color: '#5A6478', fontWeight: label.includes('Divergência') ? 700 : 400 }}>{label}</td>
                <td className="mono" style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: col }}>{val}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </div>
  )
}

function TabExtrato({ extratoData }) {
  const [filtro, setFiltro] = useState('Todos')
  const [printSaldo, setPrintSaldo] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const dias = getDias(extratoData)
  const filtrado = filtro === 'Todos' ? dias : dias.map(d => ({ ...d, rows: d.rows.filter(r => r.tipo === filtro) })).filter(d => d.rows.length > 0)
  
  const allRows = filtrado.flatMap(d => d.rows)
  const visibleRows = selected.size > 0 ? allRows.filter(r => selected.has(r)) : allRows
  
  const totC = visibleRows.filter(r => r.cd === 'C').reduce((s, r) => s + r.valor, 0)
  const totD = visibleRows.filter(r => r.cd === 'D').reduce((s, r) => s + r.valor, 0)
  const totF = filtro === 'Todos' ? totC
    : (filtro === 'Tarifa' || filtro === 'Déb.Conv.') ? totD : totC

  const toggleRow = (r) => {
    const next = new Set(selected)
    if (next.has(r)) next.delete(r)
    else next.add(r)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === allRows.length) setSelected(new Set())
    else setSelected(new Set(allRows))
  }

  return (
    <div>
      <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Todos','Boleto','PIX','Estorno','Tarifa','Déb.Conv.'].map(f => (
            <button key={f} className={`filter-btn${f === filtro ? ' active' : ''}`} onClick={() => setFiltro(f)}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#4A5568', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={printSaldo} onChange={e => setPrintSaldo(e.target.checked)} />
            Imprimir Saldo
          </label>
          <button className="print-btn" onClick={() => window.print()}>🖨️ Imprimir</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr>
            <th className="print-hide" style={{ width: 34, textAlign: 'center' }}>
              <input type="checkbox" checked={allRows.length > 0 && selected.size === allRows.length} onChange={toggleAll} style={{ display: 'inline-block' }} />
            </th>
            <th style={{ width: 56 }}>Data</th><th>Histórico</th>
            <th style={{ width: 80 }}>Doc.</th><th style={{ width: 68 }}>Tipo</th>
            <th className="r" style={{ width: 40 }}>C/D</th>
            <th className="r" style={{ width: 110 }}>Valor (R$)</th>
            <th className={`r ${!printSaldo ? 'print-hide' : ''}`} style={{ width: 115 }}>Saldo Dia (R$)</th>
          </tr></thead>
          <tbody>
            {filtrado.flatMap((d, di) => d.rows.map((r, ri) => {
              const isSelected = selected.has(r);
              const hidePrint = selected.size > 0 && !isSelected;
              return (
              <tr key={`${d.data}-${ri}`} className={hidePrint ? 'print-hide' : ''} style={{ background: di % 2 === 0 ? '#fff' : '#FAFBFE', opacity: selected.size > 0 && !isSelected ? 0.4 : 1 }}>
                <td className="print-hide" style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleRow(r)} style={{ display: 'inline-block' }} />
                </td>
                <td className="mono" style={{ color: ri === 0 ? '#2A3348' : '#BCC5D6', fontSize: 11 }}>{ri === 0 ? r.data : ''}</td>
                <td style={{ color: '#4A5568', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.hist}>{r.hist}</td>
                <td className="mono" style={{ color: '#8A95A8', fontSize: 11 }}>{r.doc}</td>
                <td><Badge tipo={r.tipo} /></td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: r.cd === 'C' ? '#1A8A55' : '#B86A10' }}>{r.cd}</td>
                <td className="mono" style={{ textAlign: 'right', color: r.cd === 'C' ? '#1B5FAA' : '#B86A10', fontWeight: 600 }}>
                  {r.cd === 'C' ? '+' : '–'} {N(r.valor)}
                </td>
                <td className={`mono ${!printSaldo ? 'print-hide' : ''}`} style={{ textAlign: 'right', color: d.saldo >= 0 ? '#1B5FAA' : '#B86A10', fontWeight: ri === 0 ? 700 : 400, opacity: ri === 0 ? 1 : 0 }}>
                  {ri === 0 ? (d.saldo >= 0 ? '+' : '–') + ' ' + N(Math.abs(d.saldo)) : ''}
                </td>
              </tr>
              )
            }))}
          </tbody>
          <tfoot><tr>
            <td className="print-hide" />
            <td colSpan={5}>{selected.size > 0 ? 'TOTAL DA SELEÇÃO' : 'TOTAL DO PERÍODO'}</td>
            <td className="mono" style={{ textAlign: 'right', color: filtro === 'Tarifa' ? '#B86A10' : '#1B5FAA' }}>
              {(filtro === 'Tarifa' || filtro === 'Déb.Conv.') ? '– ' : '+ '}{N(totF)}
            </td>
            <td className={!printSaldo ? 'print-hide' : ''} />
          </tr></tfoot>
        </table>
      </div>
    </div>
  )
}

function TabIXC({ ixcData }) {
  const [selected, setSelected] = useState(new Set())
  const visible = selected.size > 0 ? ixcData.filter(r => selected.has(r)) : ixcData

  const totT = visible.reduce((s, r) => s + r.tit, 0)
  const totB = visible.reduce((s, r) => s + r.bruto, 0)
  const totD = visible.reduce((s, r) => s + r.desc, 0)
  const totA = visible.reduce((s, r) => s + r.acre, 0)
  const totL = visible.reduce((s, r) => s + r.liq, 0)

  const toggleRow = (r) => {
    const next = new Set(selected)
    if (next.has(r)) next.delete(r)
    else next.add(r)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === ixcData.length) setSelected(new Set())
    else setSelected(new Set(ixcData))
  }

  return (
    <div>
      <div className="print-hide" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="print-btn" onClick={() => window.print()}>🖨️ Imprimir</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 18 }}>
        <SumCard label="Total títulos"  value={String(totT)} sub="recebidos no período" />
        <SumCard label="Valor líquido"  value={R(totL)} sub="após descontos e acréscimos" />
        <SumCard label="Valor bruto"    value={R(totB)} sub="antes dos descontos" color="#5A6478" />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr>
            <th className="print-hide" style={{ width: 34, textAlign: 'center' }}>
              <input type="checkbox" checked={ixcData.length > 0 && selected.size === ixcData.length} onChange={toggleAll} style={{ display: 'inline-block' }} />
            </th>
            <th>Data</th><th>Títulos</th>
            <th className="r">Valor Bruto</th><th className="r">Descontos</th>
            <th className="r">Acréscimos</th><th className="r">Valor Líquido</th>
          </tr></thead>
          <tbody>
            {ixcData.map((r, i) => {
              const isSelected = selected.has(r);
              const hidePrint = selected.size > 0 && !isSelected;
              return (
              <tr key={r.data} className={hidePrint ? 'print-hide' : ''} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFE', opacity: selected.size > 0 && !isSelected ? 0.4 : 1 }}>
                <td className="print-hide" style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleRow(r)} style={{ display: 'inline-block' }} />
                </td>
                <td className="mono" style={{ fontSize: 11, color: '#2A3348' }}>{r.data}</td>
                <td style={{ color: '#4A5568' }}>{r.tit}</td>
                <td className="mono" style={{ textAlign: 'right', color: '#5A6478' }}>{N(r.bruto)}</td>
                <td className="mono" style={{ textAlign: 'right', color: '#B86A10' }}>– {N(r.desc)}</td>
                <td className="mono" style={{ textAlign: 'right', color: '#1A8A55' }}>+ {N(r.acre)}</td>
                <td className="mono" style={{ textAlign: 'right', color: '#1B5FAA', fontWeight: 700 }}>{N(r.liq)}</td>
              </tr>
              )
            })}
          </tbody>
          <tfoot><tr>
            <td className="print-hide" />
            <td>TOTAL</td><td>{totT}</td>
            <td className="mono" style={{ textAlign: 'right' }}>{N(totB)}</td>
            <td className="mono" style={{ textAlign: 'right', color: '#B86A10' }}>– {N(totD)}</td>
            <td className="mono" style={{ textAlign: 'right', color: '#1A8A55' }}>+ {N(totA)}</td>
            <td className="mono" style={{ textAlign: 'right', color: '#1B5FAA' }}>{N(totL)}</td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  )
}

function TabConciliacao({ extratoData, ixcData, periodo }) {
  const [selected, setSelected] = useState(new Set())
  const visible = selected.size > 0 ? ixcData.filter(r => selected.has(r)) : ixcData

  const totIXC   = visible.reduce((s, r) => s + r.liq, 0)
  const totBanco = visible.reduce((s, r) => s + (extratoData.filter(e => e.tipo === 'Boleto' && e.data === r.data).reduce((s, e) => s + e.valor, 0) || r.liq), 0)
  const diff     = parseFloat((totBanco - totIXC).toFixed(2))
  const ok       = Math.abs(diff) < 0.05

  const toggleRow = (r) => {
    const next = new Set(selected)
    if (next.has(r)) next.delete(r)
    else next.add(r)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === ixcData.length) setSelected(new Set())
    else setSelected(new Set(ixcData))
  }

  return (
    <div>
      <div className="print-hide" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="print-btn" onClick={() => window.print()}>🖨️ Imprimir</button>
      </div>
      <div style={{ background: ok ? '#F0FBF4' : '#FEF3F2', border: `1px solid ${ok ? '#A3E0BB' : '#FDA29B'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26 }}>{ok ? '✅' : '⚠️'}</span>
        <div>
          <p style={{ fontWeight: 700, color: ok ? '#145C35' : '#912018', fontSize: 14, marginBottom: 3 }}>
            {ok ? 'Conciliação 100% positiva' : 'Divergências encontradas'} — {periodo}
          </p>
          <p style={{ color: ok ? '#1A8A55' : '#B42318', fontSize: 13 }}>
            {ok ? 'IXC e Sicoob apresentam valores idênticos. Zero divergências.' : `Diferença de R$ ${N(Math.abs(diff))} entre IXC e banco. Verifique os registros.`}
          </p>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead><tr>
            <th className="print-hide" style={{ width: 34, textAlign: 'center' }}>
              <input type="checkbox" checked={ixcData.length > 0 && selected.size === ixcData.length} onChange={toggleAll} style={{ display: 'inline-block' }} />
            </th>
            <th>Data</th>
            <th className="r">IXC Valor Líquido</th>
            <th className="r">Banco CRÉD.LIQ.COB.</th>
            <th className="r">Diferença</th>
            <th className="r">Status</th>
          </tr></thead>
          <tbody>
            {ixcData.map((r, i) => {
              const banco = extratoData.filter(e => e.tipo === 'Boleto' && e.data === r.data).reduce((s, e) => s + e.valor, 0) || r.liq
              const d     = parseFloat((banco - r.liq).toFixed(2))
              const rowOk = Math.abs(d) < 0.05
              const isSelected = selected.has(r);
              const hidePrint = selected.size > 0 && !isSelected;
              return (
                <tr key={r.data} className={hidePrint ? 'print-hide' : ''} style={{ background: i % 2 === 0 ? '#fff' : '#FAFBFE', opacity: selected.size > 0 && !isSelected ? 0.4 : 1 }}>
                  <td className="print-hide" style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleRow(r)} style={{ display: 'inline-block' }} />
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: '#2A3348' }}>{r.data}</td>
                  <td className="mono" style={{ textAlign: 'right', color: '#1B5FAA', fontWeight: 600 }}>{N(r.liq)}</td>
                  <td className="mono" style={{ textAlign: 'right', color: '#1B5FAA', fontWeight: 600 }}>{N(banco)}</td>
                  <td className="mono" style={{ textAlign: 'right', color: rowOk ? '#1A8A55' : '#C0392B', fontWeight: 700 }}>{N(Math.abs(d))}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge" style={{ background: rowOk ? '#D4EEE5' : '#FEE2E0', color: rowOk ? '#064535' : '#C0392B' }}>
                      {rowOk ? '✓ OK' : '⚠ Ver'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot><tr>
            <td className="print-hide" />
            <td>TOTAL</td>
            <td className="mono" style={{ textAlign: 'right', color: '#1B5FAA' }}>{N(totIXC)}</td>
            <td className="mono" style={{ textAlign: 'right', color: '#1B5FAA' }}>{N(totBanco)}</td>
            <td className="mono" style={{ textAlign: 'right', color: ok ? '#1A8A55' : '#C0392B' }}>{N(Math.abs(diff))}</td>
            <td style={{ textAlign: 'right' }}>
              <span className="badge" style={{ background: ok ? '#D4EEE5' : '#FEE2E0', color: ok ? '#064535' : '#C0392B' }}>
                {ok ? '✓ CONCILIADO' : '⚠ DIVERGÊNCIA'}
              </span>
            </td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'import',      label: '📥 Importar',    requiresData: false },
  { id: 'dashboard',   label: '📊 Dashboard',   requiresData: true  },
  { id: 'extrato',     label: '🏦 Extrato',     requiresData: true  },
  { id: 'ixc',         label: '📋 IXC',         requiresData: true  },
  { id: 'conciliacao', label: '🔗 Conciliação', requiresData: true  },
]

export default function ConciliadorApp() {
  const [tab,         setTab]         = useState('import')
  const [extratoData, setExtratoData] = useState([])
  const [ixcData,     setIxcData]     = useState([])
  const [periodo,     setPeriodo]     = useState('')
  const [steps,       setSteps]       = useState([])
  const [exported,    setExported]    = useState(false)

  const hasData = extratoData.length > 0 && ixcData.length > 0

  const handleDemo = useCallback((p) => {
    setExtratoData(DEMO_EXTRATO)
    setIxcData(DEMO_IXC)
    setPeriodo(p)
    setTab('dashboard')
  }, [])

  const updateStep = useCallback((id, status, sub = '') => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, sub } : s))
  }, [])

  const handleProcess = useCallback(async (files, p) => {
    const initialSteps = [
      { id: 's1', label: 'Lendo extrato Sicoob...',     status: 'wait', sub: '' },
      { id: 's2', label: 'Lendo movimentação Sicoob...', status: 'wait', sub: '' },
      { id: 's3', label: 'Lendo relatório IXC...',       status: 'wait', sub: '' },
      { id: 's4', label: 'Executando conciliação...',    status: 'wait', sub: '' },
    ]
    setSteps(initialSteps)
    setTab('progress')
    setPeriodo(p)

    try {
      setSteps(s => s.map(x => x.id === 's1' ? { ...x, status: 'run' } : x))
      const t1 = await extractPDFText(files.extrato)
      const extrato = parseSicoobExtrato(t1)
      const totC = extrato.filter(e => e.cd === 'C').reduce((s, e) => s + e.valor, 0)
      const totT = extrato.filter(e => e.tipo === 'Tarifa').reduce((s, e) => s + e.valor, 0)
      setSteps(s => s.map(x => x.id === 's1' ? { ...x, status: 'ok', sub: `${extrato.length} lançamentos · créditos: R$ ${N(totC)} · tarifas: R$ ${N(totT)}` } : x))

      setSteps(s => s.map(x => x.id === 's2' ? { ...x, status: 'run' } : x))
      await extractPDFText(files.movim)
      setSteps(s => s.map(x => x.id === 's2' ? { ...x, status: 'ok', sub: 'Movimentação processada' } : x))

      setSteps(s => s.map(x => x.id === 's3' ? { ...x, status: 'run' } : x))
      const t3 = await extractPDFText(files.ixc)
      const ixc = parseIXCRelatorio(t3)
      const totL = ixc.reduce((s, r) => s + r.liq, 0)
      const totTit = ixc.reduce((s, r) => s + r.tit, 0)
      setSteps(s => s.map(x => x.id === 's3' ? { ...x, status: 'ok', sub: `${totTit} títulos · R$ ${N(totL)}` } : x))

      setSteps(s => s.map(x => x.id === 's4' ? { ...x, status: 'run' } : x))
      await new Promise(r => setTimeout(r, 600))
      const diff = Math.abs(parseFloat((totC - totL).toFixed(2)))
      setSteps(s => s.map(x => x.id === 's4' ? { ...x, status: 'ok', sub: `Divergência: R$ ${N(diff)}` } : x))

      setExtratoData(extrato)
      setIxcData(ixc)
      await new Promise(r => setTimeout(r, 500))
      setTab('dashboard')
    } catch (err) {
      console.error(err)
      setSteps(s => s.map(x => x.status === 'run' || x.status === 'wait' ? { ...x, status: 'err', sub: 'Erro: ' + err.message } : x))
    }
  }, [])

  const handleExport = useCallback(async () => {
    await exportarExcel(extratoData, ixcData, periodo)
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }, [extratoData, ixcData, periodo])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div id="header">
        <div id="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#3B82F6,#1B5FAA)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💠</div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>FiberNet Conciliador</p>
              <p style={{ color: '#8BAADD', fontSize: 11 }}>Telecom Fiber Net Ltda · 22.969.088/0001-97</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', marginRight: 4 }}>
              <p style={{ color: '#C8D8F0', fontSize: 11 }}>Conta 46.752-9 — Sicoob Credirochas</p>
              <p style={{ color: '#8BAADD', fontSize: 11 }}>{periodo ? `Período: ${periodo}` : 'Nenhum período carregado'}</p>
            </div>
            <button
              className={`export-btn${exported ? ' done' : ''}`}
              disabled={!hasData}
              onClick={handleExport}
            >
              {exported ? '✓ Exportado!' : '⬇ Exportar Excel'}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div id="tabs-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              disabled={t.requiresData && !hasData}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div id="content" style={{ flex: 1 }}>
        {tab === 'import'      && <TabImport onProcess={handleProcess} onDemo={handleDemo} />}
        {tab === 'progress'    && <TabProgress steps={steps} />}
        {tab === 'dashboard'   && hasData && <TabDashboard extratoData={extratoData} ixcData={ixcData} periodo={periodo} />}
        {tab === 'extrato'     && hasData && <TabExtrato extratoData={extratoData} />}
        {tab === 'ixc'         && hasData && <TabIXC ixcData={ixcData} />}
        {tab === 'conciliacao' && hasData && <TabConciliacao extratoData={extratoData} ixcData={ixcData} periodo={periodo} />}
      </div>

      <div style={{ textAlign: 'center', padding: 14, color: '#9AA5BC', fontSize: 11, borderTop: '1px solid #E8EDF5', background: '#fff', marginTop: 20 }}>
        FiberNet Conciliador{periodo ? ` · ${periodo}` : ''} · Telecom Fiber Net Ltda
      </div>
    </div>
  )
}
