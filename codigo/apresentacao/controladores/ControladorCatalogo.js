import { TelaCatalogo } from '../telas/TelaCatalogo.js';
import { ImportadorCatalogoOficial } from '../../catalogo/ImportadorCatalogoOficial.js';
import { clienteSupabase } from '../../repositorios/ConfiguracaoBanco.js';

export class ControladorCatalogo {
    /**
     * @param {import('../../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     */
    constructor(repositorioProdutos) {
        this.repositorioProdutos = repositorioProdutos;
        this.container = document.getElementById('conteudo-catalogo');
        this.urlCatalogo = ImportadorCatalogoOficial.URL_PADRAO;
        this.whatsapp = localStorage.getItem('cacau_whatsapp_vendas') || '5541984051401';
        this.linkPublico = `${window.location.origin}${window.location.pathname.replace('index.html', '').replace('indice.html', '')}catalogo.html`;
        this.paginas = [];
    }

    async inicializar() {
        await this.carregarRevistaPublicada();
        await this.atualizarTela();
    }

    async carregarRevistaPublicada() {
        try {
            // Tenta carregar do Supabase primeiro
            const { data } = await clienteSupabase
                .from('catalogo_publico')
                .select('*')
                .eq('id', 'principal')
                .single();

            if (data && data.paginas && data.paginas.length > 0) {
                this.paginas = data.paginas;
                this.whatsapp = data.whatsapp || this.whatsapp;
            } else {
                // Se ainda não salvou no banco, carrega do localStorage ou inicializa vazio
                const local = localStorage.getItem('cacau_revista_dados');
                if (local) this.paginas = JSON.parse(local);
            }
        } catch (e) {
            console.log("Iniciando montador de revista...");
        }
    }

    async atualizarTela() {
        if (!this.container) return;
        TelaCatalogo.renderizar(this.container, {
            paginas: this.paginas,
            whatsapp: this.whatsapp,
            linkPublico: this.linkPublico,
            urlCatalogo: this.urlCatalogo
        });
        this.vincularEventos();
    }

    vincularEventos() {
        const btnCopiar = document.getElementById('btn-copiar-link-catalogo');
        const btnImportar = document.getElementById('btn-importar-catalogo-oficial');
        const btnCarregarIni = document.getElementById('btn-carregar-inicial');
        const btnMarcarTodas = document.getElementById('btn-marcar-todas-paginas');
        const btnDesmarcarTodas = document.getElementById('btn-desmarcar-todas-paginas');
        const btnSincronizar = document.getElementById('btn-sincronizar-estoque-catalogo');
        const btnPublicar = document.getElementById('btn-salvar-publicar-catalogo');

        // Copiar Link
        btnCopiar?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.linkPublico);
                alert("📋 Link do catálogo copiado!\nEnvie para os seus colegas no Teams ou WhatsApp.");
            } catch (e) {
                prompt("Copie o link abaixo:", this.linkPublico);
            }
        });

        // Importar do Site Oficial
        const acaoImportar = async () => {
            const inputUrl = document.getElementById('campo-url-catalogo');
            const url = inputUrl?.value.trim() || this.urlCatalogo;

            const btn = btnImportar || btnCarregarIni;
            const textoOriginal = btn.innerText;
            btn.innerText = "⏳ Importando...";
            btn.disabled = true;

            try {
                const resultado = await ImportadorCatalogoOficial.importarDeUrl(url);
                this.paginas = resultado.paginas;
                this.urlCatalogo = url;
                alert(`🎉 Sucesso! ${resultado.totalPaginas} páginas e produtos importados do site oficial!`);
                await this.atualizarTela();
            } catch (erro) {
                alert(`Erro ao importar: ${erro.message}`);
                btn.innerText = textoOriginal;
                btn.disabled = false;
            }
        };

        btnImportar?.addEventListener('click', acaoImportar);
        btnCarregarIni?.addEventListener('click', acaoImportar);

        // Marcar / Desmarcar Todas as Páginas
        btnMarcarTodas?.addEventListener('click', () => {
            document.querySelectorAll('.chk-pagina').forEach(c => c.checked = true);
        });

        btnDesmarcarTodas?.addEventListener('click', () => {
            document.querySelectorAll('.chk-pagina').forEach(c => c.checked = false);
        });

        // Alternar checkboxes da página
        document.querySelectorAll('.chk-pagina').forEach(chk => {
            chk.addEventListener('change', () => {
                const pagNum = chk.getAttribute('data-pag');
                document.querySelectorAll(`.chk-prod-p${pagNum}`).forEach(cp => {
                    cp.checked = chk.checked;
                });
            });
        });

        // Sincronizar com o Estoque Real do Supabase
        btnSincronizar?.addEventListener('click', async () => {
            if (!this.repositorioProdutos) return;
            const produtosEstoque = await this.repositorioProdutos.obterTodosComLotes();
            const mapaEstoque = new Map();

            produtosEstoque.forEach(p => {
                mapaEstoque.set(p.nome.toLowerCase().trim(), p.obterEstoqueTotal());
            });

            let ajustados = 0;
            document.querySelectorAll('.chk-prod').forEach(cp => {
                const label = cp.closest('label')?.innerText.toLowerCase() || '';
                for (const [nomeProd, qtdEstoque] of mapaEstoque.entries()) {
                    if (label.includes(nomeProd)) {
                        cp.checked = qtdEstoque > 0;
                        ajustados++;
                        break;
                    }
                }
            });

            alert(`⚡ Estoque sincronizado! ${ajustados} itens tiveram disponibilidade ajustada conforme o estoque real.`);
        });

        // PUBLICAR REVISTA (SALVA NO SUPABASE PARA TODOS OS CLIENTES)
        btnPublicar?.addEventListener('click', async () => {
            const inputWhats = document.getElementById('campo-whats-vendedor');
            const whats = inputWhats.value.replace(/\D/g, '');
            if (whats.length < 10) return alert("Informe um WhatsApp válido!");

            const whatsFinal = whats.startsWith('55') ? whats : `55${whats}`;
            this.whatsapp = whatsFinal;
            localStorage.setItem('cacau_whatsapp_vendas', whatsFinal);

            // Captura o estado das páginas e produtos selecionados
            const paginasAtualizadas = this.paginas.map(p => {
                const chkPag = document.querySelector(`.chk-pagina[data-pag="${p.numero}"]`);
                const ativa = chkPag ? chkPag.checked : p.ativa;

                const produtosAjustados = p.produtos.map(prod => {
                    const chkProd = document.querySelector(`.chk-prod[data-prod-id="${prod.id}"]`);
                    return {
                        ...prod,
                        esgotado: chkProd ? !chkProd.checked : prod.esgotado
                    };
                });

                return {
                    ...p,
                    ativa: ativa,
                    produtos: produtosAjustados
                };
            });

            this.paginas = paginasAtualizadas;
            localStorage.setItem('cacau_revista_dados', JSON.stringify(paginasAtualizadas));

            // Grava no Supabase para os clientes acessarem em catalogo.html
            try {
                btnPublicar.disabled = true;
                btnPublicar.innerText = "Publicando na Nuvem...";

                await clienteSupabase.from('catalogo_publico').upsert({
                    id: 'principal',
                    whatsapp: whatsFinal,
                    paginas: paginasAtualizadas,
                    atualizado_em: new Date().toISOString()
                });

                alert("🎉 Revista Digital publicada com sucesso!\nTodos os clientes já estão vendo as novas páginas e estoques atualizados.");
                await this.atualizarTela();
            } catch (e) {
                alert(`Erro ao publicar no banco: ${e.message}`);
                btnPublicar.disabled = false;
                btnPublicar.innerText = "💾 Publicar Revista para Clientes";
            }
        });
    }
}