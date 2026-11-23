import { TelaVendas } from '../telas/TelaVendas.js';
import { Cliente } from '../../dominio/Cliente.js';
import { ModalRevisao } from '../componentes/ModalRevisao.js';
import { GeradorPixClipboard } from '../../utilitarios/GeradorPixClipboard.js';

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
    constructor(repositorioProdutos, repositorioClientes, casoDeUsoRegistrarVenda, aoFinalizarVenda, repositorioConfiguracoes = null) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
        this.casoDeUsoRegistrarVenda = casoDeUsoRegistrarVenda;
        this.aoFinalizarVenda = aoFinalizarVenda;
        this.repositorioConfiguracoes = repositorioConfiguracoes;
        this.container = document.getElementById('conteudo-vendas');

        this.carrinho = [];
        this.produtos = [];
        this.clientes = [];

        this.dataVendaFormatada = obterDataHojeDDMMAA();
        this.tipoPagamentoAtual = 'A_PRAZO';

        this.tipoDesconto = 'VALOR'; // 'VALOR' (R$) ou 'PERCENTUAL' (%)
        this.valorDescontoDigitado = 0;

        this.chavePix = localStorage.getItem('cacau_chave_pix') || '';
        this.payloadPixAtual = '';
    }

    async inicializar() {
        await this.carregarConfiguracoes();
        await this.atualizarTela();
    }

    async carregarConfiguracoes() {
        if (!this.repositorioConfiguracoes) return;
        try {
            const config = await this.repositorioConfiguracoes.obter();
            if (config?.chavePix) {
                this.chavePix = config.chavePix;
            }
        } catch (erro) {
            console.warn("Aviso ao carregar configurações em Vendas:", erro);
        }
    }

    async atualizarTela() {
        try {
            this.produtos = await this.repositorioProdutos.obterTodosComLotes();
            this.clientes = await this.repositorioClientes.obterTodosComHistorico();

            if (this.repositorioConfiguracoes) {
                const config = await this.repositorioConfiguracoes.obter();
                if (config?.chavePix) this.chavePix = config.chavePix;
            }

            TelaVendas.renderizar(this.container, {
                dataFormatada: this.dataVendaFormatada,
                tipoPagamento: this.tipoPagamentoAtual
            });

            this.vincularEventos();
            this.atualizarBotoesTipoDesconto();
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

        this.tipoDesconto = 'VALOR';
        this.valorDescontoDigitado = Number(dadosEstorno.desconto || 0);

        const inputDesconto = document.getElementById('campo-venda-desconto');
        if (inputDesconto) {
            inputDesconto.value = this.valorDescontoDigitado > 0 ? this.valorDescontoDigitado.toFixed(2) : '';
        }

        if (dadosEstorno.tipoPagamento) {
            this.tipoPagamentoAtual = dadosEstorno.tipoPagamento;
            const selectTipo = document.getElementById('campo-venda-tipo-pagamento');
            if (selectTipo) selectTipo.value = dadosEstorno.tipoPagamento;
        }

        this.atualizarBotoesTipoDesconto();
        this.atualizarListaCarrinho();

        if (dadosEstorno.clienteId) {
            const cliente = this.clientes.find(c => c.id === dadosEstorno.clienteId);
            if (cliente) {
                this.selecionarCliente(cliente);
            }
        }

        alert("✏️ Venda carregada no formulário! Ajuste o que precisar e confirme.");
    }

    calcularResumoTotais() {
        const subtotal = Number(
            this.carrinho.reduce((soma, item) => soma + (item.quantidade * item.precoUnitario), 0).toFixed(2)
        );

        let descontoEmReais = 0;
        const digitado = Math.max(0, Number(this.valorDescontoDigitado || 0));

        if (subtotal > 0 && digitado > 0) {
            if (this.tipoDesconto === 'PERCENTUAL') {
                const perc = Math.min(100, digitado);
                descontoEmReais = Number(((subtotal * perc) / 100).toFixed(2));
            } else {
                descontoEmReais = Number(Math.min(subtotal, digitado).toFixed(2));
            }
        }

        const totalFinal = Number(Math.max(0, subtotal - descontoEmReais).toFixed(2));
        return { subtotal, descontoEmReais, totalFinal };
    }

    atualizarBotoesTipoDesconto() {
        const btnValor = document.getElementById('btn-desc-valor');
        const btnPerc = document.getElementById('btn-desc-percentual');
        if (!btnValor || !btnPerc) return;

        if (this.tipoDesconto === 'VALOR') {
            btnValor.style.background = 'var(--cor-primaria)';
            btnValor.style.color = '#FFF';
            btnPerc.style.background = '#FFF';
            btnPerc.style.color = 'var(--cor-texto-suave)';
        } else {
            btnPerc.style.background = 'var(--cor-primaria)';
            btnPerc.style.color = '#FFF';
            btnValor.style.background = '#FFF';
            btnValor.style.color = 'var(--cor-texto-suave)';
        }
    }

    construirDataHoraISO() {
        const partes = this.dataVendaFormatada.split('/');
        const agora = new Date();
        let dataObj = agora;

        if (partes.length === 3 && partes[0] && partes[1] && partes[2]) {
            const dia = Number(partes[0]);
            const mes = Number(partes[1]) - 1;
            const ano = Number(partes[2].length === 2 ? `20${partes[2]}` : partes[2]);
            const candidata = new Date(ano, mes, dia, agora.getHours(), agora.getMinutes(), agora.getSeconds());
            if (!isNaN(candidata.getTime())) {
                dataObj = candidata;
            }
        }

        return dataObj.toISOString();
    }

    async gravarVendaFinal({ tipoPagamento }) {
        if (this.carrinho.length === 0) {
            alert("Adicione chocolates à venda!");
            return false;
        }

        const clienteId = document.getElementById('campo-cliente-id')?.value || '';
        if (tipoPagamento === 'A_PRAZO' && !clienteId) {
            alert("Para fiado, você deve selecionar o cliente!");
            document.getElementById('campo-busca-cliente')?.focus();
            return false;
        }

        const { descontoEmReais } = this.calcularResumoTotais();
        let observacao = '';
        if (descontoEmReais > 0) {
            observacao = this.tipoDesconto === 'PERCENTUAL'
                ? `Desconto de ${this.valorDescontoDigitado}% (R$ ${descontoEmReais.toFixed(2)})`
                : `Desconto de R$ ${descontoEmReais.toFixed(2)}`;
        }

        await this.casoDeUsoRegistrarVenda.executar({
            clienteId: clienteId || null,
            tipoPagamento: tipoPagamento,
            origem: 'MANUAL',
            dataHora: this.construirDataHoraISO(),
            desconto: descontoEmReais,
            observacao: observacao,
            itens: this.carrinho.map(i => ({
                produtoId: i.produtoId,
                quantidade: i.quantidade,
                precoVendaPersonalizado: i.precoUnitario
            }))
        });

        this.carrinho = [];
        this.valorDescontoDigitado = 0;
        const inputDesconto = document.getElementById('campo-venda-desconto');
        if (inputDesconto) inputDesconto.value = '';

        this.limparCliente();
        this.limparProduto();
        this.atualizarListaCarrinho();

        this.produtos = await this.repositorioProdutos.obterTodosComLotes();
        this.clientes = await this.repositorioClientes.obterTodosComHistorico();

        if (this.aoFinalizarVenda) await this.aoFinalizarVenda();
        document.getElementById('campo-busca-cliente')?.focus();
        return true;
    }

    async abrirModalCheckoutPix() {
        await this.carregarConfiguracoes();

        const { subtotal, descontoEmReais, totalFinal } = this.calcularResumoTotais();
        if (totalFinal <= 0) {
            await this.gravarVendaFinal({ tipoPagamento: 'PIX_IMEDIATO' });
            return;
        }

        const modal = document.getElementById('modal-checkout-pix');
        const labelValor = document.getElementById('checkout-pix-valor');
        const labelDesconto = document.getElementById('checkout-pix-desconto-info');
        const divItens = document.getElementById('checkout-pix-itens');
        const inputChave = document.getElementById('checkout-pix-chave');

        if (labelValor) labelValor.innerText = TelaVendas.formatarMoeda(totalFinal);

        if (labelDesconto) {
            if (descontoEmReais > 0) {
                labelDesconto.innerText = `Subtotal ${TelaVendas.formatarMoeda(subtotal)} • Desconto aplicado: - ${TelaVendas.formatarMoeda(descontoEmReais)}`;
                labelDesconto.style.display = 'block';
            } else {
                labelDesconto.style.display = 'none';
            }
        }

        if (divItens) {
            divItens.innerHTML = this.carrinho.map(i =>
                `<div style="display:flex; justify-content:space-between; margin: 2px 0;">
                    <span><strong>${i.quantidade}x</strong> ${i.nome}</span>
                    <span>${TelaVendas.formatarMoeda(i.quantidade * i.precoUnitario)}</span>
                </div>`
            ).join('');
        }

        if (inputChave) inputChave.value = this.chavePix;

        modal?.classList.add('aberto');
        await this.gerarQrCodeCheckout(totalFinal);
    }

    async gerarQrCodeCheckout(valorTotal) {
        const imgQr = document.getElementById('checkout-pix-qrcode-img');
        const statusQr = document.getElementById('checkout-pix-status-qr');
        const btnCopiar = document.getElementById('btn-copiar-pix-checkout');

        if (!this.chavePix || this.chavePix.trim() === '') {
            this.payloadPixAtual = '';
            if (imgQr) imgQr.style.display = 'none';
            if (statusQr) {
                statusQr.style.display = 'block';
                statusQr.innerHTML = '⚠️ Informe sua <strong>Chave Pix</strong> abaixo e clique em <strong>Gerar QR</strong> para exibir o código.';
            }
            if (btnCopiar) btnCopiar.disabled = true;
            return;
        }

        try {
            if (statusQr) {
                statusQr.style.display = 'block';
                statusQr.innerText = 'Gerando QR Code...';
            }

            this.payloadPixAtual = GeradorPixClipboard.gerarPayloadPix({
                chavePix: this.chavePix,
                valor: valorTotal
            });

            const dataUrl = await GeradorPixClipboard.gerarQrCodeDataUrl(this.payloadPixAtual);
            if (imgQr) {
                imgQr.src = dataUrl;
                imgQr.style.display = 'block';
            }
            if (statusQr) statusQr.style.display = 'none';
            if (btnCopiar) btnCopiar.disabled = false;
        } catch (erro) {
            if (imgQr) imgQr.style.display = 'none';
            if (statusQr) {
                statusQr.style.display = 'block';
                statusQr.innerText = `Erro ao gerar QR Code: ${erro.message}`;
            }
            if (btnCopiar) btnCopiar.disabled = true;
        }
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

        const inputDesconto = document.getElementById('campo-venda-desconto');
        const btnDescValor = document.getElementById('btn-desc-valor');
        const btnDescPerc = document.getElementById('btn-desc-percentual');

        btnCalendario?.addEventListener('click', () => {
            if (pickerData.showPicker) {
                pickerData.showPicker();
            } else {
                pickerData.focus();
                pickerData.click();
            }
        });

        pickerData?.addEventListener('change', (e) => {
            if (!e.target.value) return;
            const [ano, mes, dia] = e.target.value.split('-');
            const dataDDMMAA = `${dia}/${mes}/${ano.slice(-2)}`;
            inputData.value = dataDDMMAA;
            this.dataVendaFormatada = dataDDMMAA;
        });

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

        selectTipoPagamento?.addEventListener('change', (e) => {
            this.tipoPagamentoAtual = e.target.value;
            if (rotuloCliente) {
                rotuloCliente.innerText = this.tipoPagamentoAtual === 'PIX_IMEDIATO'
                    ? "👤 Cliente (Opcional no Pix)"
                    : "👤 Cliente (Obrigatório no Fiado)";
            }
            this.atualizarListaCarrinho();
        });

        btnDescValor?.addEventListener('click', () => {
            this.tipoDesconto = 'VALOR';
            this.atualizarBotoesTipoDesconto();
            this.atualizarListaCarrinho();
        });

        btnDescPerc?.addEventListener('click', () => {
            this.tipoDesconto = 'PERCENTUAL';
            this.atualizarBotoesTipoDesconto();
            this.atualizarListaCarrinho();
        });

        inputDesconto?.addEventListener('input', (e) => {
            this.valorDescontoDigitado = Number(e.target.value || 0);
            this.atualizarListaCarrinho();
        });

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

        inputBuscaProduto?.addEventListener('input', (e) => {
            const termo = normalizar(e.target.value);
            if (termo.length === 0) {
                divSugestoesProdutos.style.display = 'none';
                return;
            }

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

        inputQtd?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnAdicionar.click();
                document.getElementById('btn-confirmar-venda')?.focus();
            }
        });

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

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#campo-busca-cliente') && !e.target.closest('#sugestoes-clientes')) {
                divSugestoesClientes.style.display = 'none';
            }
            if (!e.target.closest('#campo-busca-produto') && !e.target.closest('#sugestoes-produtos')) {
                divSugestoesProdutos.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const btn = document.getElementById('btn-confirmar-venda');
                if (btn && !btn.disabled) {
                    e.preventDefault();
                    btn.click();
                }
            }
        });

        formVenda?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.carrinho.length === 0) return alert("Adicione chocolates à venda!");

            const tipoPagamento = selectTipoPagamento.value;
            if (tipoPagamento === 'PIX_IMEDIATO') {
                await this.abrirModalCheckoutPix();
                return;
            }

            const btnConfirmar = document.getElementById('btn-confirmar-venda');
            btnConfirmar.disabled = true;
            btnConfirmar.innerText = 'Gravando na nuvem...';

            try {
                const gravou = await this.gravarVendaFinal({ tipoPagamento: 'A_PRAZO' });
                if (!gravou) {
                    btnConfirmar.disabled = false;
                    this.atualizarListaCarrinho();
                }
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
                btnConfirmar.disabled = false;
                this.atualizarListaCarrinho();
            }
        });

        document.getElementById('btn-confirmar-pix-direto')?.addEventListener('click', async () => {
            const btnDireto = document.getElementById('btn-confirmar-pix-direto');
            if (btnDireto) {
                btnDireto.disabled = true;
                btnDireto.innerText = 'Gravando venda Pix...';
            }
            try {
                await this.gravarVendaFinal({ tipoPagamento: 'PIX_IMEDIATO' });
            } catch (erro) {
                alert(`Erro: ${erro.message}`);
            } finally {
                if (btnDireto) {
                    btnDireto.disabled = false;
                    btnDireto.innerText = '⚡ Já recebi — Confirmar direto sem QR Code';
                }
            }
        });

        const fecharModalPix = () => document.getElementById('modal-checkout-pix')?.classList.remove('aberto');

        document.getElementById('btn-voltar-checkout-pix')?.addEventListener('click', fecharModalPix);

        document.getElementById('btn-atualizar-qr-checkout')?.addEventListener('click', async () => {
            const inputChave = document.getElementById('checkout-pix-chave');
            const novaChave = (inputChave?.value || '').trim();
            if (!novaChave) return alert("Digite uma Chave Pix válida.");

            this.chavePix = novaChave;
            localStorage.setItem('cacau_chave_pix', novaChave);
            await this.repositorioConfiguracoes?.salvarConfiguracoes({ chavePix: novaChave });

            const { totalFinal } = this.calcularResumoTotais();
            await this.gerarQrCodeCheckout(totalFinal);
        });

        document.getElementById('btn-copiar-pix-checkout')?.addEventListener('click', async () => {
            if (!this.payloadPixAtual) return;
            const btnCopiar = document.getElementById('btn-copiar-pix-checkout');
            try {
                await navigator.clipboard.writeText(this.payloadPixAtual);
                if (btnCopiar) {
                    btnCopiar.innerText = '✅ Código Pix Copiado!';
                    setTimeout(() => { btnCopiar.innerText = '📋 Copiar Pix Copia e Cola'; }, 2200);
                }
            } catch (e) {
                prompt("Copie o código Pix abaixo:", this.payloadPixAtual);
            }
        });

        document.getElementById('btn-confirmar-pagamento-pix')?.addEventListener('click', async () => {
            const btnConf = document.getElementById('btn-confirmar-pagamento-pix');
            const inputChave = document.getElementById('checkout-pix-chave');
            const chaveDigitada = (inputChave?.value || '').trim();

            if (btnConf) {
                btnConf.disabled = true;
                btnConf.innerText = 'Gravando pagamento na nuvem...';
            }

            try {
                if (chaveDigitada && chaveDigitada !== this.chavePix) {
                    this.chavePix = chaveDigitada;
                    await this.repositorioConfiguracoes?.salvarConfiguracoes({ chavePix: chaveDigitada });
                } else if (this.chavePix) {
                    await this.repositorioConfiguracoes?.salvarConfiguracoes({ chavePix: this.chavePix });
                }

                await this.gravarVendaFinal({ tipoPagamento: 'PIX_IMEDIATO' });
                fecharModalPix();
            } catch (erro) {
                alert(`Erro ao confirmar venda: ${erro.message}`);
            } finally {
                if (btnConf) {
                    btnConf.disabled = false;
                    btnConf.innerText = '✅ Pagamento Confirmado (Concluir Venda)';
                }
            }
        });

        document.getElementById('btn-converter-para-fiado')?.addEventListener('click', () => {
            fecharModalPix();
            this.tipoPagamentoAtual = 'A_PRAZO';
            if (selectTipoPagamento) selectTipoPagamento.value = 'A_PRAZO';
            if (rotuloCliente) rotuloCliente.innerText = "👤 Cliente (Obrigatório no Fiado)";
            this.atualizarListaCarrinho();

            const clienteId = document.getElementById('campo-cliente-id')?.value;
            if (!clienteId) {
                alert("Selecione o cliente para anotar a venda no Fiado!");
                inputBuscaCliente?.focus();
            } else {
                document.getElementById('btn-confirmar-venda')?.focus();
            }
        });

        document.querySelectorAll('.botao-fechar-modal').forEach(b => {
            b.addEventListener('click', () => {
                const alvo = b.getAttribute('data-fechar');
                if (alvo) {
                    document.getElementById(alvo)?.classList.remove('aberto');
                } else {
                    document.getElementById('modal-rapido-cliente')?.classList.remove('aberto');
                }
            });
        });

        document.getElementById('btn-modal-novo-cliente')?.addEventListener('click', () => {
            document.getElementById('modal-rapido-cliente').classList.add('aberto');
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
        const linhaResumoDesconto = document.getElementById('linha-resumo-desconto');
        const labelSubtotal = document.getElementById('valor-subtotal-carrinho');
        const labelDesconto = document.getElementById('valor-desconto-carrinho');
        const btnConfirmar = document.getElementById('btn-confirmar-venda');
        const btnPixDireto = document.getElementById('btn-confirmar-pix-direto');
        if (!containerLista) return;

        const ehPix = this.tipoPagamentoAtual === 'PIX_IMEDIATO';

        if (this.carrinho.length === 0) {
            containerLista.innerHTML = '<p style="color: var(--cor-texto-suave); font-size: 0.8rem; text-align: center; margin: 4px 0;">Nenhum item adicionado ainda.</p>';
            if (linhaResumoDesconto) linhaResumoDesconto.style.display = 'none';
            if (labelTotal) labelTotal.innerText = 'R$ 0,00';
            if (btnConfirmar) {
                btnConfirmar.disabled = true;
                btnConfirmar.innerText = ehPix ? '💳 Gerar QR Code Pix' : 'Confirmar Venda (Enter)';
            }
            if (btnPixDireto) btnPixDireto.style.display = 'none';
            return;
        }

        containerLista.innerHTML = this.carrinho.map((item, index) => {
            const subtotalItem = item.quantidade * item.precoUnitario;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px dashed var(--cor-borda);">
                    <div>
                        <div style="font-size: 0.85rem;"><strong>${item.quantidade}x</strong> ${item.nome}</div>
                        <div style="font-size: 0.72rem; color: var(--cor-texto-suave);">
                            ${TelaVendas.formatarMoeda(item.precoUnitario)} un
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: bold; font-size: 0.85rem;">${TelaVendas.formatarMoeda(subtotalItem)}</span>
                        <button type="button" data-remover="${index}" style="background: none; border: none; color: var(--cor-perigo); font-weight: bold; cursor: pointer; padding: 4px;">✕</button>
                    </div>
                </div>
            `;
        }).join('');

        const { subtotal, descontoEmReais, totalFinal } = this.calcularResumoTotais();

        if (linhaResumoDesconto) {
            if (descontoEmReais > 0) {
                if (labelSubtotal) labelSubtotal.innerText = TelaVendas.formatarMoeda(subtotal);
                if (labelDesconto) labelDesconto.innerText = TelaVendas.formatarMoeda(descontoEmReais);
                linhaResumoDesconto.style.display = 'flex';
            } else {
                linhaResumoDesconto.style.display = 'none';
            }
        }

        if (labelTotal) labelTotal.innerText = TelaVendas.formatarMoeda(totalFinal);

        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.innerText = ehPix ? '💳 Gerar QR Code Pix' : 'Confirmar Venda (Enter)';
        }

        if (btnPixDireto) {
            btnPixDireto.style.display = ehPix ? 'inline-flex' : 'none';
        }

        containerLista.querySelectorAll('[data-remover]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.getAttribute('data-remover'));
                this.carrinho.splice(index, 1);
                this.atualizarListaCarrinho();
            });
        });
    }
}
