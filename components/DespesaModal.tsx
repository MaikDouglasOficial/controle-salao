import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface DespesaModalProps {
  despesa?: {
    id?: number;
    description?: string;
    amount?: number;
    category?: string;
    date?: string;
    notes?: string | null;
  };
  onSave: (despesa: any) => void;
  onClose: () => void;
}

export default function DespesaModal({ despesa, onSave, onClose }: DespesaModalProps) {
  const [description, setDescription] = useState<string>(despesa?.description || '');
  const [amount, setAmount] = useState<number>(despesa?.amount || 0);
  const [category, setCategory] = useState<string>(despesa?.category || 'OUTROS');
  const [date, setDate] = useState<string>(
    despesa?.date ? despesa.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(despesa?.notes || '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validação
    if (!description.trim()) {
      alert('Por favor, preencha a descrição da despesa');
      return;
    }
    
    if (!amount || amount <= 0) {
      alert('Por favor, preencha um valor válido maior que zero');
      return;
    }

    onSave({
      ...despesa,
      description: description.trim(),
      amount,
      category,
      date,
      notes: notes.trim() || null,
    });
  }

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={despesa ? 'Editar Despesa' : 'Nova Despesa'}
      subtitle={despesa ? 'Atualize os dados da despesa abaixo' : 'Preencha os dados para cadastrar uma nova despesa'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              minLength={3}
              placeholder="Ex: Compra de produtos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              required
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria *</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              <option value="PRODUTOS">Produtos</option>
              <option value="SALARIO">Salário</option>
              <option value="ALUGUEL">Aluguel</option>
              <option value="MARKETING">Marketing</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
            <input
              type="date"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
          <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
        </div>
      </form>
    </ModalBase>
  );
}
