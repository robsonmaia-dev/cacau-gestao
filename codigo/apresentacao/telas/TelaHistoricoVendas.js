export class TelaHistoricoVendas {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static formatarDataHora(isoString) {
        if (!isoString) return "-";
        const d = new Date(isoString);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // Renderiza a estrutura estática (filtros e container da lista) uma única vez
    static renderizarEstrutura(container, filtros = {}) {
        container.innerHTML = `
            <!-- PAINEL DE FILTROS FIXO (Nunca é recriado enquanto digita) -->
            <div class="cartao" style="background: #FAF7F5; padding: 14px; margin-bottom: 12px;">
                <div class="cartao-cabecalho" style="margin-bottom: 8px;">
                    <span class="cartao-titulo" style="font-size: 0.95rem;">🔍 Filtros do Histórico</span>
                    <span id="contador-vendas-historico" style="font-size: 0.78rem; font-weight: 700; color: var(--cor-primaria);">
                        0 venda(s) • Total: R$ 0,00
                    </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <input type="text" id="filtro-busca-historico" class="campo-entrada"
                        placeholder="Buscar por colega ou chocolate..."
                        value="${filtros.termo || ''}" style="height: 40px; font-size: 0.85rem; background:#FFF;">

                    <div style="display: flex; gap: 8px;">
                        <select id="filtro-tipo-historico" class="campo-selecao" style="flex: 1; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="TODOS" ${filtros.tipo === 'TODOS' ? 'selected' : ''}>Todos os Pagamentos</option>
                            <option value="A_PRAZO" ${filtros.tipo === 'A_PRAZO' ? 'selected' : ''}>📝 Somente Fiado</option>
                            <option value="PIX_IMEDIATO" ${filtros.tipo === 'PIX_IMEDIATO' ? 'selected' : ''}>⚡ Somente Pix</option>
                        </select>

                        <select id="filtro-periodo-historico" class="campo-selecao" style="flex: 1; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="30_DIAS" ${filtros.periodo === '30_DIAS' ? 'selected' : ''}>Últimos 30 dias</option>
                            <option value="HOJE" ${filtros.periodo === 'HOJE' ? 'selected' : ''}>Hoje</option>
                            <option value="7_DIAS" ${filtros.periodo === '7_DIAS' ? 'selected' : ''}>Últimos 7 dias</option>
                            <option value="TODOS" ${filtros.periodo === 'TODOS' ? 'selected' : ''}>Todo o Histórico</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- CONTAINER ONDE OS CARDS SÃO INSERIDOS -->
            <div id="lista-vendas-historico"></div>
        `;
    }

    // Atualiza apenas a listagem interna sem perder o foco do teclado
    static atualizarLista(vendas = [], clientes = []) {
        const containerLista = document.getElementById('lista-vendas-historico');
        const contador = document.getElementById('contador-vendas-historico');
        if (!containerLista) return;

        const mapaClientes = new Map(clientes.map(c => [c.id, c.nome]));

        let totalFiltrado = 0;
        vendas.forEach(v => totalFiltrado += Number(v.valorTotal));

        if (contador) {
            contador.innerText = `${vendas.length} venda(s) • Total: ${this.formatarMoeda(totalFiltrado)}`;
        }

        if (vendas.length === 0) {
            containerLista.innerHTML = `
                <div class="cartao" style="text-align: center; padding: 24px; color: var(--cor-texto-suave);">
                    Nenhuma venda encontrada com os filtros selecionados.
                </div>
            `;
            return;
        }

        containerLista.innerHTML = vendas.map(v => {
            const dataVenda = new Date(v.dataHora);
            const agora = new Date();
            const diasDesdeVenda = (agora - dataVenda) / (1000 * 60 * 60 * 24);
            const podeEditar = diasDesdeVenda <= 30;
            const ehFiado = v.tipoPagamento === 'A_PRAZO';

            // Se tem clienteId mostra o nome do colega; se for null mostra Balcão
            const nomeExibicao = v.clienteId
                ? `👤 ${mapaClientes.get(v.clienteId) || "Colega cadastrado"}`
                : "🏪 Venda no Balcão";

            return `
                <div class="cartao" style="padding: 12px; margin-bottom: 10px; border-left: 4px solid ${ehFiado ? 'var(--cor-alerta)' : 'var(--cor-sucesso)'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                        <div>
                            <div style="font-weight: 700; font-size: 0.95rem; color: var(--cor-primaria);">
                                ${nomeExibicao}
                            </div>
                            <div style="font-size: 0.72rem; color: var(--cor-texto-suave); margin-top: 2px;">
                                ${this.formatarDataHora(v.dataHora)} • <strong style="color: ${ehFiado ? 'var(--cor-alerta)' : 'var(--cor-sucesso)'};">${ehFiado ? '📝 Fiado' : '⚡ Pix na hora'}</strong>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.05rem; font-weight: 800; color: var(--cor-primaria);">
                                ${this.formatarMoeda(v.valorTotal)}
                            </div>
                            <span class="etiqueta ${ehFiado ? 'etiqueta-alerta' : 'etiqueta-sucesso'}" style="font-size: 0.65rem;">
                                ${ehFiado ? 'A Cobrar' : 'Pago'}
                            </span>
                        </div>
                    </div>

                    <!-- ITENS DA VENDA -->
                    <div style="background: #FAF8F5; border-radius: 6px; padding: 6px 10px; font-size: 0.78rem; margin: 6px 0;">
                        ${v.itens.map(it => `
                            <div style="display: flex; justify-content: space-between; margin: 2px 0;">
                                <span><strong>${it.quantidade}x</strong> ${it.nomeProduto}</span>
                                <span style="color: var(--cor-texto-suave);">${this.formatarMoeda(it.quantidade * it.precoVendaUnitario)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- AÇÕES: CORRIGIR OU CANCELAR -->
                    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed var(--cor-borda);">
                        ${podeEditar ? `
                            <button class="botao botao-suave btn-corrigir-venda" data-venda-id="${v.id}"
                                style="height: 32px; font-size: 0.75rem; padding: 0 10px;" title="Estorna no banco e preenche na tela de vendas para alterar">
                                ✏️ Corrigir
                            </button>
                            <button class="botao btn-cancelar-venda" data-venda-id="${v.id}"
                                style="height: 32px; font-size: 0.75rem; padding: 0 10px; background: #FFF0F0; color: var(--cor-perigo); border: 1px solid #FFCDD2;"
                                title="Devolve os produtos ao estoque e cancela">
                                ❌ Cancelar
                            </button>
                        ` : `
                            <span style="font-size: 0.7rem; color: var(--cor-texto-suave);">🔒 Fechada (> 30 dias)</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }
}
