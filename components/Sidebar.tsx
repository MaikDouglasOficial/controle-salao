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
  Pencil,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ProfileEditModal } from '@/components/ProfileEditModal';

function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileOverride, setProfileOverride] = useState<{ name: string; email: string } | null>(null);
  const accountRefMobile = useRef<HTMLDivElement>(null);
  const accountRefDesktop = useRef<HTMLDivElement>(null);

  const displayName = profileOverride?.name ?? session?.user?.name ?? 'Administrador';
  const displayEmail = profileOverride?.email ?? session?.user?.email ?? '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountRefMobile.current?.contains(target) || accountRefDesktop.current?.contains(target)) return;
      setAccountOpen(false);
    };
    if (accountOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [accountOpen]);

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
      {/* Header mobile — menu esquerda, avatar (dropdown) direita */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-stone-900 border-b border-stone-700/50 shadow-lg h-14">
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl hover:bg-stone-800 transition-colors text-stone-300 hover:text-amber-400 flex-shrink-0"
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="relative flex-1 flex justify-end" ref={accountRefMobile}>
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className="h-9 w-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 hover:bg-amber-500/30 transition-colors"
              aria-expanded={accountOpen}
              aria-haspopup="true"
            >
              <span className="text-sm font-semibold text-amber-400">{getInitials(displayName)}</span>
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-stone-700 bg-stone-900 shadow-xl py-2 z-[60]">
                <div className="px-4 py-3 border-b border-stone-700/50">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-stone-500 truncate">{displayEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setProfileModalOpen(true); setAccountOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
                >
                  <Pencil className="h-4 w-4 flex-shrink-0" />
                  Editar informações
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ redirect: false }).then(() => { window.location.href = '/login'; })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  Sair da conta
                </button>
              </div>
            )}
          </div>
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
          'top-14 lg:top-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo — dentro do menu (mobile) e sempre visível (desktop) */}
          <div className="flex items-center gap-3 p-5 border-b border-stone-700/50">
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

          {/* Avatar + dropdown — só no desktop */}
          <div className="hidden lg:block p-3 border-t border-stone-700/50 bg-stone-800/30" ref={accountRefDesktop}>
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-stone-800/80 border border-transparent hover:border-stone-600 transition-colors text-left"
              aria-expanded={accountOpen}
              aria-haspopup="true"
            >
              <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-amber-400">{getInitials(displayName)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-stone-500 truncate">{displayEmail}</p>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-stone-500 flex-shrink-0 transition-transform', accountOpen && 'rotate-180')} />
            </button>
            {accountOpen && (
              <div className="mt-2 rounded-xl border border-stone-700 bg-stone-800/95 shadow-xl py-1">
                <button
                  type="button"
                  onClick={() => { setProfileModalOpen(true); setAccountOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
                >
                  <Pencil className="h-4 w-4 flex-shrink-0" />
                  Editar informações
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ redirect: false }).then(() => { window.location.href = '/login'; })}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-stone-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <ProfileEditModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSaved={(p) => setProfileOverride(p)}
      />
    </>
  );
}
