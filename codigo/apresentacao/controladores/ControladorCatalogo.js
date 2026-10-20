import { TelaCatalogo } from '../telas/TelaCatalogo.js';

export class ControladorCatalogo {
    constructor() {
        this.container = document.getElementById('conteudo-catalogo');
        this.whatsappSalvo = localStorage.getItem('cacau_whatsapp_vendas') || '5541984051401';
        this.linkPublico = `${window.location.origin}${window.location.pathname.replace('index.html', '').replace('indice.html', '')}catalogo.html`;
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        TelaCatalogo.renderizar(this.container, this.linkPublico, this.whatsappSalvo);
        this.vincularEventos();
    }

    vincularEventos() {
        const btnCopiar = document.getElementById('btn-copiar-link-catalogo');
        const inputLink = document.getElementById('campo-link-publico-catalogo');
        const btnSalvarWhats = document.getElementById('btn-salvar-whats-catalogo');
        const inputWhats = document.getElementById('campo-whats-vendedor');

        btnCopiar?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.linkPublico);
                alert("📋 Link do catálogo copiado com sucesso!\nEnvie para os seus colegas no Teams ou WhatsApp.");
            } catch (e) {
                prompt("Copie o link abaixo:", this.linkPublico);
            }
        });

        btnSalvarWhats?.addEventListener('click', () => {
            const numero = inputWhats.value.replace(/\D/g, '');
            if (numero.length < 10) return alert("Informe um número válido com DDD!");

            const final = numero.startsWith('55') ? numero : `55${numero}`;
            this.whatsappSalvo = final;
            localStorage.setItem('cacau_whatsapp_vendas', final);
            alert("✅ WhatsApp de recebimento de pedidos atualizado com sucesso!");
        });
    }
}