import { TelaGestao } from '../telas/TelaGestao.js';

/**
 * CONTROLADOR: ControladorGestao
 * Orquestra as consultas de inteligência estratégica e atualiza a TelaGestao.
 */
export class ControladorGestao {
    /**
     * @param {import('../../casos-de-uso/CalcularPontoEquilibrio.js').CalcularPontoEquilibrio} casoDeUsoPontoEquilibrio
     * @param {import('../../casos-de-uso/CalcularCapitalEstoque.js').CalcularCapitalEstoque} casoDeUsoCapitalEstoque
     * @param {import('../../casos-de-uso/ObterDesempenhoProdutos.js').ObterDesempenhoProdutos} casoDeUsoDesempenhoProdutos
     * @param {import('../../casos-de-uso/CalcularPrevisaoReposicao.js').CalcularPrevisaoReposicao} casoDeUsoPrevisaoReposicao
     * @param {import('../../casos-de-uso/ObterPerfilClientes.js').ObterPerfilClientes} casoDeUsoPerfilClientes
     */
    constructor(
        casoDeUsoPontoEquilibrio,
        casoDeUsoCapitalEstoque,
        casoDeUsoDesempenhoProdutos,
        casoDeUsoPrevisaoReposicao,
        casoDeUsoPerfilClientes
    ) {
        this.casoDeUsoPontoEquilibrio = casoDeUsoPontoEquilibrio;
        this.casoDeUsoCapitalEstoque = casoDeUsoCapitalEstoque;
        this.casoDeUsoDesempenhoProdutos = casoDeUsoDesempenhoProdutos;
        this.casoDeUsoPrevisaoReposicao = casoDeUsoPrevisaoReposicao;
        this.casoDeUsoPerfilClientes = casoDeUsoPerfilClientes;
        this.container = document.getElementById('conteudo-gestao');
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        this.container.innerHTML = '<p style="text-align: center; padding: 20px;">Carregando inteligência estratégica...</p>';

        try {
            // Executa os 5 Casos de Uso de forma assíncrona paralela (ultra-rápido)
            const [
                pontoEquilibrio,
                capitalEstoque,
                desempenho,
                previsaoReposicao,
                perfilClientes
            ] = await Promise.all([
                this.casoDeUsoPontoEquilibrio.executar(),
                this.casoDeUsoCapitalEstoque.executar(),
                this.casoDeUsoDesempenhoProdutos.executar(),
                this.casoDeUsoPrevisaoReposicao.executar(),
                this.casoDeUsoPerfilClientes.executar()
            ]);

            // Renderiza na tela
            TelaGestao.renderizar(this.container, {
                pontoEquilibrio,
                capitalEstoque,
                desempenho,
                previsaoReposicao,
                perfilClientes
            });

        } catch (erro) {
            console.error("Erro ao carregar indicadores de gestão:", erro);
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center; padding: 20px;">Erro: ${erro.message}</p>`;
        }
    }
}