'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface Profile {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  loginEmail: string;
  birthday: string | null;
  notes: string | null;
  photo: string | null;
}

export default function ClientePerfilPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    fetch('/api/cliente/me')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data?.name ?? '',
          phone: data?.phone ?? '',
          email: data?.loginEmail ?? data?.email ?? '',
          currentPassword: '',
          newPassword: '',
        });
      })
      .catch(() => toast.error('Erro ao carregar perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/cliente/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone.replace(/\D/g, ''),
          email: form.email || undefined,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Erro ao salvar');
        setSaving(false);
        return;
      }
      toast.success('Perfil atualizado!');
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container space-y-6 mt-6">
      <div className="page-header">
        <h1 className="page-title">Meu perfil</h1>
        <p className="page-subtitle">Atualize seus dados pessoais</p>
      </div>
      {loading || !profile ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner w-8 h-8" />
        </div>
      ) : (
      <div className="card card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-stone-600 mb-1">Nome</label>
            <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-stone-600 mb-1">Telefone</label>
            <input type="tel" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="form-input" placeholder="(63) 99999-9999" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-stone-600 mb-1">Email (login)</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="form-input" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-stone-600 mb-1">Senha atual (obrigatória só para alterar a senha)</label>
            <input type="password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} className="form-input" placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-stone-600 mb-1">Nova senha (deixe em branco para não alterar)</label>
            <input type="password" minLength={6} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} className="form-input" placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div className="flex flex-row gap-3 justify-end">
            <Button type="submit" variant="primary" disabled={saving} loading={saving}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
}
