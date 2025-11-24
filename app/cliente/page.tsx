"use client";
import { useState, useRef } from "react";
import { ModalBase as Modal } from "@/components/ui/ModalBase";
import { Button } from "@/components/ui/Button";

// Exemplo de dados do cliente (substituir por dados reais do contexto/autenticação)
const clienteFake = {
  nome: "Cliente Exemplo",
  email: "cliente@email.com"
};

export default function ClientePage() {
  const [showModal, setShowModal] = useState(false);
  const [cliente, setCliente] = useState(clienteFake);
  const [form, setForm] = useState(clienteFake);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setForm(cliente);
    setShowModal(true);
    setTimeout(() => initialFocusRef.current?.focus(), 100);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setCliente(form);
    setShowModal(false);
    // Aqui você pode chamar uma API para salvar no backend
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4 sm:px-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Perfil do Cliente</h1>
        <div className="modal-subtitle">Gerencie seus dados pessoais</div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="mb-2"><span className="font-semibold text-gray-700">Nome:</span> {cliente.nome}</div>
        <div><span className="font-semibold text-gray-700">Email:</span> {cliente.email}</div>
      </div>
      <Button onClick={handleOpen}>Editar Perfil</Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Editar Perfil"
        subtitle="Atualize seus dados pessoais"
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="cliente-form">
              Salvar
            </Button>
          </>
        }
      >
        <form id="cliente-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              ref={initialFocusRef}
              className="w-full border rounded px-3 py-2"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              type="email"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
