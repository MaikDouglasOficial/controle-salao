import { AdminLayout } from '@/components/AdminLayout';
import { Sidebar } from '@/components/Sidebar';

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="pt-16 lg:pt-6 px-2 pb-20 xs:px-3 xs:pb-20 sm:p-6 sm:pb-8 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminLayout>
  );
}
