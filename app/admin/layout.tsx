import { AdminLayout } from '@/components/AdminLayout';
import { Sidebar } from '@/components/Sidebar';

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <div className="flex bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="pt-16 lg:pt-6">{children}</div>
        </main>
      </div>
    </AdminLayout>
  );
}
