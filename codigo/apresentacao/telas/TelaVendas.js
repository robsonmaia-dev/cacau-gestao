export class TelaVendas {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, { dataFormatada, tipoPagamento = 'A_PRAZO' }) {
        container.innerHTML = `
            <!-- 1. DATA DA VENDA (DD/MM/AA) COM BOTÃO DE CALENDÁRIO 📅 -->
            <div class="cartao" style="background: #FAF7F5; padding: 10px 14px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="rotulo-campo" style="margin-bottom: 0; font-size: 0.82rem;">📅 Data da Venda (DD/MM/AA):</label>
                    <div style="display: flex; align-items: center; gap: 6px; position: relative;">
                        <input type="text" id="campo-venda-data" class="campo-entrada"
                            value="${dataFormatada}" placeholder="DD/MM/AA" maxlength="8"
                            style="width: 105px; height: 38px; text-align: center; font-weight: bold; background: #FFF; font-size: 0.9rem;">
                        
                        <button type="button" id="btn-abrir-calendario" class="botao botao-suave"
                            style="height: 38px; width: 38px; padding: 0; font-size: 1.15rem; cursor: pointer; border: 1px solid var(--cor-borda);"
                            title="Abrir calendário visual">
                            📅
                        </button>
                        <!-- Input oculto para acionar o seletor nativo do sistema -->
                        <input type="date" id="campo-venda-data-picker" style="position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;">
                    </div>
                </div>
            </div>

            <!-- 2. FORMULÁRIO DE LANÇAMENTO RÁPIDO (PDV) -->
            <div class="cartao" style="margin-bottom: 14px;">
                <form id="form-registro-venda">
                    <!-- CLIENTE COM AUTOCOMPLETE -->
                    <div class="grupo-campo" style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <label class="rotulo-campo" id="rotulo-cliente-venda" style="margin-bottom: 0;">
                                👤 Cliente (Obrigatório no Fiado)
                            </label>
                            <button type="button" id="btn-modal-novo-cliente" style="background: none; border: none; color: var(--cor-secundaria); font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                + Novo Cliente
                            </button>
                        </div>

                        <input type="hidden" id="campo-cliente-id" value="">
                        <!-- Contêiner com position: relative exclusivo para o autocomplete -->
                        <div style="position: relative;">
                            <input type="text" id="campo-busca-cliente" class="campo-entrada"
                                placeholder="Digite o nome do cliente (TAB/Enter seleciona)..." autocomplete="off"
                                style="height: 42px; font-size: 0.9rem; padding-right: 32px;">
                            <button type="button" id="btn-limpar-cliente"
                                style="display: none; position: absolute; right: 8px; top: 10px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>
                            
                            <!-- Dropdown de clientes posicionado estritamente abaixo do campo -->
                            <div id="sugestoes-clientes" class="lista-sugestoes-flutuante" style="display: none;"></div>
                        </div>
                    </div>

                    <!-- CHOCOLATE COM AUTOCOMPLETE E BUSCA POR CATEGORIA -->
                    <div style="background-color: #FAF7F5; padding: 12px; border-radius: 8px; border: 1px dashed var(--cor-borda); margin-bottom: 12px;">
                        <label class="rotulo-campo" style="margin-bottom: 4px;">🍫 Chocolate ou Categoria (ex: trufa, tablete)</label>
                        <input type="hidden" id="campo-produto-id" value="">
                        <input type="hidden" id="campo-produto-preco-tabela" value="0">

                        <!-- Contêiner com position: relative exclusivo para as sugestões de chocolate -->
                        <div style="position: relative; margin-bottom: 10px;">
                            <input type="text" id="campo-busca-produto" class="campo-entrada"
                                placeholder="Digite o chocolate ou categoria..." autocomplete="off"
                                style="height: 42px; font-size: 0.9rem; background: #FFF; padding-right: 32px;">
                            <button type="button" id="btn-limpar-produto"
                                style="display: none; position: absolute; right: 8px; top: 10px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>
                            
                            <!-- Dropdown de chocolates posicionado perfeitamente abaixo do input -->
                            <div id="sugestoes-produtos" class="lista-sugestoes-flutuante" style="display: none;"></div>
                        </div>

                        <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <label class="rotulo-campo" style="font-size: 0.75rem; margin-bottom: 2px;">Qtd</label>
                                <input type="number" id="campo-item-quantidade" class="campo-entrada" value="1" min="1"
                                    style="height: 42px; text-align: center; background: #FFF; font-weight: bold;">
                            </div>
                            <div style="flex: 1.6;">
                                <label class="rotulo-campo" style="font-size: 0.75rem; margin-bottom: 2px;">Valor Unitário</label>
                                <input type="number" step="0.01" id="campo-item-preco" class="campo-entrada" placeholder="R$ 0,00"
                                    style="height: 42px; background: #FFF; font-weight: bold;">
                            </div>
                            <button type="button" id="btn-adicionar-carrinho" class="botao botao-secundario" style="flex: 1.4; height: 42px; font-size: 0.85rem;">
                                + Adicionar
                            </button>
                        </div>

                        <!-- FORMA DE PAGAMENTO (DEPOIS DO VALOR) -->
                        <div style="padding-top: 10px; border-top: 1px dashed var(--cor-borda);">
                            <label class="rotulo-campo" style="font-size: 0.78rem; margin-bottom: 4px;">Forma de Pagamento</label>
                            <select id="campo-venda-tipo-pagamento" class="campo-selecao" style="height: 42px; font-size: 0.88rem; background:#FFF;">
                                <option value="A_PRAZO" ${tipoPagamento === 'A_PRAZO' ? 'selected' : ''}>📝 Fiado / Anotar na Folha (Cobrar no Mês)</option>
                                <option value="PIX_IMEDIATO" ${tipoPagamento === 'PIX_IMEDIATO' ? 'selected' : ''}>⚡ Pix Imediato (Pago na Hora)</option>
                            </select>
                        </div>
                    </div>

                    <!-- CARRINHO DE ITENS -->
                    <div id="container-itens-carrinho" style="margin-bottom: 12px;">
                        <div id="lista-carrinho" style="background: #FFF; border: 1px solid var(--cor-borda); border-radius: 8px; padding: 6px 12px; min-height: 40px;">
                            <p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 4px 0;">Nenhum item adicionado ainda.</p>
                        </div>
                    </div>

                    <!-- TOTAL E CONFIRMAÇÃO -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 12px; background-color: var(--cor-fundo); border-radius: 8px;">
                        <span style="font-weight: bold; font-size: 0.9rem;">Total da Venda:</span>
                        <span id="valor-total-carrinho" style="font-size: 1.35rem; font-weight: 800; color: var(--cor-primaria);">R$ 0,00</span>
                    </div>

                    <button type="submit" id="btn-confirmar-venda" class="botao botao-primario botao-bloco" style="height: 48px; font-size: 1rem;" disabled>
                        Confirmar Venda (Enter)
                    </button>
                    <div style="text-align: center; font-size: 0.7rem; color: var(--cor-texto-suave); margin-top: 6px;">
                        💡 No computador: use <strong>TAB</strong> ou <strong>Enter</strong> para autocompletar e avançar.
                    </div>
                </form>
            </div>

            <!-- 3. RODAPÉ DA TELA: LEITURA POR FOTO / IA -->
            <div class="cartao" style="background: #FAF6F0; border: 1px dashed var(--cor-secundaria); padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 700; color: var(--cor-primaria); font-size: 0.85rem;">📸 Ler Folha de Vendas com IA</div>
                        <div style="font-size: 0.7rem; color: var(--cor-texto-suave);">Digitalize a folha de consumo em papel automaticamente.</div>
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <label class="botao botao-secundario" style="flex: 1; height: 38px; font-size: 0.78rem; cursor: pointer;">
                        📷 Tirar Foto
                        <input type="file" id="input-foto-camera" accept="image/*" capture="environment" style="display: none;">
                    </label>
                    <label class="botao botao-suave" style="flex: 1; height: 38px; font-size: 0.78rem; cursor: pointer; border: 1px solid var(--cor-borda);">
                        📁 Galeria
                        <input type="file" id="input-foto-arquivo" accept="image/*" style="display: none;">
                    </label>
                </div>
            </div>

            <!-- MODAL: CADASTRAR NOVO CLIENTE RÁPIDO -->
            <div id="modal-rapido-cliente" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3>Cadastrar Novo Cliente</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-rapido-cliente">&times;</button>
                    </div>
                    <form id="form-rapido-cliente">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Nome do Cliente</label>
                            <input type="text" id="campo-cliente-nome" class="campo-entrada" placeholder="Ex: Carlos RH" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Onde ele recebe a cobrança?</label>
                            <select id="campo-cliente-canal" class="campo-selecao">
                                <option value="TEAMS">Microsoft Teams (E-mail corporativo)</option>
                                <option value="WHATSAPP">WhatsApp (Celular com DDD)</option>
                            </select>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Contato (E-mail Teams ou Celular)</label>
                            <input type="text" id="campo-cliente-contato" class="campo-entrada" placeholder="Ex: carlos@empresa.com ou 11999998888" required>
                        </div>
                        <button type="submit" class="botao botao-primario botao-bloco">Salvar Cliente</button>
                    </form>
                </div>
            </div>

            <div id="modal-revisao-ia" class="fundo-modal"></div>
        `;
    }
}
