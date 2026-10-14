/**
 * TELA: TelaEstoque
 * Responsável por renderizar o catálogo de produtos, lotes e modais de entrada.
 */
export class TelaEstoque {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, produtos = []) {
        // Cálculos para as métricas rápidas
        let totalUnidades = 0;
        let capitalInvestido = 0;
        let alertasReposicao = 0;
        let alertasVencimento = 0;

        produtos.forEach(p => {
            const estoque = p.obterEstoqueTotal();
            totalUnidades += estoque;
            capitalInvestido += (estoque * p.calcularCustoMedioAtual());

            if (p.precisaDeReposicao()) alertasReposicao++;

            p.lotes.forEach(l => {
                if (!l.estaEsgotado() && l.estaProximoDoVencimento(15)) {
                    alertasVencimento++;
                }
            });
        });

        container.innerHTML = `
            <!-- Painel de Métricas -->
            <div class="grade-metricas">
                <div class="card-metrica">
                    <div class="metrica-rotulo">Itens em Estoque</div>
                    <div class="metrica-valor">${totalUnidades} un</div>
                </div>
                <div class="card-metrica">
                    <div class="metrica-rotulo">Capital Investido</div>
                    <div class="metrica-valor">${this.formatarMoeda(capitalInvestido)}</div>
                </div>
                <div class="card-metrica">
                    <div class="metrica-rotulo">Reposição Urgente</div>
                    <div class="metrica-valor ${alertasReposicao > 0 ? 'alerta' : ''}">${alertasReposicao} produtos</div>
                </div>
                <div class="card-metrica">
                    <div class="metrica-rotulo">Perto de Vencer</div>
                    <div class="metrica-valor ${alertasVencimento > 0 ? 'negativo' : ''}">${alertasVencimento} lotes</div>
                </div>
            </div>

            <!-- Botões de Ação Rápida -->
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button id="btn-abrir-modal-compra" class="botao botao-secundario botao-bloco">
                    + Registrar Compra
                </button>
                <button id="btn-abrir-modal-produto" class="botao botao-primario botao-bloco">
                    + Novo Produto
                </button>
            </div>

            <!-- Lista de Produtos Cadastrados -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Catálogo de Produtos</span>
                    <span style="font-size: 0.8rem; color: var(--cor-texto-suave);">${produtos.length} cadastrados</span>
                </div>

                <div class="lista-linhas">
                    ${produtos.length === 0 ? `
                        <p style="text-align: center; color: var(--cor-texto-suave); padding: 20px 0;">
                            Nenhum produto cadastrado ainda.<br>Clique em "+ Novo Produto" para começar.
                        </p>
                    ` : produtos.map(prod => {
                        const estoque = prod.obterEstoqueTotal();
                        const alerta = prod.precisaDeReposicao();
                        return `
                            <div class="item-linha">
                                <div>
                                    <div class="item-info-principal">${prod.nome}</div>
                                    <div class="item-info-secundaria">
                                        Venda: <strong>${this.formatarMoeda(prod.precoVenda)}</strong> | 
                                        Custo Médio: ${this.formatarMoeda(prod.calcularCustoMedioAtual())}
                                    </div>
                                    <div class="item-info-secundaria">
                                        ${prod.lotes.filter(l => !l.estaEsgotado()).map(l => 
                                            `• Lote: ${l.quantidadeAtual} un (Custo: ${this.formatarMoeda(l.precoCustoUnitario)} - Vence: ${l.dataValidade || 'S/D'})`
                                        ).join('<br>')}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <span class="etiqueta ${alerta ? 'etiqueta-alerta' : 'etiqueta-sucesso'}">
                                        ${estoque} un
                                    </span>
                                    ${alerta ? '<div style="font-size: 0.65rem; color: var(--cor-alerta); font-weight: bold; margin-top: 3px;">Comprar mais!</div>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- MODAL 1: CADASTRAR PRODUTO -->
            <div id="modal-produto" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3>Novo Produto no Catálogo</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-produto">&times;</button>
                    </div>
                    <form id="form-novo-produto">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Nome do Produto</label>
                            <input type="text" id="campo-prod-nome" class="campo-entrada" placeholder="Ex: Trufa LaNut 30g" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Categoria</label>
                            <select id="campo-prod-categoria" class="campo-selecao">
                                <option value="Trufas">Trufas</option>
                                <option value="Tabletes">Tabletes</option>
                                <option value="Presentes">Presentes / Caixas</option>
                                <option value="Geral">Outros</option>
                            </select>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Preço Fixo de Venda (R$)</label>
                            <input type="number" step="0.01" id="campo-prod-preco" class="campo-entrada" placeholder="Ex: 4.50" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Estoque Mínimo para Alerta</label>
                            <input type="number" id="campo-prod-minimo" class="campo-entrada" value="5" required>
                        </div>
                        <button type="submit" class="botao botao-primario botao-bloco">Salvar Produto</button>
                    </form>
                </div>
            </div>

            <!-- MODAL 2: REGISTRAR COMPRA / NOVO LOTE -->
            <div id="modal-compra" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3>Registrar Entrada de Compra</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-compra">&times;</button>
                    </div>
                    <form id="form-nova-compra">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Selecione o Chocolate</label>
                            <select id="campo-compra-produto" class="campo-selecao" required>
                                <option value="">-- Escolha um produto --</option>
                                ${produtos.map(p => `<option value="${p.id}">${p.nome} (Atual: ${p.obterEstoqueTotal()} un)</option>`).join('')}
                            </select>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Quantidade Comprada</label>
                            <input type="number" id="campo-compra-qtd" class="campo-entrada" placeholder="Ex: 20" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Preço de Custo Unitário na Promoção (R$)</label>
                            <input type="number" step="0.01" id="campo-compra-custo" class="campo-entrada" placeholder="Ex: 2.20" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Data de Validade (PEPS)</label>
                            <input type="date" id="campo-compra-validade" class="campo-entrada" required>
                        </div>
                        <button type="submit" class="botao botao-secundario botao-bloco">Registrar Entrada no Estoque</button>
                    </form>
                </div>
            </div>
        `;
    }
}