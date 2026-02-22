import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { fetchAuth } from '@/lib/api';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/utils';

const COMMISSION_TYPES = [
  { value: 'PERCENT', label: 'Porcentagem (%)' },
  { value: 'FIXED', label: 'Valor fixo (R$)' },
] as const;

interface ProdutoEditarModalProps {
  produto?: {
    nome?: string;
    name?: string;
    sku?: string;
    preco?: number;
    price?: number;
    estoque?: number;
    stock?: number;
    descricao?: string;
    description?: string;
    photo?: string;
    id?: number;
    commissionType?: string | null;
    commissionValue?: number | null;
  };
  onSave: (produto: any) => void;
  onClose: () => void;
}

export default function ProdutoEditarModal({ produto, onSave, onClose }: ProdutoEditarModalProps) {
  const { error } = useToast();
  const nomeInicial = produto?.nome ?? produto?.name ?? '';
  const precoInicial = produto?.preco ?? produto?.price ?? 0;
  const estoqueInicial = produto?.estoque ?? produto?.stock ?? 0;
  const descricaoInicial = produto?.descricao ?? produto?.description ?? '';
  const [nome, setNome] = useState<string>(nomeInicial);
  const [preco, setPreco] = useState<number>(precoInicial);
  const [precoDisplay, setPrecoDisplay] = useState<string | null>(null);
  const [estoque, setEstoque] = useState<string>(estoqueInicial.toString());
  const [descricao, setDescricao] = useState<string>(descricaoInicial);
  const [photo, setPhoto] = useState<string>(produto?.photo || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(produto?.photo || null);
  const [uploading, setUploading] = useState(false);
  const [commissionType, setCommissionType] = useState<string>(produto?.commissionType || 'PERCENT');
  const [commissionValue, setCommissionValue] = useState<string>((produto?.commissionValue ?? 0).toString());
  const [commissionDisplay, setCommissionDisplay] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      error('Por favor, selecione uma imagem');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchAuth('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setPhoto(url);
        setPhotoPreview(url);
      } else {
        const err = await response.json();
        error(err.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto('');
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const commVal = commissionType === 'FIXED'
      ? parseCurrencyInput(commissionDisplay !== null ? commissionDisplay : commissionValue)
      : Math.max(0, Math.min(100, parseFloat(commissionValue) || 0));
    onSave({
      ...produto,
      nome,
      sku: produto?.id ? produto.sku : undefined,
      preco,
      estoque: parseInt(estoque) || 0,
      descricao,
      photo,
      commissionType,
      commissionValue: commVal,
    });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={produto ? 'Editar Produto' : 'Novo Produto'}
      subtitle={produto ? 'Atualize os dados do produto abaixo' : 'Preencha os dados para cadastrar um novo produto'}
      size="lg"
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="product-form">Salvar</Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Upload de Foto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto</label>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {photoPreview ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={photoPreview}
                    alt="Foto do produto"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="product-photo-upload"
              />
              <label
                htmlFor="product-photo-upload"
                className={`inline-block cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {uploading ? 'Enviando...' : photoPreview ? 'Alterar foto' : 'Adicionar Foto'}
              </label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG ou WEBP (máx. 5MB)</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Produto *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Shampoo Kerastase"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
              {produto?.id && produto?.sku ? (
                <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {produto.sku}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Será gerado automaticamente ao salvar.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estoque *</label>
              <input
                type="text"
                inputMode="numeric"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={estoque}
                onChange={e => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setEstoque(value);
                }}
                required
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$) *</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={precoDisplay !== null ? precoDisplay : (preco === 0 ? '' : formatCurrencyInput(preco))}
              onFocus={() => setPrecoDisplay(preco === 0 ? '' : formatCurrencyInput(preco))}
              onChange={e => {
                let raw = e.target.value.replace(/[^\d,]/g, '');
                const parts = raw.split(',');
                if (parts.length > 2) raw = parts[0] + ',' + parts.slice(1).join('');
                setPrecoDisplay(raw);
                setPreco(Math.max(0, parseCurrencyInput(raw)));
              }}
              onBlur={(e) => {
                const v = Math.max(0, parseCurrencyInput(e.target.value));
                setPreco(v);
                setPrecoDisplay(null);
              }}
              required
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Comissão</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Tipo</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={commissionType}
                  onChange={e => setCommissionType(e.target.value)}
                >
                  {COMMISSION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">{commissionType === 'FIXED' ? 'Valor (R$)' : 'Valor (%)'}</label>
                {commissionType === 'FIXED' ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={commissionDisplay !== null ? commissionDisplay : (parseFloat(commissionValue) ? formatCurrencyInput(parseFloat(commissionValue)) : '')}
                    onFocus={() => setCommissionDisplay(parseFloat(commissionValue) ? formatCurrencyInput(parseFloat(commissionValue)) : '')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d,]/g, '');
                      setCommissionDisplay(raw);
                      setCommissionValue(parseCurrencyInput(raw).toString());
                    }}
                    onBlur={e => {
                      const v = parseCurrencyInput(e.target.value);
                      setCommissionValue(v.toString());
                      setCommissionDisplay(null);
                    }}
                    placeholder="0,00"
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    value={commissionValue}
                    onChange={e => setCommissionValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descrição detalhada do produto..."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
