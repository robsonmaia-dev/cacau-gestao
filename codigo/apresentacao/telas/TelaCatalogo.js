/**
 * TELA: TelaCatalogo
 * Painel administrativo para configurar o WhatsApp de vendas e compartilhar a revista digital.
 */
export class TelaCatalogo {
    static renderizar(container, linkPublico, whatsappSalvo) {
        container.innerHTML = `
            <!-- Painel de Compartilhamento -->
            <div class="cartao" style="background: linear-gradient(135deg, #FAF6F0, #F3E5D8); border: 1.5px solid var(--cor-secundaria);">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">📖 Sua Revista Digital Cacau Show</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--cor-texto-suave); margin-bottom: 12px;">
                    Seus clientes folheiam a revista no celular, clicam no <strong>"+"</strong> para adicionar produtos e mandam o pedido pronto no seu WhatsApp!
                </p>

                <!-- Campo do Link Público -->
                <div class="grupo-campo">
                    <label class="rotulo-campo">Link Público para Enviar no Teams / WhatsApp:</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="campo-link-publico-catalogo" class="campo-entrada" value="${linkPublico}" readonly style="background: #FFF;">
                        <button id="btn-copiar-link-catalogo" class="botao botao-secundario" style="height: 46px; white-space: nowrap;">
                            📋 Copiar
                        </button>
                    </div>
                </div>

                <!-- Configuração do WhatsApp de Recebimento de Pedidos -->
                <div class="grupo-campo" style="margin-bottom: 0;">
                    <label class="rotulo-campo">Seu WhatsApp para Receber os Pedidos (DDD + Número):</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="campo-whats-vendedor" class="campo-entrada" value="${whatsappSalvo}" placeholder="Ex: 5541984051401" style="background: #FFF;">
                        <button id="btn-salvar-whats-catalogo" class="botao botao-primario" style="height: 46px; white-space: nowrap;">
                            💾 Salvar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Botões de Ação Rápida -->
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <a href="${linkPublico}" target="_blank" class="botao botao-primario botao-bloco" style="text-decoration: none;">
                    👁️ Abrir Revista como Cliente
                </a>
            </div>
        `;
    }
}