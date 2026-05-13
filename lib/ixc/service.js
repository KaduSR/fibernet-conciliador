'use strict'

const API_BASE = process.env.IXC_API_URL || 'https://api.ixc.provedor.com.br'
const API_TOKEN = process.env.IXC_API_TOKEN

export class IXCService {
  constructor(baseUrl = API_BASE, token = API_TOKEN) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    }

    const response = await fetch(url, { ...options, headers })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `IXC API Error: ${response.status}`)
    }

    return response.json()
  }

  async getRecebimentos({ mes, ano, planoConta }) {
    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`
    const dataFim = new Date(ano, parseInt(mes), 0).toISOString().split('T')[0]

    return this.request('/v1/financeiro/recebimentos', {
      method: 'POST',
      body: JSON.stringify({
        data_inicio: dataInicio,
        data_fim: dataFim,
        plano_conta: planoConta,
        tipo: 'recebimento',
      }),
    })
  }

  async getFaturas({ mes, ano, status = ['pago', 'parcial'] }) {
    const dataInicio = `${ano}-${mes.padStart(2, '0')}-01`
    const dataFim = new Date(ano, parseInt(mes), 0).toISOString().split('T')[0]

    return this.request('/v1/faturas', {
      method: 'POST',
      body: JSON.stringify({
        data_inicio: dataInicio,
        data_fim: dataFim,
        status,
      }),
    })
  }

  async getContratos({ ativo = true }) {
    return this.request('/v1/contratos', {
      method: 'POST',
      body: JSON.stringify({ ativo }),
    })
  }

  parseRecebimentos(data) {
    if (!data || !Array.isArray(data)) return { daily: [], records: [] }

    const dailyMap = {}
    const records = []

    data.forEach((item) => {
      const dataRec = item.data_pagamento?.substring(0, 5) || item.data?.substring(0, 5)
      const dataVenc = item.data_vencimento?.substring(0, 5) || ''

      const rec = {
        dataVenc,
        dataRec,
        cliente: item.cliente || item.nome_cliente || 'Não identificado',
        baixa: parseFloat(item.valor_pago || item.valor || 0),
        acre: parseFloat(item.acrescimo || 0),
        desc: parseFloat(item.desconto || 0),
        liquido: parseFloat(item.valor_liquido || item.valor_pago || 0),
      }

      records.push(rec)

      if (!dailyMap[dataRec]) {
        dailyMap[dataRec] = { data: dataRec, tit: 0, bruto: 0, desc: 0, acre: 0, liq: 0 }
      }

      dailyMap[dataRec].tit++
      dailyMap[dataRec].bruto += rec.baixa
      dailyMap[dataRec].desc += rec.desc
      dailyMap[dataRec].acre += rec.acre
      dailyMap[dataRec].liq += rec.liq
    })

    const daily = Object.values(dailyMap).sort((a, b) => {
      const [da, ma] = a.data.split('/').map(Number)
      const [db, mb] = b.data.split('/').map(Number)
      return ma !== mb ? ma - mb : da - db
    })

    return { daily, records }
  }
}

export function parseIXCJson(content) {
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export function parseIXCCsv(content) {
  try {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return { success: false, error: 'CSV vazio ou inválido' }

    const headers = lines[0].split(';').map((h) => h.trim().toLowerCase())
    const records = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';')
      const record = {}

      headers.forEach((header, index) => {
        let value = values[index]?.trim() || ''

        if (['valor', 'baixa', 'liquido', 'desconto', 'acrescimo'].includes(header)) {
          value = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
        }

        record[header] = value
      })

      records.push(record)
    }

    return { success: true, data: records }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export function normalizeIXCData(data) {
  if (!Array.isArray(data)) return []

  return data.map((item) => {
    const dataRec = item.data_rec || item.data_pagamento || item.data_recebimento || ''
    const dataVenc = item.data_venc || item.data_vencimento || ''

    return {
      dataVenc: dataVenc.substring(0, 5),
      dataRec: dataRec.substring(0, 5),
      cliente: item.cliente || item.nome_cliente || item.razao_social || 'Não identificado',
      baixa: parseFloat(item.baixa || item.valor_pago || item.valor || 0),
      acre: parseFloat(item.acre || item.acrescimo || 0),
      desc: parseFloat(item.desc || item.desconto || 0),
      liquido: parseFloat(item.liquido || item.valor_liquido || 0),
    }
  })
}

export function groupIXCByDate(items) {
  const dailyMap = {}

  items.forEach((item) => {
    const key = item.dataRec
    if (!dailyMap[key]) {
      dailyMap[key] = { data: key, tit: 0, bruto: 0, desc: 0, acre: 0, liq: 0 }
    }

    dailyMap[key].tit++
    dailyMap[key].bruto += item.baixa
    dailyMap[key].desc += item.desc
    dailyMap[key].acre += item.acre
    dailyMap[key].liq += item.liquido
  })

  return Object.values(dailyMap).sort((a, b) => {
    const [da, ma] = a.data.split('/').map(Number)
    const [db, mb] = b.data.split('/').map(Number)
    return ma !== mb ? ma - mb : da - db
  })
}

export default IXCService