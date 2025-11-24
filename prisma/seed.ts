import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@salao.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@salao.com',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  // Criar clientes
  const cliente1 = await prisma.customer.create({
    data: {
      name: 'Maria Silva',
      phone: '+5511987654321',
      email: 'maria@email.com',
      birthday: new Date('1990-05-15'),
      notes: 'Cliente VIP, prefere horários pela manhã',
    },
  });

  const cliente2 = await prisma.customer.create({
    data: {
      name: 'Ana Santos',
      phone: '+5511976543210',
      email: 'ana@email.com',
      birthday: new Date('1985-08-22'),
      notes: 'Alérgica a alguns produtos químicos',
    },
  });

  const cliente3 = await prisma.customer.create({
    data: {
      name: 'Juliana Oliveira',
      phone: '+5511965432109',
      email: 'juliana@email.com',
      birthday: new Date('1995-12-03'),
    },
  });
  console.log('✅ Clientes criados');

  // Criar profissionais
  const profissional1 = await prisma.professional.create({
    data: {
      name: 'Carla Mendes',
      phone: '+5511999887766',
      email: 'carla@salao.com',
      specialty: 'Cabeleireira',
      active: true,
    },
  });

  const profissional2 = await prisma.professional.create({
    data: {
      name: 'Roberto Silva',
      phone: '+5511988776655',
      email: 'roberto@salao.com',
      specialty: 'Barbeiro',
      active: true,
    },
  });

  const profissional3 = await prisma.professional.create({
    data: {
      name: 'Fernanda Costa',
      phone: '+5511977665544',
      email: 'fernanda@salao.com',
      specialty: 'Manicure',
      active: true,
    },
  });

  const profissional4 = await prisma.professional.create({
    data: {
      name: 'Paula Rodrigues',
      phone: '+5511966554433',
      email: 'paula@salao.com',
      specialty: 'Esteticista',
      active: true,
    },
  });

  const profissional5 = await prisma.professional.create({
    data: {
      name: 'Marcos Almeida',
      phone: '+5511955443322',
      email: 'marcos@salao.com',
      specialty: 'Colorista',
      active: false, // Inativo como exemplo
    },
  });
  console.log('✅ Profissionais criados');

  // Criar produtos
  const produto1 = await prisma.product.create({
    data: {
      name: 'Shampoo Hidratante',
      description: 'Shampoo profissional para hidratação profunda',
      price: 45.90,
      stock: 25,
      sku: 'SHP-001',
    },
  });

  const produto2 = await prisma.product.create({
    data: {
      name: 'Condicionador Reparador',
      description: 'Condicionador para cabelos danificados',
      price: 52.90,
      stock: 18,
      sku: 'CND-001',
    },
  });

  const produto3 = await prisma.product.create({
    data: {
      name: 'Máscara Capilar',
      description: 'Máscara de tratamento intensivo',
      price: 89.90,
      stock: 12,
      sku: 'MSC-001',
    },
  });

  const produto4 = await prisma.product.create({
    data: {
      name: 'Esmalte Premium',
      description: 'Esmalte de longa duração',
      price: 15.90,
      stock: 45,
      sku: 'ESM-001',
    },
  });
  console.log('✅ Produtos criados');

  // Criar serviços
  const servico1 = await prisma.service.create({
    data: {
      name: 'Corte Feminino',
      description: 'Corte de cabelo feminino com lavagem',
      duration: 60,
      price: 80.00,
    },
  });

  const servico2 = await prisma.service.create({
    data: {
      name: 'Coloração',
      description: 'Coloração completa com produtos profissionais',
      duration: 120,
      price: 180.00,
    },
  });

  const servico3 = await prisma.service.create({
    data: {
      name: 'Manicure',
      description: 'Manicure completa com esmaltação',
      duration: 45,
      price: 35.00,
    },
  });

  const servico4 = await prisma.service.create({
    data: {
      name: 'Hidratação',
      description: 'Tratamento de hidratação capilar',
      duration: 90,
      price: 120.00,
    },
  });

  const servico5 = await prisma.service.create({
    data: {
      name: 'Escova Progressiva',
      description: 'Alisamento com escova progressiva',
      duration: 180,
      price: 250.00,
    },
  });
  console.log('✅ Serviços criados');

  // Criar agendamentos
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(14, 0, 0, 0);

  const agendamento1 = await prisma.appointment.create({
    data: {
      customerId: cliente1.id,
      serviceId: servico1.id,
      date: amanha,
      status: 'confirmado',
      professional: 'Carla',
      notes: 'Cliente pediu para deixar o cabelo mais curto',
    },
  });

  const depoisAmanha = new Date(hoje);
  depoisAmanha.setDate(depoisAmanha.getDate() + 2);
  depoisAmanha.setHours(10, 30, 0, 0);

  const agendamento2 = await prisma.appointment.create({
    data: {
      customerId: cliente2.id,
      serviceId: servico2.id,
      date: depoisAmanha,
      status: 'agendado',
      professional: 'Fernanda',
    },
  });
  console.log('✅ Agendamentos criados');

  // Criar uma venda
  const venda = await prisma.sale.create({
    data: {
      customerId: cliente3.id,
      total: 215.90,
      paymentMethod: 'cartao_credito',
      date: new Date(),
      notes: 'Cliente aproveitou promoção',
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: venda.id,
      serviceId: servico4.id,
      quantity: 1,
      price: 120.00,
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: venda.id,
      productId: produto1.id,
      quantity: 2,
      price: 45.90,
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: venda.id,
      productId: produto4.id,
      quantity: 1,
      price: 15.90,
    },
  });
  console.log('✅ Venda criada');

  // Criar despesas
  await prisma.expense.create({
    data: {
      name: 'Aluguel do Salão',
      category: 'Infraestrutura',
      value: 2500.00,
      type: 'FIXA',
      date: new Date(),
      notes: 'Aluguel mensal',
    },
  });

  await prisma.expense.create({
    data: {
      name: 'Conta de Luz',
      category: 'Utilidades',
      value: 450.00,
      type: 'FIXA',
      date: new Date(),
      notes: 'Energia elétrica',
    },
  });

  await prisma.expense.create({
    data: {
      name: 'Compra de Produtos',
      category: 'Estoque',
      value: 1200.00,
      type: 'VARIAVEL',
      date: new Date(),
      notes: 'Reposição de estoque mensal',
    },
  });
  console.log('✅ Despesas criadas');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
