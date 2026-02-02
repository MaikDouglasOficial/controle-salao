import { AdminLayout } from '@/components/AdminLayout';
import { Sidebar } from '@/components/Sidebar';

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="pt-16 lg:pt-6">{children}</div>
        </main>
      </div>
    </AdminLayout>
  );
}
