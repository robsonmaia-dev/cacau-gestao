/**
 * TELA: TelaClientes
 * Gestão de clientes com ações completas de inclusão, edição e exclusão.
 */
export class TelaClientes {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, clientes = []) {
        const totalEmAberto = clientes.reduce((soma, c) => soma + c.saldoDevedor, 0);

        container.innerHTML = `
            <!-- Resumo e Ação Principal -->
            <div class="cartao" style="display: flex; justify-content: space-between; align-items: center; background: #FAF7F5;">
                <div>
                    <div style="font-size: 0.8rem; color: var(--cor-texto-suave);">Total a Receber da Equipe</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: var(--cor-perigo);">${this.formatarMoeda(totalEmAberto)}</div>
                </div>
                <button id="btn-abrir-modal-novo-cliente" class="botao botao-primario" style="height: 42px;">
                    + Novo Colega
                </button>
            </div>

            <!-- Lista de Colegas -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Colegas Cadastrados</span>
                    <span style="font-size: 0.8rem; color: var(--cor-texto-suave);">${clientes.length} pessoas</span>
                </div>

                <div class="lista-linhas">
                    ${clientes.length === 0 ? `
                        <p style="text-align: center; color: var(--cor-texto-suave); padding: 20px 0;">
                            Nenhum colega cadastrado ainda.<br>Clique em "+ Novo Colega" acima para começar.
                        </p>
                    ` : clientes.map(cli => `
                        <div class="item-linha" style="align-items: center; padding: 12px 0;">
                            <div style="flex: 1;">
                                <div class="item-info-principal" style="display: flex; align-items: center; gap: 6px;">
                                    ${cli.nome}
                                    <span class="etiqueta" style="font-size: 0.65rem; background: #EEE; color: #555;">
                                        ${cli.canalPreferencial === 'WHATSAPP' ? '🟢 WhatsApp' : '🟣 Teams'}
                                    </span>
                                </div>
                                <div class="item-info-secundaria">${cli.contato}</div>
                                <div class="item-info-secundaria" style="margin-top: 4px;">
                                    ${cli.saldoDevedor > 0 
                                        ? `<strong style="color: var(--cor-perigo);">Pendente: ${this.formatarMoeda(cli.saldoDevedor)}</strong>` 
                                        : '<span style="color: var(--cor-sucesso);">● Sem pendências</span>'
                                    }
                                </div>
                            </div>
                            
                            <!-- Botões de Ação: Editar e Excluir -->
                            <div style="display: flex; gap: 6px;">
                                <button class="btn-editar-cliente" 
                                    data-id="${cli.id}"
                                    data-nome="${cli.nome}"
                                    data-canal="${cli.canalPreferencial}"
                                    data-contato="${cli.contato}"
                                    style="background: #FAF7F5; border: 1px solid var(--cor-borda); border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.85rem;"
                                    title="Editar Colega">
                                    ✏️
                                </button>
                                <button class="btn-remover-cliente" 
                                    data-id="${cli.id}" 
                                    data-nome="${cli.nome}"
                                    style="background: #FFF0F0; border: 1px solid #FFCDD2; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 0.85rem; color: var(--cor-perigo);"
                                    title="Excluir Colega">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- MODAL: CADASTRAR OU EDITAR CLIENTE -->
            <div id="modal-cadastro-cliente" class="fundo-modal">
                <div class="janela-modal">
                    <div class="modal-cabecalho">
                        <h3 id="titulo-modal-cliente">Cadastrar Colega de Trabalho</h3>
                        <button class="botao-fechar-modal" data-fechar="modal-cadastro-cliente">&times;</button>
                    </div>
                    <form id="form-cadastro-completo-cliente">
                        <input type="hidden" id="campo-cad-id" value="">
                        <div class="grupo-campo">
                            <label class="rotulo-campo">Nome Completo / Apelido</label>
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
                        <button type="submit" id="btn-salvar-cliente" class="botao botao-primario botao-bloco">Salvar Colega</button>
                    </form>
                </div>
            </div>
        `;
    }
}