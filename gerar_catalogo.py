import json
import re
import requests

CATALOGO_URL = "https://catalogo.cacaushow.com.br/2026/catalogo/ciclo-13-e-14/catalogo-vd-ciclos-13-e-14/?page=2"
WHATSAPP_PADRAO = "5541984051401"
SUPABASE_URL = "https://bvqyiccynvgndugxayzh.supabase.co"
SUPABASE_KEY = "sb_publishable_31sF_uP_iTuYo3XRHnfqEA_bFQrg3XB"

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

print("[*] Baixando catálogo da Cacau Show...")
resp = requests.get(CATALOGO_URL, headers=headers)
match = re.search(r"window\.staticSettings\s*=\s*(\{.+?\});", resp.text, re.DOTALL)
settings = json.loads(match.group(1))

paper_aws = settings.get("aws", {}).get("url", "")
policy = settings.get("aws", {}).get("policy", "")
total_paginas = len(settings.get("pages", []))
chunks = settings.get("enrichments", {}).get("chunkUrls", {})

produtos_por_pagina = {p: [] for p in range(1, total_paginas + 1)}

for chunk_key, chunk_url in chunks.items():
    try:
        c_resp = requests.get(chunk_url, headers=headers)
        if c_resp.status_code == 200:
            data = c_resp.json()
            for item in data.get("enrichments", []):
                nome = item.get("name") or item.get("alttext") or ""
                preco = item.get("price") or 0.0
                pagina = item.get("pageIndex", 0) + 1 if "pageIndex" in item else item.get("pagenumber", 1)

                if nome and preco:
                    produtos_por_pagina[pagina].append({
                        "id": str(item.get("productId") or item.get("id")),
                        "nome": nome.strip(),
                        "preco": float(preco),
                        "x": float(item.get("x", 0)) * 100,
                        "y": float(item.get("y", 0)) * 100,
                        "w": float(item.get("width", 0.1)) * 100,
                        "h": float(item.get("height", 0.08)) * 100,
                        "esgotado": False
                    })
    except Exception:
        pass

paginas = []
for p in range(1, total_paginas + 1):
    paginas.append({
        "numero": p,
        "imagem": f"{paper_aws}Pages/{p}/Normal.jpg?{policy}",
        "qtd_produtos": len(produtos_por_pagina.get(p, [])),
        "produtos": produtos_por_pagina.get(p, []),
        "ativa": True
    })

paginas_json = json.dumps(paginas, ensure_ascii=False)

html_conteudo = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <!-- Evita cache antigo no navegador -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>Catálogo Digital - Cacau Show</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }}
        body {{ background: #1c0e07; color: #fff; min-height: 100vh; overflow-x: hidden; display: flex; flex-direction: column; align-items: center; }}
        header {{ width: 100%; padding: 12px; background: rgba(0,0,0,0.6); text-align: center; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.1); }}
        
        .flipbook-container {{
            margin: 10px auto;
            display: flex;
            justify-content: center;
            align-items: center;
            max-width: 100vw;
            padding: 5px;
        }}

        .page {{
            background: #fff;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }}

        .page img.bg-page {{
            width: 100%;
            height: 100%;
            display: block;
            user-select: none;
            pointer-events: none;
            object-fit: cover;
        }}

        /* Botão do Produto com prioridade máxima de clique */
        .hotspot-prod {{
            position: absolute;
            background: #25d366 !important;
            color: #fff !important;
            border: 2px solid #fff;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            transform: translate(-50%, -50%);
            z-index: 9999 !important; /* Acima de qualquer elemento do PageFlip */
            user-select: none;
            touch-action: auto !important;
            pointer-events: auto !important;
        }}
        .hotspot-prod:active {{
            transform: translate(-50%, -50%) scale(1.15);
            background: #1eb954 !important;
        }}

        .hotspot-badge {{
            position: absolute;
            top: -6px;
            right: -6px;
            background: #4a2511;
            color: white;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 10px;
            border: 1px solid white;
            display: none;
        }}

        .hotspot-esgotado {{
            position: absolute;
            transform: translate(-50%, -50%);
            background: rgba(220, 38, 38, 0.95);
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 12px;
            border: 1.5px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            user-select: none;
            cursor: not-allowed;
            z-index: 999;
            white-space: nowrap;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }}

        .nav-controls {{
            display: flex;
            gap: 15px;
            margin-bottom: 85px;
            align-items: center;
        }}

        .btn-nav {{
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }}

        .cart-bar {{
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: #ffffff;
            color: #222;
            padding: 12px 20px;
            box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10000;
        }}

        .cart-actions {{ display: flex; gap: 8px; }}
        .btn-open-cart {{ background: #4a2511; color: white; border: none; padding: 10px 16px; border-radius: 25px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }}
        .btn-whatsapp {{ background: #25d366; color: white; border: none; padding: 10px 18px; border-radius: 25px; font-weight: 700; cursor: pointer; text-decoration: none; font-size: 0.85rem; }}

        .modal-overlay {{
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 20000;
            padding: 15px;
        }}

        .modal-content {{
            background: white;
            color: #222;
            border-radius: 12px;
            width: 100%;
            max-width: 450px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }}

        .modal-header {{
            padding: 16px 20px;
            background: #4a2511;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .btn-close {{ background: none; border: none; color: white; font-size: 26px; cursor: pointer; }}
        .modal-body {{ padding: 15px 20px; overflow-y: auto; flex-grow: 1; }}

        .cart-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
        }}

        .item-title {{ font-size: 0.88rem; font-weight: 600; margin-bottom: 2px; }}
        .item-price {{ font-size: 0.8rem; color: #4a2511; font-weight: 600; }}

        /* CONTROLES DO CARRINHO (+ e -) */
        .qty-controls {{ display: flex; align-items: center; gap: 8px; }}
        .btn-qty {{
            background: #f0ebe6 !important;
            color: #222 !important;
            border: 1px solid #ddd !important;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-weight: bold;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .btn-qty-remover {{ background: #ffebee !important; color: #c62828 !important; border-color: #ffcdd2 !important; }}

        .modal-footer {{ padding: 16px 20px; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 10px; }}
        .modal-total {{ display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; }}

        .toast {{
            position: fixed;
            top: 20px;
            background: #25d366;
            color: white;
            padding: 10px 22px;
            border-radius: 30px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: none;
            z-index: 30000;
            font-size: 0.85rem;
        }}
    </style>
</head>
<body>
    <header>
        📖 Arraste para folhear • Toque no <b>+</b> para pedir
    </header>

    <div class="toast" id="toast">Item adicionado!</div>

    <div class="flipbook-container">
        <div id="flipbook">Carregando revista...</div>
    </div>

    <div class="nav-controls">
        <button class="btn-nav" id="btn-ant">◀ Anterior</button>
        <span id="pageInfo" style="font-size: 0.85rem;">Página 1</span>
        <button class="btn-nav" id="btn-prox">Próxima ▶</button>
    </div>

    <div class="cart-bar" id="cartBar" style="display: none;">
        <div>
            <b><span id="cartCount">0</span> itens</b> • <b style="color: #4a2511;" id="cartTotal">R$ 0,00</b>
        </div>
        <div class="cart-actions">
            <button class="btn-open-cart" id="btn-ver-carrinho">Ver Itens</button>
            <button class="btn-whatsapp" id="btn-pedir-whats">Pedir</button>
        </div>
    </div>

    <div class="modal-overlay" id="modalCarrinho">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>Seu Pedido de Chocolates</h3>
                <button class="btn-close" id="btn-fechar-modal">×</button>
            </div>
            <div class="modal-body" id="cartList"></div>
            <div class="modal-footer">
                <div class="modal-total">
                    <span>Total:</span>
                    <span id="modalTotalValue">R$ 0,00</span>
                </div>
                <button class="btn-whatsapp" id="btn-finalizar-whats-modal" style="width: 100%; text-align: center;">
                    📲 Enviar Pedido no WhatsApp
                </button>
            </div>
        </div>
    </div>

    <script>
        let paginas = {paginas_json};
        let WHATSAPP = "{WHATSAPP_PADRAO}";
        const SUPABASE_URL = "{SUPABASE_URL}";
        const SUPABASE_KEY = "{SUPABASE_KEY}";
        
        const cart = {{}};
        let pageFlip = null;

        async function inicializarCatalogoCompleto() {{
            try {{
                const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                const {{ data }} = await supabase
                    .from('catalogo_publico')
                    .select('*')
                    .eq('id', 'principal')
                    .single();

                if (data && data.paginas && data.paginas.length > 0) {{
                    // Pega APENAS as páginas que você selecionou e publicou
                    paginas = data.paginas;
                    if (data.whatsapp) WHATSAPP = data.whatsapp;
                }}
            }} catch (e) {{
                console.log("Modo offline ativo.");
            }}

            montarRevista();
        }}

        function montarRevista() {{
            const bookEl = document.getElementById('flipbook');
            bookEl.innerHTML = paginas.map(p => `
                <div class="page">
                    <img class="bg-page" src="${{p.imagem}}" alt="Página ${{p.numero}}">
                    ${{p.produtos.map(prod => {{
                        if (prod.esgotado) {{
                            return `
                                <div class="hotspot-esgotado" style="left: ${{prod.x}}%; top: ${{prod.y}}%;">
                                    Esgotado
                                </div>
                            `;
                        }} else {{
                            return `
                                <div class="hotspot-prod" 
                                     id="hotspot-${{prod.id}}"
                                     style="left: ${{prod.x}}%; top: ${{prod.y}}%;"
                                     data-id="${{prod.id}}"
                                     data-nome="${{prod.nome.replace(/'/g, "")}}"
                                     data-preco="${{prod.preco}}">
                                    +
                                    <span class="hotspot-badge" id="badge-${{prod.id}}">0</span>
                                </div>
                            `;
                        }}
                    }}).join('')}}
                </div>
            `).join('');

            const isMobile = window.innerWidth < 768;
            const w = isMobile ? Math.min(window.innerWidth - 30, 400) : 460;
            const h = w * 1.36;

            pageFlip = new St.PageFlip(bookEl, {{
                width: w,
                height: h,
                size: "fixed",
                minWidth: 280,
                maxWidth: 900,
                minHeight: 380,
                maxHeight: 1200,
                showCover: false,
                useMouseEvents: true
            }});

            pageFlip.loadFromHTML(document.querySelectorAll('.page'));

            pageFlip.on('flip', (e) => {{
                document.getElementById('pageInfo').innerText = `Página ${{e.data + 1}} de ${{paginas.length}}`;
            }});

            // TRAVA DE OURO: Intercepta o toque nos botões antes que o PageFlip sinta o clique
            document.querySelectorAll('.hotspot-prod').forEach(btn => {{
                const pararEvento = (e) => {{
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }};

                btn.addEventListener('pointerdown', pararEvento, {{ capture: true }});
                btn.addEventListener('mousedown', pararEvento, {{ capture: true }});
                btn.addEventListener('touchstart', pararEvento, {{ capture: true }});

                btn.addEventListener('click', (e) => {{
                    pararEvento(e);
                    e.preventDefault();
                    const id = btn.getAttribute('data-id');
                    const nome = btn.getAttribute('data-nome');
                    const preco = Number(btn.getAttribute('data-preco'));
                    adicionarItem(id, nome, preco);
                }}, {{ capture: true }});
            }});

            document.getElementById('btn-ant').onclick = () => pageFlip.flipPrev();
            document.getElementById('btn-prox').onclick = () => pageFlip.flipNext();
            document.getElementById('btn-ver-carrinho').onclick = abrirModalCarrinho;
            document.getElementById('btn-fechar-modal').onclick = fecharModalCarrinho;
            document.getElementById('btn-pedir-whats').onclick = enviarWhatsApp;
            document.getElementById('btn-finalizar-whats-modal').onclick = enviarWhatsApp;
        }}

        function adicionarItem(id, nome, preco) {{
            if (!cart[id]) {{
                cart[id] = {{ id, nome, preco, qtd: 0 }};
            }}
            cart[id].qtd += 1;
            atualizarCarrinho();
            atualizarBadge(id);

            const toast = document.getElementById('toast');
            toast.innerText = `+1 ${{nome}} adicionado!`;
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 1400);
        }}

        // Altera quantidade (+1 ou -1)
        window.alterarQtd = function(id, delta) {{
            if (cart[id]) {{
                cart[id].qtd += delta;
                if (cart[id].qtd <= 0) {{
                    delete cart[id];
                }}
                atualizarCarrinho();
                atualizarBadge(id);
                renderizarCarrinhoModal();
            }}
        }};

        function atualizarBadge(id) {{
            const badge = document.getElementById(`badge-${{id}}`);
            if (badge) {{
                const qtd = cart[id] ? cart[id].qtd : 0;
                badge.innerText = qtd;
                badge.style.display = qtd > 0 ? 'block' : 'none';
            }}
        }}

        function atualizarCarrinho() {{
            let count = 0;
            let total = 0;
            for (let id in cart) {{
                count += cart[id].qtd;
                total += cart[id].preco * cart[id].qtd;
            }}
            document.getElementById('cartCount').innerText = count;
            document.getElementById('cartTotal').innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
            document.getElementById('cartBar').style.display = count > 0 ? 'flex' : 'none';
        }}

        function abrirModalCarrinho() {{
            renderizarCarrinhoModal();
            document.getElementById('modalCarrinho').style.display = 'flex';
        }}

        function fecharModalCarrinho() {{
            document.getElementById('modalCarrinho').style.display = 'none';
        }}

        function renderizarCarrinhoModal() {{
            const listEl = document.getElementById('cartList');
            const items = Object.values(cart);
            if (items.length === 0) {{
                listEl.innerHTML = '<p style="text-align: center; color: #777; padding: 20px;">Seu carrinho está vazio.</p>';
                document.getElementById('modalTotalValue').innerText = 'R$ 0,00';
                document.getElementById('cartBar').style.display = 'none';
                return;
            }}

            let total = 0;
            listEl.innerHTML = items.map(item => {{
                const sub = item.preco * item.qtd;
                total += sub;
                return `
                    <div class="cart-item">
                        <div style="flex: 1; padding-right: 10px;">
                            <div class="item-title">${{item.nome}}</div>
                            <div class="item-price">R$ ${{item.preco.toFixed(2).replace('.', ',')}} un</div>
                        </div>
                        <div class="qty-controls">
                            <button class="btn-qty btn-qty-remover" onclick="alterarQtd('${{item.id}}', -1)">-</button>
                            <b style="min-width: 24px; text-align: center;">${{item.qtd}}</b>
                            <button class="btn-qty" onclick="alterarQtd('${{item.id}}', 1)">+</button>
                        </div>
                    </div>
                `;
            }}).join('');

            document.getElementById('modalTotalValue').innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
        }}

        function enviarWhatsApp() {{
            const ENTER = String.fromCharCode(10);
            let msg = "*Olá! Gostaria de fazer o pedido pelo catálogo:*" + ENTER + ENTER;
            let total = 0;

            for (let id in cart) {{
                if (cart[id].qtd > 0) {{
                    const sub = cart[id].preco * cart[id].qtd;
                    msg += "• " + cart[id].qtd + "x " + cart[id].nome + " - R$ " + sub.toFixed(2).replace('.', ',') + ENTER;
                    total += sub;
                }}
            }}

            msg += ENTER + "*Total do Pedido: R$ " + total.toFixed(2).replace('.', ',') + "*";
            const link = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
            window.open(link, '_blank');
        }}

        window.onload = inicializarCatalogoCompleto;
    </script>
</body>
</html>"""

with open("catalogo.html", "w", encoding="utf-8") as f:
    f.write(html_conteudo)

print(f"[+] SUCESSO! 'catalogo.html' gerado com proteção total!")