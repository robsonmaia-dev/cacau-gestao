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

        // Alterna o placeholder conforme Teams ou WhatsApp
        selectCanal?.addEventListener('change', () => {
            if (selectCanal.value === 'WHATSAPP') {
                rotuloContato.innerText = "Número do WhatsApp (DDD + Número)";
                campoContato.placeholder = "Ex: 11987654321";
            } else {
                rotuloContato.innerText = "E-mail corporativo do Teams";
                campoContato.placeholder = "Ex: colega@empresa.com";
            }
        });

        // Abrir e fechar modal
        btnAbrirModal?.addEventListener('click', () => modal.classList.add('aberto'));
        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => modal.classList.remove('aberto'));
        });

        // Salvar cliente
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const novo = new Cliente({
                    nome: document.getElementById('campo-cad-nome').value,
                    canalPreferencial: selectCanal.value,
                    contato: campoContato.value
                });

                await this.repositorioClientes.salvarCliente(novo);
                modal.classList.remove('aberto');
                alert(`Colega "${novo.nome}" cadastrado com sucesso!`);
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });

        // Excluir cliente
        document.querySelectorAll('.btn-remover-cliente').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');

                const cliente = clientes.find(c => c.id === id);
                if (cliente && cliente.saldoDevedor > 0) {
                    return alert(`Não é possível excluir ${nome} pois ainda existe saldo devedor de R$ ${cliente.saldoDevedor.toFixed(2)}.`);
                }

                if (confirm(`Deseja remover "${nome}" do cadastro?`)) {
                    await this.repositorioClientes.remover(id);
                    await this.atualizarTela();
                    if (this.aoAtualizarDados) await this.aoAtualizarDados();
                }
            });
        });
    }
}