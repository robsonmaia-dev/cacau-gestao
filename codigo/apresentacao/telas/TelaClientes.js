export class TelaClientes {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    // Renderiza a estrutura completa (métricas, filtros e casca da lista)
    static renderizarEstrutura(container, { clientes = [], filtros = {} }) {
        const totalEmAberto = clientes.reduce((soma, c) => soma + Number(c.saldoDevedor || 0), 0);

        container.innerHTML = `
            <!-- Resumo e Ação Principal -->
            <div class="cartao" style="display: flex; justify-content: space-between; align-items: center; background: #FAF7F5; padding: 14px; margin-bottom: 12px;">
                <div>
                    <div style="font-size: 0.78rem; color: var(--cor-texto-suave);">Total Geral a Receber</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: var(--cor-perigo);">${this.formatarMoeda(totalEmAberto)}</div>
                </div>
                <button id="btn-abrir-modal-novo-cliente" class="botao botao-primario" style="height: 42px; font-size: 0.85rem;">
                    + Novo Cliente
                </button>
            </div>

            <!-- PAINEL DE FILTROS DOS CLIENTES (FIXO PARA DIGITAÇÃO CONTÍNUA) -->
            <div class="cartao" style="background: #FAF7F5; padding: 12px; margin-bottom: 12px;">
                <div class="cartao-cabecalho" style="margin-bottom: 8px;">
                    <span class="cartao-titulo" style="font-size: 0.95rem;">🔍 Filtros da Carteira</span>
                    <span id="contador-clientes-carteira" style="font-size: 0.78rem; font-weight: 700; color: var(--cor-primaria);">
                        ${clientes.length} cliente(s)
                    </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="position: relative;">
                        <input type="text" id="filtro-busca-cliente" class="campo-entrada"
                            placeholder="Buscar por nome, setor, e-mail ou telefone..."
                            value="${filtros.termo || ''}" style="height: 40px; font-size: 0.88rem; background:#FFF; padding-right: 32px;">
                        <button type="button" id="btn-limpar-busca-cliente"
                            style="display: ${filtros.termo ? 'block' : 'none'}; position: absolute; right: 8px; top: 9px; background: none; border: none; font-size: 1.1rem; color: #888; cursor: pointer;">✕</button>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <select id="filtro-situacao-cliente" class="campo-selecao" style="flex: 1.2; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="TODOS" ${filtros.situacao === 'TODOS' ? 'selected' : ''}>Todas as Situações</option>
                            <option value="PENDENTES" ${filtros.situacao === 'PENDENTES' ? 'selected' : ''}>⚠️ Com Saldo Pendente</option>
                            <option value="EM_DIA" ${filtros.situacao === 'EM_DIA' ? 'selected' : ''}>✅ Em Dia (Sem Débito)</option>
                        </select>

                        <select id="filtro-canal-cliente" class="campo-selecao" style="flex: 1; height: 38px; font-size: 0.8rem; background:#FFF;">
                            <option value="TODOS" ${filtros.canal === 'TODOS' ? 'selected' : ''}>Todos os Canais</option>
                            <option value="TEAMS" ${filtros.canal === 'TEAMS' ? 'selected' : ''}>🟣 Teams</option>
                            <option value="WHATSAPP" ${filtros.canal === 'WHATSAPP' ? 'selected' : ''}>🟢 WhatsApp</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- CONTAINER DINÂMICO PARA A LISTA DE CLIENTES -->
            <div class="cartao">
                <div class="lista-linhas" id="lista-clientes-cadastrados"></div>
            </div>

            <!-- MODAL: CADASTRAR OU EDITAR CLIENTE -->
            <div id="modal-cadastro-cliente" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3 id="titulo-modal-cliente">Cadastrar Novo Cliente</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-cadastro-cliente">&times;</button>
                    </div>
                    <form id="form-cadastro-completo-cliente">
                        <input type="hidden" id="campo-cad-id" value="">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Nome Completo / Apelido / Setor</label>
                            <input type="text" id="campo-cad-nome" class="campo-entrada" placeholder="Ex: Mariana Financeiro" required>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Onde enviar a cobrança?</label>
                            <select id="campo-cad-canal" class="campo-selecao">
                                <option value="TEAMS">Microsoft Teams (Chat Corporativo)</option>
                                <option value="WHATSAPP">WhatsApp</option>
                            </select>
                        </div>
                        <div class="grupo-campo">
                            <label class="rotulo-campo" id="rotulo-cad-contato">E-mail corporativo do Teams</label>
                            <input type="text" id="campo-cad-contato" class="campo-entrada" placeholder="Ex: mariana@empresa.com" required>
                        </div>
                        <button type="submit" id="btn-salvar-cliente" class="botao botao-primario botao-bloco">Salvar Cliente</button>
                    </form>
                </div>
            </div>
        `;
    }

    // Atualiza apenas os itens da lista filtrada sem destruir o input onde o usuário digita
    static atualizarLista(clientesFiltrados = []) {
        const containerLista = document.getElementById('lista-clientes-cadastrados');
        const contador = document.getElementById('contador-clientes-carteira');
        if (!containerLista) return;

        const totalPendenteFiltrado = clientesFiltrados.reduce((soma, c) => soma + Number(c.saldoDevedor || 0), 0);

        if (contador) {
            contador.innerText = `${clientesFiltrados.length} cliente(s) • Total: ${this.formatarMoeda(totalPendenteFiltrado)}`;
        }

        if (clientesFiltrados.length === 0) {
            containerLista.innerHTML = `
                <p style="text-align: center; color: var(--cor-texto-suave); padding: 20px 0;">
                    Nenhum cliente encontrado com os filtros selecionados.
                </p>
            `;
            return;
        }

        containerLista.innerHTML = clientesFiltrados.map(cli => `
            <div class="item-linha" style="align-items: center; padding: 12px 0;">
                <div style="flex: 1; padding-right: 8px;">
                    <div class="item-info-principal" style="display: flex; align-items: center; gap: 6px; font-size: 0.95rem;">
                        ${cli.nome}
                        <span class="etiqueta" style="font-size: 0.65rem; background: #EEE; color: #555;">
                            ${cli.canalPreferencial === 'WHATSAPP' ? '🟢 WhatsApp' : '🟣 Teams'}
                        </span>
                    </div>
                    <div class="item-info-secundaria">${cli.contato}</div>
                    <div class="item-info-secundaria" style="margin-top: 4px;">
                        ${cli.saldoDevedor > 0
                            ? `<strong style="color: var(--cor-perigo); font-size: 0.85rem;">Pendente: ${this.formatarMoeda(cli.saldoDevedor)}</strong>`
                            : '<span style="color: var(--cor-sucesso); font-size: 0.82rem;">● Sem pendências</span>'
                        }
                    </div>
                </div>

                <div style="display: flex; gap: 6px;">
                    <button class="btn-editar-cliente"
                        data-id="${cli.id}"
                        data-nome="${cli.nome}"
                        data-canal="${cli.canalPreferencial}"
                        data-contato="${cli.contato}"
                        style="background: #FAF7F5; border: 1px solid var(--cor-borda); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.85rem;"
                        title="Editar Cliente">
                        ✏️
                    </button>
                    <button class="btn-remover-cliente"
                        data-id="${cli.id}"
                        data-nome="${cli.nome}"
                        style="background: #FFF0F0; border: 1px solid #FFCDD2; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.85rem; color: var(--cor-perigo);"
                        title="Excluir Cliente">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }
}
