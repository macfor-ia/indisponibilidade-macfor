'use client';

import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { PageHeader } from '../../components/PageHeader';
import { API } from '../../lib/api-client';

export function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await API.forgotPassword(email);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar redefinição.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <PageHeader title="Esqueci minha senha" subtitle="Enviaremos um link de redefinição para o seu email" align="center" />

        {message ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-sm">
              {message}
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Email</label>
              <InputText
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full"
                placeholder="seu@email.com"
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button type="submit" label="Enviar link" loading={submitting} className="w-full justify-center" />
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          <button className="text-[var(--accent)] hover:underline" onClick={() => { window.location.href = '/login'; }}>
            Voltar para o login
          </button>
        </p>
      </div>
    </div>
  );
}
