export class TelaHome {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static obterSaudacao() {
        const hora = new Date().getHours();
        if (hora < 12) return "Bom dia";
        if (hora < 18) return "Boa tarde";
        return "Boa noite";
    }

    static obterDataPorExtenso() {
        const d = new Date();
        return d.toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    }

    static renderizar(container, dados) {
        const dataFormatada = this.obterDataPorExtenso();
        const saudacao = this.obterSaudacao();

        container.innerHTML = `
            <!-- 1. HERO CARD: BOAS-VINDAS & SALDOS PRINCIPAIS -->
            <div class="cartao hero-home">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <div style="font-size: 0.75rem; text-transform: capitalize; color: var(--cor-secundaria); font-weight: 600;">
                            ${dataFormatada}
                        </div>
                        <h2 style="font-size: 1.35rem; font-weight: 800; color: #FFF; margin-top: 2px;">
                            ${saudacao}! 🍫
                        </h2>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 4px 10px; font-size: 0.72rem; color: #FFF;">
                        Cacau Gestão
                    </div>
                </div>

                <!-- Pílulas Financeiras -->
                <div style="display: flex; gap: 8px;">
                    <div class="pilula-hero">
                        <span class="pilula-hero-rotulo">⚡ Pix Hoje</span>
                        <div class="pilula-hero-valor positivo">${this.formatarMoeda(dados.pixHoje)}</div>
                    </div>
                    <div class="pilula-hero">
                        <span class="pilula-hero-rotulo">⏳ Fiado Pendente</span>
                        <div class="pilula-hero-valor alerta">${this.formatarMoeda(dados.totalFiado)}</div>
                    </div>
                </div>
            </div>

            <!-- 2. ATALHOS RÁPIDOS DE ALTA FREQUÊNCIA (4 CARDS) -->
            <div class="cartao-cabecalho" style="margin: 14px 4px 8px 4px;">
                <span class="cartao-titulo" style="font-size: 0.9rem;">⚡ Ações Rápidas</span>
            </div>

            <div class="grade-atalhos-home">
                <button class="btn-atalho-home" data-ir-aba="aba-vendas">
                    <div class="icone-atalho-circulo" style="background: #E8F5E9; color: #2E7D32;">🛒</div>
                    <span class="titulo-atalho">Nova Venda</span>
                    <span class="subtitulo-atalho">Lançar no caixa</span>
                </button>

                <button class="btn-atalho-home" data-ir-aba="aba-historico">
                    <div class="icone-atalho-circulo" style="background: #FFF3E0; color: #E65100;">📜</div>
                    <span class="titulo-atalho">Histórico</span>
                    <span class="subtitulo-atalho">Consultar / Corrigir</span>
                </button>

                <button class="btn-atalho-home" data-ir-aba="aba-estoque">
                    <div class="icone-atalho-circulo" style="background: #E3F2FD; color: #1565C0;">📦</div>
                    <span class="titulo-atalho">Estoque</span>
                    <span class="subtitulo-atalho">Entrada de lotes</span>
                </button>

                <button class="btn-atalho-home" data-ir-aba="aba-cobranca">
                    <div class="icone-atalho-circulo" style="background: #F3E5F5; color: #7B1FA2;">💬</div>
                    <span class="titulo-atalho">Cobrança</span>
                    <span class="subtitulo-atalho">Teams & Whats</span>
                </button>
            </div>

            <!-- 3. PULSO DA MESA & ALERTAS DE ESTOQUE -->
            <div class="cartao" style="margin-top: 14px; padding: 14px;">
                <div class="cartao-cabecalho" style="margin-bottom: 8px;">
                    <span class="cartao-titulo" style="font-size: 0.9rem;">📦 Pulso da Mesa</span>
                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--cor-primaria);">
                        ${dados.totalItensEstoque} chocolates disponíveis
                    </span>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 6px;">
                    <div style="flex: 1; background: #FAF7F5; padding: 10px; border-radius: 8px; border: 1px solid var(--cor-borda);">
                        <div style="font-size: 0.7rem; color: var(--cor-texto-suave);">Reposição Urgente</div>
                        <div style="font-size: 1.15rem; font-weight: 800; color: ${dados.itensReposicao > 0 ? 'var(--cor-perigo)' : 'var(--cor-sucesso)'}; margin-top: 2px;">
                            ${dados.itensReposicao} produto(s)
                        </div>
                    </div>
                    <div style="flex: 1; background: #FAF7F5; padding: 10px; border-radius: 8px; border: 1px solid var(--cor-borda);">
                        <div style="font-size: 0.7rem; color: var(--cor-texto-suave);">Perto de Vencer</div>
                        <div style="font-size: 1.15rem; font-weight: 800; color: ${dados.lotesVencendo > 0 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)'}; margin-top: 2px;">
                            ${dados.lotesVencendo} lote(s)
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. MAIS VENDIDOS DA SEMANA -->
            <div class="cartao" style="margin-top: 12px; padding: 14px;">
                <div class="cartao-cabecalho" style="margin-bottom: 8px;">
                    <span class="cartao-titulo" style="font-size: 0.9rem;">🏆 Favoritos da Equipe</span>
                    <button class="botao-aba" data-ir-aba="aba-gestao" style="height: auto; font-size: 0.75rem; color: var(--cor-secundaria); font-weight: bold; background: none; border: none; cursor: pointer;">
                        Ver Gestão ➔
                    </button>
                </div>

                <div class="lista-linhas">
                    ${dados.topProdutos.length === 0 ? `
                        <p style="font-size: 0.8rem; color: var(--cor-texto-suave); text-align: center; padding: 10px 0;">Nenhuma venda registrada ainda.</p>
                    ` : dados.topProdutos.map((p, idx) => `
                        <div class="item-ranking" style="padding: 6px 0;">
                            <div class="badge-posicao ${idx === 0 ? 'ouro' : idx === 1 ? 'prata' : 'bronze'}" style="width: 26px; height: 26px; font-size: 0.75rem;">
                                ${idx + 1}º
                            </div>
                            <div style="flex: 1;">
                                <div class="item-info-principal" style="font-size: 0.88rem;">${p.nome}</div>
                                <div class="item-info-secundaria">${p.quantidade} unidades vendidas</div>
                            </div>
                            <div style="font-weight: 700; font-size: 0.85rem; color: var(--cor-primaria);">
                                ${this.formatarMoeda(p.faturamento)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
