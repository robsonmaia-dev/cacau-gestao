/**
 * TELA: TelaGestao
 * Interface visual do Cockpit de Inteligência e Gestão Estratégica.
 */
export class TelaGestao {
    static formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
    }

    static renderizar(container, { pontoEquilibrio, capitalEstoque, desempenho, previsaoReposicao, perfilClientes }) {
        // Limita a largura visual da barra de progresso a 100%
        const larguraBarra = Math.min(100, Math.max(0, pontoEquilibrio.porcentagemRetorno));
        const ehPaybackCompleto = pontoEquilibrio.atingiuPontoEquilibrio;

        container.innerHTML = `
            <!-- 1. TERMÔMETRO DO INVESTIMENTO (PAYBACK DO CAIXA) -->
            <div class="cartao-termometro">
                <div class="termometro-cabecalho">
                    <span class="termometro-titulo">Ponto de Equilíbrio (Payback do Bolso)</span>
                    <span class="termometro-porcentagem" style="color: ${ehPaybackCompleto ? '#2ecc71' : 'var(--cor-secundaria)'};">
                        ${pontoEquilibrio.porcentagemRetorno}%
                    </span>
                </div>

                <div class="termometro-trilho">
                    <div class="termometro-preenchimento ${ehPaybackCompleto ? 'completo' : ''}" style="width: ${larguraBarra}%;"></div>
                </div>

                <div class="termometro-detalhes">
                    <span>Investido: <strong>${this.formatarMoeda(pontoEquilibrio.totalInvestidoEmCompras)}</strong></span>
                    <span>Recebido: <strong>${this.formatarMoeda(pontoEquilibrio.totalRecebidoEmCaixa)}</strong></span>
                </div>

                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 0.8rem;">
                    ${ehPaybackCompleto 
                        ? `🎉 <strong style="color: #2ecc71;">Investimento 100% pago!</strong> Lucro livre no bolso: <strong>${this.formatarMoeda(pontoEquilibrio.lucroLivreNoBolso)}</strong>`
                        : `⏳ Faltam <strong>${this.formatarMoeda(pontoEquilibrio.valorRestanteParaQuitar)}</strong> em recebimentos reais para recuperar todo o capital investido.`
                    }
                </div>
            </div>

            <!-- 2. RAIO-X DO CAPITAL E POTENCIAL REPRIMIDO -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Patrimônio em Chocolates</span>
                    <span style="font-size: 0.8rem; color: var(--cor-texto-suave);">${capitalEstoque.totalUnidadesFisicas} un na mesa/estoque</span>
                </div>

                <div class="grade-metricas" style="margin-bottom: 0;">
                    <div class="card-metrica">
                        <div class="metrica-rotulo">Capital Imobilizado (Custo)</div>
                        <div class="metrica-valor">${this.formatarMoeda(capitalEstoque.capitalImobilizadoCusto)}</div>
                        <div style="font-size: 0.68rem; color: var(--cor-texto-suave); margin-top: 2px;">Dinheiro seu parado</div>
                    </div>

                    <div class="card-metrica">
                        <div class="metrica-rotulo">Faturamento Potencial</div>
                        <div class="metrica-valor positivo">${this.formatarMoeda(capitalEstoque.faturamentoPotencialTabela)}</div>
                        <div style="font-size: 0.68rem; color: var(--cor-texto-suave); margin-top: 2px;">Se vender tudo</div>
                    </div>
                </div>

                <div style="background-color: #FAF6F0; border-radius: 8px; padding: 10px; margin-top: 10px; text-align: center;">
                    <span style="font-size: 0.78rem; color: var(--cor-texto-suave);">Lucro Represado Aguardando Venda:</span>
                    <div style="font-size: 1.15rem; font-weight: 800; color: var(--cor-primaria); margin-top: 2px;">
                        ${this.formatarMoeda(capitalEstoque.lucroRepresadoEstoque)} 
                        <span style="font-size: 0.75rem; color: var(--cor-sucesso); font-weight: 600;">(${capitalEstoque.margemPotencialPercentual}% de margem)</span>
                    </div>
                </div>
            </div>

            <!-- 3. PREVISÃO DE REPOSIÇÃO (COBERTURA EM DIAS) -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Previsão de Ida ao Fornecedor</span>
                </div>

                <div class="lista-linhas">
                    ${previsaoReposicao.length === 0 ? `
                        <p style="text-align: center; color: var(--cor-texto-suave); padding: 10px 0;">Nenhum produto cadastrado.</p>
                    ` : previsaoReposicao.map(p => {
                        let badgeCor = 'etiqueta-sucesso';
                        let textoStatus = `${p.diasCobertura} dias de estoque`;

                        if (p.status === 'ESGOTADO') {
                            badgeCor = 'etiqueta-perigo';
                            textoStatus = '🚨 Esgotado na mesa!';
                        } else if (p.status === 'CRITICO') {
                            badgeCor = 'etiqueta-perigo';
                            textoStatus = `⚠️ Acaba em ${p.diasCobertura} dia(s)!`;
                        } else if (p.status === 'ATENCAO') {
                            badgeCor = 'etiqueta-alerta';
                            textoStatus = `Dura ~${p.diasCobertura} dias`;
                        } else if (p.status === 'SEM_HISTORICO') {
                            badgeCor = '';
                            textoStatus = `${p.estoqueAtual} un (Sem histórico)`;
                        }

                        return `
                            <div class="item-linha">
                                <div>
                                    <div class="item-info-principal">${p.nome}</div>
                                    <div class="item-info-secundaria">
                                        Estoque: <strong>${p.estoqueAtual} un</strong> | Ritmo: ~${p.consumoDiarioMedio} un/dia
                                    </div>
                                </div>
                                <div>
                                    <span class="etiqueta ${badgeCor}">${textoStatus}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 4. CAMPEÕES DE VENDA VS. ENCALHADOS -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Curva de Chocolates</span>
                </div>

                <!-- Campeões de Volume -->
                <div style="margin-bottom: 14px;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--cor-primaria); margin-bottom: 6px;">
                        🏆 Mais Vendidos (Volume)
                    </div>
                    <div class="lista-linhas">
                        ${desempenho.maisVendidosVolume.slice(0, 3).map((item, idx) => `
                            <div class="item-ranking">
                                <div class="badge-posicao ${idx === 0 ? 'ouro' : idx === 1 ? 'prata' : 'bronze'}">
                                    ${idx + 1}º
                                </div>
                                <div style="flex: 1;">
                                    <div class="item-info-principal">${item.nome}</div>
                                    <div class="item-info-secundaria">${item.quantidadeVendida} unidades vendidas</div>
                                </div>
                                <div style="font-weight: bold; font-size: 0.85rem; color: var(--cor-primaria);">
                                    ${this.formatarMoeda(item.faturamentoTotal)}
                                </div>
                            </div>
                        `).join('') || '<p style="font-size: 0.8rem; color: var(--cor-texto-suave);">Nenhuma venda registrada ainda.</p>'}
                    </div>
                </div>

                <!-- Mais Lucrativos em Dinheiro Real -->
                <div style="margin-bottom: 14px; padding-top: 8px; border-top: 1px dashed var(--cor-borda);">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--cor-primaria); margin-bottom: 6px;">
                        💰 Mais Rentáveis (Lucro Líquido em R$)
                    </div>
                    <div class="lista-linhas">
                        ${desempenho.maisLucrativosValor.slice(0, 3).map((item, idx) => `
                            <div class="item-ranking">
                                <div class="badge-posicao ${idx === 0 ? 'ouro' : idx === 1 ? 'prata' : 'bronze'}">
                                    ${idx + 1}º
                                </div>
                                <div style="flex: 1;">
                                    <div class="item-info-principal">${item.nome}</div>
                                    <div class="item-info-secundaria">Lucro gerado no bolso</div>
                                </div>
                                <div style="font-weight: 800; font-size: 0.85rem; color: var(--cor-sucesso);">
                                    + ${this.formatarMoeda(item.lucroRealTotal)}
                                </div>
                            </div>
                        `).join('') || '<p style="font-size: 0.8rem; color: var(--cor-texto-suave);">Nenhuma venda registrada ainda.</p>'}
                    </div>
                </div>

                <!-- Produtos Encalhados / Sem Giro -->
                ${desempenho.produtosEncalhados.length > 0 ? `
                    <div style="padding-top: 8px; border-top: 1px dashed var(--cor-borda);">
                        <div style="font-size: 0.82rem; font-weight: 700; color: var(--cor-alerta); margin-bottom: 6px;">
                            ⚠️ Alerta de Baixo Giro (Risco de Calor / Vencimento)
                        </div>
                        <div class="lista-linhas">
                            ${desempenho.produtosEncalhados.map(item => `
                                <div class="card-aviso-gestao">
                                    <strong>${item.nome}</strong>: ${item.estoqueAtual} un paradas. 
                                    <div style="color: var(--cor-texto-suave); margin-top: 2px;">
                                        ${item.quantidadeVendida === 0 ? 'Nunca teve saída.' : `Sem vendas há ${item.diasSemVenda} dia(s).`}
                                        <em>(Considere mudar de lugar na mesa ou dar desconto de 10%)</em>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- 5. COMUNIDADE: TOP COMPRADORES & TERMÔMETRO DA CONFIANÇA -->
            <div class="cartao">
                <div class="cartao-cabecalho">
                    <span class="cartao-titulo">Equipe & Confiança na Mesa</span>
                </div>

                <!-- Termômetro de Confiança / Honestidade -->
                <div style="background-color: #FAF7F5; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: var(--cor-primaria);">Taxa de Honestidade da Mesa</span>
                        <span style="font-size: 1.1rem; font-weight: 900; color: ${perfilClientes.termometroConfianca.taxaHonestidadePercentual >= 95 ? 'var(--cor-sucesso)' : 'var(--cor-alerta)'};">
                            ${perfilClientes.termometroConfianca.taxaHonestidadePercentual}%
                        </span>
                    </div>
                    <div style="font-size: 0.72rem; color: var(--cor-texto-suave);">
                        ${perfilClientes.termometroConfianca.totalVendidosHonestamente} chocolates registrados e pagos vs. 
                        <strong>${perfilClientes.termometroConfianca.totalDesviosNaoPagos} sumidos/desvios</strong>.
                    </div>
                </div>

                <!-- Top Compradores VIP -->
                <div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--cor-primaria); margin-bottom: 6px;">
                        🌟 Maiores Compradores (Foco para Páscoa/Natal/Mães)
                    </div>
                    <div class="lista-linhas">
                        ${perfilClientes.clientesVip.length === 0 ? `
                            <p style="font-size: 0.8rem; color: var(--cor-texto-suave);">Nenhum comprador registrado ainda.</p>
                        ` : perfilClientes.clientesVip.map((cli, idx) => `
                            <div class="item-ranking">
                                <div class="badge-posicao ${idx === 0 ? 'ouro' : idx === 1 ? 'prata' : 'bronze'}">
                                    ${idx + 1}º
                                </div>
                                <div style="flex: 1;">
                                    <div class="item-info-principal">${cli.nome}</div>
                                    <div class="item-info-secundaria">${cli.quantidadeItens} chocolates consumidos</div>
                                </div>
                                <div style="font-weight: 800; font-size: 0.85rem; color: var(--cor-primaria);">
                                    ${this.formatarMoeda(cli.totalGasto)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}