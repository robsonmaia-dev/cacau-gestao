import { TelaCatalogo } from '../telas/TelaCatalogo.js';
import { clienteSupabase } from '../../repositorios/ConfiguracaoBanco.js';

export class ControladorCatalogo {
    constructor(repositorioProdutos) {
        this.repositorioProdutos = repositorioProdutos;
        this.container = document.getElementById('conteudo-catalogo');
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
            // 1. Tenta carregar do Supabase
            const { data } = await clienteSupabase
                .from('catalogo_publico')
                .select('*')
                .eq('id', 'principal')
                .single();

            if (data && data.paginas && data.paginas.length > 0) {
                this.paginas = data.paginas;
                this.whatsapp = data.whatsapp || this.whatsapp;
                return;
            }
        } catch (e) {
            console.log("Catálogo ainda não publicado no Supabase.");
        }

        // 2. Se não estiver no Supabase, tenta carregar dados_catalogo.json do próprio repositório
        await this.carregarArquivoJsonDoRepositorio();
    }

    async carregarArquivoJsonDoRepositorio() {
        try {
            const resp = await fetch('./dados_catalogo.json');
            if (resp.ok) {
                const dados = await resp.json();
                this.paginas = dados.paginas || [];
            }
        } catch (err) {
            console.log("Arquivo dados_catalogo.json não encontrado localmente.");
        }
    }

    async atualizarTela() {
        if (!this.container) return;
        TelaCatalogo.renderizar(this.container, {
            paginas: this.paginas,
            whatsapp: this.whatsapp,
            linkPublico: this.linkPublico
        });
        this.vincularEventos();
    }

    vincularEventos() {
        const btnCopiar = document.getElementById('btn-copiar-link-catalogo');
        const btnRecarregar = document.getElementById('btn-recarregar-json-base');
        const btnCarregarIni = document.getElementById('btn-carregar-inicial');
        const inputArquivoJson = document.getElementById('input-arquivo-json-catalogo');
        const btnMarcarTodas = document.getElementById('btn-marcar-todas-paginas');
        const btnDesmarcarTodas = document.getElementById('btn-desmarcar-todas-paginas');
        const btnSincronizar = document.getElementById('btn-sincronizar-estoque-catalogo');
        const btnPublicar = document.getElementById('btn-salvar-publicar-catalogo');

        btnCopiar?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.linkPublico);
                alert("📋 Link do catálogo copiado!\nEnvie para os seus colegas no Teams ou WhatsApp.");
            } catch (e) {
                prompt("Copie o link abaixo:", this.linkPublico);
            }
        });

        // Carregar do arquivo dados_catalogo.json do repositório
        const acaoCarregar = async () => {
            await this.carregarArquivoJsonDoRepositorio();
            if (this.paginas.length > 0) {
                alert(`🎉 Sucesso! ${this.paginas.length} páginas carregadas com sucesso!`);
            } else {
                alert("O arquivo dados_catalogo.json não foi encontrado. Execute 'python extrair_catalogo.py' para gerá-lo!");
            }
            await this.atualizarTela();
        };

        btnRecarregar?.addEventListener('click', acaoCarregar);
        btnCarregarIni?.addEventListener('click', acaoCarregar);

        // Carregar via upload de arquivo JSON direto no navegador
        inputArquivoJson?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evento) => {
                try {
                    const dados = JSON.parse(evento.target.result);
                    this.paginas = dados.paginas || [];
                    alert(`🎉 ${this.paginas.length} páginas carregadas do arquivo!`);
                    await this.atualizarTela();
                } catch (err) {
                    alert("Arquivo JSON inválido.");
                }
            };
            reader.readAsText(file);
        });

        // Marcar / Desmarcar Páginas
        btnMarcarTodas?.addEventListener('click', () => {
            document.querySelectorAll('.chk-pagina').forEach(c => c.checked = true);
        });

        btnDesmarcarTodas?.addEventListener('click', () => {
            document.querySelectorAll('.chk-pagina').forEach(c => c.checked = false);
        });

        document.querySelectorAll('.chk-pagina').forEach(chk => {
            chk.addEventListener('change', () => {
                const pagNum = chk.getAttribute('data-pag');
                document.querySelectorAll(`.chk-prod-p${pagNum}`).forEach(cp => {
                    cp.checked = chk.checked;
                });
            });
        });

        // Sincronizar com Estoque Real do Supabase
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

            alert(`⚡ Estoque sincronizado! ${ajustados} itens ajustados conforme o estoque real.`);
        });

        // PUBLICAR REVISTA PARA OS CLIENTES NO SUPABASE (BLINDADO)
        btnPublicar?.addEventListener('click', async () => {
            const inputWhats = document.getElementById('campo-whats-vendedor');
            const whats = inputWhats.value.replace(/\D/g, '');
            if (whats.length < 10) return alert("Informe um WhatsApp válido!");

            const whatsFinal = whats.startsWith('55') ? whats : `55${whats}`;
            this.whatsapp = whatsFinal;
            localStorage.setItem('cacau_whatsapp_vendas', whatsFinal);

            // Mapeia o estado diretamente das checkboxes que existem na tela
            const checkboxesPaginas = document.querySelectorAll('.chk-pagina');
            const mapaPaginasAtivas = new Map();
            checkboxesPaginas.forEach(chk => {
                mapaPaginasAtivas.set(Number(chk.getAttribute('data-pag')), chk.checked);
            });

            const checkboxesProdutos = document.querySelectorAll('.chk-prod');
            const mapaProdutosDisponiveis = new Map();
            checkboxesProdutos.forEach(chk => {
                mapaProdutosDisponiveis.set(chk.getAttribute('data-prod-id'), chk.checked);
            });

            // Aplica as escolhas: se a página foi desmarcada, ela NÃO vai para o cliente
            const paginasFinais = [];

            this.paginas.forEach(p => {
                const estaAtiva = mapaPaginasAtivas.has(p.numero)
                    ? mapaPaginasAtivas.get(p.numero)
                    : (p.ativa !== false);

                // Só inclui na revista se a página estiver MARCADA
                if (estaAtiva) {
                    const produtosAjustados = p.produtos.map(prod => {
                        const marcado = mapaProdutosDisponiveis.has(prod.id)
                            ? mapaProdutosDisponiveis.get(prod.id)
                            : !prod.esgotado;

                        return {
                            ...prod,
                            esgotado: !marcado // Se desmarcou, vira ESGOTADO
                        };
                    });

                    paginasFinais.append ? paginasFinais.append : paginasFinais.push({
                        ...p,
                        ativa: true,
                        produtos: produtosAjustados
                    });
                }
            });

            if (paginasFinais.length === 0) {
                return alert("Atenção: Você desmarcou todas as páginas! Marque pelo menos uma página para publicar.");
            }

            try {
                btnPublicar.disabled = true;
                btnPublicar.innerText = "Publicando...";

                // Grava no Supabase apenas as páginas que você escolheu
                const { error } = await clienteSupabase.from('catalogo_publico').upsert({
                    id: 'principal',
                    whatsapp: whatsFinal,
                    paginas: paginasFinais,
                    atualizado_em: new Date().toISOString()
                });

                if (error) throw error;

                alert(`🎉 Revista Publicada com Sucesso!\n${paginasFinais.length} páginas ativas enviadas para a nuvem.`);
                btnPublicar.disabled = false;
                btnPublicar.innerText = "💾 Publicar Revista para Clientes";
            } catch (e) {
                alert(`Erro ao publicar: ${e.message}`);
                btnPublicar.disabled = false;
                btnPublicar.innerText = "💾 Publicar Revista para Clientes";
            }
        });
    }
}