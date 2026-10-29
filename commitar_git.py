# -*- coding: utf-8 -*-
"""
Script de Commit e Push Automático - Cacau Gestão
Consolida:
1. Menu Híbrido com Gaveta Lateral e barra inferior ergonômica.
2. Histórico de Vendas com filtros e estorno seguro em 1 clique.
3. Modo PDV de Vendas Rápidas (Autocomplete, TAB/Enter, DD/MM/AA com calendário).
4. Filtros inteligentes em Estoque, Clientes e Cobrança.
5. Restauração completa dos estilos visuais de Inteligência & Gestão.
"""

import subprocess
import sys

def executar(comando):
    """Executa comando shell capturando a saída com segurança."""
    try:
        res = subprocess.run(
            comando,
            check=True,
            text=True,
            capture_output=True,
            shell=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"\n[✘] Erro ao executar: {comando}")
        print(f"    Detalhes: {e.stderr.strip()}")
        return None

print("=== COMMIT AUTOMÁTICO: CACAU GESTÃO ===\n")

# 1. Verifica se estamos no repositório
if executar("git rev-parse --is-inside-work-tree") != "true":
    print("[✘] Este diretório não é um repositório Git válido.")
    sys.exit(1)

# 2. Verifica se há mudanças pendentes
status = executar("git status --porcelain")
if not status:
    print("[!] Nenhuma alteração pendente para commitar.")
    sys.exit(0)

print("[*] Arquivos modificados/detectados:")
for linha in status.splitlines():
    print(f"    {linha}")

# 3. Adiciona arquivos do projeto
print("\n[*] Adicionando arquivos ao palco (git add)...")
executar("git add index.html codigo/ estilos/")

# Adiciona os scripts utilitários caso estejam na pasta
executar("git add *.py")

# 4. Mensagem detalhada do commit
mensagem_commit = (
    "feat: menu hibrido mobile, historico de vendas, PDV rapido e filtros globais\n\n"
    "- Menu: barra inferior com 3 botoes amplos e gaveta lateral categorizada\n"
    "- Historico: tela de historico com filtros e estorno/relancamento seguro (< 30 dias)\n"
    "- PDV Vendas: busca em tempo real sem acentos para cliente e chocolate, suporte a TAB/Enter, data DD/MM/AA com calendario e memoria entre vendas\n"
    "- Filtros Globais: busca e filtros adicionados em Estoque, Clientes e Cobranca\n"
    "- Estilos: restauracao completa do termometro de payback, medalhas de podio e caixas flutuantes"
)

print("[*] Gravando commit...")
comando_commit = f'git commit -m "{mensagem_commit}"'
saida_commit = executar(comando_commit)

if saida_commit is not None:
    print("[✔] Commit registrado com sucesso!")
    print(saida_commit)
else:
    print("[!] Não foi possível gerar o commit.")

# 5. Push para o repositório remoto
print("\n[*] Enviando alterações para o GitHub (git push)...")
saida_push = executar("git push")

if saida_push is not None:
    print("\n" + "=" * 55)
    print("🚀 SUCESSO! Repositório perfeitamente sincronizado com o GitHub!")
    print("=" * 55)
else:
    print("\n[!] Falha no push automático. Se necessário, rode: git push")