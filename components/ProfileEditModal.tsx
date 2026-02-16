'use client';

import { useEffect, useState } from 'react';
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (profile: { name: string; email: string }) => void;
}

export function ProfileEditModal({ isOpen, onClose, onSaved }: ProfileEditModalProps) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    fetch('/api/auth/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.name !== undefined) setName(data.name);
        if (data.email !== undefined) setEmail(data.email);
      })
      .catch(() => error('Erro ao carregar perfil'))
      .finally(() => setLoading(false));
  }, [isOpen, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      error('A nova senha e a confirmação não conferem');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      const body: { name?: string; email?: string; currentPassword?: string; newPassword?: string } = {
        name: name.trim(),
        email: email.trim(),
      };
      if (newPassword.trim()) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword.trim();
      }
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        error(data.error || 'Erro ao salvar');
        return;
      }
      success('Informações atualizadas com sucesso');
      onSaved?.({ name: data.name, email: data.email });
      onClose();
    } catch {
      error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Editar informações"
      subtitle="Altere seu nome, e-mail ou senha"
      size="md"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="profile-edit-form" variant="primary" size="sm" disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="py-8 text-center text-stone-500 text-sm">Carregando...</div>
      ) : (
        <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
              required
            />
          </div>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Alterar senha (opcional)</p>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
              />
              <input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
              />
              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
              />
            </div>
          </div>
        </form>
      )}
    </ModalBase>
  );
}
