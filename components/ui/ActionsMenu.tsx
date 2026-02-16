'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LucideIcon } from 'lucide-react';

export interface ActionsMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface ActionsMenuProps {
  items: ActionsMenuItem[];
  className?: string;
  /** Alinha o menu à direita do botão (para não sair da tela) */
  alignRight?: boolean;
}

export function ActionsMenu({ items, className = '', alignRight = true }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (item: ActionsMenuItem) => {
    item.onClick();
    setOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-stone-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        aria-label="Abrir menu de ações"
        aria-expanded={open}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[200px] py-1 bg-white rounded-xl border border-gray-200 shadow-lg ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-stone-50'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
