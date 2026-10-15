/**
 * TELA: TelaRelatorios
 * Interface visual do Balanço Financeiro (DRE) e registro de perdas.
 */
export class TelaRelatorios {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, balanco, produtos = []) {
        container.innerHTML = `
            <!-- Painel de Lucro Líquido Real -->
            <div class="cartao" style="background: linear-gradient(135deg, var(--cor-primaria), #1a0c07); color: #FFF; text-align: center; padding: 24px 16px;">
                <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--cor-secundaria); font-weight: 700; letter-spacing: 1px;">
                    Lucro Líquido Real (No Bolso)
                </div>
                <div style="font-size: 2.2rem; font-weight: 900; margin: 8px 0; color: #FFF;">
                    ${this.formatarMoeda(balanco.lucroLiquidoReal)}
                </div>
                <div style="font-size: 0.85rem; opacity: 0.85;">
                    Margem Líquida: <strong>${balanco.margemLiquidaPercentual}%</strong> | ${balanco.totalVendasRealizadas} vendas feitas
                </div>
            </div>

            <!-- Grade de Métricas da DRE -->
            <div class="grade-metricas">
                <div class="card-metrica">
                    <div class="metrica-rotulo">Receita Bruta Total</div>
                    <div class="metrica-valor positivo">${this.formatarMoeda(balanco.receitaBruta)}</div>
                </div>
                <div class="card-metrica">
                    <div class="metrica-rotulo">Custo de Compra (CMV)</div>
                    <div class="metrica-valor">${this.formatarMoeda(balanco.custoMercadoriasVendidas)}</div>
                </div>
                <div class="card-metrica">
                    <div class="metrica-rotulo">Prejuízos (Perdas)</div>
                    <div class="metrica-valor negativo">${this.formatarMoeda(balanco.prejuizoTotalPerdas)}</div>
                </div>
                <div class="card-metrica">
                    <div class="metrica-rotulo">Capital em Estoque</div>
                    <div class="metrica-valor">${this.formatarMoeda(balanco.capitalEstoqueParado)}</div>
                </div>
            </div>

            <!-- Botão para Baixar Perda -->
            <button id="btn-abrir-modal-perda" class="botao botao-perigo botao-bloco" style="margin-bottom: 16px;">
                ⚠️ Registrar Perda (Vencido, Derretido ou Sumido)
            </button>

            <!-- Detalhamento de Perdas Operacionais -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Onde foi o Prejuízo?</span>
                </div>
                <div class="lista-linhas">
                    <div class="item-linha">
                        <span class="item-info-principal">🍫 Chocolates Vencidos</span>
                        <span class="etiqueta etiqueta-perigo">${this.formatarMoeda(balanco.perdasPorMotivo.VENCIMENTO)}</span>
                    </div>
                    <div class="item-linha">
                        <span class="item-info-principal">☀️ Derretidos / Amassados</span>
                        <span class="etiqueta etiqueta-alerta">${this.formatarMoeda(balanco.perdasPorMotivo.AVARIA)}</span>
                    </div>
                    <div class="item-linha">
                        <span class="item-info-principal">🕵️ Desvios (Pegaram e não anotaram)</span>
                        <span class="etiqueta etiqueta-perigo">${this.formatarMoeda(balanco.perdasPorMotivo.DESVIO)}</span>
                    </div>
                    <div class="item-linha">
                        <span class="item-info-principal">😋 Consumo Próprio / Degustação</span>
                        <span class="etiqueta" style="background:#EEE; color:#555;">${this.formatarMoeda(balanco.perdasPorMotivo.CONSUMO_PROPRIO)}</span>
                    </div>
                </div>
            </div>

            <!-- MODAL: REGISTRAR PERDA OPERACIONAL -->
            <div id="modal-perda" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3>Lançar Baixa por Perda</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-perda">&times;</button>
                    </div>
                    <form id="form-registro-perda">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Qual chocolate estragou/sumiu?</label>
                            <select id="campo-perda-produto" class="campo-selecao" required>
                                <option value="">-- Selecione o produto --</option>
                                ${produtos.filter(p => p.obterEstoqueTotal() > 0).map(p => `
                                    <option value="${p.id}">${p.nome} (Estoque: ${p.obterEstoqueTotal()} un)</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Quantidade Perdida</label>
                            <input type="number" id="campo-perda-qtd" class="campo-entrada" value="1" min="1" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Motivo da Perda</label>
                            <select id="campo-perda-motivo" class="campo-selecao" required>
                                <option value="VENCIMENTO">Venceu a data de validade</option>
                                <option value="AVARIA">Derreteu no calor / Danificado</option>
                                <option value="DESVIO">Sumiu da mesa (não pagaram)</option>
                                <option value="CONSUMO_PROPRIO">Consumo próprio / Cortesia</option>
                            </select>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Observação</label>
                            <input type="text" id="campo-perda-obs" class="campo-entrada" placeholder="Ex: Deixaram no sol perto da janela">
                        </div>
                        <button type="submit" class="botao botao-perigo botao-bloco">Confirmar Baixa e Prejuízo</button>
                    </form>
                </div>
            </div>
        `;
    }
}