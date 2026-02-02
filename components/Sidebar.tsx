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
      {/* Header mobile fixo */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-900"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center space-x-3">
            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white">
              <Image
                src="/logo-corte-ja.png"
                alt="Corte-Já"
                width={56}
                height={56}
                className="h-14 w-14 object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-semibold text-gray-900">Corte-Já</span>
              <span className="block text-[11px] text-gray-500">Sistema de Gestão de Salão</span>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white text-gray-900 transform transition-transform duration-200 ease-in-out shadow-lg border-r border-gray-200',
          'top-[57px] lg:top-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - apenas desktop */}
          <div className="hidden lg:block p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white">
                <Image
                  src="/logo-corte-ja.png"
                  alt="Corte-Já"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Corte-Já</h1>
                <p className="text-xs text-gray-500">Sistema de Gestão de Salão</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-3 pt-5 space-y-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Usuário e Logout */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
