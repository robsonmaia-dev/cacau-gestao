/**
 * TELA: TelaVendas
 * Interface para lançamento rápido de vendas (Pix, Fiado, Câmera ou Galeria com IA).
 */
export class TelaVendas {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, produtos = [], clientes = []) {
        container.innerHTML = `
            <!-- Painel de Leitura por Foto / IA -->
            <div class="cartao" style="background: linear-gradient(135deg, #FAF6F0, #F4ECE1); border: 1.5px dashed var(--cor-secundaria); margin-bottom: 16px;">
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: 700; color: var(--cor-primaria); font-size: 0.95rem;">📸 Ler Folha de Vendas com IA</div>
                    <div style="font-size: 0.75rem; color: var(--cor-texto-suave);">Tire uma foto ou carregue uma imagem da folha para lançar em lote.</div>
                </div>
                
                <!-- Botões Duplos: Câmera ou Galeria -->
                <div style="display: flex; gap: 8px;">
                    <label class="botao botao-secundario" style="flex: 1; height: 40px; font-size: 0.8rem; cursor: pointer;">
                        📷 Tirar Foto
                        <input type="file" id="input-foto-camera" accept="image/*" capture="environment" style="display: none;">
                    </label>
                    
                    <label class="botao botao-suave" style="flex: 1; height: 40px; font-size: 0.8rem; cursor: pointer; border: 1px solid var(--cor-borda);">
                        📁 Da Galeria
                        <input type="file" id="input-foto-arquivo" accept="image/*" style="display: none;">
                    </label>
                </div>
            </div>

            <!-- Formulário de Registro Manual de Venda -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Lançamento Manual de Chocolates</span>
                </div>

                <form id="form-registro-venda">
                    <!-- 1. Tipo de Pagamento -->
                    <div class="grupo-campo">
                        <label class="rotulo-campo">Tipo de Pagamento</label>
                        <select id="campo-venda-tipo-pagamento" class="campo-selecao">
                            <option value="A_PRAZO">📝 Fiado / Anotado na Folha (Cobrar no Fim do Mês)</option>
                            <option value="PIX_IMEDIATO">⚡ Pix Imediato (Pago na Hora na Mesa)</option>
                        </select>
                    </div>

                    <!-- 2. Seleção do Colega (Exibido para Fiado) -->
                    <div id="container-selecao-cliente" class="grupo-campo">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label class="rotulo-campo" style="margin-bottom: 0;">Colega / Comprador</label>
                            <button type="button" id="btn-modal-novo-cliente" style="background: none; border: none; color: var(--cor-secundaria); font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                + Cadastrar Novo Colega
                            </button>
                        </div>
                        <select id="campo-venda-cliente" class="campo-selecao">
                            <option value="">-- Selecione quem pegou --</option>
                            ${clientes.map(c => `
                                <option value="${c.id}">
                                    ${c.nome} (${c.canalPreferencial}) - Deve: ${this.formatarMoeda(c.saldoDevedor)}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- 3. Adicionar Chocolates ao Pedido -->
                    <div class="grupo-campo" style="background-color: #FAF7F5; padding: 12px; border-radius: 8px; border: 1px dashed var(--cor-borda);">
                        <label class="rotulo-campo">Adicionar Chocolate ao Pedido</label>
                        <div style="display: flex; gap: 8px;">
                            <select id="campo-selecionar-produto" class="campo-selecao" style="flex: 2;">
                                <option value="">-- Escolha o chocolate --</option>
                                ${produtos.filter(p => p.obterEstoqueTotal() > 0).map(p => `
                                    <option value="${p.id}" data-preco="${p.precoVenda}">
                                        ${p.nome} - ${this.formatarMoeda(p.precoVenda)} (${p.obterEstoqueTotal()} un)
                                    </option>
                                `).join('')}
                            </select>
                            <input type="number" id="campo-item-quantidade" class="campo-entrada" value="1" min="1" style="flex: 1; text-align: center;">
                            <button type="button" id="btn-adicionar-carrinho" class="botao botao-secundario" style="height: 46px; padding: 0 14px;">
                                +
                            </button>
                        </div>
                    </div>

                    <!-- 4. Resumo dos Itens Selecionados -->
                    <div id="container-itens-carrinho" style="margin-bottom: 16px;">
                        <span class="rotulo-campo">Itens a Baixar:</span>
                        <div id="lista-carrinho" style="background: #FFF; border: 1px solid var(--cor-borda); border-radius: 8px; padding: 8px 12px; min-height: 45px;">
                            <p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 6px 0;">Nenhum item adicionado ainda.</p>
                        </div>
                    </div>

                    <!-- 5. Totalizador e Botão de Gravar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 10px; background-color: var(--cor-fundo); border-radius: 8px;">
                        <span style="font-weight: bold; font-size: 0.9rem;">Total a Lançar:</span>
                        <span id="valor-total-carrinho" style="font-size: 1.3rem; font-weight: 800; color: var(--cor-primaria);">R$ 0,00</span>
                    </div>

                    <button type="submit" id="btn-confirmar-venda" class="botao botao-primario botao-bloco" disabled>
                        Confirmar e Baixar Estoque
                    </button>
                </form>
            </div>

            <!-- MODAL: CADASTRAR CLIENTE RÁPIDO -->
            <div id="modal-rapido-cliente" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3>Cadastrar Novo Colega</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-rapido-cliente">&times;</button>
                    </div>
                    <form id="form-rapido-cliente">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Nome do Colega</label>
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
                        <button type="submit" class="botao botao-primario botao-bloco">Salvar Colega</button>
                    </form>
                </div>
            </div>

            <!-- MODAL: GAVETA DE REVISÃO HUMANA (IA) -->
            <div id="modal-revisao-ia" class="fundo-modal"></div>
        `;
    }
}