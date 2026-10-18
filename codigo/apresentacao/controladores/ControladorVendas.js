 import { TelaVendas } from '../telas/TelaVendas.js';
import { Cliente } from '../../dominio/Cliente.js';
import { ModalRevisao } from '../componentes/ModalRevisao.js';

export class ControladorVendas {
    constructor(repositorioProdutos, repositorioClientes, casoDeUsoRegistrarVenda, aoFinalizarVenda) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoRegistrarVenda = casoDeUsoRegistrarVenda;
        this.aoFinalizarVenda = aoFinalizarVenda;
        this.container = document.getElementById('conteudo-vendas');
        this.carrinho = [];
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        try {
            const produtos = await this.repositorioProdutos.obterTodosComLotes();
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            this.carrinho = [];
            TelaVendas.renderizar(this.container, produtos, clientes);
            this.vincularEventos(produtos, clientes);
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos(produtos, clientes) {
        const selectTipoPagamento = document.getElementById('campo-venda-tipo-pagamento');
        const containerCliente = document.getElementById('container-selecao-cliente');
        const selectProd = document.getElementById('campo-selecionar-produto');
        const inputQtd = document.getElementById('campo-item-quantidade');
        const selectTipoDesconto = document.getElementById('campo-tipo-desconto');
        const inputValorDesconto = document.getElementById('campo-valor-desconto');
        const rotuloPrecoFinal = document.getElementById('rotulo-preco-unitario-final');
        const btnAdicionar = document.getElementById('btn-adicionar-carrinho');
        const formVenda = document.getElementById('form-registro-venda');

        const btnModalCliente = document.getElementById('btn-modal-novo-cliente');
        const formRapidoCliente = document.getElementById('form-rapido-cliente');

        const inputFotoCamera = document.getElementById('input-foto-camera');
        const inputFotoArquivo = document.getElementById('input-foto-arquivo');

        // Alterna campo cliente
        selectTipoPagamento?.addEventListener('change', () => {
            containerCliente.style.display = selectTipoPagamento.value === 'PIX_IMEDIATO' ? 'none' : 'block';
        });

        // CÁLCULO DINÂMICO DE PREÇO COM DESCONTO
        const calcularPrecoUnitarioFinal = () => {
            const produtoId = selectProd.value;
            if (!produtoId) {
                rotuloPrecoFinal.innerText = "Unitário: R$ 0,00";
                return 0;
            }

            const produto = produtos.find(p => p.id === produtoId);
            if (!produto) return 0;

            const precoTabela = produto.precoVenda;
            const modo = selectTipoDesconto.value;
            let precoCalculado = precoTabela;

            if (modo === 'PADRAO') {
                inputValorDesconto.disabled = true;
                inputValorDesconto.value = '';
                inputValorDesconto.placeholder = '-';
                precoCalculado = precoTabela;
            } else if (modo === 'PORCENTAGEM') {
                inputValorDesconto.disabled = false;
                inputValorDesconto.placeholder = 'Ex: 10';
                const pct = Number(inputValorDesconto.value) || 0;
                precoCalculado = Math.max(0, precoTabela * (1 - (pct / 100)));
            } else if (modo === 'VALOR_FINAL') {
                inputValorDesconto.disabled = false;
                inputValorDesconto.placeholder = `Ex: ${precoTabela.toFixed(2)}`;
                if (inputValorDesconto.value !== '') {
                    precoCalculado = Number(inputValorDesconto.value) || 0;
                }
            }

            rotuloPrecoFinal.innerText = `Unitário: ${TelaVendas.formatarMoeda(precoCalculado)}`;
            return Number(precoCalculado.toFixed(2));
        };

        selectProd?.addEventListener('change', () => {
            selectTipoDesconto.value = 'PADRAO';
            calcularPrecoUnitarioFinal();
        });

        selectTipoDesconto?.addEventListener('change', calcularPrecoUnitarioFinal);
        inputValorDesconto?.addEventListener('input', calcularPrecoUnitarioFinal);

        // ADICIONAR AO CARRINHO COM PREÇO CUSTOMIZADO
        btnAdicionar?.addEventListener('click', () => {
            const produtoId = selectProd.value;
            const quantidade = Number(inputQtd.value);

            if (!produtoId || quantidade <= 0) return alert("Selecione um produto e quantidade válida!");

            const produto = produtos.find(p => p.id === produtoId);
            if (!produto) return;

            const estoqueAtual = produto.obterEstoqueTotal();
            const qtdNoCarrinho = this.carrinho.find(i => i.produtoId === produtoId)?.quantidade || 0;

            if ((qtdNoCarrinho + quantidade) > estoqueAtual) {
                return alert(`Estoque insuficiente! Disponível: ${estoqueAtual} un.`);
            }

            const precoUnitarioFinal = calcularPrecoUnitarioFinal();
            const teveDesconto = precoUnitarioFinal !== produto.precoVenda;

            this.carrinho.push({
                produtoId: produto.id,
                nome: produto.nome,
                precoUnitario: precoUnitarioFinal,
                precoTabela: produto.precoVenda,
                teveDesconto: teveDesconto,
                quantidade: quantidade
            });

            inputQtd.value = 1;
            selectTipoDesconto.value = 'PADRAO';
            calcularPrecoUnitarioFinal();
            this.atualizarListaCarrinho();
        });

        // SUBMISSÃO DA VENDA
        formVenda?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.carrinho.length === 0) return alert("Adicione chocolates à venda!");

            const tipoPagamento = selectTipoPagamento.value;
            const clienteId = document.getElementById('campo-venda-cliente').value;

            if (tipoPagamento === 'A_PRAZO' && !clienteId) {
                return alert("Para fiado, você deve selecionar o colega!");
            }

            try {
                const btnConfirmar = document.getElementById('btn-confirmar-venda');
                btnConfirmar.disabled = true;
                btnConfirmar.innerText = 'Gravando...';

                await this.casoDeUsoRegistrarVenda.executar({
                    clienteId: clienteId || null,
                    tipoPagamento: tipoPagamento,
                    origem: 'MANUAL',
                    itens: this.carrinho.map(i => ({
                        produtoId: i.produtoId,
                        quantidade: i.quantidade,
                        precoVendaPersonalizado: i.precoUnitario
                    }))
                });

                alert("Venda registrada e estoque atualizado!");
                await this.atualizarTela();
                if (this.aoFinalizarVenda) await this.aoFinalizarVenda();
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
                const btnConfirmar = document.getElementById('btn-confirmar-venda');
                btnConfirmar.disabled = false;
                btnConfirmar.innerText = 'Confirmar e Baixar Estoque';
            }
        });

        // Cadastro Rápido de Cliente
        btnModalCliente?.addEventListener('click', () => {
            document.getElementById('modal-rapido-cliente').classList.add('aberto');
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => {
                document.getElementById('modal-rapido-cliente')?.classList.remove('aberto');
            });
        });

        formRapidoCliente?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const novoCliente = new Cliente({
                    nome: document.getElementById('campo-cliente-nome').value,
                    canalPreferencial: document.getElementById('campo-cliente-canal').value,
                    contato: document.getElementById('campo-cliente-contato').value
                });

                await this.repositorioClientes.salvarCliente(novoCliente);
                document.getElementById('modal-rapido-cliente').classList.remove('aberto');
                await this.atualizarTela();
                alert(`Colega "${novoCliente.nome}" cadastrado com sucesso!`);
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            }
        });

        // REVISÃO HUMANA (IA)
        const modalRevisao = new ModalRevisao({
            produtos: produtos,
            clientes: clientes,
            aoConfirmarLote: async (loteFinal) => {
                for (const item of loteFinal) {
                    await this.casoDeUsoRegistrarVenda.executar({
                        clienteId: item.clienteId,
                        tipoPagamento: 'A_PRAZO',
                        origem: 'IA_IMAGEM',
                        itens: [{ produtoId: item.produtoId, quantidade: item.quantidade }]
                    });
                }
                await this.atualizarTela();
                if (this.aoFinalizarVenda) await this.aoFinalizarVenda();
            }
        });

        // Chamada da IA por foto
        const processarImagem = async (arquivo) => {
            if (!arquivo) return;
            const chave = localStorage.getItem('cacau_chave_gemini');
            if (!chave) {
                const informada = prompt("Cole sua chave gratuita da API do Gemini:");
                if (!informada) return;
                localStorage.setItem('cacau_chave_gemini', informada.trim());
            }

            try {
                const { LerFolhaComIA } = await import('../../casos-de-uso/LerFolhaComIA.js');
                const leitor = new LerFolhaComIA(localStorage.getItem('cacau_chave_gemini'));
                alert("Processando folha de vendas com IA...");
                const dados = await leitor.processarImagemFolha(arquivo);
                modalRevisao.abrirComDados(dados);
            } catch (err) {
                alert(`Erro na leitura: ${err.message}`);
            }
        };

        inputFotoCamera?.addEventListener('change', (e) => {
            processarImagem(e.target.files[0]);
            inputFotoCamera.value = '';
        });

        inputFotoArquivo?.addEventListener('change', (e) => {
            processarImagem(e.target.files[0]);
            inputFotoArquivo.value = '';
        });
    }

    atualizarListaCarrinho() {
        const containerLista = document.getElementById('lista-carrinho');
        const labelTotal = document.getElementById('valor-total-carrinho');
        const btnConfirmar = document.getElementById('btn-confirmar-venda');

        if (this.carrinho.length === 0) {
            containerLista.innerHTML = '<p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 6px 0;">Nenhum item adicionado ainda.</p>';
            labelTotal.innerText = 'R$ 0,00';
            btnConfirmar.disabled = true;
            return;
        }

        let total = 0;
        containerLista.innerHTML = this.carrinho.map((item, index) => {
            const subtotal = item.quantidade * item.precoUnitario;
            total += subtotal;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--cor-borda);">
                    <div>
                        <div style="font-size: 0.85rem;"><strong>${item.quantidade}x</strong> ${item.nome}</div>
                        <div style="font-size: 0.72rem; color: var(--cor-texto-suave);">
                            ${TelaVendas.formatarMoeda(item.precoUnitario)} cada 
                            ${item.teveDesconto ? `<span style="color: var(--cor-sucesso); font-weight: bold;">(Desconto aplicado!)</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: bold; font-size: 0.85rem;">${TelaVendas.formatarMoeda(subtotal)}</span>
                        <button type="button" data-remover="${index}" style="background: none; border: none; color: var(--cor-perigo); font-weight: bold; cursor: pointer;">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        labelTotal.innerText = TelaVendas.formatarMoeda(total);
        btnConfirmar.disabled = false;

        containerLista.querySelectorAll('[data-remover]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.getAttribute('data-remover'));
                this.carrinho.splice(index, 1);
                this.atualizarListaCarrinho();
            });
        });
    }
}