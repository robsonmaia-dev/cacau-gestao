import { TelaCobranca } from '../telas/TelaCobranca.js';

// Normalizador para busca sem acentos
function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

export class ControladorCobranca {
    constructor(repositorioClientes, casoDeUsoGerarCobranca, casoDeUsoRegistrarPagamento, aoAtualizarDados) {
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoGerarCobranca = casoDeUsoGerarCobranca;
        this.casoDeUsoRegistrarPagamento = casoDeUsoRegistrarPagamento;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-cobranca');

        this.chavePix = localStorage.getItem('cacau_chave_pix') || '';
        this.linkCatalogo = localStorage.getItem('cacau_link_catalogo') || '';

        this.devedores = [];
        this.filtros = {
            termo: '',
            canal: 'TODOS',
            ordem: 'MAIOR_VALOR'
        };
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        try {
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            this.devedores = clientes.filter(c => c.possuiDebito());

            const totalGeral = this.devedores.reduce((soma, c) => soma + Number(c.saldoDevedor || 0), 0);

            // Renderiza estrutura estática preservando estado dos filtros
            TelaCobranca.renderizarEstrutura(this.container, {
                totalGeral,
                totalDevedores: this.devedores.length,
                chavePix: this.chavePix,
                linkCatalogo: this.linkCatalogo,
                filtros: this.filtros
            });

            this.vincularEventosGerais();
            this.vincularEventosFiltros();
            this.aplicarFiltrosNaLista();
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    aplicarFiltrosNaLista() {
        const termoBusca = normalizar(this.filtros.termo);

        let filtrados = this.devedores.filter(cli => {
            // 1. Busca textual (Nome ou Contato sem acentos)
            if (termoBusca) {
                const bateuNome = normalizar(cli.nome).includes(termoBusca);
                const bateuContato = normalizar(cli.contato).includes(termoBusca);
                if (!bateuNome && !bateuContato) return false;
            }

            // 2. Filtro de Canal
            if (this.filtros.canal !== 'TODOS' && cli.canalPreferencial !== this.filtros.canal) {
                return false;
            }

            return true;
        });

        // 3. Ordenação Inteligente
        if (this.filtros.ordem === 'MAIOR_VALOR') {
            filtrados.sort((a, b) => Number(b.saldoDevedor) - Number(a.saldoDevedor));
        } else if (this.filtros.ordem === 'MENOR_VALOR') {
            filtrados.sort((a, b) => Number(a.saldoDevedor) - Number(b.saldoDevedor));
        } else if (this.filtros.ordem === 'NOME') {
            filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
        }

        // Atualiza apenas os cards de faturas
        TelaCobranca.atualizarLista(filtrados);
        this.vincularAcoesFaturas(filtrados);
    }

    vincularEventosFiltros() {
        const inputBusca = document.getElementById('filtro-busca-cobranca');
        const btnLimpar = document.getElementById('btn-limpar-busca-cobranca');
        const selectCanal = document.getElementById('filtro-canal-cobranca');
        const selectOrdem = document.getElementById('filtro-ordem-cobranca');

        inputBusca?.addEventListener('input', (e) => {
            this.filtros.termo = e.target.value;
            if (btnLimpar) btnLimpar.style.display = this.filtros.termo ? 'block' : 'none';
            this.aplicarFiltrosNaLista();
        });

        btnLimpar?.addEventListener('click', () => {
            this.filtros.termo = '';
            if (inputBusca) inputBusca.value = '';
            btnLimpar.style.display = 'none';
            this.aplicarFiltrosNaLista();
            inputBusca?.focus();
        });

        selectCanal?.addEventListener('change', (e) => {
            this.filtros.canal = e.target.value;
            this.aplicarFiltrosNaLista();
        });

        selectOrdem?.addEventListener('change', (e) => {
            this.filtros.ordem = e.target.value;
            this.aplicarFiltrosNaLista();
        });
    }

    vincularAcoesFaturas(devedoresFiltrados) {
        // DISPARAR MENSAGEM DE COBRANÇA
        document.querySelectorAll('.btn-gerar-cobranca').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!this.chavePix) {
                    return alert("Por favor, preencha sua Chave Pix no topo da página antes de cobrar!");
                }

                const clienteId = btn.getAttribute('data-cliente-id');
                const cliente = devedoresFiltrados.find(c => c.id === clienteId);
                if (!cliente) return;

                const resultado = await this.casoDeUsoGerarCobranca.executar({
                    cliente: cliente,
                    chavePix: this.chavePix,
                    linkCatalogo: this.linkCatalogo
                });

                if (resultado.canal === 'WHATSAPP') {
                    window.open(resultado.linkWhatsApp, '_blank');
                } else {
                    try {
                        await navigator.clipboard.writeText(resultado.mensagemTexto);
                        const abrirTeams = confirm(
                            `📋 Mensagem copiada com sucesso!\n\nDeseja abrir o Microsoft Teams no chat de "${cliente.nome}" agora?`
                        );
                        if (abrirTeams) {
                            window.open(`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(cliente.contato)}`, '_blank');
                        }
                    } catch (e) {
                        prompt("Copie a mensagem abaixo para enviar no Teams:", resultado.mensagemTexto);
                    }
                }
            });
        });

        // ABRIR MODAL BAIXAR PIX
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
    }

    vincularEventosGerais() {
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

        document.querySelectorAll('.botao-fechar-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('modal-pagamento-cobranca')?.classList.remove('aberto');
            });
        });

        // FORMULÁRIO DE BAIXA COM TRAVA DE DUPLO CLIQUE
        const formPagamento = document.getElementById('form-pagamento-cobranca');
        formPagamento?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnConfirmar = document.getElementById('btn-confirmar-baixa-pix');
            if (btnConfirmar) {
                btnConfirmar.disabled = true;
                btnConfirmar.innerText = "Registrando baixa na nuvem...";
            }

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
            } finally {
                if (btnConfirmar) {
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerText = "Confirmar Baixa do Pagamento";
                }
            }
        });
    }
}
