import { clienteSupabase } from './ConfiguracaoBanco.js';

/**
 * SERVIÇO: AutenticacaoServico
 * Gerencia a sessão segura JWT via Supabase Auth.
 */
export class AutenticacaoServico {
    /**
     * Realiza o login com e-mail e senha
     */
    static async entrar(email, senha) {
        const { data, error } = await clienteSupabase.auth.signInWithPassword({
            email: email.trim(),
            password: senha
        });

        if (error) {
            throw new Error(`Falha no login: ${error.message}`);
        }

        return data.user;
    }

    /**
     * Encerra a sessão
     */
    static async sair() {
        const { error } = await clienteSupabase.auth.signOut();
        if (error) console.error("Erro ao sair:", error);
        window.location.reload();
    }

    /**
     * Retorna o usuário logado atualmente (ou null se deslogado)
     */
    static async obterUsuarioAtual() {
        const { data: { session } } = await clienteSupabase.auth.getSession();
        return session?.user || null;
    }

    /**
     * Escuta mudanças de estado (login / logout)
     */
    static aoMudarEstado(callback) {
        clienteSupabase.auth.onAuthStateChange((evento, sessao) => {
            callback(sessao?.user || null);
        });
    }
}