import { TelaEstoque } from '../telas/TelaEstoque.js';
import { Produto } from '../../dominio/Produto.js';

// Normalizador de texto para busca sem acentos
function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

export class ControladorEstoque {
    constructor(repositorioProdutos, casoDeUsoComprarEstoque, aoAtualizarDados) {
        this.repositorioProdutos = repositorioProdutos;
        this.casoDeUsoComprarEstoque = casoDeUsoComprarEstoque;
        this.aoAtualizarDados = aoAtualizarDados;
        this.container = document.getElementById('conteudo-estoque');

        this.produtos = [];
        this.filtros = {
            termo: '',
            categoria: 'TODAS',
            status: 'TODOS'
        };
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        try {
            this.produtos = await this.repositorioProdutos.obterTodosComLotes();

            // Renderiza a estrutura da tela preservando os filtros ativos
            TelaEstoque.renderizarEstrutura(this.container, {
                produtos: this.produtos,
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

        const produtosFiltrados = this.produtos.filter(prod => {
            const estoque = prod.obterEstoqueTotal();

            // 1. Filtro textual (Nome ou Categoria sem acentos)
            if (termoBusca) {
                const bateuNome = normalizar(prod.nome).includes(termoBusca);
                const bateuCategoria = normalizar(prod.categoria).includes(termoBusca);
                if (!bateuNome && !bateuCategoria) return false;
            }

            // 2. Filtro de Categoria
            if (this.filtros.categoria !== 'TODAS' && prod.categoria !== this.filtros.categoria) {
                return false;
            }

            // 3. Filtro de Status
            if (this.filtros.status === 'REPOSICAO' && !prod.precisaDeReposicao()) {
                return false;
            }
            if (this.filtros.status === 'ESGOTADOS' && estoque > 0) {
                return false;
            }
            if (this.filtros.status === 'COM_ESTOQUE' && estoque === 0) {
                return false;
            }
            if (this.filtros.status === 'VENCENDO') {
                const temLoteVencendo = prod.lotes.some(l => !l.estaEsgotado() && l.estaProximoDoVencimento(15));
                if (!temLoteVencendo) return false;
            }

            return true;
        });

        // Atualiza somente a lista interna de itens sem recriar o input de busca
        TelaEstoque.atualizarLista(produtosFiltrados);
        this.vincularAcoesItens();
    }

    vincularEventosFiltros() {
        const inputBusca = document.getElementById('filtro-busca-estoque');
        const btnLimpar = document.getElementById('btn-limpar-busca-estoque');
        const selectCat = document.getElementById('filtro-categoria-estoque');
        const selectStatus = document.getElementById('filtro-status-estoque');

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

        selectCat?.addEventListener('change', (e) => {
            this.filtros.categoria = e.target.value;
            this.aplicarFiltrosNaLista();
        });

        selectStatus?.addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.aplicarFiltrosNaLista();
        });
    }

    vincularAcoesItens() {
        // Botão Editar Produto
        document.querySelectorAll('.btn-editar-produto').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');
                const categoria = btn.getAttribute('data-categoria');
                const preco = btn.getAttribute('data-preco');
                const minimo = btn.getAttribute('data-minimo');

                document.getElementById('campo-prod-id').value = id;
                document.getElementById('campo-prod-nome').value = nome;
                document.getElementById('campo-prod-categoria').value = categoria;
                document.getElementById('campo-prod-preco').value = preco;
                document.getElementById('campo-prod-minimo').value = minimo;

                document.getElementById('titulo-modal-produto').innerText = `Editar: ${nome}`;
                this.alternarModal('modal-produto', true);
            });
        });

        // Botão Excluir Produto
        document.querySelectorAll('.btn-excluir-produto').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');
                const estoque = Number(btn.getAttribute('data-estoque'));

                let mensagemAviso = `Tem certeza que deseja excluir o produto "${nome}"?`;
                if (estoque > 0) {
                    mensagemAviso = `⚠️ ATENÇÃO: "${nome}" ainda possui ${estoque} unidade(s) em estoque!\nAo excluir, todos os lotes deste produto serão apagados do banco.\nDeseja mesmo continuar?`;
                }

                if (confirm(mensagemAviso)) {
                    try {
                        await this.repositorioProdutos.remover(id);
                        alert(`Produto "${nome}" excluído com sucesso!`);
                        await this.atualizarTela();
                        if (this.aoAtualizarDados) await this.aoAtualizarDados();
                    } catch (erro) {
                        alert(`Erro ao excluir: ${erro.message}`);
                    }
                }
            });
        });
    }

    vincularEventosGerais() {
        const btnModalProd = document.getElementById('btn-abrir-modal-produto');
        const btnModalCompra = document.getElementById('btn-abrir-modal-compra');
        const formProduto = document.getElementById('form-novo-produto');
        const formCompra = document.getElementById('form-nova-compra');

        btnModalProd?.addEventListener('click', () => {
            document.getElementById('campo-prod-id').value = '';
            document.getElementById('campo-prod-nome').value = '';
            document.getElementById('campo-prod-categoria').value = 'Trufas';
            document.getElementById('campo-prod-preco').value = '';
            document.getElementById('campo-prod-minimo').value = '5';
            document.getElementById('titulo-modal-produto').innerText = 'Novo Produto no Catálogo';
            this.alternarModal('modal-produto', true);
        });

        btnModalCompra?.addEventListener('click', () => this.alternarModal('modal-compra', true));

        document.querySelectorAll('.botao-fechar-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-fechar');
                this.alternarModal(modalId, false);
            });
        });

        // SUBMIT NOVO / EDITAR PRODUTO (COM TRAVA DE DUPLO CLIQUE)
        formProduto?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvar = document.getElementById('btn-salvar-produto');
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerText = "Salvando produto...";
            }

            const idExistente = document.getElementById('campo-prod-id').value;
            const nome = document.getElementById('campo-prod-nome').value;
            const categoria = document.getElementById('campo-prod-categoria').value;
            const preco = document.getElementById('campo-prod-preco').value;
            const minimo = document.getElementById('campo-prod-minimo').value;

            try {
                const produtoExistente = idExistente ? this.produtos.find(p => p.id === idExistente) : null;
                const produtoParaGravar = new Produto({
                    id: idExistente || undefined,
                    nome: nome,
                    categoria: categoria,
                    precoVenda: preco,
                    estoqueMinimo: minimo,
                    lotes: produtoExistente ? produtoExistente.lotes : []
                });

                await this.repositorioProdutos.salvarProduto(produtoParaGravar);
                this.alternarModal('modal-produto', false);
                alert(`Produto "${produtoParaGravar.nome}" salvo com sucesso!`);
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.innerText = "Salvar Produto";
                }
            }
        });

        // SUBMIT COMPRA (COM TRAVA DE DUPLO CLIQUE)
        formCompra?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmeter = formCompra.querySelector('button[type="submit"]');
            if (btnSubmeter) {
                btnSubmeter.disabled = true;
                btnSubmeter.innerText = "Registrando na nuvem...";
            }

            try {
                await this.casoDeUsoComprarEstoque.executar({
                    produtoId: document.getElementById('campo-compra-produto').value,
                    quantidade: document.getElementById('campo-compra-qtd').value,
                    precoCustoUnitario: document.getElementById('campo-compra-custo').value,
                    dataValidade: document.getElementById('campo-compra-validade').value
                });

                this.alternarModal('modal-compra', false);
                alert("Entrada de estoque registrada com sucesso na nuvem!");
                await this.atualizarTela();
                if (this.aoAtualizarDados) await this.aoAtualizarDados();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            } finally {
                if (btnSubmeter) {
                    btnSubmeter.disabled = false;
                    btnSubmeter.innerText = "Registrar Entrada no Estoque";
                }
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
