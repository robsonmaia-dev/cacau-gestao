/**
 * TELA: TelaCatalogo
 * O Criador e Montador de Revista Digital da Cacau Show.
 */
export class TelaCatalogo {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, { paginas = [], whatsapp = '', linkPublico = '' }) {
        container.innerHTML = `
            <!-- 1. PAINEL DE CONTROLE -->
            <div class="cartao" style="background: linear-gradient(135deg, #FAF6F0, #F3E5D8); border: 1.5px solid var(--cor-secundaria);">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">⚙️ Montador de Revista Digital</span>
                </div>

                <div class="grupo-campo">
                    <label class="rotulo-campo">WhatsApp para Receber os Pedidos (DDD + Número):</label>
                    <input type="text" id="campo-whats-vendedor" class="campo-entrada" value="${whatsapp}" placeholder="Ex: 5541984051401" style="background:#FFF;">
                </div>

                <div class="grupo-campo" style="margin-bottom: 0;">
                    <label class="rotulo-campo">Link Público para Enviar no Teams / WhatsApp:</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="campo-link-publico" class="campo-entrada" value="${linkPublico}" readonly style="background:#FFF; font-size: 0.8rem;">
                        <button id="btn-copiar-link-catalogo" class="botao botao-primario" style="height: 46px;">
                            📋 Copiar Link
                        </button>
                    </div>
                </div>
            </div>

            <!-- 2. BARRA DE AÇÕES DO MONTADOR -->
            <div class="cartao" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; background: #FFF;">
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <button id="btn-recarregar-json-base" class="botao botao-secundario" style="height: 38px; font-size: 0.75rem;">
                        🔄 Carregar Catálogo
                    </button>
                    
                    <label class="botao botao-suave" style="height: 38px; font-size: 0.75rem; cursor: pointer; border: 1px solid var(--cor-borda);">
                        📁 Carregar JSON
                        <input type="file" id="input-arquivo-json-catalogo" accept=".json" style="display: none;">
                    </label>

                    <button id="btn-marcar-todas-paginas" class="botao botao-suave" style="height: 38px; font-size: 0.75rem;">
                        Marcar Todas
                    </button>
                    <button id="btn-desmarcar-todas-paginas" class="botao botao-suave" style="height: 38px; font-size: 0.75rem;">
                        Desmarcar Todas
                    </button>
                    <button id="btn-sincronizar-estoque-catalogo" class="botao botao-suave" style="height: 38px; font-size: 0.75rem; border: 1px solid var(--cor-secundaria);">
                        ⚡ Sincronizar Estoque Real
                    </button>
                </div>

                <button id="btn-salvar-publicar-catalogo" class="botao botao-sucesso" style="height: 42px; font-size: 0.9rem;">
                    💾 Publicar Revista para Clientes
                </button>
            </div>

            <!-- 3. GRADE DE PÁGINAS E PRODUTOS -->
            <div id="grade-paginas-montador" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;">
                ${paginas.length === 0 ? `
                    <div class="cartao" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                        <p style="color: var(--cor-texto-suave); margin-bottom: 12px;">Nenhuma página carregada ainda.</p>
                        <button id="btn-carregar-inicial" class="botao botao-primario">
                            Carregar Catálogo Agora
                        </button>
                    </div>
                ` : paginas.map(p => `
                    <div class="cartao" style="margin-bottom: 0; display: flex; flex-direction: column; border: 1.5px solid ${p.ativa ? 'var(--cor-borda)' : '#FFCDD2'}; opacity: ${p.ativa ? '1' : '0.6'};">
                        <div style="padding: 10px; background: #F3EEE8; border-bottom: 1px solid #DDD; display: flex; justify-content: space-between; align-items: center;">
                            <label style="font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" class="chk-pagina" data-pag="${p.numero}" ${p.ativa ? 'checked' : ''}>
                                Página ${p.numero}
                            </label>
                            <span style="font-size: 0.75rem; color: var(--cor-texto-suave);">${p.produtos.length} produtos</span>
                        </div>

                        <div style="padding: 10px; display: flex; gap: 10px; flex-grow: 1;">
                            <img src="${p.imagem}" style="width: 90px; height: 125px; object-fit: contain; border: 1px solid #eee; border-radius: 4px; background: #FAFAFA;" loading="lazy">
                            <div style="flex-grow: 1; overflow-y: auto; max-height: 125px;">
                                ${p.produtos.length === 0 ? `
                                    <span style="color: #999; font-size: 0.75rem;">Página sem produtos clicáveis.</span>
                                ` : p.produtos.map(prod => `
                                    <label style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; margin: 3px 0; background: #fafafa; padding: 4px 6px; border-radius: 4px; border: 1px solid #eee; cursor: pointer;">
                                        <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            <input type="checkbox" class="chk-prod chk-prod-p${p.numero}" data-prod-id="${prod.id}" ${!prod.esgotado ? 'checked' : ''}>
                                            ${prod.nome}
                                        </span>
                                        <b style="color: var(--cor-primaria);">${this.formatarMoeda(prod.preco)}</b>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}