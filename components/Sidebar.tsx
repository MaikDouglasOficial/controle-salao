'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Package,
  Scissors,
  Calendar,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/profissionais', label: 'Profissionais', icon: UserCheck },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/servicos', label: 'Serviços', icon: Scissors },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar },
  { href: '/admin/pdv', label: 'PDV', icon: ShoppingCart },
  { href: '/admin/vendas', label: 'Vendas', icon: ShoppingBag },
  { href: '/admin/despesas', label: 'Despesas', icon: DollarSign },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let startY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? 0;
      const isPullingDown = currentY > startY;
      const isAtTop = window.scrollY <= 0;

      if (isPullingDown && isAtTop) {
        return;
      }

      event.preventDefault();
    };

    if (isOpen) {
      document.body.style.touchAction = 'pan-y';
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      document.body.style.touchAction = '';
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  return (
    <>
      {/* Header mobile — mesma identidade escura da sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-stone-900 border-b border-stone-700/50 shadow-lg h-16">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl hover:bg-stone-800 transition-colors text-stone-300 hover:text-amber-400"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src="/logo-corte-ja.png"
                alt="Corte-Já"
                width={96}
                height={96}
                quality={100}
                className="h-14 w-14 object-cover"
                priority
              />
            </div>
            <div className="flex flex-col justify-center h-14 leading-tight min-w-0">
              <span className="block text-sm font-semibold text-white">Corte-Já</span>
              <span className="block text-[11px] text-stone-400">Gestão de Salão</span>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-stone-950/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — escura, elegante, identidade salão */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-stone-900 text-stone-200 transform transition-transform duration-200 ease-out shadow-xl border-r border-stone-700/50',
          'top-16 lg:top-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo — desktop */}
          <div className="hidden lg:flex items-center gap-3 p-5 border-b border-stone-700/50">
            <div className="h-[4.25rem] w-[4.25rem] rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src="/logo-corte-ja.png"
                alt="Corte-Já"
                width={128}
                height={128}
                quality={100}
                className="h-[4.25rem] w-[4.25rem] object-cover"
                priority
              />
            </div>
            <div className="flex flex-col justify-center min-w-0 h-[4.25rem]">
              <h1 className="text-lg font-bold text-white truncate">Corte-Já</h1>
              <p className="text-xs text-stone-400">Sistema de Gestão</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-3 pt-4 space-y-0.5 overflow-y-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium',
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100 border border-transparent'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Usuário e Sair */}
          <div className="p-3 border-t border-stone-700/50 bg-stone-800/50">
            <div className="px-3 py-2 mb-2 rounded-lg bg-stone-800/80">
              <p className="text-sm font-semibold text-white truncate">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-stone-400 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-stone-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
