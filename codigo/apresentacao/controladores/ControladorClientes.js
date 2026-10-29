import { TelaClientes } from '../telas/TelaClientes.js';
import { Cliente } from '../../dominio/Cliente.js';

// Normalizador para busca sem acentos
function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

export class ControladorClientes {
    constructor(repositorioClientes, aoAtualizarDados) {
        this.repositorioClientes = repositorioClientes;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-clientes');

        this.clientes = [];
        this.filtros = {
            termo: '',
            situacao: 'TODOS',
            canal: 'TODOS'
        };
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        try {
            this.clientes = await this.repositorioClientes.obterTodosComHistorico();

            // Renderiza estrutura estática preservando estado dos filtros
            TelaClientes.renderizarEstrutura(this.container, {
                clientes: this.clientes,
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

        const clientesFiltrados = this.clientes.filter(cli => {
            const saldo = Number(cli.saldoDevedor || 0);

            // 1. Busca textual (Nome ou Contato sem acentos)
            if (termoBusca) {
                const bateuNome = normalizar(cli.nome).includes(termoBusca);
                const bateuContato = normalizar(cli.contato).includes(termoBusca);
                if (!bateuNome && !bateuContato) return false;
            }

            // 2. Filtro de Situação Financeira
            if (this.filtros.situacao === 'PENDENTES' && saldo <= 0) return false;
            if (this.filtros.situacao === 'EM_DIA' && saldo > 0) return false;

            // 3. Filtro de Canal
            if (this.filtros.canal !== 'TODOS' && cli.canalPreferencial !== this.filtros.canal) {
                return false;
            }

            return true;
        });

        // Atualiza somente os cards sem perder foco de digitação
        TelaClientes.atualizarLista(clientesFiltrados);
        this.vincularAcoesItens();
    }

    vincularEventosFiltros() {
        const inputBusca = document.getElementById('filtro-busca-cliente');
        const btnLimpar = document.getElementById('btn-limpar-busca-cliente');
        const selectSituacao = document.getElementById('filtro-situacao-cliente');
        const selectCanal = document.getElementById('filtro-canal-cliente');

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

        selectSituacao?.addEventListener('change', (e) => {
            this.filtros.situacao = e.target.value;
            this.aplicarFiltrosNaLista();
        });

        selectCanal?.addEventListener('change', (e) => {
            this.filtros.canal = e.target.value;
            this.aplicarFiltrosNaLista();
        });
    }

    vincularAcoesItens() {
        const modal = document.getElementById('modal-cadastro-cliente');
        const campoId = document.getElementById('campo-cad-id');
        const campoNome = document.getElementById('campo-cad-nome');
        const selectCanal = document.getElementById('campo-cad-canal');
        const campoContato = document.getElementById('campo-cad-contato');
        const rotuloContato = document.getElementById('rotulo-cad-contato');

        // Botão Editar Cliente
        document.querySelectorAll('.btn-editar-cliente').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');
                const canal = btn.getAttribute('data-canal');
                const contato = btn.getAttribute('data-contato');

                campoId.value = id;
                campoNome.value = nome;
                selectCanal.value = canal;
                campoContato.value = contato;

                if (canal === 'WHATSAPP') {
                    rotuloContato.innerText = "Número do WhatsApp (DDD + Número)";
                    campoContato.placeholder = "Ex: 11987654321";
                } else {
                    rotuloContato.innerText = "E-mail corporativo do Teams";
                    campoContato.placeholder = "Ex: colega@empresa.com";
                }

                document.getElementById('titulo-modal-cliente').innerText = `Editar: ${nome}`;
                modal?.classList.add('aberto');
            });
        });

        // Botão Remover Cliente
        document.querySelectorAll('.btn-remover-cliente').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');

                const cliente = this.clientes.find(c => c.id === id);
                if (cliente && cliente.saldoDevedor > 0) {
                    return alert(
                        `⛔ Não é possível excluir "${nome}" porque ainda existe um saldo devedor de R$ ${cliente.saldoDevedor.toFixed(2)} em aberto!\nReceba o valor na aba Cobrança antes de excluir.`
                    );
                }

                if (confirm(`Tem certeza que deseja remover "${nome}" do cadastro?`)) {
                    try {
                        await this.repositorioClientes.remover(id);
                        alert(`Cliente "${nome}" removido com sucesso.`);
                        await this.atualizarTela();
                        if (this.aoAtualizarDados) await this.aoAtualizarDados();
                    } catch (erro) {
                        alert(`Erro ao remover: ${erro.message}`);
                    }
                }
            });
        });
    }

    vincularEventosGerais() {
        const btnAbrirModal = document.getElementById('btn-abrir-modal-novo-cliente');
        const modal = document.getElementById('modal-cadastro-cliente');
        const form = document.getElementById('form-cadastro-completo-cliente');
        const selectCanal = document.getElementById('campo-cad-canal');
        const rotuloContato = document.getElementById('rotulo-cad-contato');
        const campoContato = document.getElementById('campo-cad-contato');
        const campoId = document.getElementById('campo-cad-id');
        const campoNome = document.getElementById('campo-cad-nome');

        const ajustarRotuloContato = () => {
            if (selectCanal.value === 'WHATSAPP') {
                rotuloContato.innerText = "Número do WhatsApp (DDD + Número)";
                campoContato.placeholder = "Ex: 11987654321";
            } else {
                rotuloContato.innerText = "E-mail corporativo do Teams";
                campoContato.placeholder = "Ex: colega@empresa.com";
            }
        };

        selectCanal?.addEventListener('change', ajustarRotuloContato);

        btnAbrirModal?.addEventListener('click', () => {
            campoId.value = '';
            campoNome.value = '';
            selectCanal.value = 'TEAMS';
            campoContato.value = '';
            ajustarRotuloContato();
            document.getElementById('titulo-modal-cliente').innerText = 'Cadastrar Novo Cliente';
            modal?.classList.add('aberto');
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => modal?.classList.remove('aberto'));
        });

        // SUBMIT COM TRAVA DE DUPLO CLIQUE
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvar = document.getElementById('btn-salvar-cliente');
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerText = "Salvando cliente...";
            }

            const idExistente = campoId.value;
            const nome = campoNome.value;
            const canal = selectCanal.value;
            const contato = campoContato.value;

            try {
                const clienteExistente = idExistente ? this.clientes.find(c => c.id === idExistente) : null;
                const clienteParaSalvar = new Cliente({
                    id: idExistente || undefined,
                    nome: nome,
                    canalPreferencial: canal,
                    contato: contato,
                    saldoDevedor: clienteExistente ? clienteExistente.saldoDevedor : 0,
                    historicoPagamentos: clienteExistente ? clienteExistente.historicoPagamentos : []
                });

                await this.repositorioClientes.salvarCliente(clienteParaSalvar);
                modal?.classList.remove('aberto');
                alert(`Cliente "${clienteParaSalvar.nome}" salvo com sucesso!`);
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.innerText = "Salvar Cliente";
                }
            }
        });
    }
}
