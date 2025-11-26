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
        <main className="flex-1 overflow-y-auto">
          <div className="pt-16 lg:pt-6 px-3 pb-3 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminLayout>
  );
}
