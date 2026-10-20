import json
import re
import requests

CATALOGO_URL = "https://catalogo.cacaushow.com.br/2026/catalogo/ciclo-13-e-14/catalogo-vd-ciclos-13-e-14/?page=2"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

print("[*] Conectando ao catálogo oficial da Cacau Show...")
resp = requests.get(CATALOGO_URL, headers=headers)
if resp.status_code != 200:
    print(f"[!] Erro ao acessar: {resp.status_code}")
    exit(1)

match = re.search(r"window\.staticSettings\s*=\s*(\{.+?\});", resp.text, re.DOTALL)
if not match:
    print("[!] Dados do catálogo não encontrados.")
    exit(1)

settings = json.loads(match.group(1))
paper_aws = settings.get("aws", {}).get("url", "")
policy = settings.get("aws", {}).get("policy", "")
total_paginas = len(settings.get("pages", []))
chunks = settings.get("enrichments", {}).get("chunkUrls", {})

produtos_por_pagina = {p: [] for p in range(1, total_paginas + 1)}

print(f"[*] Mapeando produtos de {total_paginas} páginas...")
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
    except Exception as e:
        print(f"[!] Falha no lote {chunk_key}: {e}")

paginas = []
for p in range(1, total_paginas + 1):
    img_url = f"{paper_aws}Pages/{p}/Normal.jpg?{policy}"
    prods = produtos_por_pagina.get(p, [])
    paginas.append({
        "numero": p,
        "imagem": img_url,
        "qtd_produtos": len(prods),
        "produtos": prods,
        "ativa": True
    })

# Salva o JSON no padrão que nosso app web consome diretamente
dados_finais = {
    "totalPaginas": total_paginas,
    "paginas": paginas
}

with open("dados_catalogo.json", "w", encoding="utf-8") as f:
    json.dump(dados_finais, f, ensure_ascii=False, indent=2)

print(f"\n[+] SUCESSO! {total_paginas} páginas salvas em 'dados_catalogo.json'.")