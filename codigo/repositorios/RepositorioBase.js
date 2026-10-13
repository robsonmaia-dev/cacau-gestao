import { clienteSupabase } from './ConfiguracaoBanco.js';

/**
 * REPOSITÓRIO BASE
 * Centraliza as operações de leitura, gravação e deleção no PostgreSQL.
 */
export class RepositorioBase {
    /**
     * @param {string} nomeTabela - Nome exato da tabela no Supabase
     */
    constructor(nomeTabela) {
        if (!nomeTabela) throw new Error("O nome da tabela é obrigatório para o repositório.");
        this.nomeTabela = nomeTabela;
        this.cliente = clienteSupabase;
    }

    /**
     * Busca todos os registros da tabela
     * @param {string} campoOrdenacao - Nome do campo para ordenar (ex: 'criado_em')
     * @param {boolean} ascendente - true para crescente, false para decrescente
     */
    async obterTodos(campoOrdenacao = 'criado_em', ascendente = false) {
        const { data, error } = await this.cliente
            .from(this.nomeTabela)
            .select('*')
            .order(campoOrdenacao, { ascending: ascendente });

        if (error) {
            console.error(`Erro ao buscar dados de ${this.nomeTabela}:`, error);
            throw new Error(`Falha ao carregar ${this.nomeTabela}: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Busca um registro por ID
     */
    async obterPorId(id) {
        const { data, error } = await this.cliente
            .from(this.nomeTabela)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Erro ao buscar registro ${id} em ${this.nomeTabela}:`, error);
            return null;
        }

        return data;
    }

    /**
     * Salva ou atualiza um registro (Upsert)
     */
    async salvar(dados) {
        const { data, error } = await this.cliente
            .from(this.nomeTabela)
            .upsert(dados)
            .select();

        if (error) {
            console.error(`Erro ao salvar em ${this.nomeTabela}:`, error);
            throw new Error(`Falha ao gravar no banco: ${error.message}`);
        }

        return data ? data[0] : null;
    }

    /**
     * Remove um registro por ID
     */
    async remover(id) {
        const { error } = await this.cliente
            .from(this.nomeTabela)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Erro ao deletar registro de ${this.nomeTabela}:`, error);
            throw new Error(`Falha ao excluir registro: ${error.message}`);
        }

        return true;
    }
}