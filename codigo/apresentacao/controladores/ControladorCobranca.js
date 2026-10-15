import { TelaCobranca } from '../telas/TelaCobranca.js';

export class ControladorCobranca {
    constructor(repositorioClientes, casoDeUsoGerarCobranca, casoDeUsoRegistrarPagamento, aoAtualizarDados) {
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoGerarCobranca = casoDeUsoGerarCobranca;
        this.casoDeUsoRegistrarPagamento = casoDeUsoRegistrarPagamento;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-cobranca');

        this.chavePix = localStorage.getItem('cacau_chave_pix') || '';
        this.linkCatalogo = localStorage.getItem('cacau_link_catalogo') || '';
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        try {
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            const devedores = clientes.filter(c => c.possuiDebito());

            TelaCobranca.renderizar(this.container, devedores, this.chavePix, this.linkCatalogo);
            this.vincularEventos(devedores);
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos(devedores) {
        const inputPix = document.getElementById('campo-chave-pix');
        const inputCatalogo = document.getElementById('campo-link-catalogo');

        inputPix?.addEventListener('change', () => {
            this.chavePix = inputPix.value.trim();
            localStorage.setItem('cacau_chave_pix', this.chavePix);
        });

        inputCatalogo?.addEventListener('change', () => {
            this.linkCatalogo = inputCatalogo.value.trim();
            localStorage.setItem('cacau_link_catalogo', this.linkCatalogo);
        });

        // DISPARO INTELIGENTE: TEAMS OU WHATSAPP
        document.querySelectorAll('.btn-gerar-cobranca').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!this.chavePix) {
                    return alert("Por favor, preencha sua Chave Pix no topo da página antes de cobrar!");
                }

                const clienteId = btn.getAttribute('data-cliente-id');
                const cliente = devedores.find(c => c.id === clienteId);
                if (!cliente) return;

                const resultado = await this.casoDeUsoGerarCobranca.executar({
                    cliente: cliente,
                    chavePix: this.chavePix,
                    linkCatalogo: this.linkCatalogo
                });

                if (resultado.canal === 'WHATSAPP') {
                    // Abre o WhatsApp Web ou App do celular com o chat e texto prontos
                    window.open(resultado.linkWhatsApp, '_blank');
                } else {
                    // TEAMS: Copia a mensagem com formatação e tenta abrir o chat do Teams
                    try {
                        await navigator.clipboard.writeText(resultado.mensagemTexto);
                        const abrirTeams = confirm(
                            `📋 Mensagem copiada com sucesso!\n\nDeseja abrir o Microsoft Teams no chat de "${cliente.nome}" agora?`
                        );
                        if (abrirTeams) {
                            // Protocolo universal de abertura do Teams pelo e-mail
                            window.open(`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(cliente.contato)}`, '_blank');
                        }
                    } catch (e) {
                        prompt("Copie a mensagem abaixo para enviar no Teams:", resultado.mensagemTexto);
                    }
                }
            });
        });

        // Baixa de Pagamento
        document.querySelectorAll('.btn-quitar-debito').forEach(btn => {
            btn.addEventListener('click', () => {
                const clienteId = btn.getAttribute('data-cliente-id');
                const clienteNome = btn.getAttribute('data-cliente-nome');
                const saldo = btn.getAttribute('data-saldo');

                document.getElementById('pagamento-cliente-id').value = clienteId;
                document.getElementById('titulo-modal-pagamento').innerText = `Baixar Pagamento: ${clienteNome}`;
                document.getElementById('pagamento-valor').value = Number(saldo).toFixed(2);
                document.getElementById('modal-pagamento-cobranca').classList.add('aberto');
            });
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('modal-pagamento-cobranca').classList.remove('aberto');
            });
        });

        const formPagamento = document.getElementById('form-pagamento-cobranca');
        formPagamento?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteId = document.getElementById('pagamento-cliente-id').value;
            const valor = document.getElementById('pagamento-valor').value;
            const metodo = document.getElementById('pagamento-metodo').value;

            try {
                const res = await this.casoDeUsoRegistrarPagamento.executar({
                    clienteId: clienteId,
                    valor: valor,
                    metodo: metodo,
                    observacao: "Acerto pelo painel de cobrança"
                });

                document.getElementById('modal-pagamento-cobranca').classList.remove('aberto');
                alert(res.mensagem);
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });
    }
}