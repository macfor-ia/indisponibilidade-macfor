'use client';

import { useState, useEffect } from 'react';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { PageHeader } from '../../components/PageHeader';
import { API } from '../../lib/api-client';

export function ResetPasswordClient() {
  // O link do email do Supabase chega como /reset-password#access_token=...&type=recovery
  // (ou #error=...&error_code=otp_expired quando o link já expirou/foi usado).
  // undefined = ainda lendo a URL; '' = sem token válido.
  const [token, setToken] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    setToken(params.get('type') === 'recovery' ? params.get('access_token') || '' : '');
    // Tira o token da barra de endereço (histórico do navegador).
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Senha deve ter pelo menos 6 caracteres.');
    if (password !== confirm) return setError('As senhas não coincidem.');
    setSubmitting(true);
    try {
      const res = await API.resetPassword(token!, password);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <PageHeader title="Nova senha" subtitle="Defina uma nova senha para sua conta" align="center" />

        {token === undefined ? null : !token ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              Link inválido ou expirado. Solicite uma nova redefinição de senha.
            </div>
          </div>
        ) : message ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-sm">
              {message}
            </div>
            <Button label="Ir para o login" className="w-full justify-center" onClick={() => { window.location.href = '/login'; }} />
          </div>
        ) : (
          <form onSubmit={submit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Nova senha</label>
              <Password value={password} onChange={(e) => setPassword(e.target.value)} feedback={false} toggleMask inputClassName="w-full" className="w-full" autoFocus />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Confirmar senha</label>
              <Password value={confirm} onChange={(e) => setConfirm(e.target.value)} feedback={false} toggleMask inputClassName="w-full" className="w-full" />
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button type="submit" label="Redefinir senha" loading={submitting} className="w-full justify-center" />
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          <button className="text-[var(--accent)] hover:underline" onClick={() => { window.location.href = token === '' ? '/forgot-password' : '/login'; }}>
            {token === '' ? 'Solicitar novo link' : 'Voltar para o login'}
          </button>
        </p>
      </div>
    </div>
  );
}
