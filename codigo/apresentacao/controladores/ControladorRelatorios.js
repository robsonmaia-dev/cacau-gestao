import { TelaRelatorios } from '../telas/TelaRelatorios.js';

export class ControladorRelatorios {
    /**
     * @param {import('../../casos-de-uso/ObterBalancoFinanceiro.js').ObterBalancoFinanceiro} casoDeUsoBalanco
     * @param {import('../../casos-de-uso/RegistrarPerda.js').RegistrarPerda} casoDeUsoRegistrarPerda
     * @param {import('../../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {Function} aoAtualizarDados - Callback para atualizar estoque se houver perda
     */
    constructor(casoDeUsoBalanco, casoDeUsoRegistrarPerda, repositorioProdutos, aoAtualizarDados) {
        this.casoDeUsoBalanco = casoDeUsoBalanco;
        this.casoDeUsoRegistrarPerda = casoDeUsoRegistrarPerda;
        this.repositorioProdutos = repositorioProdutos;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-relatorios');
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        try {
            const balanco = await this.casoDeUsoBalanco.executar();
            const produtos = await this.repositorioProdutos.obterTodosComLotes();
            TelaRelatorios.renderizar(this.container, balanco, produtos);
            this.vincularEventos();
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos() {
        const btnAbrirModal = document.getElementById('btn-abrir-modal-perda');
        btnAbrirModal?.addEventListener('click', () => {
            document.getElementById('modal-perda').classList.add('aberto');
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => {
                document.getElementById('modal-perda').classList.remove('aberto');
            });
        });

        const formPerda = document.getElementById('form-registro-perda');
        formPerda?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const produtoId = document.getElementById('campo-perda-produto').value;
            const quantidade = document.getElementById('campo-perda-qtd').value;
            const motivo = document.getElementById('campo-perda-motivo').value;
            const obs = document.getElementById('campo-perda-obs').value;

            try {
                const res = await this.casoDeUsoRegistrarPerda.executar({
                    produtoId: produtoId,
                    quantidade: quantidade,
                    motivo: motivo,
                    observacao: obs
                });

                document.getElementById('modal-perda').classList.remove('aberto');
                alert(`${res.mensagem}\nPrejuízo registrado: R$ ${res.prejuizoTotal.toFixed(2)}`);
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });
    }
}