import { ModalBase as Modal } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import React from 'react';

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: any;
  options?: Array<{ label: string; value: any }>;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: Field[];
  initialValues?: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  loading?: boolean;
  footer?: React.ReactNode;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
  initialValues = {},
  onSave,
  loading = false,
  footer,
}) => {
  const [values, setValues] = React.useState<Record<string, any>>(initialValues);

  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues, isOpen]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(values);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex flex-row gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" form="form-modal">{loading ? 'Salvando...' : 'Salvar'}</Button>
          {footer}
        </div>
      }
    >
      <form id="form-modal" onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full border rounded px-2 py-1"
                rows={3}
              />
            ) : field.type === 'select' && field.options ? (
              <select
                name={field.name}
                value={values[field.name] ?? ''}
                onChange={handleChange}
                required={field.required}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Selecione...</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type || 'text'}
                value={field.type === 'checkbox' ? undefined : values[field.name] ?? ''}
                checked={field.type === 'checkbox' ? values[field.name] ?? false : undefined}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full border rounded px-2 py-1"
              />
            )}
          </div>
        ))}
      </form>
    </Modal>
  );
};
