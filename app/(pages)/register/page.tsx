'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { API } from '../../lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '', department: '' });
  const [setores, setSetores] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.db) {
          console.log('[register] banco de dados conectado com sucesso:', data);
        } else {
          console.error('[register] ERRO DE CONEXÃO COM O BANCO:', data);
        }
      })
      .catch((err) => console.error('[register] falha ao verificar banco:', err));

    API.getSetores()
      .then((list) => {
        console.log('[register] setores carregados:', list);
        setSetores(list);
      })
      .catch((err) => console.error('[register] erro ao carregar setores:', err));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!form.department) {
      setError('Selecione um setor.');
      return;
    }
    setSubmitting(true);
    try {
      await API.register({ full_name: form.full_name, email: form.email, password: form.password, department: form.department });
      setSuccess(true);
    } catch (err: any) {
      console.error('[register] erro:', err);
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold mb-2">Solicitação enviada!</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">Aguarde a aprovação de um administrador.</p>
            <Button label="Ir para login" onClick={() => router.push('/login')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Solicitar Acesso</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Crie sua conta no sistema Macfor</p>
        </div>

        <form onSubmit={submit} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Nome completo</label>
            <InputText value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full" placeholder="Seu nome" autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Email</label>
            <InputText value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="w-full" placeholder="seu@macfor.com.br" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Senha</label>
            <InputText value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" className="w-full" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Confirmar senha</label>
            <InputText value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} type="password" className="w-full" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Setor</label>
            <Dropdown
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.value })}
              options={setores}
              placeholder="Selecione seu setor"
              className="w-full"
            />
          </div>
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>
          )}
          <Button type="submit" label="Solicitar Acesso" loading={submitting} className="w-full justify-center" />
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          Já tem conta?{' '}
          <button className="text-[var(--accent)] hover:underline" onClick={() => router.push('/login')}>
            Fazer login
          </button>
        </p>
      </div>
    </div>
  );
}
