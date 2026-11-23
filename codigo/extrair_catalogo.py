# -*- coding: utf-8 -*-
import json
import os
from pathlib import Path
import re
import sys
import requests

URL_PADRAO = "https://catalogo.cacaushow.com.br/2026/catalogo/ciclo-13-e-14/catalogo-vd-ciclos-13-e-14/?page=2"


def normalizar_texto(texto):
    return re.sub(r"\s+", " ", (texto or "").strip().lower())


def deduplicar_produtos_pagina(produtos, numero_pagina):
    agrupados = {}
    ordem = []
    for prod in produtos or []:
        chave = (str(prod.get("id", "")).strip(), normalizar_texto(prod.get("nome", "")))
        area = float(prod.get("w", 0) or 0) * float(prod.get("h", 0) or 0)
        if chave not in agrupados:
            agrupados[chave] = (area, dict(prod))
            ordem.append(chave)
        elif area > agrupados[chave][0]:
            agrupados[chave] = (area, dict(prod))

    resultado = []
    for idx, chave in enumerate(ordem):
        item = agrupados[chave][1]
        item["uid"] = f"p{numero_pagina}-{item.get('id')}-{idx}"
        resultado.append(item)
    return resultado


def obter_url_fonte():
    if len(sys.argv) > 1 and sys.argv[1].strip():
        return sys.argv[1].strip()
    url_env = os.environ.get("CATALOGO_URL", "").strip()
    if url_env:
        return url_env
    arq_fonte = Path("fonte_catalogo.txt")
    if arq_fonte.exists():
        txt = arq_fonte.read_text(encoding="utf-8").strip()
        if txt:
            return txt
    return URL_PADRAO


CATALOGO_URL = obter_url_fonte()
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

print(f"[*] Conectando ao catálogo oficial: {CATALOGO_URL}")
resp = requests.get(CATALOGO_URL, headers=headers, timeout=30)
if resp.status_code != 200:
    print(f"[!] Erro ao acessar: {resp.status_code}")
    sys.exit(1)

match = re.search(r"window\.staticSettings\s*=\s*(\{.+?\});", resp.text, re.DOTALL)
if not match:
    print("[!] Dados do catálogo não encontrados.")
    sys.exit(1)

settings = json.loads(match.group(1))
paper_aws = settings.get("aws", {}).get("url", "")
policy = settings.get("aws", {}).get("policy", "")
total_paginas = len(settings.get("pages", []))
chunks = settings.get("enrichments", {}).get("chunkUrls", {})

produtos_por_pagina = {p: [] for p in range(1, total_paginas + 1)}

print(f"[*] Mapeando produtos de {total_paginas} páginas...")
for chunk_key, chunk_url in chunks.items():
    try:
        c_resp = requests.get(chunk_url, headers=headers, timeout=20)
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
    except Exception as e:
        print(f"[!] Falha no lote {chunk_key}: {e}")

paginas = []
for p in range(1, total_paginas + 1):
    img_url = f"{paper_aws}Pages/{p}/Normal.jpg?{policy}"
    prods = deduplicar_produtos_pagina(produtos_por_pagina.get(p, []), p)
    paginas.append({
        "numero": p,
        "imagem": img_url,
        "qtd_produtos": len(prods),
        "produtos": prods,
        "ativa": True
    })

dados_finais = {
    "totalPaginas": total_paginas,
    "paginas": paginas
}

Path("dados_catalogo.json").write_text(json.dumps(dados_finais, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\n[+] SUCESSO! {total_paginas} páginas deduplicadas salvas em 'dados_catalogo.json'.")
