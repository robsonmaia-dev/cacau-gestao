/**
 * CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
 * Importa o SDK oficial do Supabase via módulo ESM nativo (não precisa de npm).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cole aqui os dados do seu painel Supabase:
export const URL_SUPABASE = 'SUA_URL_DO_SUPABASE_AQUI';
export const CHAVE_ANON_SUPABASE = 'SUA_CHAVE_ANON_AQUI';

// Instância única do cliente Supabase para toda a aplicação
export const clienteSupabase = createClient(URL_SUPABASE, CHAVE_ANON_SUPABASE);