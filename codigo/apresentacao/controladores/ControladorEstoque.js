import { TelaEstoque } from '../telas/TelaEstoque.js';
import { Produto } from '../../dominio/Produto.js';

export class ControladorEstoque {
    /**
     * @param {import('../../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {import('../../casos-de-uso/ComprarEstoque.js').ComprarEstoque} casoDeUsoComprarEstoque
     */
    constructor(repositorioProdutos, casoDeUsoComprarEstoque) {
        this.repositorioProdutos = repositorioProdutos;
        this.casoDeUsoComprarEstoque = casoDeUsoComprarEstoque;
        this.container = document.getElementById('conteudo-estoque');
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        this.container.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando dados da nuvem...</p>';
        try {
            const produtos = await this.repositorioProdutos.obterTodosComLotes();
            TelaEstoque.renderizar(this.container, produtos);
            this.vincularEventos();
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos() {
        // Abertura de Modais
        const btnModalProd = document.getElementById('btn-abrir-modal-produto');
        const btnModalCompra = document.getElementById('btn-abrir-modal-compra');

        btnModalProd?.addEventListener('click', () => this.alternarModal('modal-produto', true));
        btnModalCompra?.addEventListener('click', () => this.alternarModal('modal-compra', true));

        // Fechamento de Modais
        document.querySelectorAll('.botao-fechar-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-fechar');
                this.alternarModal(modalId, false);
            });
        });

        // Submissão do Formulário de Novo Produto
        const formProduto = document.getElementById('form-novo-produto');
        formProduto?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const novoProduto = new Produto({
                    nome: document.getElementById('campo-prod-nome').value,
                    categoria: document.getElementById('campo-prod-categoria').value,
                    precoVenda: document.getElementById('campo-prod-preco').value,
                    estoqueMinimo: document.getElementById('campo-prod-minimo').value
                });

                await this.repositorioProdutos.salvarProduto(novoProduto);
                this.alternarModal('modal-produto', false);
                await this.atualizarTela();
                alert(`Produto "${novoProduto.nome}" cadastrado com sucesso!`);
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });

        // Submissão do Formulário de Compra de Lote
        const formCompra = document.getElementById('form-nova-compra');
        formCompra?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await this.casoDeUsoComprarEstoque.executar({
                    produtoId: document.getElementById('campo-compra-produto').value,
                    quantidade: document.getElementById('campo-compra-qtd').value,
                    precoCustoUnitario: document.getElementById('campo-compra-custo').value,
                    dataValidade: document.getElementById('campo-compra-validade').value
                });

                this.alternarModal('modal-compra', false);
                await this.atualizarTela();
                alert("Entrada de estoque registrada com sucesso na nuvem!");
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });
    }

    alternarModal(modalId, abrir) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (abrir) modal.classList.add('aberto');
            else modal.classList.remove('aberto');
        }
    }
}