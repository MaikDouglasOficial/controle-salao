import * as path from 'path';
import * as fs from 'fs';

// Carregar .env da raiz do projeto
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

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

  // Criar clientes (upsert = pode rodar o seed várias vezes)
  const cliente1 = await prisma.customer.upsert({
    where: { phone: '+5511987654321' },
    update: {},
    create: {
      name: 'Maria Silva',
      phone: '+5511987654321',
      email: 'maria@email.com',
      birthday: new Date('1990-05-15'),
      notes: 'Cliente VIP, prefere horários pela manhã',
    },
  });

  const cliente2 = await prisma.customer.upsert({
    where: { phone: '+5511976543210' },
    update: {},
    create: {
      name: 'Ana Santos',
      phone: '+5511976543210',
      email: 'ana@email.com',
      birthday: new Date('1985-08-22'),
      notes: 'Alérgica a alguns produtos químicos',
    },
  });

  const cliente3 = await prisma.customer.upsert({
    where: { phone: '+5511965432109' },
    update: {},
    create: {
      name: 'Juliana Oliveira',
      phone: '+5511965432109',
      email: 'juliana@email.com',
      birthday: new Date('1995-12-03'),
    },
  });
  console.log('✅ Clientes criados');

  // Criar profissionais (upsert = pode rodar o seed várias vezes)
  await prisma.professional.upsert({
    where: { name: 'Carla Mendes' },
    update: {},
    create: {
      name: 'Carla Mendes',
      phone: '+5511999887766',
      email: 'carla@salao.com',
      specialty: 'Cabeleireira',
      active: true,
    },
  });

  await prisma.professional.upsert({
    where: { name: 'Roberto Silva' },
    update: {},
    create: {
      name: 'Roberto Silva',
      phone: '+5511988776655',
      email: 'roberto@salao.com',
      specialty: 'Barbeiro',
      active: true,
    },
  });

  await prisma.professional.upsert({
    where: { name: 'Fernanda Costa' },
    update: {},
    create: {
      name: 'Fernanda Costa',
      phone: '+5511977665544',
      email: 'fernanda@salao.com',
      specialty: 'Manicure',
      active: true,
    },
  });

  await prisma.professional.upsert({
    where: { name: 'Paula Rodrigues' },
    update: {},
    create: {
      name: 'Paula Rodrigues',
      phone: '+5511966554433',
      email: 'paula@salao.com',
      specialty: 'Esteticista',
      active: true,
    },
  });

  await prisma.professional.upsert({
    where: { name: 'Marcos Almeida' },
    update: {},
    create: {
      name: 'Marcos Almeida',
      phone: '+5511955443322',
      email: 'marcos@salao.com',
      specialty: 'Colorista',
      active: false, // Inativo como exemplo
    },
  });
  console.log('✅ Profissionais criados');

  // Criar produtos (upsert = pode rodar o seed várias vezes)
  const produto1 = await prisma.product.upsert({
    where: { sku: 'SHP-001' },
    update: {},
    create: {
      name: 'Shampoo Hidratante',
      description: 'Shampoo profissional para hidratação profunda',
      price: 45.90,
      stock: 25,
      sku: 'SHP-001',
    },
  });

  const produto2 = await prisma.product.upsert({
    where: { sku: 'CND-001' },
    update: {},
    create: {
      name: 'Condicionador Reparador',
      description: 'Condicionador para cabelos danificados',
      price: 52.90,
      stock: 18,
      sku: 'CND-001',
    },
  });

  const produto3 = await prisma.product.upsert({
    where: { sku: 'MSC-001' },
    update: {},
    create: {
      name: 'Máscara Capilar',
      description: 'Máscara de tratamento intensivo',
      price: 89.90,
      stock: 12,
      sku: 'MSC-001',
    },
  });

  const produto4 = await prisma.product.upsert({
    where: { sku: 'ESM-001' },
    update: {},
    create: {
      name: 'Esmalte Premium',
      description: 'Esmalte de longa duração',
      price: 15.90,
      stock: 45,
      sku: 'ESM-001',
    },
  });
  console.log('✅ Produtos criados');

  // Criar serviços (buscar ou criar para poder rodar o seed várias vezes)
  const servico1 = await prisma.service.findFirst({ where: { name: 'Corte Feminino' } })
    ?? await prisma.service.create({
        data: {
          name: 'Corte Feminino',
          description: 'Corte de cabelo feminino com lavagem',
          duration: 60,
          price: 80.00,
        },
      });

  const servico2 = await prisma.service.findFirst({ where: { name: 'Coloração' } })
    ?? await prisma.service.create({
        data: {
          name: 'Coloração',
          description: 'Coloração completa com produtos profissionais',
          duration: 120,
          price: 180.00,
        },
      });

  const servico3 = await prisma.service.findFirst({ where: { name: 'Manicure' } })
    ?? await prisma.service.create({
        data: {
          name: 'Manicure',
          description: 'Manicure completa com esmaltação',
          duration: 45,
          price: 35.00,
        },
      });

  const servico4 = await prisma.service.findFirst({ where: { name: 'Hidratação' } })
    ?? await prisma.service.create({
        data: {
          name: 'Hidratação',
          description: 'Tratamento de hidratação capilar',
          duration: 90,
          price: 120.00,
        },
      });

  await prisma.service.findFirst({ where: { name: 'Escova Progressiva' } })
    ?? await prisma.service.create({
        data: {
          name: 'Escova Progressiva',
          description: 'Alisamento com escova progressiva',
          duration: 180,
          price: 250.00,
        },
      });
  console.log('✅ Serviços criados');

  // Criar agendamentos, venda e despesas só se ainda não existirem (evita duplicar ao rodar o seed de novo)
  const countAppointments = await prisma.appointment.count();
  if (countAppointments === 0) {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(14, 0, 0, 0);

    await prisma.appointment.create({
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

    await prisma.appointment.create({
      data: {
        customerId: cliente2.id,
        serviceId: servico2.id,
        date: depoisAmanha,
        status: 'agendado',
        professional: 'Fernanda',
      },
    });
    console.log('✅ Agendamentos criados');
  } else {
    console.log('✅ Agendamentos já existem (pulado)');
  }

  const countSales = await prisma.sale.count();
  if (countSales === 0) {
    const venda = await prisma.sale.create({
      data: {
        customerId: cliente3.id,
        total: 215.90,
        paymentMethod: 'CARTAO_CREDITO',
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
  } else {
    console.log('✅ Vendas já existem (pulado)');
  }

  const countExpenses = await prisma.expense.count();
  if (countExpenses === 0) {
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
  } else {
    console.log('✅ Despesas já existem (pulado)');
  }

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
