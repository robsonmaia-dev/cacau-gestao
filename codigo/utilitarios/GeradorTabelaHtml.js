import { GeradorPixClipboard } from './GeradorPixClipboard.js';

/**
 * UTILITÁRIO: GeradorTabelaHtml
 * Gera o documento HTML A4 completo nos dois modelos:
 * - 'DESTAQUE': 1 produto em destaque com card de preço, escassez e guia 1x..5x.
 * - 'MULTI': múltiplos chocolates em colunas lado a lado.
 * Suporta modo editor interativo (contenteditable + barra de ferramentas) e modo limpo para download.
 */
export class GeradorTabelaHtml {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
    }

    static escaparHtml(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    static async gerarDocumento({
        modelo = 'DESTAQUE',
        subtitulo = 'Sobremesa especial Cacau Show',
        produtoDestaque = { nome: 'Taça', preco: 6.49 },
        produtosMulti = [],
        incluirSetor = false,
        usarEscassez = true,
        tituloEscassez = '⚡ SOMENTE HOJE — DISPONÍVEL APENAS POR 1 DIA!',
        textoEscassez = '',
        quantidadeLinhas = 22,
        pixTitular = 'Robson Luiz da Maia',
        pixChave = '',
        modoEdicao = true
    }) {
        const linhasQtd = Math.max(1, Math.min(45, Number(quantidadeLinhas || 22)));
        const editavelAttr = modoEdicao ? ' contenteditable="true" spellcheck="false"' : '';

        // Gera QR Code oficial do Pix offline em Base64 usando o GeradorPixClipboard do projeto
        let qrHtml = '<div style="font-size:8px;text-align:center;color:#777;padding:4px;">Sem Chave Pix</div>';
        if (pixChave && pixChave.trim() !== '') {
            try {
                const payload = GeradorPixClipboard.gerarPayloadPix({
                    chavePix: pixChave.trim(),
                    valor: null,
                    nomeRecebedor: pixTitular || 'Cacau Gestao'
                });
                const dataUrl = await GeradorPixClipboard.gerarQrCodeDataUrl(payload);
                qrHtml = `<img src="${dataUrl}" alt="QR Code PIX" style="width:100%;height:100%;display:block;" />`;
            } catch (err) {
                console.warn("Aviso ao gerar QR Code da tabela:", err);
            }
        }

        const ehDestaque = modelo === 'DESTAQUE';
        const nomeProdDestaque = this.escaparHtml(produtoDestaque?.nome || 'Produto');
        const precoProdDestaque = Number(produtoDestaque?.preco || 0);
        const precoDestaqueStr = this.formatarMoeda(precoProdDestaque);

        const listaMulti = (produtosMulti && produtosMulti.length > 0)
            ? produtosMulti
            : [{ nome: 'Trufa 30g', preco: 5.29 }, { nome: 'Tablete 20g', preco: 5.29 }];

        // Monta cabeçalho da tabela e células conforme o modelo
        let cabecalhosProdutosHtml = '';
        let celulasProdutosLinhaHtml = '';

        if (ehDestaque) {
            cabecalhosProdutosHtml = `
                <th class="prod-header"${editavelAttr}>${nomeProdDestaque} (${precoDestaqueStr}) — Qtd. / Marque</th>
            `;
            celulasProdutosLinhaHtml = `
                <td class="col-prod col-qtd"${editavelAttr}></td>
            `;
        } else {
            cabecalhosProdutosHtml = listaMulti.map(p => `
                <th class="prod-header"${editavelAttr}>
                    ${this.escaparHtml(p.nome)}
                    <span class="price-tag"${editavelAttr}>${this.formatarMoeda(p.preco)}</span>
                </th>
            `).join('');

            celulasProdutosLinhaHtml = listaMulti.map(() => `
                <td class="col-prod"${editavelAttr}></td>
            `).join('');
        }

        const colunaSetorHeader = incluirSetor ? `<th class="col-setor-th"${editavelAttr}>Setor</th>` : '';
        const colunaSetorCell = incluirSetor ? `<td class="col-setor"${editavelAttr}></td>` : '';

        let linhasTabelaHtml = '';
        for (let i = 1; i <= linhasQtd; i++) {
            const numFormatado = i < 10 ? `0${i}` : `${i}`;
            linhasTabelaHtml += `
                <tr>
                    <td class="col-num"${editavelAttr}>${numFormatado}</td>
                    <td class="col-nome"${editavelAttr}></td>
                    ${colunaSetorCell}
                    ${celulasProdutosLinhaHtml}
                    <td class="col-total"${editavelAttr}></td>
                    <td class="col-pago"><span class="checkbox-pago"></span></td>
                </tr>
            `;
        }

        // Guia rápido no rodapé
        let guiaRapidoHtml = '';
        if (ehDestaque) {
            const itensRef = [1, 2, 3, 4, 5].map(q =>
                `<strong>${q}x</strong> = ${this.formatarMoeda(precoProdDestaque * q)}`
            ).join(' &nbsp;|&nbsp; ');
            guiaRapidoHtml = `
                <div class="calc-bar"${editavelAttr}>
                    <span class="calc-header-title"><strong>Guia rápido:</strong></span>
                    ${itensRef}
                </div>
            `;
        } else {
            const itensRef = listaMulti.map(p =>
                `<strong>${this.escaparHtml(p.nome)}</strong>: ${this.formatarMoeda(p.preco)}`
            ).join(' &nbsp;|&nbsp; ');
            guiaRapidoHtml = `
                <div class="calc-bar"${editavelAttr}>
                    <span class="calc-header-title"><strong>Tabela de preços:</strong></span>
                    ${itensRef}
                </div>
            `;
        }

        const headerDireitaHtml = ehDestaque
            ? `
                <div class="price-card">
                    <div class="prod-name"${editavelAttr}>${nomeProdDestaque} (UNID.)</div>
                    <span class="price-tag"${editavelAttr}>${precoDestaqueStr}</span>
                </div>
            `
            : `
                <div class="price-card" style="min-width: 145px;">
                    <div class="prod-name"${editavelAttr}>CONSUMO NA MESA</div>
                    <span class="price-tag" style="font-size: 16px; margin-top: 2px;"${editavelAttr}>Pegue &amp; Anote</span>
                </div>
            `;

        const faixaEscassezHtml = usarEscassez
            ? `
                <div class="scarcity-bar">
                    <strong${editavelAttr}>${this.escaparHtml(tituloEscassez)}</strong>
                    <span class="meta-info"${editavelAttr}>${this.escaparHtml(textoEscassez)}</span>
                </div>
            `
            : '';

        const textoInstrucao = ehDestaque
            ? `<strong>Como funciona:</strong> 1) Pegue a sua ${nomeProdDestaque} &nbsp;•&nbsp; 2) Anote seu <strong>Nome</strong> e marque a <strong>Quantidade</strong> (ex: I, II) &nbsp;•&nbsp; 3) Acerte depois via <strong>PIX</strong>!`
            : `<strong>Como funciona:</strong> 1) Pegue seu chocolate &nbsp;•&nbsp; 2) Anote seu <strong>Nome</strong> e marque a quantidade na coluna do sabor (ex: I, II) &nbsp;•&nbsp; 3) Acerte via <strong>PIX</strong>!`;

        const detalheValorPixHtml = ehDestaque
            ? `<div>Valor unitário: <strong>${precoDestaqueStr}</strong></div>`
            : `<div>Informe o valor total somado dos seus chocolates</div>`;

        const barraEditorHtml = modoEdicao ? this.obterBarraEditorHtml() : '';
        const estiloEditorCss = modoEdicao ? this.obterEstiloEditorCss() : '';
        const scriptEditorJs = modoEdicao ? this.obterScriptEditorJs() : '';

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tabela de Anotação - ${ehDestaque ? nomeProdDestaque : 'Multi-Produtos'}</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: "Segoe UI", Arial, Helvetica, sans-serif;
            background: #e9e4dc;
            color: #2b150d;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .folha-a4 {
            width: 190mm;
            min-height: 277mm;
            margin: ${modoEdicao ? '62px' : '20px'} auto 20px auto;
            background: #ffffff;
            padding: 4mm;
            border: 1.5px solid #c59b27;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .header-box {
            background: linear-gradient(135deg, #4A2518 0%, #5C2F1E 50%, #3D1F14 100%);
            color: #ffffff;
            border: 2px solid #c59b27;
            border-radius: 6px;
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .brand-title {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 21px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #F3E5AB;
        }

        .brand-subtitle {
            font-size: 12.5px;
            color: #ffffff;
            margin-top: 2px;
        }

        .price-card {
            background: #ffffff;
            color: #3D1F14;
            border: 2px solid #c59b27;
            border-radius: 6px;
            padding: 6px 14px;
            text-align: center;
            min-width: 135px;
        }

        .price-card .prod-name {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #5C2F1E;
        }

        .price-card .price-tag {
            display: block;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 24px;
            font-weight: 900;
            color: #2b150d;
            line-height: 1.1;
        }

        .scarcity-bar {
            margin-top: 6px;
            background: #FFF6DC;
            border: 1.5px solid #c59b27;
            border-left: 6px solid #b42318;
            border-radius: 4px;
            padding: 6px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #2b150d;
            gap: 8px;
        }

        .scarcity-bar strong {
            color: #9e1c13;
            font-size: 11.5px;
            letter-spacing: 0.3px;
        }

        .instruction-bar {
            margin-top: 5px;
            font-size: 11px;
            color: #4A2518;
            background: #FAF6EF;
            border: 1px solid #d9c7a3;
            border-radius: 4px;
            padding: 5px 10px;
            text-align: center;
        }

        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 11px;
        }

        .main-table thead th {
            background: #4A2518;
            color: #F3E5AB;
            border: 1px solid #4A2518;
            padding: 6px 5px;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.3px;
        }

        .main-table thead th.prod-header {
            background: #5C2F1E;
            color: #ffffff;
        }

        .main-table thead th.prod-header .price-tag {
            display: block;
            font-size: 10.5px;
            color: #F3E5AB;
            font-weight: 800;
            margin-top: 2px;
        }

        .main-table tbody tr:nth-child(even) {
            background: #FCF9F4;
        }

        .main-table tbody td {
            border: 1px solid #8c7051;
            height: 7.7mm;
            padding: 2px 5px;
            vertical-align: middle;
        }

        .col-num {
            width: 8.5mm;
            text-align: center;
            font-weight: 700;
            color: #5C2F1E;
            background: #F7F1E6;
        }

        .col-nome {
            min-width: ${ehDestaque ? '76mm' : '48mm'};
        }

        .col-setor-th,
        .col-setor {
            width: 24mm;
            text-align: center;
        }

        .col-prod,
        .col-qtd {
            text-align: center;
        }

        .col-total {
            width: 22mm;
            text-align: center;
        }

        .col-pago {
            width: 15mm;
            text-align: center;
        }

        .checkbox-pago {
            display: inline-block;
            width: 4.2mm;
            height: 4.2mm;
            border: 1.4px solid #4A2518;
            border-radius: 2px;
            vertical-align: middle;
        }

        .calc-bar {
            margin-top: 6px;
            background: #FAF6EF;
            border: 1px dashed #c59b27;
            border-radius: 4px;
            padding: 5px 8px;
            font-size: 10.5px;
            text-align: center;
            color: #3D1F14;
        }

        .pix-box {
            margin-top: 6px;
            border: 1.5px solid #c59b27;
            border-radius: 6px;
            background: #FFFDF9;
            padding: 7px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .pix-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .pix-qr-box {
            width: 22mm;
            height: 22mm;
            border: 1px solid #c59b27;
            padding: 1mm;
            background: #ffffff;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pix-badge {
            display: inline-block;
            background: #4A2518;
            color: #F3E5AB;
            font-size: 9.5px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 3px;
            margin-bottom: 3px;
            letter-spacing: 0.5px;
        }

        .pix-details {
            font-size: 11px;
            line-height: 1.4;
            color: #2b150d;
        }

        .pix-key {
            font-weight: 800;
            color: #4A2518;
        }

        .pix-right-instructions {
            font-size: 10px;
            color: #5C2F1E;
            text-align: right;
            max-width: 62mm;
            line-height: 1.35;
        }

        @media print {
            body {
                background: #ffffff !important;
                margin: 0 !important;
                padding-top: 0 !important;
            }

            .folha-a4 {
                margin: 0 !important;
                width: 100% !important;
                min-height: auto !important;
                box-shadow: none !important;
            }
        }
    </style>
    ${estiloEditorCss}
</head>
<body>
    ${barraEditorHtml}

    <div class="folha-a4">
        <div>
            <header class="header-box">
                <div>
                    <div class="brand-title"${editavelAttr}>CACAU SHOW</div>
                    <div class="brand-subtitle"${editavelAttr}>${this.escaparHtml(subtitulo)} • Lista de Anotação</div>
                </div>
                ${headerDireitaHtml}
            </header>

            ${faixaEscassezHtml}

            <div class="instruction-bar"${editavelAttr}>
                ${textoInstrucao}
            </div>

            <table class="main-table">
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>Nome Completo</th>
                        ${colunaSetorHeader}
                        ${cabecalhosProdutosHtml}
                        <th>Total (R$)</th>
                        <th>Pago</th>
                    </tr>
                </thead>
                <tbody>
                    ${linhasTabelaHtml}
                </tbody>
            </table>
        </div>

        <div>
            ${guiaRapidoHtml}

            <footer class="pix-box">
                <div class="pix-left">
                    <div class="pix-qr-box" id="pix-qr-container">
                        ${qrHtml}
                    </div>
                    <div>
                        <div class="pix-badge"${editavelAttr}>PAGUE DEPOIS COM PIX</div>
                        <div class="pix-details">
                            <div>Titular: <strong id="pix-titular-texto"${editavelAttr}>${this.escaparHtml(pixTitular)}</strong></div>
                            <div>Chave PIX: <span class="pix-key" id="pix-chave-texto"${editavelAttr}>${this.escaparHtml(pixChave || 'Não informada')}</span></div>
                            <div${editavelAttr}>${detalheValorPixHtml}</div>
                        </div>
                    </div>
                </div>
                <div class="pix-right-instructions"${editavelAttr}>
                    <strong>Atenção:</strong><br />
                    Após pagar via PIX, envie o comprovante ou marque um <strong>✓</strong> na coluna <em>Pago</em> ao lado do seu nome.
                </div>
            </footer>
        </div>
    </div>

    ${scriptEditorJs}
</body>
</html>`;
    }

    static obterBarraEditorHtml() {
        return `
<div id="barra-editor-tabela" contenteditable="false" style="position:fixed;top:0;left:0;right:0;min-height:48px;background:#180b06;color:#ffffff;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:6px 14px;gap:8px;z-index:999999;box-shadow:0 3px 12px rgba(0,0,0,0.5);font-family:Arial,sans-serif;user-select:none;">
    <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:900;color:#e8b938;letter-spacing:1px;font-size:13px;">CACAU SHOW</span>
        <span style="background:#2C160E;color:#F3E5AB;border:1px solid #734f19;font-size:10px;font-weight:bold;padding:2px 7px;border-radius:3px;">EDITOR A4</span>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
        <button type="button" class="btn-editor" onclick="adicionarLinha()">➕ Linha</button>
        <button type="button" class="btn-editor" onclick="removerLinha()">➖ Linha</button>
        <button type="button" class="btn-editor" onclick="adicionarColuna()" style="background:#3b2014;border-color:#d4af37;">➕ Coluna</button>
        <button type="button" class="btn-editor" onclick="removerColuna()" style="background:#3b2014;color:#fca5a5;">➖ Coluna</button>
        <button type="button" class="btn-editor" onclick="configurarPix()">💳 PIX</button>
        <button type="button" class="btn-editor" onclick="baixarHtmlLimpo()" style="background:#1e7e34;border-color:#28a745;color:#fff;">⬇️ Baixar HTML</button>
        <button type="button" class="btn-editor btn-imprimir" onclick="window.print()">🖨️ Imprimir A4</button>
    </div>
</div>`;
    }

    static obterEstiloEditorCss() {
        return `
<style id="estilo-editor-tabela">
    [contenteditable="true"] {
        cursor: text;
        transition: background-color 0.15s ease, outline 0.15s ease;
    }

    [contenteditable="true"]:hover {
        outline: 1.5px dashed #c59b27 !important;
        background-color: rgba(212, 175, 55, 0.10) !important;
    }

    [contenteditable="true"]:focus {
        outline: 2px solid #2C160E !important;
        background-color: rgba(212, 175, 55, 0.20) !important;
    }

    .btn-editor {
        background: #2C160E;
        color: #F3E5AB;
        border: 1px solid #c59b27;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 700;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-family: Arial, sans-serif;
    }

    .btn-editor:hover {
        background: #3d2014;
        color: #ffffff;
    }

    .btn-imprimir {
        background: #c59b27 !important;
        border-color: #F3E5AB !important;
        color: #2C160E !important;
        font-weight: 800 !important;
    }

    @media print {
        #barra-editor-tabela {
            display: none !important;
        }

        [contenteditable="true"] {
            outline: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
        }
    }
</style>`;
    }

    static obterScriptEditorJs() {
        return `
<script id="script-editor-tabela">
(function() {
    function obterTabelaPrincipal() {
        return document.querySelector('.main-table') || document.querySelector('table');
    }

    function gerarPayloadPixBrCode(chavePix, nomeRecebedor) {
        function fmt(id, val) {
            var s = String(val);
            var tam = s.length < 10 ? '0' + s.length : '' + s.length;
            return id + tam + s;
        }
        var nome = String(nomeRecebedor || 'Cacau Gestao')
            .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
            .replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 25) || 'Cacau Gestao';

        var info = fmt('00', 'BR.GOV.BCB.PIX') + fmt('01', String(chavePix).trim());
        var payload = fmt('00', '01') + fmt('26', info) + fmt('52', '0000') + fmt('53', '986')
            + fmt('58', 'BR') + fmt('59', nome) + fmt('60', 'Curitiba')
            + fmt('62', fmt('05', '***')) + '6304';

        var crc = 0xFFFF;
        for (var i = 0; i < payload.length; i++) {
            crc ^= (payload.charCodeAt(i) << 8);
            for (var j = 0; j < 8; j++) {
                crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
            }
        }
        return payload + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    }

    window.adicionarColuna = function() {
        var tabela = obterTabelaPrincipal();
        if (!tabela) return;

        var theadTr = tabela.querySelector('thead tr');
        var tbody = tabela.querySelector('tbody');
        if (!theadTr || !tbody) return;

        var nome = prompt("Nome do chocolate da nova coluna:", "Novo Produto");
        if (nome === null) return;

        var preco = prompt("Preço do produto (Ex: R$ 5,29):", "R$ 0,00");
        if (preco === null) return;

        // Insere antes das 2 últimas colunas (Total e Pago)
        var indiceInsercao = Math.max(2, theadTr.children.length - 2);
        var thRef = theadTr.children[indiceInsercao];

        var th = document.createElement('th');
        th.className = 'prod-header';
        th.setAttribute('contenteditable', 'true');
        th.innerHTML = (nome.trim() || 'Produto') + ' <span class="price-tag" contenteditable="true">' + (preco.trim() || 'R$ 0,00') + '</span>';
        theadTr.insertBefore(th, thRef);

        tbody.querySelectorAll('tr').forEach(function(tr) {
            var td = document.createElement('td');
            td.className = 'col-prod';
            td.setAttribute('contenteditable', 'true');
            tr.insertBefore(td, tr.children[indiceInsercao]);
        });
    };

    window.removerColuna = function() {
        var tabela = obterTabelaPrincipal();
        if (!tabela) return;

        var theadTr = tabela.querySelector('thead tr');
        var tbody = tabela.querySelector('tbody');
        if (!theadTr || !tbody) return;

        var headersProd = theadTr.querySelectorAll('th.prod-header');
        if (headersProd.length <= 1) {
            alert("A tabela precisa manter pelo menos 1 coluna de produto.");
            return;
        }

        var ultimaProdTh = headersProd[headersProd.length - 1];
        if (confirm("Remover a última coluna de produto?")) {
            var indice = Array.prototype.indexOf.call(theadTr.children, ultimaProdTh);
            ultimaProdTh.remove();

            tbody.querySelectorAll('tr').forEach(function(tr) {
                if (tr.children[indice]) tr.children[indice].remove();
            });
        }
    };

    window.adicionarLinha = function() {
        var tabela = obterTabelaPrincipal();
        if (!tabela) return;

        var tbody = tabela.querySelector('tbody');
        var theadTr = tabela.querySelector('thead tr');
        if (!tbody || !theadTr) return;

        var proximoNum = tbody.querySelectorAll('tr').length + 1;
        var numFmt = proximoNum < 10 ? '0' + proximoNum : '' + proximoNum;
        var tr = document.createElement('tr');

        for (var i = 0; i < theadTr.children.length; i++) {
            var td = document.createElement('td');
            if (i === 0) {
                td.className = 'col-num';
                td.setAttribute('contenteditable', 'true');
                td.textContent = numFmt;
            } else if (i === theadTr.children.length - 1) {
                td.className = 'col-pago';
                td.innerHTML = '<span class="checkbox-pago"></span>';
            } else {
                if (i === 1) td.className = 'col-nome';
                else if (i === theadTr.children.length - 2) td.className = 'col-total';
                else td.className = 'col-prod';
                td.setAttribute('contenteditable', 'true');
            }
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    };

    window.removerLinha = function() {
        var tabela = obterTabelaPrincipal();
        if (!tabela) return;
        var tbody = tabela.querySelector('tbody');
        var linhas = tbody ? tbody.querySelectorAll('tr') : [];
        if (linhas.length > 1) {
            linhas[linhas.length - 1].remove();
        } else {
            alert('A tabela precisa de pelo menos uma linha.');
        }
    };

    window.configurarPix = function() {
        var elTitular = document.getElementById('pix-titular-texto');
        var elChave = document.getElementById('pix-chave-texto');
        var qrContainer = document.getElementById('pix-qr-container');

        var novoTitular = prompt('Nome do Titular do PIX:', elTitular ? elTitular.innerText.trim() : '');
        if (novoTitular !== null && elTitular) elTitular.innerText = novoTitular.trim();

        var novaChave = prompt('Chave PIX:', elChave ? elChave.innerText.trim() : '');
        if (novaChave !== null && novaChave.trim() !== '' && elChave) {
            elChave.innerText = novaChave.trim();
            if (window.QRCode && qrContainer) {
                var payload = gerarPayloadPixBrCode(novaChave.trim(), elTitular ? elTitular.innerText : 'Cacau Gestao');
                window.QRCode.toDataURL(payload, { width: 220, margin: 1 }, function(err, url) {
                    if (!err && url) {
                        qrContainer.innerHTML = '<img src="' + url + '" alt="QR Code PIX" style="width:100%;height:100%;display:block;" />';
                    }
                });
            }
        }
    };

    window.baixarHtmlLimpo = function() {
        var clone = document.documentElement.cloneNode(true);
        ['barra-editor-tabela', 'estilo-editor-tabela', 'script-editor-tabela'].forEach(function(id) {
            var el = clone.querySelector('#' + id);
            if (el) el.remove();
        });
        clone.querySelectorAll('[contenteditable]').forEach(function(el) {
            el.removeAttribute('contenteditable');
            el.removeAttribute('spellcheck');
        });
        var folha = clone.querySelector('.folha-a4');
        if (folha) folha.style.marginTop = '20px';

        var conteudo = '<!DOCTYPE html>\\n' + clone.outerHTML;
        var blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'tabela-anotacao-cacau.html';
        a.click();
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    };
})();
<\/script>`;
    }
}
