-- FiberNet Conciliador - Schema Supabase
-- Tabelas para conciliação financeira IXC × Sicoob

-- =============================================
-- TABELAS BASE
-- =============================================

-- Empresas/clientes
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    conta_banco VARCHAR(100),
    agencia VARCHAR(20),
    banco VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- Usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(255),
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- =============================================
-- TABELAS DE CONCILIAÇÃO
-- =============================================

-- Header da conciliação
CREATE TABLE conciliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    periodo VARCHAR(50) NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2030),
    
    -- Totais calculados
    tot_ixc_liquido DECIMAL(15,2) DEFAULT 0,
    tot_banco_boleto DECIMAL(15,2) DEFAULT 0,
    tot_banco_pix DECIMAL(15,2) DEFAULT 0,
    tot_banco_estorno DECIMAL(15,2) DEFAULT 0,
    tot_tarifas DECIMAL(15,2) DEFAULT 0,
    tot_deb_conv DECIMAL(15,2) DEFAULT 0,
    tot_debito DECIMAL(15,2) DEFAULT 0,
    diferenca DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente',
    -- pendente, processando, conciliado, divergencia
    
    observacoes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    UNIQUE(empresa_id, mes, ano)
);

-- Extrato Sicoob - linhas do extrato
CREATE TABLE conciliacao_extratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacao_id UUID NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
    
    data VARCHAR(10),
    historico TEXT,
    documento VARCHAR(50),
    tipo VARCHAR(30),
    -- Boleto, PIX, Estorno, Tarifa, Déb.Conv., Débito
    
    tipo_operacao VARCHAR(1),
    -- C = Crédito, D = Débito
    
    valor DECIMAL(15,2),
    contraparte VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimentação Sicoob - tipos de liquidação
CREATE TABLE conciliacao_movim_tipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacao_id UUID NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
    
    tipo_codigo VARCHAR(10),
    -- 58 = Compensação, 68 = Déb. Conta, 82 = Baixa Cedente, 212 = PIX, 215 = Intercredis
    
    total DECIMAL(15,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimentação Sicoob - registros individuais
CREATE TABLE conciliacao_movim_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacao_id UUID NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
    
    nosso_numero VARCHAR(30),
    seu_numero VARCHAR(30),
    sacado VARCHAR(255),
    data_venc VARCHAR(10),
    data_liq VARCHAR(10),
    val_original DECIMAL(15,2),
    val_cobrado DECIMAL(15,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IXC Recebimentos - resumo diário
CREATE TABLE conciliacao_ixc_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacao_id UUID NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
    
    data VARCHAR(10),
    titulos INTEGER DEFAULT 0,
    valor_bruto DECIMAL(15,2) DEFAULT 0,
    descuentos DECIMAL(15,2) DEFAULT 0,
    acrescimos DECIMAL(15,2) DEFAULT 0,
    valor_liquido DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IXC Recebimentos - registros individuais
CREATE TABLE conciliacao_ixc_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacao_id UUID NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
    
    data_venc VARCHAR(10),
    data_rec VARCHAR(10),
    cliente VARCHAR(255),
    baixa DECIMAL(15,2),
    acrescimo DECIMAL(15,2),
    desconto DECIMAL(15,2),
    liquido DECIMAL(15,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONCILIAÇÃO DIÁRIA (COMPARAÇÃO)
-- =============================================

CREATE TABLE conciliacao_diaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacao_id UUID NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
    
    data VARCHAR(10),
    banco_valor DECIMAL(15,2) DEFAULT 0,
    ixc_valor DECIMAL(15,2) DEFAULT 0,
    diferenca DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendente',
    -- conciliado, divergencia
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_conciliacoes_empresa_periodo ON conciliacoes(empresa_id, mes, ano);
CREATE INDEX idx_conciliacoes_status ON conciliacoes(status);
CREATE INDEX idx_extratos_conciliacao ON conciliacao_extratos(conciliacao_id);
CREATE INDEX idx_ixc_diario_conciliacao ON conciliacao_ixc_diario(conciliacao_id);
CREATE INDEX idx_conciliacao_diaria_conciliacao ON conciliacao_diaria(conciliacao_id);

-- =============================================
-- POLÍTICAS RLS (SEGURANÇA)
-- =============================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacao_extratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacao_movim_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacao_movim_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacao_ixc_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacao_ixc_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacao_diaria ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
CREATE POLICY "Usuários podem ver suas empresas" ON empresas
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem ver suas conciliações" ON conciliacoes
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem ver extratos" ON conciliacao_extratos
    FOR SELECT USING (true);

-- =============================================
-- FUNÇÕES ÚTEIS
-- =============================================

-- Atualizar timestamp automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conciliacoes_updated_at
    BEFORE UPDATE ON conciliacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir empresa padrão FiberNet
INSERT INTO empresas (nome, cnpj, conta_banco, agencia, banco)
VALUES ('Telecom Fiber Net Ltda', '22.969.088/0001-97', '46.752-9', '3085', 'Sicoob Credirochas')
ON CONFLICT DO NOTHING;

-- Inserir usuário admin padrão (alterar email depois)
-- INSERT INTO usuarios (email, nome, role)
-- VALUES ('admin@fibernet.com.br', 'Administrador', 'admin');