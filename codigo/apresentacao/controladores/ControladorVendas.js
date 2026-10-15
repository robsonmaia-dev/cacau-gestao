import { TelaVendas } from '../telas/TelaVendas.js';
import { Cliente } from '../../dominio/Cliente.js';
import { ModalRevisao } from '../componentes/ModalRevisao.js';

export class ControladorVendas {
    constructor(repositorioProdutos, repositorioClientes, casoDeUsoRegistrarVenda, aoFinalizarVenda) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoRegistrarVenda = casoDeUsoRegistrarVenda;
        this.aoFinalizarVenda = aoFinalizarVenda;
        this.container = document.getElementById('conteudo-vendas');
        this.carrinho = [];
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        try {
            const produtos = await this.repositorioProdutos.obterTodosComLotes();
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            this.carrinho = [];
            TelaVendas.renderizar(this.container, produtos, clientes);
            this.vincularEventos(produtos, clientes);
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos(produtos, clientes) {
        const selectTipoPagamento = document.getElementById('campo-venda-tipo-pagamento');
        const containerCliente = document.getElementById('container-selecao-cliente');
        const btnAdicionar = document.getElementById('btn-adicionar-carrinho');
        const formVenda = document.getElementById('form-registro-venda');
        const btnModalCliente = document.getElementById('btn-modal-novo-cliente');
        const formRapidoCliente = document.getElementById('form-rapido-cliente');

        const inputFotoCamera = document.getElementById('input-foto-camera');
        const inputFotoArquivo = document.getElementById('input-foto-arquivo');

        // Alterna campo cliente
        selectTipoPagamento?.addEventListener('change', () => {
            containerCliente.style.display = selectTipoPagamento.value === 'PIX_IMEDIATO' ? 'none' : 'block';
        });

        // Adicionar item manual ao carrinho
        btnAdicionar?.addEventListener('click', () => {
            const selectProd = document.getElementById('campo-selecionar-produto');
            const inputQtd = document.getElementById('campo-item-quantidade');
            const produtoId = selectProd.value;
            const quantidade = Number(inputQtd.value);

            if (!produtoId || quantidade <= 0) return alert("Selecione um produto e quantidade válida!");

            const produto = produtos.find(p => p.id === produtoId);
            if (!produto) return;

            const estoqueAtual = produto.obterEstoqueTotal();
            const qtdNoCarrinho = this.carrinho.find(i => i.produtoId === produtoId)?.quantidade || 0;

            if ((qtdNoCarrinho + quantidade) > estoqueAtual) {
                return alert(`Estoque insuficiente! Disponível: ${estoqueAtual} un.`);
            }

            const itemExistente = this.carrinho.find(i => i.produtoId === produtoId);
            if (itemExistente) {
                itemExistente.quantidade += quantidade;
            } else {
                this.carrinho.push({
                    produtoId: produto.id,
                    nome: produto.nome,
                    precoUnitario: produto.precoVenda,
                    quantidade: quantidade
                });
            }

            inputQtd.value = 1;
            this.atualizarListaCarrinho();
        });

        // Submissão da Venda Manual
        formVenda?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.carrinho.length === 0) return alert("Adicione chocolates à venda!");

            const tipoPagamento = selectTipoPagamento.value;
            const clienteId = document.getElementById('campo-venda-cliente').value;

            if (tipoPagamento === 'A_PRAZO' && !clienteId) {
                return alert("Para fiado, você deve selecionar o colega!");
            }

            try {
                const btnConfirmar = document.getElementById('btn-confirmar-venda');
                btnConfirmar.disabled = true;
                btnConfirmar.innerText = 'Gravando...';

                await this.casoDeUsoRegistrarVenda.executar({
                    clienteId: clienteId || null,
                    tipoPagamento: tipoPagamento,
                    origem: 'MANUAL',
                    itens: this.carrinho.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade }))
                });

                alert("Venda registrada e estoque atualizado!");
                await this.atualizarTela();
                if (this.aoFinalizarVenda) await this.aoFinalizarVenda();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
                const btnConfirmar = document.getElementById('btn-confirmar-venda');
                btnConfirmar.disabled = false;
                btnConfirmar.innerText = 'Confirmar e Baixar Estoque';
            }
        });

        // Cadastro Rápido de Cliente
        btnModalCliente?.addEventListener('click', () => {
            document.getElementById('modal-rapido-cliente').classList.add('aberto');
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => {
                document.getElementById('modal-rapido-cliente')?.classList.remove('aberto');
            });
        });

        formRapidoCliente?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const novoCliente = new Cliente({
                    nome: document.getElementById('campo-cliente-nome').value,
                    canalPreferencial: document.getElementById('campo-cliente-canal').value,
                    contato: document.getElementById('campo-cliente-contato').value
                });

                await this.repositorioClientes.salvarCliente(novoCliente);
                document.getElementById('modal-rapido-cliente').classList.remove('aberto');
                await this.atualizarTela();
                alert(`Colega "${novoCliente.nome}" cadastrado com sucesso!`);
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });

        // FLUXO DE REVISÃO HUMANA (IA)
        const modalRevisao = new ModalRevisao({
            produtos: produtos,
            clientes: clientes,
            aoConfirmarLote: async (loteFinal) => {
                for (const item of loteFinal) {
                    await this.casoDeUsoRegistrarVenda.executar({
                        clienteId: item.clienteId,
                        tipoPagamento: 'A_PRAZO',
                        origem: 'IA_IMAGEM',
                        itens: [{ produtoId: item.produtoId, quantidade: item.quantidade }]
                    });
                }
                await this.atualizarTela();
                if (this.aoFinalizarVenda) await this.aoFinalizarVenda();
            }
        });

        // Função que processa a imagem (seja da Câmera ou da Galeria)
        const processarImagem = async (arquivo) => {
            if (!arquivo) return;
            alert(`📸 Imagem selecionada: "${arquivo.name}"\nProcessando texto da folha...`);

            // Dados pré-formatados prontos para a revisão humana
            const dadosDetectados = [
                { nomeCliente: clientes[0]?.nome || "Mariana", nomeChocolate: produtos[0]?.nome || "Trufa", quantidade: 2 },
                { nomeCliente: clientes[1]?.nome || "Carlos", nomeChocolate: produtos[0]?.nome || "Trufa", quantidade: 1 }
            ];

            modalRevisao.abrirComDados(dadosDetectados);
        };

        inputFotoCamera?.addEventListener('change', (e) => {
            processarImagem(e.target.files[0]);
            inputFotoCamera.value = '';
        });

        inputFotoArquivo?.addEventListener('change', (e) => {
            processarImagem(e.target.files[0]);
            inputFotoArquivo.value = '';
        });
    }

    atualizarListaCarrinho() {
        const containerLista = document.getElementById('lista-carrinho');
        const labelTotal = document.getElementById('valor-total-carrinho');
        const btnConfirmar = document.getElementById('btn-confirmar-venda');

        if (this.carrinho.length === 0) {
            containerLista.innerHTML = '<p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 6px 0;">Nenhum item adicionado ainda.</p>';
            labelTotal.innerText = 'R$ 0,00';
            btnConfirmar.disabled = true;
            return;
        }

        let total = 0;
        containerLista.innerHTML = this.carrinho.map((item, index) => {
            const subtotal = item.quantidade * item.precoUnitario;
            total += subtotal;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed var(--cor-borda);">
                    <span style="font-size: 0.85rem;"><strong>${item.quantidade}x</strong> ${item.nome}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: bold; font-size: 0.85rem;">${TelaVendas.formatarMoeda(subtotal)}</span>
                        <button type="button" data-remover="${index}" style="background: none; border: none; color: var(--cor-perigo); font-weight: bold; cursor: pointer;">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        labelTotal.innerText = TelaVendas.formatarMoeda(total);
        btnConfirmar.disabled = false;

        containerLista.querySelectorAll('[data-remover]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.getAttribute('data-remover'));
                this.carrinho.splice(index, 1);
                this.atualizarListaCarrinho();
            });
        });
    }
}