export class TelaEstoque {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    // Renderiza a estrutura completa com métricas, botões, filtros e casca da lista
    static renderizarEstrutura(container, { produtos = [], filtros = {} }) {
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

        // Extrai categorias dinâmicas dos produtos cadastrados
        const categoriasUnicas = Array.from(new Set(produtos.map(p => p.categoria || 'Geral'))).sort();

        container.innerHTML = `
            <!-- Painel de Métricas do Topo -->
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
            <div style="display: flex; gap: 8px; margin-bottom: 14px;">
                <button id="btn-abrir-modal-compra" class="botao botao-secundario botao-bloco" style="height: 42px;">
                    + Registrar Compra
                </button>
                <button id="btn-abrir-modal-produto" class="botao botao-primario botao-bloco" style="height: 42px;">
                    + Novo Produto
                </button>
            </div>

            <!-- PAINEL DE FILTROS DO ESTOQUE (FIXO PARA DIGITAÇÃO CONTÍNUA) -->
            <div class="cartao" style="background: #FAF7F5; padding: 12px; margin-bottom: 12px;">
                <div class="cartao-cabecalho" style="margin-bottom: 8px;">
                    <span class="cartao-titulo" style="font-size: 0.95rem;">🔍 Filtros do Catálogo</span>
                    <span id="contador-produtos-estoque" style="font-size: 0.78rem; font-weight: 700; color: var(--cor-primaria);">
                        ${produtos.length} produtos
                    </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="position: relative;">
                        <input type="text" id="filtro-busca-estoque" class="campo-entrada"
                            placeholder="Buscar chocolate por nome..."
                            value="${filtros.termo || ''}" style="height: 40px; font-size: 0.88rem; background:#FFF; padding-right: 32px;">
                        <button type="button" id="btn-limpar-busca-estoque"
                            style="display: ${filtros.termo ? 'block' : 'none'}; position: absolute; right: 8px; top: 9px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <select id="filtro-categoria-estoque" class="campo-selecao" style="flex: 1; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="TODAS" ${filtros.categoria === 'TODAS' ? 'selected' : ''}>Todas as Categorias</option>
                            ${categoriasUnicas.map(cat => `
                                <option value="${cat}" ${filtros.categoria === cat ? 'selected' : ''}>${cat}</option>
                            `).join('')}
                        </select>

                        <select id="filtro-status-estoque" class="campo-selecao" style="flex: 1.2; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="TODOS" ${filtros.status === 'TODOS' ? 'selected' : ''}>Todos os Status</option>
                            <option value="REPOSICAO" ${filtros.status === 'REPOSICAO' ? 'selected' : ''}>⚠️ Reposição Urgente</option>
                            <option value="ESGOTADOS" ${filtros.status === 'ESGOTADOS' ? 'selected' : ''}>🚨 Esgotados (0 un)</option>
                            <option value="VENCENDO" ${filtros.status === 'VENCENDO' ? 'selected' : ''}>⏳ Vencendo (15 dias)</option>
                            <option value="COM_ESTOQUE" ${filtros.status === 'COM_ESTOQUE' ? 'selected' : ''}>✅ Com Estoque (> 0)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- CONTAINER DINÂMICO PARA A LISTA DE PRODUTOS -->
            <div class="cartao">
                <div class="lista-linhas" id="lista-produtos-estoque"></div>
            </div>

            <!-- MODAL: CADASTRAR OU EDITAR PRODUTO -->
            <div id="modal-produto" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3 id="titulo-modal-produto">Novo Produto no Catálogo</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-produto">&times;</button>
                    </div>
                    <form id="form-novo-produto">
                        <input type="hidden" id="campo-prod-id" value="">
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
                            <input type="number" step="0.01" id="campo-prod-preco" class="campo-entrada" placeholder="Ex: 5.29" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Estoque Mínimo para Alerta</label>
                            <input type="number" id="campo-prod-minimo" class="campo-entrada" value="5" required>
                        </div>
                        <button type="submit" id="btn-salvar-produto" class="botao botao-primario botao-bloco">Salvar Produto</button>
                    </form>
                </div>
            </div>

            <!-- MODAL: REGISTRAR COMPRA / NOVO LOTE -->
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

    // Atualiza apenas os itens filtrados da lista
    static atualizarLista(produtosFiltrados = []) {
        const containerLista = document.getElementById('lista-produtos-estoque');
        const contador = document.getElementById('contador-produtos-estoque');
        if (!containerLista) return;

        if (contador) {
            contador.innerText = `${produtosFiltrados.length} produto(s) encontrado(s)`;
        }

        if (produtosFiltrados.length === 0) {
            containerLista.innerHTML = `
                <p style="text-align: center; color: var(--cor-texto-suave); padding: 20px 0;">
                    Nenhum chocolate encontrado com os filtros selecionados.
                </p>
            `;
            return;
        }

        containerLista.innerHTML = produtosFiltrados.map(prod => {
            const estoque = prod.obterEstoqueTotal();
            const alerta = prod.precisaDeReposicao();
            return `
                <div class="item-linha" style="align-items: flex-start; padding: 12px 0;">
                    <div style="flex: 1; padding-right: 8px;">
                        <div class="item-info-principal" style="font-size: 0.95rem;">${prod.nome}</div>
                        <div class="item-info-secundaria">
                            Categoria: <strong>${prod.categoria}</strong> |
                            Venda: <strong style="color: var(--cor-sucesso);">${this.formatarMoeda(prod.precoVenda)}</strong>
                        </div>
                        <div class="item-info-secundaria">
                            Custo Médio: ${this.formatarMoeda(prod.calcularCustoMedioAtual())} | Mínimo: ${prod.estoqueMinimo} un
                        </div>
                        <div class="item-info-secundaria" style="margin-top: 4px;">
                            ${prod.lotes.filter(l => !l.estaEsgotado()).map(l =>
                                `• Lote: ${l.quantidadeAtual} un (Custo: ${this.formatarMoeda(l.precoCustoUnitario)} | Vence: ${l.dataValidade || 'S/D'})`
                            ).join('<br>') || '<em style="color: var(--cor-texto-suave);">Sem lotes ativos</em>'}
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <span class="etiqueta ${alerta ? 'etiqueta-alerta' : 'etiqueta-sucesso'}">
                            ${estoque} un
                        </span>

                        <div style="display: flex; gap: 6px; margin-top: 4px;">
                            <button class="btn-editar-produto"
                                data-id="${prod.id}"
                                data-nome="${prod.nome}"
                                data-categoria="${prod.categoria}"
                                data-preco="${prod.precoVenda}"
                                data-minimo="${prod.estoqueMinimo}"
                                style="background: #FAF7F5; border: 1px solid var(--cor-borda); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.85rem;"
                                title="Editar Produto">
                                ✏️
                            </button>
                            <button class="btn-excluir-produto"
                                data-id="${prod.id}"
                                data-nome="${prod.nome}"
                                data-estoque="${estoque}"
                                style="background: #FFF0F0; border: 1px solid #FFCDD2; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.85rem; color: var(--cor-perigo);"
                                title="Excluir Produto">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}
