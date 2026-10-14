/**
 * CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
 * Importa o SDK oficial do Supabase via módulo ESM nativo (não precisa de npm).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// URL raiz limpa (sem /rest/v1/):
export const URL_SUPABASE = 'https://bvqyiccynvgndugxayzh.supabase.co';
export const CHAVE_ANON_SUPABASE = 'sb_publishable_31sF_uP_iTuYo3XRHnfqEA_bFQrg3XB';

// Instância única do cliente Supabase para toda a aplicação
export const clienteSupabase = createClient(URL_SUPABASE, CHAVE_ANON_SUPABASE);