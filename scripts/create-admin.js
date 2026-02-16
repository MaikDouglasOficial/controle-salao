/**
 * Cria o usuário admin no banco (admin@salao.com / admin123).
 * Rode na pasta do projeto: node scripts/create-admin.js
 */
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// Carregar .env da raiz do projeto
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'DATABASE_URL' && value.startsWith('file:./')) {
        // Forçar caminho absoluto para o mesmo banco que o Next.js usa
        const dbPath = path.join(projectRoot, value.replace(/^file:\.\/?/, ''));
        value = 'file:' + dbPath.replace(/\\/g, '/');
      }
      process.env[key] = value;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@salao.com';
  const password = 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Atualizar senha para garantir que seja admin123
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log('Senha do admin atualizada para: admin123');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('Usuário admin criado com sucesso!');
  console.log('  Email: admin@salao.com');
  console.log('  Senha: admin123');
}

main()
  .catch((e) => {
    console.error('Erro:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
