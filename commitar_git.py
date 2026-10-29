# -*- coding: utf-8 -*-
"""
Script de Commit e Push Automático - Cacau Gestão
Consolida:
1. Nova Tela Inicial (Home Dashboard moderno com atalhos de 1 toque).
2. Barra inferior equilibrada com 4 botões (Início, Vendas, Estoque e Menu).
3. Busca por categoria de chocolates (trufa, tablete) e botão de calendário 📅.
4. Filtros inteligentes com digitação contínua em Estoque, Clientes e Cobrança.
5. Purga automática de cache do navegador no Login e Logout.
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

# 1. Verifica se estamos dentro do repositório Git
if executar("git rev-parse --is-inside-work-tree") != "true":
    print("[✘] Este diretório não é um repositório Git válido.")
    sys.exit(1)

# 2. Verifica se há alterações pendentes
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
executar("git add *.py")

# 4. Mensagem detalhada do commit
mensagem_commit = (
    "feat: Home dashboard moderna, filtros globais em todas as telas e purga de cache\n\n"
    "- Home: criacao da TelaHome com hero card, saldos do dia, 4 atalhos rapidos e pulso da mesa\n"
    "- Navegacao: barra inferior com 4 botoes equilibrados (Inicio, Vendas, Estoque e Menu)\n"
    "- Vendas: busca por categoria (trufa, tablete), botao visual de calendario, formato DD/MM/AA e TAB autocomplete\n"
    "- Estoque: filtros inteligentes por busca textual, categoria e status (reposicao, esgotado, vencendo)\n"
    "- Clientes: filtros por situacao (pendentes vs em dia) e canal (Teams vs WhatsApp) sem perda de foco\n"
    "- Cobranca: busca em tempo real, ordenacao por maior divida e filtros de envio por canal\n"
    "- Cache: purga automatica da Cache Storage API e service workers no login e logout"
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