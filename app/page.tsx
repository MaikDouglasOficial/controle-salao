import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona para o painel admin
  redirect('/admin/dashboard');
}
