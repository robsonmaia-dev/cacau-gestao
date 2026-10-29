import { TelaHistoricoVendas } from '../telas/TelaHistoricoVendas.js';

export class ControladorHistoricoVendas {
    constructor(repositorioVendas, repositorioClientes, casoDeUsoEstornarVenda, aoCorrigirVenda, aoAtualizarDados) {
        this.repositorioVendas = repositorioVendas;
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoEstornarVenda = casoDeUsoEstornarVenda;
        this.aoCorrigirVenda = aoCorrigirVenda;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-historico');

        this.filtros = {
            termo: '',
            tipo: 'TODOS',
            periodo: '30_DIAS'
        };

        this.todasVendas = [];
        this.clientes = [];
    }

    async inicializar() {
        if (!this.container) return;
        TelaHistoricoVendas.renderizarEstrutura(this.container, this.filtros);
        this.vincularEventosFiltros();
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        // Se o container foi esvaziado por outra navegação, remonta a casca
        if (!document.getElementById('filtro-busca-historico')) {
            TelaHistoricoVendas.renderizarEstrutura(this.container, this.filtros);
            this.vincularEventosFiltros();
        }

        try {
            this.todasVendas = await this.repositorioVendas.obterTodas();
            this.clientes = await this.repositorioClientes.obterTodosComHistorico();
            this.aplicarFiltrosNaLista();
        } catch (erro) {
            console.error("Erro ao carregar histórico:", erro);
            const lista = document.getElementById('lista-vendas-historico');
            if (lista) lista.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    aplicarFiltrosNaLista() {
        const mapaClientes = new Map(this.clientes.map(c => [c.id, c.nome.toLowerCase()]));

        const vendasOrdenadas = [...this.todasVendas].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
        const agora = new Date();
        const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
        const seteDiasAtras = agora.getTime() - (7 * 24 * 60 * 60 * 1000);
        const trintaDiasAtras = agora.getTime() - (30 * 24 * 60 * 60 * 1000);

        const vendasFiltradas = vendasOrdenadas.filter(v => {
            const tempoVenda = new Date(v.dataHora).getTime();

            // 1. Filtro Período
            if (this.filtros.periodo === 'HOJE' && tempoVenda < inicioHoje) return false;
            if (this.filtros.periodo === '7_DIAS' && tempoVenda < seteDiasAtras) return false;
            if (this.filtros.periodo === '30_DIAS' && tempoVenda < trintaDiasAtras) return false;

            // 2. Filtro Tipo
            if (this.filtros.tipo !== 'TODOS' && v.tipoPagamento !== this.filtros.tipo) return false;

            // 3. Filtro Busca por Texto
            if (this.filtros.termo) {
                const termo = this.filtros.termo.toLowerCase().trim();
                const nomeCli = v.clienteId ? (mapaClientes.get(v.clienteId) || '') : 'balcão';
                const bateuCliente = nomeCli.includes(termo);
                const bateuProduto = v.itens.some(it => it.nomeProduto.toLowerCase().includes(termo));
                if (!bateuCliente && !bateuProduto) return false;
            }

            return true;
        });

        // Atualiza somente os cards e o contador sem destruir o campo onde o usuário está digitando
        TelaHistoricoVendas.atualizarLista(vendasFiltradas, this.clientes);
        this.vincularBotoesAcao();
    }

    vincularEventosFiltros() {
        const inputBusca = document.getElementById('filtro-busca-historico');
        const selectTipo = document.getElementById('filtro-tipo-historico');
        const selectPeriodo = document.getElementById('filtro-periodo-historico');

        inputBusca?.addEventListener('input', (e) => {
            this.filtros.termo = e.target.value;
            this.aplicarFiltrosNaLista();
        });

        selectTipo?.addEventListener('change', (e) => {
            this.filtros.tipo = e.target.value;
            this.aplicarFiltrosNaLista();
        });

        selectPeriodo?.addEventListener('change', (e) => {
            this.filtros.periodo = e.target.value;
            this.aplicarFiltrosNaLista();
        });
    }

    vincularBotoesAcao() {
        // CANCELAR VENDA (ESTORNO)
        document.querySelectorAll('.btn-cancelar-venda').forEach(btn => {
            btn.addEventListener('click', async () => {
                const vendaId = btn.getAttribute('data-venda-id');
                const confirmado = confirm("Tem certeza que deseja cancelar esta venda?\n\n• Os chocolates retornarão ao estoque.\n• Se era fiado, a dívida do colega será estornada.");
                if (!confirmado) return;

                btn.disabled = true;
                btn.innerText = "Cancelando...";

                try {
                    await this.casoDeUsoEstornarVenda.executar({ vendaId });
                    alert("✅ Venda cancelada com sucesso!");
                    await this.atualizarTela();
                    if (this.aoAtualizarDados) await this.aoAtualizarDados();
                } catch (err) {
                    alert(`Erro ao cancelar venda: ${err.message}`);
                    btn.disabled = false;
                    btn.innerText = "❌ Cancelar";
                }
            });
        });

        // CORRIGIR VENDA (ESTORNA E PREENCHE A TELA DE VENDAS PARA ALTERAÇÃO)
        document.querySelectorAll('.btn-corrigir-venda').forEach(btn => {
            btn.addEventListener('click', async () => {
                const vendaId = btn.getAttribute('data-venda-id');
                const confirmado = confirm("Deseja estornar esta venda e abrir a tela de vendas com os dados preenchidos para você corrigir?");
                if (!confirmado) return;

                btn.disabled = true;
                btn.innerText = "Carregando...";

                try {
                    const res = await this.casoDeUsoEstornarVenda.executar({ vendaId });
                    if (this.aoCorrigirVenda) {
                        await this.aoCorrigirVenda(res);
                    }
                    if (this.aoAtualizarDados) await this.aoAtualizarDados();
                } catch (err) {
                    alert(`Erro ao carregar para correção: ${err.message}`);
                    btn.disabled = false;
                    btn.innerText = "✏️ Corrigir";
                }
            });
        });
    }
}
