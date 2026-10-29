export class TelaCobranca {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    // Renderiza a estrutura completa (configuração, total geral, filtros e casca da lista)
    static renderizarEstrutura(container, { totalGeral, totalDevedores, chavePix = '', linkCatalogo = '', filtros = {} }) {
        container.innerHTML = `
            <!-- Card de Configuração do Pix e Catálogo -->
            <div class="cartao" style="background-color: #FAF6F0; padding: 12px; margin-bottom: 12px;">
                <div class="cartao-cabecalho" style="margin-bottom: 6px;">
                    <span class="cartao-titulo" style="font-size: 0.9rem;">⚙️ Dados da Cobrança</span>
                </div>
                <div class="grupo-campo" style="margin-bottom: 8px;">
                    <label class="rotulo-campo" style="font-size: 0.75rem; margin-bottom: 2px;">Sua Chave Pix</label>
                    <input type="text" id="campo-chave-pix" class="campo-entrada" value="${chavePix}" placeholder="Ex: seu-pix@email.com" style="height: 38px; font-size: 0.85rem; background: #FFF;">
                </div>
                <div class="grupo-campo" style="margin-bottom: 0;">
                    <label class="rotulo-campo" style="font-size: 0.75rem; margin-bottom: 2px;">Link do Catálogo (Google Drive / Revista)</label>
                    <input type="text" id="campo-link-catalogo" class="campo-entrada" value="${linkCatalogo}" placeholder="Ex: https://..." style="height: 38px; font-size: 0.85rem; background: #FFF;">
                </div>
            </div>

            <!-- Resumo Financeiro a Receber -->
            <div class="card-metrica" style="margin-bottom: 12px; padding: 10px;">
                <div class="metrica-rotulo">Total Pendente a Receber no Mês</div>
                <div class="metrica-valor negativo" style="font-size: 1.4rem;">${this.formatarMoeda(totalGeral)}</div>
                <div style="font-size: 0.75rem; color: var(--cor-texto-suave); margin-top: 2px;">
                    ${totalDevedores} cliente(s) com débitos em aberto
                </div>
            </div>

            <!-- PAINEL DE FILTROS DA COBRANÇA (FIXO PARA DIGITAÇÃO CONTÍNUA) -->
            <div class="cartao" style="background: #FAF7F5; padding: 12px; margin-bottom: 12px;">
                <div class="cartao-cabecalho" style="margin-bottom: 8px;">
                    <span class="cartao-titulo" style="font-size: 0.95rem;">🔍 Filtros de Cobrança</span>
                    <span id="contador-faturas-cobranca" style="font-size: 0.78rem; font-weight: 700; color: var(--cor-primaria);">
                        ${totalDevedores} fatura(s)
                    </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="position: relative;">
                        <input type="text" id="filtro-busca-cobranca" class="campo-entrada"
                            placeholder="Buscar cliente por nome, setor ou contato..."
                            value="${filtros.termo || ''}" style="height: 40px; font-size: 0.88rem; background:#FFF; padding-right: 32px;">
                        <button type="button" id="btn-limpar-busca-cobranca"
                            style="display: ${filtros.termo ? 'block' : 'none'}; position: absolute; right: 8px; top: 9px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <select id="filtro-canal-cobranca" class="campo-selecao" style="flex: 1; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="TODOS" ${filtros.canal === 'TODOS' ? 'selected' : ''}>Todos os Canais</option>
                            <option value="TEAMS" ${filtros.canal === 'TEAMS' ? 'selected' : ''}>🟣 Teams</option>
                            <option value="WHATSAPP" ${filtros.canal === 'WHATSAPP' ? 'selected' : ''}>🟢 WhatsApp</option>
                        </select>

                        <select id="filtro-ordem-cobranca" class="campo-selecao" style="flex: 1.2; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="MAIOR_VALOR" ${filtros.ordem === 'MAIOR_VALOR' ? 'selected' : ''}>Maior Dívida ⬇</option>
                            <option value="MENOR_VALOR" ${filtros.ordem === 'MENOR_VALOR' ? 'selected' : ''}>Menor Dívida ⬆</option>
                            <option value="NOME" ${filtros.ordem === 'NOME' ? 'selected' : ''}>Nome (A-Z)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- CONTAINER DINÂMICO PARA AS FATURAS -->
            <div class="cartao">
                <div class="lista-linhas" id="lista-faturas-cobranca"></div>
            </div>

            <!-- MODAL: BAIXAR PAGAMENTO (TOTAL OU PARCIAL) -->
            <div id="modal-pagamento-cobranca" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3 id="titulo-modal-pagamento">Registrar Pagamento</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-pagamento-cobranca">&times;</button>
                    </div>
                    <form id="form-pagamento-cobranca">
                        <input type="hidden" id="pagamento-cliente-id">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Valor Pago (R$)</label>
                            <input type="number" step="0.01" id="pagamento-valor" class="campo-entrada" required>
                            <span style="font-size: 0.75rem; color: var(--cor-texto-suave);">Pode ser total ou parcial.</span>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Forma de Pagamento</label>
                            <select id="pagamento-metodo" class="campo-selecao">
                                <option value="PIX">Pix</option>
                                <option value="DINHEIRO">Dinheiro</option>
                            </select>
                        </div>
                        <button type="submit" id="btn-confirmar-baixa-pix" class="botao botao-sucesso botao-bloco">Confirmar Baixa do Pagamento</button>
                    </form>
                </div>
            </div>
        `;
    }

    // Atualiza apenas os cards filtrados sem perder o foco do teclado
    static atualizarLista(devedoresFiltrados = []) {
        const containerLista = document.getElementById('lista-faturas-cobranca');
        const contador = document.getElementById('contador-faturas-cobranca');
        if (!containerLista) return;

        const totalFiltrado = devedoresFiltrados.reduce((soma, c) => soma + Number(c.saldoDevedor || 0), 0);

        if (contador) {
            contador.innerText = `${devedoresFiltrados.length} fatura(s) • Total: ${this.formatarMoeda(totalFiltrado)}`;
        }

        if (devedoresFiltrados.length === 0) {
            containerLista.innerHTML = `
                <p style="text-align: center; color: var(--cor-sucesso); padding: 24px 0; font-weight: bold;">
                    🎉 Nenhuma fatura pendente encontrada com os filtros selecionados!
                </p>
            `;
            return;
        }

        containerLista.innerHTML = devedoresFiltrados.map(cli => `
            <div class="item-linha" style="flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px 0;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <div>
                        <div class="item-info-principal" style="font-size: 0.95rem;">👤 ${cli.nome}</div>
                        <div class="item-info-secundaria">
                            Canal: <strong>${cli.canalPreferencial === 'WHATSAPP' ? '🟢 WhatsApp' : '🟣 Teams'}</strong> (${cli.contato})
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="etiqueta etiqueta-perigo" style="font-size: 0.88rem; padding: 4px 8px;">
                            ${this.formatarMoeda(cli.saldoDevedor)}
                        </span>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
                    <button class="botao botao-secundario btn-gerar-cobranca" data-cliente-id="${cli.id}" style="flex: 2; height: 38px; font-size: 0.8rem;">
                        ${cli.canalPreferencial === 'WHATSAPP' ? '📲 Abrir WhatsApp' : '📋 Copiar p/ Teams'}
                    </button>
                    <button class="botao botao-sucesso btn-quitar-debito" data-cliente-id="${cli.id}" data-cliente-nome="${cli.nome}" data-saldo="${cli.saldoDevedor}" style="flex: 1.2; height: 38px; font-size: 0.8rem;">
                        💰 Baixar Pix
                    </button>
                </div>
            </div>
        `).join('');
    }
}
