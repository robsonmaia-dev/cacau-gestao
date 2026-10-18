import { TelaClientes } from '../telas/TelaClientes.js';
import { Cliente } from '../../dominio/Cliente.js';

export class ControladorClientes {
    /**
     * @param {import('../../repositorios/RepositorioClientes.js').RepositorioClientes} repositorioClientes
     * @param {Function} aoAtualizarDados - Callback para atualizar outras abas (vendas, cobrança)
     */
    constructor(repositorioClientes, aoAtualizarDados) {
        this.repositorioClientes = repositorioClientes;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-clientes');
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        try {
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            TelaClientes.renderizar(this.container, clientes);
            this.vincularEventos(clientes);
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos(clientes) {
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

        // Abrir para NOVO CLIENTE (limpa campos)
        btnAbrirModal?.addEventListener('click', () => {
            campoId.value = '';
            campoNome.value = '';
            selectCanal.value = 'TEAMS';
            campoContato.value = '';
            ajustarRotuloContato();
            document.getElementById('titulo-modal-cliente').innerText = 'Cadastrar Colega de Trabalho';
            modal.classList.add('aberto');
        });

        // Fechar modal
        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => modal.classList.remove('aberto'));
        });

        // BOTÃO EDITAR CLIENTE (Preenche com os dados existentes)
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
                ajustarRotuloContato();

                document.getElementById('titulo-modal-cliente').innerText = `Editar: ${nome}`;
                modal.classList.add('aberto');
            });
        });

        // BOTÃO EXCLUIR CLIENTE (Protegido contra saldos pendentes)
        document.querySelectorAll('.btn-remover-cliente').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');

                const cliente = clientes.find(c => c.id === id);
                if (cliente && cliente.saldoDevedor > 0) {
                    return alert(
                        `⛔ Não é possível excluir "${nome}" porque ainda existe um saldo devedor de R$ ${cliente.saldoDevedor.toFixed(2)} em aberto!\nReceba o valor na aba Cobrança antes de excluir.`
                    );
                }

                if (confirm(`Tem certeza que deseja remover "${nome}" do cadastro?`)) {
                    try {
                        await this.repositorioClientes.remover(id);
                        alert(`Colega "${nome}" removido com sucesso.`);
                        await this.atualizarTela();
                        if (this.aoAtualizarDados) await this.aoAtualizarDados();
                    } catch (erro) {
                        alert(`Erro ao remover: ${erro.message}`);
                    }
                }
            });
        });

        // SALVAR CLIENTE (INCLUSÃO OU EDIÇÃO)
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idExistente = campoId.value;
            const nome = campoNome.value;
            const canal = selectCanal.value;
            const contato = campoContato.value;

            try {
                const clienteExistente = idExistente ? clientes.find(c => c.id === idExistente) : null;
                const clienteParaSalvar = new Cliente({
                    id: idExistente || undefined,
                    nome: nome,
                    canalPreferencial: canal,
                    contato: contato,
                    saldoDevedor: clienteExistente ? clienteExistente.saldoDevedor : 0,
                    historicoPagamentos: clienteExistente ? clienteExistente.historicoPagamentos : []
                });

                await this.repositorioClientes.salvarCliente(clienteParaSalvar);
                modal.classList.remove('aberto');
                alert(`Colega "${clienteParaSalvar.nome}" salvo com sucesso!`);
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });
    }
}