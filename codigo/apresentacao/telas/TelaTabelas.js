export class TelaTabelas {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
    }

    static renderizar(container, { produtos = [], config = {} }) {
        const ehDestaque = (config.modelo || 'DESTAQUE') === 'DESTAQUE';
        const dataHoje = new Date().toLocaleDateString('pt-BR');

        container.innerHTML = `
            <!-- 1. SELETOR DE MODELO DA FOLHA -->
            <div class="cartao" style="background: linear-gradient(135deg, #FAF6F0, #F3E5D8); border: 1.5px solid var(--cor-secundaria);">
                <div class="cartao-cabecalho" style="margin-bottom: 10px;">
                    <span class="cartao-titulo">🖨️ Escolha o Modelo da Folha A4</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button type="button" id="btn-modelo-destaque" class="botao"
                        style="height: auto; padding: 10px 8px; flex-direction: column; gap: 2px; border: 2px solid ${ehDestaque ? 'var(--cor-primaria)' : 'var(--cor-borda)'}; background: ${ehDestaque ? 'var(--cor-primaria)' : '#FFF'}; color: ${ehDestaque ? '#FFF' : 'var(--cor-texto)'};">
                        <span style="font-size: 1.15rem;">⚡</span>
                        <span style="font-size: 0.8rem; font-weight: 800;">Destaque (1 Item)</span>
                        <span style="font-size: 0.65rem; opacity: 0.85; font-weight: 400;">Estilo Taça / Promoção 1 dia</span>
                    </button>

                    <button type="button" id="btn-modelo-multi" class="botao"
                        style="height: auto; padding: 10px 8px; flex-direction: column; gap: 2px; border: 2px solid ${!ehDestaque ? 'var(--cor-primaria)' : 'var(--cor-borda)'}; background: ${!ehDestaque ? 'var(--cor-primaria)' : '#FFF'}; color: ${!ehDestaque ? '#FFF' : 'var(--cor-texto)'};">
                        <span style="font-size: 1.15rem;">🍫</span>
                        <span style="font-size: 0.8rem; font-weight: 800;">Multi-Produtos</span>
                        <span style="font-size: 0.65rem; opacity: 0.85; font-weight: 400;">Mês/Ref + Multiplicação rápida</span>
                    </button>
                </div>
            </div>

            <!-- 2A. CONFIGURAÇÃO MODELO DESTAQUE -->
            <div class="cartao" id="bloco-config-destaque" style="display: ${ehDestaque ? 'block' : 'none'};">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">⚡ Produto em Destaque</span>
                </div>

                <div class="grupo-campo">
                    <label class="rotulo-campo">Puxar do seu Estoque (opcional)</label>
                    <select id="tab-select-produto-destaque" class="campo-selecao">
                        <option value="">-- Digitar manualmente ou escolher um cadastrado --</option>
                        ${produtos.map(p => `
                            <option value="${p.id}" data-nome="${p.nome}" data-preco="${p.precoVenda}">
                                ${p.nome} (${this.formatarMoeda(p.precoVenda)} • ${p.obterEstoqueTotal()} un)
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div style="display: flex; gap: 8px;">
                    <div class="grupo-campo" style="flex: 2; margin-bottom: 10px;">
                        <label class="rotulo-campo">Nome na Folha</label>
                        <input type="text" id="tab-nome-destaque" class="campo-entrada"
                            value="${config.nomeDestaque || 'Taça'}" placeholder="Ex: Taça">
                    </div>
                    <div class="grupo-campo" style="flex: 1; margin-bottom: 10px;">
                        <label class="rotulo-campo">Preço (R$)</label>
                        <input type="number" step="0.01" id="tab-preco-destaque" class="campo-entrada"
                            value="${config.precoDestaque ?? '6.49'}" placeholder="6.49">
                    </div>
                </div>

                <div class="grupo-campo" style="margin-bottom: 0;">
                    <label class="rotulo-campo">Subtítulo do Cabeçalho</label>
                    <input type="text" id="tab-subtitulo" class="campo-entrada"
                        value="${config.subtitulo || 'Sobremesa especial Cacau Show • Lista de Anotação'}" placeholder="Ex: Sobremesa especial Cacau Show">
                </div>
            </div>

            <!-- 2B. CONFIGURAÇÃO MODELO MULTI-PRODUTOS -->
            <div class="cartao" id="bloco-config-multi" style="display: ${!ehDestaque ? 'block' : 'none'};">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">🍫 Colunas e Identificação da Folha</span>
                    <span id="tab-contador-multi" style="font-size: 0.75rem; font-weight: 700; color: var(--cor-primaria);">0 selecionado(s)</span>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <div class="grupo-campo" style="flex: 1.5; margin-bottom: 0;">
                        <label class="rotulo-campo">Mês/Ref (vazio = preencher à mão)</label>
                        <input type="text" id="tab-mes-ref" class="campo-entrada"
                            value="${config.mesRef || ''}" placeholder="Ex: 11/2026 ou deixe vazio">
                    </div>
                    <div class="grupo-campo" style="flex: 1; margin-bottom: 0;">
                        <label class="rotulo-campo">Folha Nº (opcional)</label>
                        <input type="text" id="tab-folha-numero" class="campo-entrada"
                            value="${config.folhaNumero || ''}" placeholder="Ex: 01">
                    </div>
                </div>

                <div class="grupo-campo" style="margin-bottom: 10px;">
                    <label class="rotulo-campo">Subtítulo da Folha</label>
                    <input type="text" id="tab-subtitulo-multi" class="campo-entrada"
                        value="${config.subtituloMulti || 'Anote seu nome e marque a quantidade retirada'}" placeholder="Ex: Anote seu nome e marque a quantidade retirada">
                </div>

                <label class="rotulo-campo">Selecione os produtos do estoque que vão virar colunas:</label>
                <div id="tab-lista-produtos-multi" style="max-height: 220px; overflow-y: auto; border: 1px solid var(--cor-borda); border-radius: 8px; padding: 8px; background: #FAF7F5; margin-bottom: 10px;">
                    ${produtos.length === 0 ? `
                        <p style="font-size: 0.8rem; color: var(--cor-texto-suave); text-align: center; padding: 12px;">Nenhum produto no estoque cadastrado.</p>
                    ` : produtos.map(p => {
                        const selecionado = (config.selecionadosMulti || []).includes(p.id);
                        return `
                            <label style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #FFF; border: 1px solid var(--cor-borda); border-radius: 6px; margin-bottom: 6px; cursor: pointer; font-size: 0.84rem;">
                                <span style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" class="chk-prod-multi-tabela" value="${p.id}"
                                        data-nome="${p.nome}" data-preco="${p.precoVenda}" ${selecionado ? 'checked' : ''}
                                        style="width: 17px; height: 17px;">
                                    <span><strong>${p.nome}</strong> <small style="color: var(--cor-texto-suave);">(${p.obterEstoqueTotal()} un)</small></span>
                                </span>
                                <strong style="color: var(--cor-primaria);">${this.formatarMoeda(p.precoVenda)}</strong>
                            </label>
                        `;
                    }).join('')}
                </div>

                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer;">
                    <input type="checkbox" id="tab-incluir-setor" ${config.incluirSetor ? 'checked' : ''} style="width: 17px; height: 17px;">
                    Incluir coluna "Setor" além do Nome Completo
                </label>
            </div>

            <!-- 3. CONFIGURAÇÕES DA FOLHA A4 & PIX -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">⚙️ Layout A4 &amp; Dados do PIX</span>
                </div>

                <div style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <label class="rotulo-campo">Linhas na Tabela</label>
                        <input type="number" id="tab-qtd-linhas" class="campo-entrada" min="5" max="40"
                            value="${config.qtdLinhas || 22}">
                    </div>
                    <div style="flex: 2;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; cursor: pointer;">
                            <input type="checkbox" id="tab-usar-escassez" ${config.usarEscassez !== false ? 'checked' : ''} style="width: 16px; height: 16px;">
                            Mostrar faixa de destaque / 1 dia
                        </label>
                        <input type="text" id="tab-titulo-escassez" class="campo-entrada"
                            value="${config.tituloEscassez || '⚡ SOMENTE HOJE — DISPONÍVEL APENAS POR 1 DIA!'}"
                            placeholder="Texto da faixa">
                    </div>
                </div>

                <div class="grupo-campo">
                    <label class="rotulo-campo">Texto auxiliar da faixa (com data)</label>
                    <input type="text" id="tab-texto-escassez" class="campo-entrada"
                        value="${config.textoEscassez || `Última chance para garantir a sua (${dataHoje}) • Estoque limitado`}">
                </div>

                <div style="display: flex; gap: 8px;">
                    <div class="grupo-campo" style="flex: 1; margin-bottom: 0;">
                        <label class="rotulo-campo">Titular do PIX</label>
                        <input type="text" id="tab-pix-titular" class="campo-entrada"
                            value="${config.pixTitular || 'Robson Luiz da Maia'}" placeholder="Seu nome">
                    </div>
                    <div class="grupo-campo" style="flex: 1; margin-bottom: 0;">
                        <label class="rotulo-campo">Chave PIX</label>
                        <input type="text" id="tab-pix-chave" class="campo-entrada"
                            value="${config.pixChave || ''}" placeholder="Sua chave Pix">
                    </div>
                </div>
            </div>

            <!-- 4. BOTÕES DE GERAÇÃO -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                <button type="button" id="btn-abrir-editor-tabela-a4" class="botao botao-primario botao-bloco" style="height: 50px; font-size: 1rem;">
                    👁️ Abrir Folha A4 (Editar / Imprimir)
                </button>
                <button type="button" id="btn-baixar-html-tabela-a4" class="botao botao-suave botao-bloco" style="height: 42px; font-size: 0.88rem; border: 1px solid var(--cor-borda);">
                    ⬇️ Baixar Arquivo HTML Pronto (A4)
                </button>
            </div>

            <div style="text-align: center; font-size: 0.74rem; color: var(--cor-texto-suave);">
                💡 Na folha aberta você pode clicar em qualquer texto para editar, adicionar/remover linhas ou colunas e imprimir em 1 página A4.
            </div>
        `;
    }
}
