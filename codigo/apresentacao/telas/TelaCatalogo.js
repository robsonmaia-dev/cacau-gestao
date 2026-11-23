/**
 * TELA: TelaCatalogo
 * Montador limpo da Revista Digital Cacau Show com fonte editável e barra flutuante.
 */
export class TelaCatalogo {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(
        container,
        {
            paginas = [],
            whatsapp = '',
            linkPublico = '',
            urlFonte = '',
            filtroPaginas = 'TODAS'
        }
    ) {
        const totalPaginas = paginas.length;
        const paginasAtivas = paginas.filter(p => p.ativa !== false).length;

        const paginasExibidas = filtroPaginas === 'COM_PRODUTOS'
            ? paginas.filter(p => (p.produtos || []).length > 0)
            : paginas;

        container.innerHTML = `
            <!-- 1. FONTE DO CATÁLOGO E CONFIGURAÇÕES DE ENVIO -->
            <div class="cartao" style="background: linear-gradient(135deg, #FAF6F0, #F3E5D8); border: 1.5px solid var(--cor-secundaria);">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">⚙️ Fonte e Configurações da Revista</span>
                </div>

                <!-- LINK DA FONTE EDITÁVEL -->
                <div class="grupo-campo">
                    <label class="rotulo-campo" for="campo-url-fonte-catalogo">
                        🔗 Link da Fonte (Catálogo Oficial Cacau Show):
                    </label>
                    <input type="url" id="campo-url-fonte-catalogo" class="campo-entrada"
                        value="${urlFonte}" placeholder="https://catalogo.cacaushow.com.br/..."
                        style="background:#FFF; font-size: 0.82rem; margin-bottom: 8px;">
                    <button type="button" id="btn-atualizar-da-fonte" class="botao botao-secundario botao-bloco" style="height: 42px; font-size: 0.88rem;">
                        🔄 Atualizar Catálogo da Fonte
                    </button>
                </div>

                <div class="grupo-campo">
                    <label class="rotulo-campo" for="campo-whats-vendedor">
                        📱 WhatsApp para Receber os Pedidos (DDD + Número):
                    </label>
                    <input type="text" id="campo-whats-vendedor" class="campo-entrada"
                        value="${whatsapp}" placeholder="Ex: 5541984051401" style="background:#FFF;">
                </div>

                <div class="grupo-campo" style="margin-bottom: 0;">
                    <label class="rotulo-campo" for="campo-link-publico">
                        📤 Link Público para Enviar no Teams / WhatsApp:
                    </label>
                    <div style="display: flex; gap: 6px;">
                        <input type="text" id="campo-link-publico" class="campo-entrada"
                            value="${linkPublico}" readonly style="background:#FFF; font-size: 0.78rem; flex: 1;">
                        <button type="button" id="btn-copiar-link-catalogo" class="botao botao-primario" style="height: 46px; padding: 0 12px; font-size: 0.82rem;">
                            📋 Copiar
                        </button>
                        <a href="${linkPublico}" target="_blank" class="botao botao-suave"
                            style="height: 46px; padding: 0 12px; font-size: 0.82rem; border: 1px solid var(--cor-borda);"
                            title="Abrir revista em nova aba">
                            👁️
                        </a>
                    </div>
                </div>
            </div>

            <!-- 2. CONTROLE LIMPO DA GRADE DE PÁGINAS -->
            <div class="cartao" style="padding: 12px; background: #FFF; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span id="contador-paginas-ativas" style="font-size: 0.85rem; font-weight: 700; color: var(--cor-primaria);">
                        ${paginasAtivas} de ${totalPaginas} páginas ativas
                    </span>

                    <select id="filtro-paginas-catalogo" class="campo-selecao" style="width: auto; height: 34px; font-size: 0.78rem; padding: 0 10px;">
                        <option value="TODAS" ${filtroPaginas === 'TODAS' ? 'selected' : ''}>Todas as páginas (${totalPaginas})</option>
                        <option value="COM_PRODUTOS" ${filtroPaginas === 'COM_PRODUTOS' ? 'selected' : ''}>Só com produtos</option>
                    </select>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button type="button" id="btn-marcar-todas-paginas" class="botao botao-suave" style="flex: 1; height: 38px; font-size: 0.82rem; border: 1px solid var(--cor-borda);">
                        ☑️ Marcar Todas
                    </button>
                    <button type="button" id="btn-desmarcar-todas-paginas" class="botao botao-suave" style="flex: 1; height: 38px; font-size: 0.82rem; border: 1px solid var(--cor-borda);">
                        ☐ Desmarcar Todas
                    </button>
                </div>
            </div>

            <!-- 3. GRADE DE PÁGINAS E PRODUTOS (COM ESPAÇO EXTRA NO FIM PARA A BARRA FLUTUANTE) -->
            <div id="grade-paginas-montador" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; padding-bottom: 72px;">
                ${paginasExibidas.length === 0 ? `
                    <div class="cartao" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                        <p style="color: var(--cor-texto-suave); margin-bottom: 12px;">
                            ${totalPaginas === 0 ? 'Nenhuma página carregada ainda.' : 'Nenhuma página com produtos encontrada neste filtro.'}
                        </p>
                    </div>
                ` : paginasExibidas.map(p => {
                    const ativa = p.ativa !== false;
                    return `
                        <div class="cartao card-pagina-montador" data-card-pag="${p.numero}"
                            style="margin-bottom: 0; display: flex; flex-direction: column; border: 1.5px solid ${ativa ? 'var(--cor-borda)' : '#FFCDD2'}; opacity: ${ativa ? '1' : '0.58'}; padding: 0; overflow: hidden;">
                            <div style="padding: 10px 12px; background: #F3EEE8; border-bottom: 1px solid #DDD; display: flex; justify-content: space-between; align-items: center;">
                                <label style="font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 0;">
                                    <input type="checkbox" class="chk-pagina" data-pag="${p.numero}" ${ativa ? 'checked' : ''} style="width: 17px; height: 17px;">
                                    Página ${p.numero}
                                </label>
                                <span style="font-size: 0.75rem; color: var(--cor-texto-suave);">${(p.produtos || []).length} produto(s)</span>
                            </div>

                            <div style="padding: 10px; display: flex; gap: 10px; flex-grow: 1;">
                                <img src="${p.imagem}" style="width: 84px; height: 118px; object-fit: contain; border: 1px solid #eee; border-radius: 4px; background: #FAFAFA;" loading="lazy">
                                <div style="flex-grow: 1; overflow-y: auto; max-height: 118px;">
                                    ${(p.produtos || []).length === 0 ? `
                                        <span style="color: #999; font-size: 0.75rem;">Página sem produtos clicáveis.</span>
                                    ` : p.produtos.map((prod, idx) => {
                                        const uid = prod.uid || `p${p.numero}-${prod.id}-${idx}`;
                                        return `
                                            <label style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 0.72rem; margin: 3px 0; background: #fafafa; padding: 4px 6px; border-radius: 4px; border: 1px solid #eee; cursor: pointer;">
                                                <span style="display: flex; align-items: center; gap: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                                    <input type="checkbox" class="chk-prod chk-prod-p${p.numero}"
                                                        data-pag="${p.numero}"
                                                        data-prod-uid="${uid}"
                                                        ${!prod.esgotado ? 'checked' : ''}>
                                                    <span style="overflow: hidden; text-overflow: ellipsis;">${prod.nome}</span>
                                                </span>
                                                <b style="color: var(--cor-primaria); flex-shrink: 0;">${this.formatarMoeda(prod.preco)}</b>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- 4. BARRA FLUTUANTE FIXA ACIMA DO MENU INFERIOR -->
            <div style="position: fixed; bottom: 72px; left: 50%; transform: translateX(-50%); width: calc(100% - 24px); max-width: 576px; background: rgba(44, 24, 16, 0.96); backdrop-filter: blur(6px); color: #FFF; padding: 8px 12px; border-radius: 14px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: space-between; gap: 8px; z-index: 95; border: 1px solid rgba(212, 139, 56, 0.45);">
                <div style="font-size: 0.78rem; font-weight: 700; padding-left: 4px;">
                    <span id="flutuante-resumo-paginas">${paginasAtivas}</span> ativa(s)
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" id="btn-voltar-topo-catalogo" class="botao"
                        style="height: 38px; padding: 0 12px; font-size: 0.78rem; background: rgba(255,255,255,0.16); color: #FFF; border: 1px solid rgba(255,255,255,0.25);">
                        ⬆ Topo
                    </button>
                    <button type="button" id="btn-salvar-publicar-catalogo" class="botao botao-sucesso"
                        style="height: 38px; padding: 0 16px; font-size: 0.85rem;">
                        💾 Publicar Revista
                    </button>
                </div>
            </div>
        `;
    }
}
