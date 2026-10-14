/**
 * TELA: TelaCobranca
 * Exibe os colegas com débitos pendentes e opções de envio para Teams e WhatsApp.
 */
export class TelaCobranca {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, clientesComDebito = [], chavePix = '', linkCatalogo = '') {
        const totalAReceber = clientesComDebito.reduce((soma, c) => soma + c.saldoDevedor, 0);

        container.innerHTML = `
            <!-- Card de Configuração do Pix e Catálogo -->
            <div class="cartao" style="background-color: #FAF6F0;">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">⚙️ Dados da Cobrança</span>
                </div>
                <div class="grupo-campo">
                    <label class="rotulo-campo">Sua Chave Pix (E-mail, CPF ou Telefone)</label>
                    <input type="text" id="campo-chave-pix" class="campo-entrada" value="${chavePix}" placeholder="Ex: seu-pix@email.com">
                </div>
                <div class="grupo-campo" style="margin-bottom: 0;">
                    <label class="rotulo-campo">Link do Catálogo Cacau Show (Google Drive / Site)</label>
                    <input type="text" id="campo-link-catalogo" class="campo-entrada" value="${linkCatalogo}" placeholder="Ex: https://drive.google.com/...">
                </div>
            </div>

            <!-- Resumo Financeiro a Receber -->
            <div class="card-metrica" style="margin-bottom: 16px;">
                <div class="metrica-rotulo">Total a Receber no Fim do Mês</div>
                <div class="metrica-valor negativo">${this.formatarMoeda(totalAReceber)}</div>
                <div style="font-size: 0.75rem; color: var(--cor-texto-suave); margin-top: 4px;">
                    ${clientesComDebito.length} colega(s) com saldo pendente
                </div>
            </div>

            <!-- Lista de Colegas para Cobrança -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Faturas Pendentes</span>
                </div>

                <div class="lista-linhas">
                    ${clientesComDebito.length === 0 ? `
                        <p style="text-align: center; color: var(--cor-sucesso); padding: 20px 0; font-weight: bold;">
                            🎉 Tudo em dia! Ninguém está devendo no momento.
                        </p>
                    ` : clientesComDebito.map(cli => `
                        <div class="item-linha" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; width: 100%;">
                                <div>
                                    <div class="item-info-principal">${cli.nome}</div>
                                    <div class="item-info-secundaria">
                                        Canal: <strong>${cli.canalPreferencial}</strong> (${cli.contato})
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <span class="etiqueta etiqueta-perigo" style="font-size: 0.85rem;">
                                        ${this.formatarMoeda(cli.saldoDevedor)}
                                    </span>
                                </div>
                            </div>

                            <!-- Botões de Ação por Colega -->
                            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
                                <button class="botao botao-secundario btn-gerar-cobranca" data-cliente-id="${cli.id}" style="flex: 2; height: 38px; font-size: 0.8rem;">
                                    ${cli.canalPreferencial === 'WHATSAPP' ? '📲 Abrir WhatsApp' : '📋 Copiar p/ Teams'}
                                </button>
                                <button class="botao botao-sucesso btn-quitar-debito" data-cliente-id="${cli.id}" data-cliente-nome="${cli.nome}" data-saldo="${cli.saldoDevedor}" style="flex: 1; height: 38px; font-size: 0.8rem;">
                                    💰 Baixar Pix
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
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
                        <button type="submit" class="botao botao-sucesso botao-bloco">Confirmar Baixa do Pagamento</button>
                    </form>
                </div>
            </div>
        `;
    }
}