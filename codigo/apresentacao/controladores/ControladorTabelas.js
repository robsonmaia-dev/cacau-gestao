import { TelaTabelas } from '../telas/TelaTabelas.js';
import { GeradorTabelaHtml } from '../../utilitarios/GeradorTabelaHtml.js';

const CHAVE_STORAGE_TABELAS = 'cacau_config_tabelas_a4';

export class ControladorTabelas {
    constructor(repositorioProdutos, repositorioConfiguracoes = null) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioConfiguracoes = repositorioConfiguracoes;
        this.container = document.getElementById('conteudo-tabelas');

        this.produtos = [];
        this.config = this.carregarConfigLocal();
    }

    carregarConfigLocal() {
        try {
            const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE_TABELAS) || '{}');
            return {
                modelo: salvo.modelo || 'DESTAQUE',
                nomeDestaque: salvo.nomeDestaque || 'Taça',
                precoDestaque: salvo.precoDestaque ?? 6.49,
                subtitulo: salvo.subtitulo || 'Sobremesa especial Cacau Show • Lista de Anotação',
                subtituloMulti: salvo.subtituloMulti || 'Anote seu nome e marque a quantidade retirada',
                selecionadosMulti: Array.isArray(salvo.selecionadosMulti) ? salvo.selecionadosMulti : [],
                incluirSetor: Boolean(salvo.incluirSetor),
                mesRef: salvo.mesRef || '',
                folhaNumero: salvo.folhaNumero || '',
                qtdLinhas: salvo.qtdLinhas || 22,
                usarEscassez: salvo.usarEscassez !== false,
                tituloEscassez: salvo.tituloEscassez || '⚡ SOMENTE HOJE — DISPONÍVEL APENAS POR 1 DIA!',
                textoEscassez: salvo.textoEscassez || '',
                pixTitular: salvo.pixTitular || 'Robson Luiz da Maia',
                pixChave: salvo.pixChave || localStorage.getItem('cacau_chave_pix') || ''
            };
        } catch (_) {
            return { modelo: 'DESTAQUE', qtdLinhas: 22, usarEscassez: true, selecionadosMulti: [] };
        }
    }

    salvarConfigLocal() {
        try {
            localStorage.setItem(CHAVE_STORAGE_TABELAS, JSON.stringify(this.config));
        } catch (_) {
            // ignora erro de quota
        }
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        try {
            this.produtos = await this.repositorioProdutos.obterTodosComLotes();

            if (this.repositorioConfiguracoes) {
                const cfgNuvem = await this.repositorioConfiguracoes.obter();
                if (cfgNuvem?.chavePix) {
                    this.config.pixChave = cfgNuvem.chavePix;
                }
            }

            if ((!this.config.selecionadosMulti || this.config.selecionadosMulti.length === 0) && this.produtos.length > 0) {
                const comEstoque = this.produtos.filter(p => p.obterEstoqueTotal() > 0).slice(0, 4);
                const padrao = comEstoque.length > 0 ? comEstoque : this.produtos.slice(0, 4);
                this.config.selecionadosMulti = padrao.map(p => p.id);
            }

            TelaTabelas.renderizar(this.container, {
                produtos: this.produtos,
                config: this.config
            });

            this.vincularEventos();
            this.atualizarContadorMulti();
        } catch (erro) {
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    lerDadosDoFormulario() {
        const selecionados = [];
        document.querySelectorAll('.chk-prod-multi-tabela:checked').forEach(chk => {
            selecionados.push(chk.value);
        });

        this.config = {
            ...this.config,
            nomeDestaque: document.getElementById('tab-nome-destaque')?.value || 'Taça',
            precoDestaque: Number(document.getElementById('tab-preco-destaque')?.value || 0),
            subtitulo: document.getElementById('tab-subtitulo')?.value || 'Sobremesa especial Cacau Show • Lista de Anotação',
            subtituloMulti: document.getElementById('tab-subtitulo-multi')?.value || 'Anote seu nome e marque a quantidade retirada',
            selecionadosMulti: selecionados,
            incluirSetor: Boolean(document.getElementById('tab-incluir-setor')?.checked),
            mesRef: document.getElementById('tab-mes-ref')?.value || '',
            folhaNumero: document.getElementById('tab-folha-numero')?.value || '',
            qtdLinhas: Number(document.getElementById('tab-qtd-linhas')?.value || 22),
            usarEscassez: Boolean(document.getElementById('tab-usar-escassez')?.checked),
            tituloEscassez: document.getElementById('tab-titulo-escassez')?.value || '',
            textoEscassez: document.getElementById('tab-texto-escassez')?.value || '',
            pixTitular: document.getElementById('tab-pix-titular')?.value || 'Robson Luiz da Maia',
            pixChave: (document.getElementById('tab-pix-chave')?.value || '').trim()
        };

        this.salvarConfigLocal();
    }

    atualizarContadorMulti() {
        const el = document.getElementById('tab-contador-multi');
        if (!el) return;
        const qtd = document.querySelectorAll('.chk-prod-multi-tabela:checked').length;
        el.innerText = `${qtd} selecionado(s)`;
    }

    async construirHtmlFinal(modoEdicao) {
        this.lerDadosDoFormulario();

        if (this.config.pixChave && this.repositorioConfiguracoes) {
            await this.repositorioConfiguracoes.salvarConfiguracoes({ chavePix: this.config.pixChave });
        }

        const produtosMulti = [];
        document.querySelectorAll('.chk-prod-multi-tabela:checked').forEach(chk => {
            produtosMulti.push({
                nome: chk.getAttribute('data-nome') || 'Produto',
                preco: Number(chk.getAttribute('data-preco') || 0)
            });
        });

        if (this.config.modelo === 'MULTI' && produtosMulti.length === 0) {
            throw new Error("Selecione pelo menos 1 chocolate para gerar a tabela Multi-Produtos.");
        }

        return await GeradorTabelaHtml.gerarDocumento({
            modelo: this.config.modelo,
            subtitulo: this.config.modelo === 'DESTAQUE' ? this.config.subtitulo : this.config.subtituloMulti,
            produtoDestaque: {
                nome: this.config.nomeDestaque,
                preco: this.config.precoDestaque
            },
            produtosMulti,
            incluirSetor: this.config.incluirSetor,
            mesRef: this.config.mesRef,
            folhaNumero: this.config.folhaNumero,
            usarEscassez: this.config.usarEscassez,
            tituloEscassez: this.config.tituloEscassez,
            textoEscassez: this.config.textoEscassez,
            quantidadeLinhas: this.config.qtdLinhas,
            pixTitular: this.config.pixTitular,
            pixChave: this.config.pixChave,
            modoEdicao
        });
    }

    vincularEventos() {
        const btnDestaque = document.getElementById('btn-modelo-destaque');
        const btnMulti = document.getElementById('btn-modelo-multi');
        const selectProdDestaque = document.getElementById('tab-select-produto-destaque');
        const btnAbrirEditor = document.getElementById('btn-abrir-editor-tabela-a4');
        const btnBaixarHtml = document.getElementById('btn-baixar-html-tabela-a4');

        btnDestaque?.addEventListener('click', () => {
            this.lerDadosDoFormulario();
            this.config.modelo = 'DESTAQUE';
            this.salvarConfigLocal();
            TelaTabelas.renderizar(this.container, { produtos: this.produtos, config: this.config });
            this.vincularEventos();
            this.atualizarContadorMulti();
        });

        btnMulti?.addEventListener('click', () => {
            this.lerDadosDoFormulario();
            this.config.modelo = 'MULTI';
            this.salvarConfigLocal();
            TelaTabelas.renderizar(this.container, { produtos: this.produtos, config: this.config });
            this.vincularEventos();
            this.atualizarContadorMulti();
        });

        selectProdDestaque?.addEventListener('change', (e) => {
            const opt = e.target.selectedOptions?.[0];
            if (!opt || !opt.value) return;
            const nome = opt.getAttribute('data-nome');
            const preco = opt.getAttribute('data-preco');
            const inputNome = document.getElementById('tab-nome-destaque');
            const inputPreco = document.getElementById('tab-preco-destaque');
            if (inputNome && nome) inputNome.value = nome;
            if (inputPreco && preco) inputPreco.value = Number(preco).toFixed(2);
        });

        document.querySelectorAll('.chk-prod-multi-tabela').forEach(chk => {
            chk.addEventListener('change', () => {
                this.atualizarContadorMulti();
            });
        });

        btnAbrirEditor?.addEventListener('click', async () => {
            const novaAba = window.open('', '_blank');
            if (novaAba) {
                novaAba.document.write('<p style="font-family:Arial;padding:24px;">Gerando folha A4 com logo e QR Code...</p>');
            }

            try {
                const html = await this.construirHtmlFinal(true);

                if (novaAba && !novaAba.closed) {
                    novaAba.document.open();
                    novaAba.document.write(html);
                    novaAba.document.close();
                } else {
                    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    window.location.href = url;
                }
            } catch (erro) {
                if (novaAba && !novaAba.closed) novaAba.close();
                alert(erro.message);
            }
        });

        btnBaixarHtml?.addEventListener('click', async () => {
            try {
                const html = await this.construirHtmlFinal(false);
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const sufixo = this.config.modelo === 'DESTAQUE'
                    ? (this.config.nomeDestaque || 'destaque').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    : 'multi-produtos';
                link.download = `tabela-${sufixo}.html`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (erro) {
                alert(erro.message);
            }
        });
    }
}
