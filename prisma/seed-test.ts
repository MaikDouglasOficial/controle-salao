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

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando população do banco de dados...');

  // Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...');
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.customer.deleteMany();

  // Criar Profissionais
  console.log('👨‍💼 Criando profissionais...');
  const profissionais = await Promise.all([
    prisma.professional.create({
      data: {
        name: 'Maria Silva',
        phone: '(11) 98765-4321',
        email: 'maria.silva@salao.com',
        specialty: 'Cabeleireira',
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        name: 'João Santos',
        phone: '(11) 98765-4322',
        email: 'joao.santos@salao.com',
        specialty: 'Barbeiro',
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        name: 'Ana Costa',
        phone: '(11) 98765-4323',
        email: 'ana.costa@salao.com',
        specialty: 'Manicure e Pedicure',
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        name: 'Carlos Oliveira',
        phone: '(11) 98765-4324',
        email: 'carlos.oliveira@salao.com',
        specialty: 'Esteticista',
        active: false,
      },
    }),
  ]);

  // Criar Clientes
  console.log('👥 Criando clientes...');
  const clientes = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Juliana Mendes',
        phone: '(11) 91234-5678',
        email: 'juliana@email.com',
        cpf: '123.456.789-01',
        birthday: new Date('1990-03-15'),
        notes: 'Cliente VIP',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Roberto Lima',
        phone: '(11) 91234-5679',
        email: 'roberto@email.com',
        cpf: '234.567.890-12',
        birthday: new Date('1985-07-22'),
        notes: 'Prefere atendimento pela manhã',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Fernanda Rocha',
        phone: '(11) 91234-5680',
        email: 'fernanda@email.com',
        cpf: '345.678.901-23',
        birthday: new Date('1995-11-30'),
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Paulo Ferreira',
        phone: '(11) 91234-5681',
        email: 'paulo@email.com',
        cpf: '456.789.012-34',
        birthday: new Date('1988-05-10'),
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Mariana Costa',
        phone: '(11) 91234-5682',
        email: 'mariana@email.com',
        birthday: new Date('1992-12-25'),
        notes: 'Aniversariante de dezembro',
      },
    }),
  ]);

  // Criar Serviços
  console.log('💇 Criando serviços...');
  const servicos = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Corte Feminino',
        description: 'Corte de cabelo feminino com lavagem e secagem',
        duration: 60,
        price: 80.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Corte Masculino',
        description: 'Corte de cabelo masculino com barba',
        duration: 45,
        price: 50.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Escova Progressiva',
        description: 'Tratamento de alisamento capilar',
        duration: 180,
        price: 250.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Manicure',
        description: 'Manicure completa com esmaltação',
        duration: 45,
        price: 35.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Pedicure',
        description: 'Pedicure completa com esmaltação',
        duration: 60,
        price: 40.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Coloração Completa',
        description: 'Coloração completa com produtos premium',
        duration: 120,
        price: 180.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Hidratação Profunda',
        description: 'Tratamento de hidratação capilar',
        duration: 90,
        price: 120.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Maquiagem',
        description: 'Maquiagem profissional para eventos',
        duration: 60,
        price: 150.0,
      },
    }),
  ]);

  // Criar Produtos
  console.log('🛍️  Criando produtos...');
  const produtos = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Shampoo Profissional',
        description: 'Shampoo para todos os tipos de cabelo',
        price: 45.0,
        stock: 25,
        sku: 'SHP001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Condicionador Hidratante',
        description: 'Condicionador com óleo de argan',
        price: 50.0,
        stock: 20,
        sku: 'CND001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Máscara Capilar',
        description: 'Máscara de tratamento intensivo',
        price: 65.0,
        stock: 15,
        sku: 'MSC001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Óleo Finalizador',
        description: 'Óleo para finalização e brilho',
        price: 38.0,
        stock: 30,
        sku: 'OLE001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Spray Fixador',
        description: 'Spray fixador de longa duração',
        price: 28.0,
        stock: 18,
        sku: 'SPR001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Esmalte Colorido',
        description: 'Esmalte de alta qualidade - cores variadas',
        price: 12.0,
        stock: 50,
        sku: 'ESM001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Base para Unhas',
        description: 'Base fortalecedora para unhas',
        price: 15.0,
        stock: 22,
        sku: 'BAS001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Removedor de Esmalte',
        description: 'Removedor sem acetona',
        price: 18.0,
        stock: 12,
        sku: 'REM001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Creme para Pentear',
        description: 'Creme multifuncional',
        price: 42.0,
        stock: 8,
        sku: 'CRM001',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gel Modelador',
        description: 'Gel fixador forte',
        price: 32.0,
        stock: 3,
        sku: 'GEL001',
      },
    }),
  ]);

  // Criar Agendamentos
  console.log('📅 Criando agendamentos...');
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const proximaSemana = new Date(hoje);
  proximaSemana.setDate(proximaSemana.getDate() + 7);

  await Promise.all([
    prisma.appointment.create({
      data: {
        customerId: clientes[0].id,
        serviceId: servicos[0].id,
        date: new Date(hoje.setHours(14, 0, 0, 0)),
        status: 'agendado',
        professional: profissionais[0].name,
        notes: 'Cliente preferiu horário da tarde',
      },
    }),
    prisma.appointment.create({
      data: {
        customerId: clientes[1].id,
        serviceId: servicos[1].id,
        date: new Date(hoje.setHours(10, 30, 0, 0)),
        status: 'confirmado',
        professional: profissionais[1].name,
      },
    }),
    prisma.appointment.create({
      data: {
        customerId: clientes[2].id,
        serviceId: servicos[3].id,
        date: new Date(amanha.setHours(15, 0, 0, 0)),
        status: 'agendado',
        professional: profissionais[2].name,
      },
    }),
    prisma.appointment.create({
      data: {
        customerId: clientes[3].id,
        serviceId: servicos[5].id,
        date: new Date(proximaSemana.setHours(11, 0, 0, 0)),
        status: 'agendado',
        professional: profissionais[0].name,
      },
    }),
  ]);

  // Criar Vendas
  console.log('💰 Criando vendas...');
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const venda1 = await prisma.sale.create({
    data: {
      customerId: clientes[0].id,
      professional: profissionais[0].name,
      total: 130.0,
      paymentMethod: 'CARTAO_CREDITO',
      installments: 1,
      installmentValue: 130.0,
      date: ontem,
    },
  });

  await Promise.all([
    prisma.saleItem.create({
      data: {
        saleId: venda1.id,
        serviceId: servicos[0].id,
        quantity: 1,
        price: 80.0,
      },
    }),
    prisma.saleItem.create({
      data: {
        saleId: venda1.id,
        productId: produtos[0].id,
        quantity: 1,
        price: 50.0,
      },
    }),
  ]);

  const venda2 = await prisma.sale.create({
    data: {
      customerId: clientes[1].id,
      professional: profissionais[1].name,
      total: 50.0,
      paymentMethod: 'DINHEIRO',
      installments: 1,
      installmentValue: 50.0,
      date: ontem,
    },
  });

  await prisma.saleItem.create({
    data: {
      saleId: venda2.id,
      serviceId: servicos[1].id,
      quantity: 1,
      price: 50.0,
    },
  });

  // Criar Despesas
  console.log('💸 Criando despesas...');
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
  await Promise.all([
    prisma.expense.create({
      data: {
        name: 'Aluguel do Espaço',
        category: 'Aluguel',
        value: 2500.0,
        type: 'FIXA',
        date: inicioMes,
        notes: 'Pagamento mensal',
      },
    }),
    prisma.expense.create({
      data: {
        name: 'Conta de Energia',
        category: 'Contas',
        value: 450.0,
        type: 'VARIAVEL',
        date: new Date(inicioMes.setDate(5)),
        notes: 'Referente ao mês anterior',
      },
    }),
    prisma.expense.create({
      data: {
        name: 'Compra de Produtos',
        category: 'Produtos',
        value: 1200.0,
        type: 'VARIAVEL',
        date: new Date(inicioMes.setDate(10)),
        notes: 'Reposição de estoque',
      },
    }),
  ]);

  console.log('✅ Banco de dados populado com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - ${profissionais.length} profissionais`);
  console.log(`   - ${clientes.length} clientes`);
  console.log(`   - ${servicos.length} serviços`);
  console.log(`   - ${produtos.length} produtos`);
  console.log(`   - 4 agendamentos`);
  console.log(`   - 2 vendas`);
  console.log(`   - 3 despesas`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao popular banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
