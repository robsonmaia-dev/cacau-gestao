export class TelaVendas {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, { dataFormatada, tipoPagamento = 'A_PRAZO' }) {
        const ehPix = tipoPagamento === 'PIX_IMEDIATO';

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
                                ${ehPix ? '👤 Cliente (Opcional no Pix)' : '👤 Cliente (Obrigatório no Fiado)'}
                            </label>
                            <button type="button" id="btn-modal-novo-cliente" style="background: none; border: none; color: var(--cor-secundaria); font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                + Novo Cliente
                            </button>
                        </div>

                        <input type="hidden" id="campo-cliente-id" value="">
                        <div style="position: relative;">
                            <input type="text" id="campo-busca-cliente" class="campo-entrada"
                                placeholder="Digite o nome do cliente (TAB/Enter seleciona)..." autocomplete="off"
                                style="height: 42px; font-size: 0.9rem; padding-right: 32px;">
                            <button type="button" id="btn-limpar-cliente"
                                style="display: none; position: absolute; right: 8px; top: 10px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>

                            <div id="sugestoes-clientes" class="lista-sugestoes-flutuante" style="display: none;"></div>
                        </div>
                    </div>

                    <!-- CHOCOLATE COM AUTOCOMPLETE E BUSCA POR CATEGORIA -->
                    <div style="background-color: #FAF7F5; padding: 12px; border-radius: 8px; border: 1px dashed var(--cor-borda); margin-bottom: 12px;">
                        <label class="rotulo-campo" style="margin-bottom: 4px;">🍫 Chocolate ou Categoria (ex: trufa, tablete)</label>
                        <input type="hidden" id="campo-produto-id" value="">
                        <input type="hidden" id="campo-produto-preco-tabela" value="0">

                        <div style="position: relative; margin-bottom: 10px;">
                            <input type="text" id="campo-busca-produto" class="campo-entrada"
                                placeholder="Digite o chocolate ou categoria..." autocomplete="off"
                                style="height: 42px; font-size: 0.9rem; background: #FFF; padding-right: 32px;">
                            <button type="button" id="btn-limpar-produto"
                                style="display: none; position: absolute; right: 8px; top: 10px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>

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

                        <!-- FORMA DE PAGAMENTO -->
                        <div style="padding-top: 10px; border-top: 1px dashed var(--cor-borda);">
                            <label class="rotulo-campo" style="font-size: 0.78rem; margin-bottom: 4px;">Forma de Pagamento</label>
                            <select id="campo-venda-tipo-pagamento" class="campo-selecao" style="height: 42px; font-size: 0.88rem; background:#FFF;">
                                <option value="A_PRAZO" ${!ehPix ? 'selected' : ''}>📝 Fiado / Anotar na Folha (Cobrar no Mês)</option>
                                <option value="PIX_IMEDIATO" ${ehPix ? 'selected' : ''}>⚡ Pix na Hora (Gerar QR Code / Pago)</option>
                            </select>
                        </div>
                    </div>

                    <!-- CARRINHO DE ITENS -->
                    <div id="container-itens-carrinho" style="margin-bottom: 10px;">
                        <div id="lista-carrinho" style="background: #FFF; border: 1px solid var(--cor-borda); border-radius: 8px; padding: 6px 12px; min-height: 40px;">
                            <p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 4px 0;">Nenhum item adicionado ainda.</p>
                        </div>
                    </div>

                    <!-- DESCONTO OPCIONAL (R$ OU %) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; padding: 8px 12px; background: #FAF7F5; border: 1px solid var(--cor-borda); border-radius: 8px;">
                        <label for="campo-venda-desconto" style="font-size: 0.82rem; font-weight: 700; color: var(--cor-texto); margin: 0;">🏷️ Desconto:</label>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="display: flex; border: 1.5px solid var(--cor-borda); border-radius: 6px; overflow: hidden; background: #FFF;">
                                <button type="button" id="btn-desc-valor" class="btn-tipo-desconto" data-tipo="VALOR"
                                    style="padding: 6px 10px; border: none; font-size: 0.78rem; font-weight: 700; cursor: pointer; background: var(--cor-primaria); color: #FFF;">
                                    R$
                                </button>
                                <button type="button" id="btn-desc-percentual" class="btn-tipo-desconto" data-tipo="PERCENTUAL"
                                    style="padding: 6px 10px; border: none; font-size: 0.78rem; font-weight: 700; cursor: pointer; background: #FFF; color: var(--cor-texto-suave);">
                                    %
                                </button>
                            </div>
                            <input type="number" step="0.01" min="0" id="campo-venda-desconto" class="campo-entrada"
                                placeholder="0,00"
                                style="width: 90px; height: 36px; text-align: right; font-weight: bold; background: #FFF; font-size: 0.9rem;">
                        </div>
                    </div>

                    <!-- RESUMO SUBTOTAL / DESCONTO / TOTAL -->
                    <div style="margin-bottom: 12px; padding: 10px 12px; background-color: var(--cor-fundo); border-radius: 8px;">
                        <div id="linha-resumo-desconto" style="display: none; justify-content: space-between; font-size: 0.78rem; color: var(--cor-texto-suave); margin-bottom: 4px;">
                            <span>Subtotal: <strong id="valor-subtotal-carrinho">R$ 0,00</strong></span>
                            <span style="color: var(--cor-sucesso); font-weight: 700;">Desconto: - <span id="valor-desconto-carrinho">R$ 0,00</span></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: bold; font-size: 0.9rem;">Total da Venda:</span>
                            <span id="valor-total-carrinho" style="font-size: 1.35rem; font-weight: 800; color: var(--cor-primaria);">R$ 0,00</span>
                        </div>
                    </div>

                    <button type="submit" id="btn-confirmar-venda" class="botao botao-primario botao-bloco" style="height: 48px; font-size: 1rem;" disabled>
                        ${ehPix ? '💳 Gerar QR Code Pix' : 'Confirmar Venda (Enter)'}
                    </button>

                    <button type="button" id="btn-confirmar-pix-direto" class="botao botao-suave botao-bloco"
                        style="display: none; height: 38px; font-size: 0.8rem; margin-top: 8px; border: 1px solid var(--cor-borda);">
                        ⚡ Já recebi — Confirmar direto sem QR Code
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

            <!-- MODAL: CHECKOUT PIX PRESENCIAL (QR CODE NA HORA) -->
            <div id="modal-checkout-pix" class="fundo-modal">
                <div class="janela-modal" style="max-width: 440px;">
                    <div class="modal-cabecalho" style="margin-bottom: 10px;">
                        <h3>💳 Pagamento Pix na Hora</h3>
                        <button type="button" class="botao-fechar-modal" data-fechar="modal-checkout-pix">&times;</button>
                    </div>

                    <div style="text-align: center; background: #FAF6F0; border: 1px solid var(--cor-secundaria); border-radius: 10px; padding: 12px; margin-bottom: 12px;">
                        <div style="font-size: 0.75rem; color: var(--cor-texto-suave); text-transform: uppercase; font-weight: 700;">Valor a Pagar</div>
                        <div id="checkout-pix-valor" style="font-size: 1.9rem; font-weight: 900; color: var(--cor-primaria); margin: 2px 0;">R$ 0,00</div>
                        <div id="checkout-pix-desconto-info" style="display: none; font-size: 0.75rem; color: var(--cor-sucesso); font-weight: 700;"></div>
                    </div>

                    <div id="checkout-pix-qrcode-container" style="text-align: center; margin-bottom: 12px;">
                        <img id="checkout-pix-qrcode-img" alt="QR Code Pix"
                            style="display: none; width: 220px; height: 220px; margin: 0 auto; border-radius: 10px; border: 2px solid var(--cor-borda); padding: 6px; background: #FFF;" />
                        <p id="checkout-pix-status-qr" style="font-size: 0.8rem; color: var(--cor-texto-suave); padding: 14px;">
                            Gerando QR Code...
                        </p>
                    </div>

                    <div style="background: #FAF7F5; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; border: 1px solid var(--cor-borda);">
                        <label for="checkout-pix-chave" style="font-size: 0.72rem; font-weight: 700; color: var(--cor-texto-suave); display: block; margin-bottom: 4px;">
                            🔑 Chave Pix Recebedora (salva automaticamente na nuvem):
                        </label>
                        <div style="display: flex; gap: 6px;">
                            <input type="text" id="checkout-pix-chave" class="campo-entrada" placeholder="Informe sua Chave Pix..."
                                style="height: 36px; font-size: 0.82rem; background: #FFF;">
                            <button type="button" id="btn-atualizar-qr-checkout" class="botao botao-suave"
                                style="height: 36px; font-size: 0.78rem; padding: 0 10px; border: 1px solid var(--cor-borda);">
                                Gerar QR
                            </button>
                        </div>
                    </div>

                    <button type="button" id="btn-copiar-pix-checkout" class="botao botao-suave botao-bloco"
                        style="height: 40px; font-size: 0.85rem; margin-bottom: 10px; border: 1px solid var(--cor-secundaria);" disabled>
                        📋 Copiar Pix Copia e Cola
                    </button>

                    <div id="checkout-pix-itens" style="font-size: 0.75rem; color: var(--cor-texto-suave); background: #FFF; border: 1px dashed var(--cor-borda); border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; max-height: 80px; overflow-y: auto;"></div>

                    <button type="button" id="btn-confirmar-pagamento-pix" class="botao botao-sucesso botao-bloco" style="height: 48px; font-size: 0.95rem; margin-bottom: 8px;">
                        ✅ Pagamento Confirmado (Concluir Venda)
                    </button>

                    <div style="display: flex; gap: 8px;">
                        <button type="button" id="btn-voltar-checkout-pix" class="botao botao-suave" style="flex: 1; height: 38px; font-size: 0.8rem;">
                            ⬅️ Alterar Itens
                        </button>
                        <button type="button" id="btn-converter-para-fiado" class="botao botao-suave" style="flex: 1.2; height: 38px; font-size: 0.8rem; border: 1px solid var(--cor-alerta); color: var(--cor-alerta);">
                            📝 Passar para Fiado
                        </button>
                    </div>
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
