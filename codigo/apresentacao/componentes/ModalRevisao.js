/**
 * COMPONENTE: ModalRevisao
 * Interface de conferência e revisão humana antes da gravação de vendas em lote lidas por IA.
 */
export class ModalRevisao {
    /**
     * @param {Object} opcoes
     * @param {Array} opcoes.produtos
     * @param {Array} opcoes.clientes
     * @param {Function} opcoes.aoConfirmarLote - Callback que executa o Caso de Uso RegistrarVenda para cada item
     */
    constructor({ produtos, clientes, aoConfirmarLote }) {
        this.produtos = produtos;
        this.clientes = clientes;
        this.aoConfirmarLote = aoConfirmarLote;
        this.itensRevisao = [];
    }

    /**
     * Abre a gaveta de revisão com os itens detectados
     * @param {Array<{nomeCliente: string, nomeChocolate: string, quantidade: number}>} itensDetectados
     */
    abrirComDados(itensDetectados = []) {
        // Mapeia e tenta associar com clientes e produtos cadastrados por aproximação de nome
        this.itensRevisao = itensDetectados.map((item, index) => {
            const clienteEncontrado = this.clientes.find(c => 
                c.nome.toLowerCase().includes((item.nomeCliente || '').toLowerCase())
            );

            const produtoEncontrado = this.produtos.find(p => 
                p.nome.toLowerCase().includes((item.nomeChocolate || '').toLowerCase())
            );

            return {
                idTemp: index,
                clienteId: clienteEncontrado ? clienteEncontrado.id : '',
                produtoId: produtoEncontrado ? produtoEncontrado.id : '',
                quantidade: item.quantidade || 1,
                textoOriginalCliente: item.nomeCliente || '',
                textoOriginalProduto: item.nomeChocolate || ''
            };
        });

        this.renderizar();
        document.getElementById('modal-revisao-ia').classList.add('aberto');
    }

    renderizar() {
        const modal = document.getElementById('modal-revisao-ia');
        if (!modal) return;

        modal.innerHTML = `
            <div class="janela-modal" style="max-width: 600px;">
                <div class="modal-cabecalho">
                    <h3>🔍 Revisão Humana: Vendas da Folha</h3>
                    <button class="botao-fechar-modal" id="btn-fechar-revisao">&times;</button>
                </div>
                <p style="font-size: 0.8rem; color: var(--cor-texto-suave); margin-bottom: 12px;">
                    Confira os dados lidos pela IA abaixo. Você pode corrigir os colegas, chocolates e quantidades antes de confirmar.
                </p>

                <div id="lista-linhas-revisao" style="max-height: 55vh; overflow-y: auto; margin-bottom: 16px;">
                    ${this.itensRevisao.length === 0 ? `
                        <p style="text-align: center; color: var(--cor-perigo); padding: 20px;">Nenhuma anotação detectada.</p>
                    ` : this.itensRevisao.map(item => `
                        <div class="cartao" style="padding: 10px; margin-bottom: 8px; background: #FFFDF9; border: 1px solid var(--cor-secundaria-leve);" data-item-id="${item.idTemp}">
                            <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                                <!-- Seleção do Colega -->
                                <select class="campo-selecao sel-cliente" style="flex: 2; height: 38px; font-size: 0.85rem;">
                                    <option value="">❓ Quem pegou? (${item.textoOriginalCliente})</option>
                                    ${this.clientes.map(c => `
                                        <option value="${c.id}" ${c.id === item.clienteId ? 'selected' : ''}>${c.nome}</option>
                                    `).join('')}
                                </select>
                                
                                <!-- Quantidade -->
                                <input type="number" class="campo-entrada input-qtd" value="${item.quantidade}" min="1" style="width: 70px; height: 38px; text-align: center; font-size: 0.85rem;">
                                
                                <!-- Botão Remover Linha -->
                                <button type="button" class="btn-remover-linha" data-remover-id="${item.idTemp}" style="background: none; border: none; color: var(--cor-perigo); font-size: 1.2rem; cursor: pointer;">✕</button>
                            </div>

                            <!-- Seleção do Produto -->
                            <select class="campo-selecao sel-produto" style="width: 100%; height: 38px; font-size: 0.85rem;">
                                <option value="">❓ Qual chocolate? (${item.textoOriginalProduto})</option>
                                ${this.produtos.map(p => `
                                    <option value="${p.id}" ${p.id === item.produtoId ? 'selected' : ''}>${p.nome} (Estoque: ${p.obterEstoqueTotal()})</option>
                                `).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; gap: 8px;">
                    <button type="button" id="btn-cancelar-revisao" class="botao botao-suave" style="flex: 1;">Descartar</button>
                    <button type="button" id="btn-confirmar-lote-revisao" class="botao botao-sucesso" style="flex: 2;">
                        Confirmar e Baixar Tudo
                    </button>
                </div>
            </div>
        `;

        this.vincularEventos();
    }

    vincularEventos() {
        const fechar = () => document.getElementById('modal-revisao-ia').classList.remove('aberto');

        document.getElementById('btn-fechar-revisao')?.addEventListener('click', fechar);
        document.getElementById('btn-cancelar-revisao')?.addEventListener('click', fechar);

        // Remover linha de anotação
        document.querySelectorAll('.btn-remover-linha').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-remover-id'));
                this.itensRevisao = this.itensRevisao.filter(i => i.idTemp !== id);
                this.renderizar();
            });
        });

        // Botão de Confirmação em Lote
        document.getElementById('btn-confirmar-lote-revisao')?.addEventListener('click', async () => {
            // Captura os valores ajustados pelo usuário na tela
            const linhas = document.querySelectorAll('#lista-linhas-revisao .cartao');
            const loteFinal = [];

            for (const linha of linhas) {
                const clienteId = linha.querySelector('.sel-cliente').value;
                const produtoId = linha.querySelector('.sel-produto').value;
                const quantidade = Number(linha.querySelector('.input-qtd').value);

                if (!clienteId || !produtoId) {
                    alert("Atenção: existem linhas sem o colega ou sem o chocolate selecionado. Preencha todos ou remova no '✕'.");
                    return;
                }

                loteFinal.push({ clienteId, produtoId, quantidade });
            }

            if (loteFinal.length === 0) return alert("Nenhum item válido para lançar.");

            const btnConfirmar = document.getElementById('btn-confirmar-lote-revisao');
            btnConfirmar.disabled = true;
            btnConfirmar.innerText = "Gravando no Banco...";

            try {
                await this.aoConfirmarLote(loteFinal);
                fechar();
                alert(`🎉 Sucesso! ${loteFinal.length} vendas foram gravadas e o estoque baixado.`);
            } catch (erro) {
                alert(`Erro ao gravar lote: ${erro.message}`);
                btnConfirmar.disabled = false;
                btnConfirmar.innerText = "Confirmar e Baixar Tudo";
            }
        });
    }
}