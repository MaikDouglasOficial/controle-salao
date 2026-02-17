import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

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
  const { warning } = useToast();
  const [description, setDescription] = useState<string>(despesa?.description || '');
  const [amount, setAmount] = useState<number>(despesa?.amount ?? 0);
  const [amountDisplay, setAmountDisplay] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(despesa?.category || 'OUTROS');
  const [date, setDate] = useState<string>(
    despesa?.date ? despesa.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(despesa?.notes || '');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validação
    if (!description.trim()) {
      warning('Por favor, preencha a descrição da despesa');
      return;
    }
    
    if (!amount || amount <= 0) {
      warning('Por favor, preencha um valor válido maior que zero');
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
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="expense-form">Salvar</Button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
          <input
            type="text"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            minLength={3}
            placeholder="Ex: Compra de produtos"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria *</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor (R$) *</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={amountDisplay !== null ? amountDisplay : (amount === 0 ? '' : formatCurrencyInput(amount))}
              onFocus={() => setAmountDisplay(amount === 0 ? '' : formatCurrencyInput(amount))}
              onChange={e => {
                let raw = e.target.value.replace(/[^\d,]/g, '');
                const parts = raw.split(',');
                if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
                setAmountDisplay(raw);
                setAmount(Math.max(0, parseCurrencyInput(raw)));
              }}
              onBlur={(e) => {
                const v = Math.max(0, parseCurrencyInput(e.target.value));
                setAmount(v);
                setAmountDisplay(null);
              }}
              required
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
          <input
            type="date"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observações adicionais..."
          />
        </div>

      </form>
    </ModalBase>
  );
}
