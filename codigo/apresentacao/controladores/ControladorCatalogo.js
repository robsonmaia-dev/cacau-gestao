import { TelaCatalogo } from '../telas/TelaCatalogo.js';
import { clienteSupabase } from '../../repositorios/ConfiguracaoBanco.js';
import { ImportadorCatalogoOficial } from '../../catalogo/ImportadorCatalogoOficial.js';

export class ControladorCatalogo {
    constructor(repositorioProdutos, repositorioConfiguracoes = null) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioConfiguracoes = repositorioConfiguracoes;
        this.container = document.getElementById('conteudo-catalogo');
        this.whatsapp = localStorage.getItem('cacau_whatsapp_vendas') || '5541984051401';
        this.urlFonte = localStorage.getItem('cacau_url_fonte_catalogo') || ImportadorCatalogoOficial.URL_PADRAO;
        this.linkPublico = `${window.location.origin}${window.location.pathname.replace('index.html', '').replace('indice.html', '')}catalogo.html`;
        this.paginas = [];
        this.filtroPaginas = 'TODAS';
    }

    normalizarPaginas(listaPaginas) {
        return (listaPaginas || []).map(p => ({
            ...p,
            ativa: p.ativa !== false,
            produtos: ImportadorCatalogoOficial.deduplicarProdutosPagina(p.produtos || [], p.numero)
        }));
    }

    async inicializar() {
        await this.carregarConfiguracoes();
        await this.carregarRevistaPublicada();
        await this.atualizarTela();
    }

    async carregarConfiguracoes() {
        // 1. Tenta ler do arquivo fonte_catalogo.txt como padrão inicial se não houver nada salvo
        if (!localStorage.getItem('cacau_url_fonte_catalogo')) {
            try {
                const respFonte = await fetch('./fonte_catalogo.txt');
                if (respFonte.ok) {
                    const urlArquivo = (await respFonte.text()).trim();
                    if (urlArquivo) this.urlFonte = urlArquivo;
                }
            } catch (_) {
                // ignora se offline
            }
        }

        // 2. Tenta ler da nuvem (tabela configuracoes)
        if (this.repositorioConfiguracoes) {
            try {
                const cfg = await this.repositorioConfiguracoes.obter();
                if (cfg?.urlFonteCatalogo) this.urlFonte = cfg.urlFonteCatalogo;
            } catch (e) {
                console.warn("Aviso ao buscar urlFonteCatalogo:", e);
            }
        }
    }

    async carregarRevistaPublicada() {
        try {
            const { data } = await clienteSupabase
                .from('catalogo_publico')
                .select('*')
                .eq('id', 'principal')
                .single();

            if (data && data.paginas && data.paginas.length > 0) {
                this.paginas = this.normalizarPaginas(data.paginas);
                this.whatsapp = data.whatsapp || this.whatsapp;
                return;
            }
        } catch (e) {
            console.log("Catálogo ainda não publicado no Supabase.");
        }

        await this.carregarArquivoJsonDoRepositorio();
    }

    async carregarArquivoJsonDoRepositorio() {
        try {
            const resp = await fetch('./dados_catalogo.json');
            if (resp.ok) {
                const dados = await resp.json();
                this.paginas = this.normalizarPaginas(dados.paginas || []);
            }
        } catch (err) {
            console.log("Arquivo dados_catalogo.json não encontrado localmente.");
        }
    }

    atualizarContadoresVisuais() {
        const total = this.paginas.length;
        const ativas = this.paginas.filter(p => p.ativa !== false).length;

        const elContador = document.getElementById('contador-paginas-ativas');
        if (elContador) elContador.innerText = `${ativas} de ${total} páginas ativas`;

        const elFlutuante = document.getElementById('flutuante-resumo-paginas');
        if (elFlutuante) elFlutuante.innerText = `${ativas}`;
    }

    async atualizarTela() {
        if (!this.container) return;
        TelaCatalogo.renderizar(this.container, {
            paginas: this.paginas,
            whatsapp: this.whatsapp,
            linkPublico: this.linkPublico,
            urlFonte: this.urlFonte,
            filtroPaginas: this.filtroPaginas
        });
        this.vincularEventos();
    }

    vincularEventos() {
        const inputUrlFonte = document.getElementById('campo-url-fonte-catalogo');
        const btnAtualizarFonte = document.getElementById('btn-atualizar-da-fonte');
        const inputWhats = document.getElementById('campo-whats-vendedor');
        const btnCopiar = document.getElementById('btn-copiar-link-catalogo');
        const selectFiltro = document.getElementById('filtro-paginas-catalogo');
        const btnMarcarTodas = document.getElementById('btn-marcar-todas-paginas');
        const btnDesmarcarTodas = document.getElementById('btn-desmarcar-todas-paginas');
        const btnTopo = document.getElementById('btn-voltar-topo-catalogo');
        const btnPublicar = document.getElementById('btn-salvar-publicar-catalogo');

        inputUrlFonte?.addEventListener('change', async () => {
            this.urlFonte = inputUrlFonte.value.trim();
            localStorage.setItem('cacau_url_fonte_catalogo', this.urlFonte);
            await this.repositorioConfiguracoes?.salvarConfiguracoes({ urlFonteCatalogo: this.urlFonte });
        });

        inputWhats?.addEventListener('change', () => {
            const limpo = inputWhats.value.replace(/\D/g, '');
            if (limpo) {
                this.whatsapp = limpo;
                localStorage.setItem('cacau_whatsapp_vendas', limpo);
            }
        });

        btnCopiar?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.linkPublico);
                alert("📋 Link do catálogo copiado!\nEnvie para os seus colegas no Teams ou WhatsApp.");
            } catch (e) {
                prompt("Copie o link abaixo:", this.linkPublico);
            }
        });

        btnAtualizarFonte?.addEventListener('click', async () => {
            const urlInformada = (inputUrlFonte?.value || '').trim();
            if (!urlInformada) {
                return alert("Informe o link da fonte do catálogo oficial antes de atualizar.");
            }

            this.urlFonte = urlInformada;
            localStorage.setItem('cacau_url_fonte_catalogo', urlInformada);
            await this.repositorioConfiguracoes?.salvarConfiguracoes({ urlFonteCatalogo: urlInformada });

            btnAtualizarFonte.disabled = true;
            btnAtualizarFonte.innerText = "⏳ Importando páginas da fonte...";

            try {
                const resultado = await ImportadorCatalogoOficial.importarDeUrl(urlInformada);
                if (!resultado.paginas || resultado.paginas.length === 0) {
                    throw new Error("Nenhuma página encontrada nesse link.");
                }

                this.paginas = this.normalizarPaginas(resultado.paginas);
                alert(`🎉 Sucesso! ${this.paginas.length} páginas importadas sem '+' duplicados.\nAgora revise e clique em 'Publicar Revista'.`);
                await this.atualizarTela();
            } catch (erro) {
                const carregarLocal = confirm(
                    `⚠️ Não foi possível importar direto pelo navegador (${erro.message}).\n\n` +
                    `Se a Cacau Show bloqueou o acesso via navegador, atualize pelo botão do GitHub Actions (ou gerar_catalogo.py) colando esse mesmo link.\n\n` +
                    `Deseja recarregar a base já salva no repositório (dados_catalogo.json)?`
                );
                if (carregarLocal) {
                    await this.carregarArquivoJsonDoRepositorio();
                    await this.atualizarTela();
                } else {
                    btnAtualizarFonte.disabled = false;
                    btnAtualizarFonte.innerText = "🔄 Atualizar Catálogo da Fonte";
                }
            }
        });

        selectFiltro?.addEventListener('change', async (e) => {
            this.filtroPaginas = e.target.value;
            await this.atualizarTela();
        });

        btnMarcarTodas?.addEventListener('click', () => {
            this.paginas.forEach(p => { p.ativa = true; });
            document.querySelectorAll('.chk-pagina').forEach(c => {
                c.checked = true;
                const card = c.closest('.card-pagina-montador');
                if (card) {
                    card.style.opacity = '1';
                    card.style.borderColor = 'var(--cor-borda)';
                }
            });
            this.atualizarContadoresVisuais();
        });

        btnDesmarcarTodas?.addEventListener('click', () => {
            this.paginas.forEach(p => { p.ativa = false; });
            document.querySelectorAll('.chk-pagina').forEach(c => {
                c.checked = false;
                const card = c.closest('.card-pagina-montador');
                if (card) {
                    card.style.opacity = '0.58';
                    card.style.borderColor = '#FFCDD2';
                }
            });
            this.atualizarContadoresVisuais();
        });

        document.querySelectorAll('.chk-pagina').forEach(chk => {
            chk.addEventListener('change', () => {
                const pagNum = Number(chk.getAttribute('data-pag'));
                const pagObj = this.paginas.find(p => p.numero === pagNum);
                if (pagObj) pagObj.ativa = chk.checked;

                const card = chk.closest('.card-pagina-montador');
                if (card) {
                    card.style.opacity = chk.checked ? '1' : '0.58';
                    card.style.borderColor = chk.checked ? 'var(--cor-borda)' : '#FFCDD2';
                }
                this.atualizarContadoresVisuais();
            });
        });

        document.querySelectorAll('.chk-prod').forEach(cp => {
            cp.addEventListener('change', () => {
                const pagNum = Number(cp.getAttribute('data-pag'));
                const uid = cp.getAttribute('data-prod-uid');
                const pagObj = this.paginas.find(p => p.numero === pagNum);
                if (!pagObj) return;

                const prodObj = (pagObj.produtos || []).find((pr, idx) => {
                    const prUid = pr.uid || `p${pagNum}-${pr.id}-${idx}`;
                    return prUid === uid;
                });

                if (prodObj) {
                    prodObj.esgotado = !cp.checked;
                }
            });
        });

        btnTopo?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        btnPublicar?.addEventListener('click', async () => {
            const whats = (inputWhats?.value || this.whatsapp || '').replace(/\D/g, '');
            if (whats.length < 10) return alert("Informe um WhatsApp válido!");

            const whatsFinal = whats.startsWith('55') ? whats : `55${whats}`;
            this.whatsapp = whatsFinal;
            localStorage.setItem('cacau_whatsapp_vendas', whatsFinal);

            if (inputUrlFonte) {
                this.urlFonte = inputUrlFonte.value.trim();
                localStorage.setItem('cacau_url_fonte_catalogo', this.urlFonte);
                await this.repositorioConfiguracoes?.salvarConfiguracoes({ urlFonteCatalogo: this.urlFonte });
            }

            const paginasFinais = this.paginas
                .filter(p => p.ativa !== false)
                .map(p => ({
                    ...p,
                    ativa: true,
                    produtos: ImportadorCatalogoOficial.deduplicarProdutosPagina(p.produtos || [], p.numero)
                }));

            if (paginasFinais.length === 0) {
                return alert("Atenção: Você desmarcou todas as páginas! Marque pelo menos uma página para publicar.");
            }

            try {
                btnPublicar.disabled = true;
                btnPublicar.innerText = "Publicando...";

                const { error } = await clienteSupabase.from('catalogo_publico').upsert({
                    id: 'principal',
                    whatsapp: whatsFinal,
                    paginas: paginasFinais,
                    atualizado_em: new Date().toISOString()
                });

                if (error) throw error;

                alert(`🎉 Revista Publicada com Sucesso!\n${paginasFinais.length} páginas ativas enviadas para a nuvem.`);
            } catch (e) {
                alert(`Erro ao publicar: ${e.message}`);
            } finally {
                btnPublicar.disabled = false;
                btnPublicar.innerText = "💾 Publicar Revista";
            }
        });
    }
}
