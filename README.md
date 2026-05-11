# FiberNet Conciliador

Conciliação financeira IXC × Sicoob — Telecom Fiber Net Ltda

## Deploy na Vercel

### Opção 1 — Via CLI (recomendado)
```bash
npm install
vercel
```

### Opção 2 — Via GitHub
1. Suba o projeto para um repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) → Import Project
3. Selecione o repositório → Deploy

### Opção 3 — Via Vercel MCP (Claude)
Com o MCP da Vercel conectado no Claude, basta pedir:
> "Deploy o projeto fibernet-conciliador na Vercel"

## Stack
- Next.js 15 (App Router)
- React 19
- recharts (gráficos)
- pdfjs-dist (parse de PDF)
- xlsx (exportação Excel)

## Funcionalidades
- Upload de PDFs: Extrato Sicoob + Movimentação + IXC Recebimentos
- Parse automático dos três documentos
- Dashboard com gráfico diário de créditos e tarifas
- Tabela de extrato com filtro por tipo (Boleto, PIX, Estorno, Tarifa)
- Tabela IXC com valores brutos, descontos, acréscimos e líquido
- Tela de conciliação com status por dia
- Exportação Excel com 5 abas: Resumo, Extrato, Tarifas por Dia, IXC, Conciliação
- Dados de exemplo (Abril 2026) para demo sem upload
