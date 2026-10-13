/**
 * PONTO DE ENTRADA PRINCIPAL DA APLICAÇÃO (BOOTSTRAP)
 * Responsável por inicializar eventos globais, navegação e injeção de dependências.
 */

// Função que gerencia a troca de abas da interface
function configurarNavegacaoAbas() {
    const botoesNavegacao = document.querySelectorAll('.botao-aba');
    const secoesAba = document.querySelectorAll('.secao-aba');

    botoesNavegacao.forEach(botao => {
        botao.addEventListener('click', () => {
            const idAbaAlvo = botao.getAttribute('data-aba');

            // 1. Remove o estado ativo de todos os botões e seções
            botoesNavegacao.forEach(b => b.classList.remove('ativa'));
            secoesAba.forEach(s => s.classList.remove('ativa'));

            // 2. Ativa o botão clicado
            botao.classList.add('ativa');

            // 3. Exibe a seção correspondente
            const secaoAlvo = document.getElementById(idAbaAlvo);
            if (secaoAlvo) {
                secaoAlvo.classList.add('ativa');
            }
        });
    });
}

// Inicializador dos futuros controladores (será preenchido nas próximas fases)
function inicializarControladores() {
    console.log("Controladores prontos para inicialização.");
}

// Inicialização Geral da Aplicação
function iniciarAplicacao() {
    console.log("🍫 Inicializando Cacau Gestão...");

    // Ativa os cliques da barra de navegação inferior
    configurarNavegacaoAbas();

    // Inicializa a camada de apresentação
    inicializarControladores();

    // Atualiza o indicador visual de status no cabeçalho
    const indicador = document.getElementById('indicador-conexao');
    if (indicador) {
        indicador.innerText = '● Pronto';
        indicador.style.color = 'var(--cor-sucesso)';
    }

    console.log(" Cacau Gestão carregado com sucesso!");
}

// Aguarda o carregamento completo do DOM antes de iniciar
document.addEventListener('DOMContentLoaded', iniciarAplicacao);