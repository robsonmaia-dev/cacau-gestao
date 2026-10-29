import { TelaVendas } from '../telas/TelaVendas.js';
import { Cliente } from '../../dominio/Cliente.js';
import { ModalRevisao } from '../componentes/ModalRevisao.js';

// Normalização completa: sem acentos, sem maiúsculas
function normalizar(texto) {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function obterDataHojeDDMMAA() {
    const d = new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear()).slice(-2);
    return `${dia}/${mes}/${ano}`;
}

export class ControladorVendas {
    constructor(repositorioProdutos, repositorioClientes, casoDeUsoRegistrarVenda, aoFinalizarVenda) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoRegistrarVenda = casoDeUsoRegistrarVenda;
        this.aoFinalizarVenda = aoFinalizarVenda;
        this.container = document.getElementById('conteudo-vendas');

        this.carrinho = [];
        this.produtos = [];
        this.clientes = [];

        this.dataVendaFormatada = obterDataHojeDDMMAA();
        this.tipoPagamentoAtual = 'A_PRAZO';
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        try {
            this.produtos = await this.repositorioProdutos.obterTodosComLotes();
            this.clientes = await this.repositorioClientes.obterTodosComHistorico();

            TelaVendas.renderizar(this.container, {
                dataFormatada: this.dataVendaFormatada,
                tipoPagamento: this.tipoPagamentoAtual
            });

            this.vincularEventos();
            this.atualizarListaCarrinho();
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    carregarVendaParaCorrecao(dadosEstorno) {
        this.carrinho = (dadosEstorno.itens || []).map(i => ({
            produtoId: i.produtoId,
            nome: i.nomeProduto,
            precoUnitario: Number(i.precoVendaUnitario),
            quantidade: Number(i.quantidade)
        }));

        this.atualizarListaCarrinho();

        if (dadosEstorno.tipoPagamento) {
            this.tipoPagamentoAtual = dadosEstorno.tipoPagamento;
            const selectTipo = document.getElementById('campo-venda-tipo-pagamento');
            if (selectTipo) selectTipo.value = dadosEstorno.tipoPagamento;
        }

        if (dadosEstorno.clienteId) {
            const cliente = this.clientes.find(c => c.id === dadosEstorno.clienteId);
            if (cliente) {
                this.selecionarCliente(cliente);
            }
        }

        alert("✏️ Venda carregada no formulário! Ajuste o que precisar e confirme.");
    }

    vincularEventos() {
        const inputData = document.getElementById('campo-venda-data');
        const btnCalendario = document.getElementById('btn-abrir-calendario');
        const pickerData = document.getElementById('campo-venda-data-picker');

        const selectTipoPagamento = document.getElementById('campo-venda-tipo-pagamento');
        const rotuloCliente = document.getElementById('rotulo-cliente-venda');

        const inputBuscaCliente = document.getElementById('campo-busca-cliente');
        const btnLimparCliente = document.getElementById('btn-limpar-cliente');
        const divSugestoesClientes = document.getElementById('sugestoes-clientes');

        const inputBuscaProduto = document.getElementById('campo-busca-produto');
        const btnLimparProduto = document.getElementById('btn-limpar-produto');
        const divSugestoesProdutos = document.getElementById('sugestoes-produtos');

        const inputQtd = document.getElementById('campo-item-quantidade');
        const inputPreco = document.getElementById('campo-item-preco');
        const btnAdicionar = document.getElementById('btn-adicionar-carrinho');
        const formVenda = document.getElementById('form-registro-venda');

        // BOTÃO DE CALENDÁRIO 📅
        btnCalendario?.addEventListener('click', () => {
            if (pickerData.showPicker) {
                pickerData.showPicker();
            } else {
                pickerData.focus();
                pickerData.click();
            }
        });

        // Converte escolha do calendário para DD/MM/AA
        pickerData?.addEventListener('change', (e) => {
            if (!e.target.value) return;
            const [ano, mes, dia] = e.target.value.split('-');
            const dataDDMMAA = `${dia}/${mes}/${ano.slice(-2)}`;
            inputData.value = dataDDMMAA;
            this.dataVendaFormatada = dataDDMMAA;
        });

        // Máscara direta de digitação DD/MM/AA
        inputData?.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 6);
            if (v.length >= 5) {
                v = v.replace(/^(\d{2})(\d{2})(\d{0,2})/, '$1/$2/$3');
            } else if (v.length >= 3) {
                v = v.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
            }
            e.target.value = v;
            this.dataVendaFormatada = v;
        });

        // Tipo de pagamento
        selectTipoPagamento?.addEventListener('change', (e) => {
            this.tipoPagamentoAtual = e.target.value;
            if (rotuloCliente) {
                rotuloCliente.innerText = this.tipoPagamentoAtual === 'PIX_IMEDIATO'
                    ? "👤 Cliente (Opcional no Pix)"
                    : "👤 Cliente (Obrigatório no Fiado)";
            }
        });

        // ==========================================
        // AUTOCOMPLETE DE CLIENTES
        // ==========================================
        inputBuscaCliente?.addEventListener('input', (e) => {
            const termo = normalizar(e.target.value);
            if (termo.length === 0) {
                divSugestoesClientes.style.display = 'none';
                return;
            }

            const filtrados = this.clientes.filter(c => normalizar(c.nome).includes(termo)).slice(0, 6);
            if (filtrados.length === 0) {
                divSugestoesClientes.innerHTML = '<div style="padding: 10px; font-size: 0.8rem; color: #888;">Nenhum cliente encontrado.</div>';
                divSugestoesClientes.style.display = 'block';
                return;
            }

            divSugestoesClientes.innerHTML = filtrados.map((c, idx) => `
                <div class="item-sugestao ${idx === 0 ? 'selecionado' : ''}" data-cliente-id="${c.id}">
                    <div><strong>${c.nome}</strong></div>
                    <div style="font-size: 0.72rem; color: ${c.saldoDevedor > 0 ? 'var(--cor-perigo)' : 'var(--cor-sucesso)'};">
                        ${c.saldoDevedor > 0 ? `Deve: ${TelaVendas.formatarMoeda(c.saldoDevedor)}` : 'Sem pendências'}
                    </div>
                </div>
            `).join('');

            divSugestoesClientes.style.display = 'block';

            divSugestoesClientes.querySelectorAll('.item-sugestao').forEach(item => {
                item.addEventListener('click', () => {
                    const cid = item.getAttribute('data-cliente-id');
                    const cliente = this.clientes.find(c => c.id === cid);
                    if (cliente) this.selecionarCliente(cliente);
                });
            });
        });

        // TAB ou Enter completa com o primeiro cliente
        inputBuscaCliente?.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key === 'Enter') {
                const primeiro = divSugestoesClientes.querySelector('.item-sugestao');
                if (primeiro && divSugestoesClientes.style.display !== 'none') {
                    e.preventDefault();
                    const cid = primeiro.getAttribute('data-cliente-id');
                    const cliente = this.clientes.find(c => c.id === cid);
                    if (cliente) this.selecionarCliente(cliente);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    inputBuscaProduto?.focus();
                }
            }
        });

        btnLimparCliente?.addEventListener('click', () => {
            this.limparCliente();
            inputBuscaCliente?.focus();
        });

        // ==========================================
        // AUTOCOMPLETE DE CHOCOLATES (BUSCA POR NOME OU CATEGORIA)
        // ==========================================
        inputBuscaProduto?.addEventListener('input', (e) => {
            const termo = normalizar(e.target.value);
            if (termo.length === 0) {
                divSugestoesProdutos.style.display = 'none';
                return;
            }

            // Busca pelo nome do chocolate OU pela categoria (ex: trufa, tablete, presentes)
            const filtrados = this.produtos.filter(p => {
                const bateuNome = normalizar(p.nome).includes(termo);
                const bateuCategoria = normalizar(p.categoria).includes(termo);
                return bateuNome || bateuCategoria;
            }).slice(0, 8);

            if (filtrados.length === 0) {
                divSugestoesProdutos.innerHTML = '<div style="padding: 10px; font-size: 0.8rem; color: #888;">Nenhum chocolate encontrado.</div>';
                divSugestoesProdutos.style.display = 'block';
                return;
            }

            divSugestoesProdutos.innerHTML = filtrados.map((p, idx) => {
                const estoque = p.obterEstoqueTotal();
                return `
                    <div class="item-sugestao ${idx === 0 ? 'selecionado' : ''}" data-prod-id="${p.id}">
                        <div>
                            <div><strong>${p.nome}</strong></div>
                            <span class="etiqueta" style="font-size: 0.65rem; background: #FAF0E6; color: var(--cor-primaria); padding: 1px 6px;">
                                ${p.categoria}
                            </span>
                        </div>
                        <div style="font-size: 0.8rem; text-align: right;">
                            <div style="color: var(--cor-primaria); font-weight: bold;">${TelaVendas.formatarMoeda(p.precoVenda)}</div>
                            <div style="color: ${estoque > 0 ? '#666' : 'var(--cor-perigo)'}; font-size: 0.72rem;">${estoque} un</div>
                        </div>
                    </div>
                `;
            }).join('');

            divSugestoesProdutos.style.display = 'block';

            divSugestoesProdutos.querySelectorAll('.item-sugestao').forEach(item => {
                item.addEventListener('click', () => {
                    const pid = item.getAttribute('data-prod-id');
                    const prod = this.produtos.find(p => p.id === pid);
                    if (prod) this.selecionarProduto(prod);
                });
            });
        });

        // TAB ou Enter completa com o primeiro chocolate e pula para Qtd
        inputBuscaProduto?.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.key === 'Enter') {
                const primeiro = divSugestoesProdutos.querySelector('.item-sugestao');
                if (primeiro && divSugestoesProdutos.style.display !== 'none') {
                    e.preventDefault();
                    const pid = primeiro.getAttribute('data-prod-id');
                    const prod = this.produtos.find(p => p.id === pid);
                    if (prod) this.selecionarProduto(prod);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    inputQtd?.focus();
                    inputQtd?.select();
                }
            }
        });

        btnLimparProduto?.addEventListener('click', () => {
            this.limparProduto();
            inputBuscaProduto?.focus();
        });

        // Enter na quantidade adiciona ao carrinho e foca na confirmação
        inputQtd?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnAdicionar.click();
                document.getElementById('btn-confirmar-venda')?.focus();
            }
        });

        // Adicionar item ao carrinho
        btnAdicionar?.addEventListener('click', () => {
            const produtoId = document.getElementById('campo-produto-id').value;
            const quantidade = Number(inputQtd.value);
            const precoDigitado = Number(inputPreco.value);

            if (!produtoId) return alert("Selecione um chocolate digitando o nome!");
            if (quantidade <= 0) return alert("Quantidade deve ser no mínimo 1!");

            const produto = this.produtos.find(p => p.id === produtoId);
            if (!produto) return;

            const estoqueAtual = produto.obterEstoqueTotal();
            const qtdNoCarrinho = this.carrinho.find(i => i.produtoId === produtoId)?.quantidade || 0;

            if ((qtdNoCarrinho + quantidade) > estoqueAtual) {
                return alert(`Estoque insuficiente! Disponível: ${estoqueAtual} un.`);
            }

            this.carrinho.push({
                produtoId: produto.id,
                nome: produto.nome,
                precoUnitario: precoDigitado > 0 ? precoDigitado : produto.precoVenda,
                quantidade: quantidade
            });

            this.limparProduto();
            this.atualizarListaCarrinho();
        });

        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#campo-busca-cliente') && !e.target.closest('#sugestoes-clientes')) {
                divSugestoesClientes.style.display = 'none';
            }
            if (!e.target.closest('#campo-busca-produto') && !e.target.closest('#sugestoes-produtos')) {
                divSugestoesProdutos.style.display = 'none';
            }
        });

        // ATALHO CTRL + ENTER PARA CONFIRMAR
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const btn = document.getElementById('btn-confirmar-venda');
                if (btn && !btn.disabled) {
                    e.preventDefault();
                    btn.click();
                }
            }
        });

        // SUBMIT DA VENDA
        formVenda?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.carrinho.length === 0) return alert("Adicione chocolates à venda!");

            const clienteId = document.getElementById('campo-cliente-id').value;
            const tipoPagamento = selectTipoPagamento.value;

            if (tipoPagamento === 'A_PRAZO' && !clienteId) {
                alert("Para fiado, você deve selecionar o cliente!");
                inputBuscaCliente?.focus();
                return;
            }

            const btnConfirmar = document.getElementById('btn-confirmar-venda');
            btnConfirmar.disabled = true;
            btnConfirmar.innerText = 'Gravando na nuvem...';

            try {
                // Converte DD/MM/AA para AAAA-MM-DD
                const partes = this.dataVendaFormatada.split('/');
                let dataISO = new Date().toISOString().split('T')[0];
                if (partes.length === 3 && partes[0] && partes[1] && partes[2]) {
                    const dia = partes[0].padStart(2, '0');
                    const mes = partes[1].padStart(2, '0');
                    const ano = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
                    dataISO = `${ano}-${mes}-${dia}`;
                }

                const agora = new Date();
                const horaFormatada = agora.toTimeString().split(' ')[0];
                const dataHoraGravacao = `${dataISO}T${horaFormatada}Z`;

                await this.casoDeUsoRegistrarVenda.executar({
                    clienteId: clienteId || null,
                    tipoPagamento: tipoPagamento,
                    origem: 'MANUAL',
                    dataHora: dataHoraGravacao,
                    itens: this.carrinho.map(i => ({
                        produtoId: i.produtoId,
                        quantidade: i.quantidade,
                        precoVendaPersonalizado: i.precoUnitario
                    }))
                });

                // Limpa formulário para a próxima venda mantendo a data intacta
                this.carrinho = [];
                this.limparCliente();
                this.limparProduto();
                this.atualizarListaCarrinho();

                this.produtos = await this.repositorioProdutos.obterTodosComLotes();
                this.clientes = await this.repositorioClientes.obterTodosComHistorico();

                btnConfirmar.disabled = true;
                btnConfirmar.innerText = 'Confirmar Venda (Enter)';

                if (this.aoFinalizarVenda) await this.aoFinalizarVenda();

                // Pula cursor imediatamente de volta para o cliente
                inputBuscaCliente?.focus();

            } catch (erro) {
                alert(`Erro: ${erro.message}`);
                btnConfirmar.disabled = false;
                btnConfirmar.innerText = 'Confirmar Venda (Enter)';
            }
        });

        // Modal novo cliente
        document.getElementById('btn-modal-novo-cliente')?.addEventListener('click', () => {
            document.getElementById('modal-rapido-cliente').classList.add('aberto');
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => {
                document.getElementById('modal-rapido-cliente')?.classList.remove('aberto');
            });
        });

        document.getElementById('form-rapido-cliente')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const novo = new Cliente({
                    nome: document.getElementById('campo-cliente-nome').value,
                    canalPreferencial: document.getElementById('campo-cliente-canal').value,
                    contato: document.getElementById('campo-cliente-contato').value
                });

                await this.repositorioClientes.salvarCliente(novo);
                document.getElementById('modal-rapido-cliente').classList.remove('aberto');
                this.clientes = await this.repositorioClientes.obterTodosComHistorico();
                this.selecionarCliente(novo);
                alert(`Cliente "${novo.nome}" cadastrado e selecionado!`);
                inputBuscaProduto?.focus();
            } catch (err) {
                alert(`Erro: ${err.message}`);
            }
        });

        // IA / Foto
        const modalRevisao = new ModalRevisao({
            produtos: this.produtos,
            clientes: this.clientes,
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

        const processarImagem = async (arquivo) => {
            if (!arquivo) return;
            const chave = localStorage.getItem('cacau_chave_gemini');
            if (!chave) {
                const inf = prompt("Cole sua chave gratuita da API do Gemini:");
                if (!inf) return;
                localStorage.setItem('cacau_chave_gemini', inf.trim());
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

        document.getElementById('input-foto-camera')?.addEventListener('change', (e) => {
            processarImagem(e.target.files[0]);
            e.target.value = '';
        });

        document.getElementById('input-foto-arquivo')?.addEventListener('change', (e) => {
            processarImagem(e.target.files[0]);
            e.target.value = '';
        });
    }

    selecionarCliente(cliente) {
        document.getElementById('campo-cliente-id').value = cliente.id;
        const inputBusca = document.getElementById('campo-busca-cliente');
        inputBusca.value = cliente.nome;
        inputBusca.style.fontWeight = 'bold';
        inputBusca.style.backgroundColor = '#FAF6F0';

        document.getElementById('btn-limpar-cliente').style.display = 'block';
        document.getElementById('sugestoes-clientes').style.display = 'none';
        document.getElementById('campo-busca-produto')?.focus();
    }

    limparCliente() {
        document.getElementById('campo-cliente-id').value = '';
        const inputBusca = document.getElementById('campo-busca-cliente');
        inputBusca.value = '';
        inputBusca.style.fontWeight = 'normal';
        inputBusca.style.backgroundColor = '#FFF';

        document.getElementById('btn-limpar-cliente').style.display = 'none';
        document.getElementById('sugestoes-clientes').style.display = 'none';
    }

    selecionarProduto(produto) {
        document.getElementById('campo-produto-id').value = produto.id;
        document.getElementById('campo-produto-preco-tabela').value = produto.precoVenda;
        document.getElementById('campo-item-preco').value = produto.precoVenda.toFixed(2);

        const inputBusca = document.getElementById('campo-busca-produto');
        inputBusca.value = produto.nome;
        inputBusca.style.fontWeight = 'bold';
        inputBusca.style.backgroundColor = '#FAF6F0';

        document.getElementById('btn-limpar-produto').style.display = 'block';
        document.getElementById('sugestoes-produtos').style.display = 'none';

        const inputQtd = document.getElementById('campo-item-quantidade');
        inputQtd.value = 1;
        inputQtd.focus();
        inputQtd.select();
    }

    limparProduto() {
        document.getElementById('campo-produto-id').value = '';
        document.getElementById('campo-produto-preco-tabela').value = '0';
        document.getElementById('campo-item-preco').value = '';

        const inputBusca = document.getElementById('campo-busca-produto');
        inputBusca.value = '';
        inputBusca.style.fontWeight = 'normal';
        inputBusca.style.backgroundColor = '#FFF';

        document.getElementById('btn-limpar-produto').style.display = 'none';
        document.getElementById('sugestoes-produtos').style.display = 'none';
        document.getElementById('campo-item-quantidade').value = 1;
    }

    atualizarListaCarrinho() {
        const containerLista = document.getElementById('lista-carrinho');
        const labelTotal = document.getElementById('valor-total-carrinho');
        const btnConfirmar = document.getElementById('btn-confirmar-venda');
        if (!containerLista) return;

        if (this.carrinho.length === 0) {
            containerLista.innerHTML = '<p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 4px 0;">Nenhum item adicionado ainda.</p>';
            if (labelTotal) labelTotal.innerText = 'R$ 0,00';
            if (btnConfirmar) btnConfirmar.disabled = true;
            return;
        }

        let total = 0;
        containerLista.innerHTML = this.carrinho.map((item, index) => {
            const subtotal = item.quantidade * item.precoUnitario;
            total += subtotal;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px dashed var(--cor-borda);">
                    <div>
                        <div style="font-size: 0.85rem;"><strong>${item.quantidade}x</strong> ${item.nome}</div>
                        <div style="font-size: 0.72rem; color: var(--cor-texto-suave);">
                            ${TelaVendas.formatarMoeda(item.precoUnitario)} un
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: bold; font-size: 0.85rem;">${TelaVendas.formatarMoeda(subtotal)}</span>
                        <button type="button" data-remover="${index}" style="background: none; border: none; color: var(--cor-perigo); font-weight: bold; cursor: pointer; padding: 4px;">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        if (labelTotal) labelTotal.innerText = TelaVendas.formatarMoeda(total);
        if (btnConfirmar) btnConfirmar.disabled = false;

        containerLista.querySelectorAll('[data-remover]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.getAttribute('data-remover'));
                this.carrinho.splice(index, 1);
                this.atualizarListaCarrinho();
            });
        });
    }
}
