# 💇‍♀️ Sistema de Gerenciamento de Salão de Beleza

Sistema completo e moderno para gerenciamento de salão de beleza, com painel administrativo, controle de clientes, agendamentos, PDV, despesas e portal do cliente.

## 🚀 Tecnologias

- **Frontend & Backend**: Next.js 14 + React + TypeScript
- **Estilização**: TailwindCSS + Lucide Icons
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js (roles: admin/cliente)
- **Mensagens**: Meta WhatsApp Cloud API
- **Agendamentos**: node-cron (lembretes automáticos)
- **Gráficos**: Recharts
- **Hospedagem**: Docker + docker-compose

## ✨ Funcionalidades

### Painel Administrativo
- 📊 **Dashboard** com estatísticas em tempo real
- 👥 **Gestão de Clientes** (CRUD completo)
- 📦 **Gestão de Produtos** (controle de estoque)
- ✂️ **Gestão de Serviços** (duração e preços)
- 📅 **Agendamentos** (com status e profissionais)
- 💰 **PDV** (ponto de venda integrado)
- 💸 **Controle de Despesas** (fixas e variáveis)
- 📈 **Relatórios** (lucro, gráficos, exportação CSV)
- 📲 **Lembretes Automáticos** via WhatsApp

### Portal do Cliente
- 🔐 Login e cadastro próprio
- 📅 Agendar serviços disponíveis
- 📜 Ver histórico de atendimentos
- 👤 Editar dados pessoais
- 📱 Interface responsiva (mobile-first)

### Integrações
- 💬 WhatsApp Cloud API (lembretes 1h antes)
- 🔄 Cron jobs automáticos
- 📊 Gráficos e análises visuais

## 📋 Pré-requisitos

- Docker & Docker Compose instalados
- Conta Meta Developer (para WhatsApp - opcional)
- Node.js 18+ (apenas para desenvolvimento local)

## 🐳 Instalação e Execução com Docker (Recomendado)

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd controle-salao
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env e configure suas variáveis
# Especialmente o NEXTAUTH_SECRET
```

**Variáveis importantes no `.env`:**
```env
DATABASE_URL="postgresql://salao:salao123@postgres:5432/salao_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-uma-chave-secreta-forte-aqui"
META_WA_TOKEN="seu-token-whatsapp"
META_WA_PHONE_ID="seu-phone-id"
META_WA_FROM="whatsapp:+5511999999999"
```

### 3. Inicie os containers
```bash
docker-compose up -d
```

Isso irá:
- ✅ Criar o banco PostgreSQL
- ✅ Aplicar as migrations do Prisma
- ✅ Executar o seed com dados de exemplo
- ✅ Iniciar a aplicação na porta 3000

### 4. Acesse o sistema
```
http://localhost:3000
```

**Credenciais padrão:**
- Email: `admin@salao.com`
- Senha: `admin123`

### 5. Comandos úteis Docker

```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do banco
docker-compose logs -f postgres

# Parar os containers
docker-compose down

# Parar e remover volumes (limpa banco)
docker-compose down -v

# Reconstruir a aplicação
docker-compose up -d --build
```

## 💻 Instalação Local (Desenvolvimento)

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure o banco de dados
```bash
# Certifique-se que o PostgreSQL está rodando
# Ou use: docker-compose up -d postgres

# Execute as migrations
npx prisma migrate dev

# Execute o seed
npm run prisma:seed
```

### 3. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

Acesse em: `http://localhost:3000`

## 📲 Configuração do WhatsApp Cloud API

### 1. Crie uma conta Meta Developer
- Acesse: https://developers.facebook.com/apps
- Crie um novo app do tipo "Business"

### 2. Configure o WhatsApp Business API
- No painel do app, ative "WhatsApp"
- Gere um token permanente (Access Token)
- Copie o Phone Number ID

### 3. Configure no .env
```env
META_WA_TOKEN="seu-token-aqui"
META_WA_PHONE_ID="seu-phone-id"
META_WA_FROM="whatsapp:+5511999999999"
```

### 4. Teste o envio
O sistema envia lembretes automáticos 1h antes dos agendamentos confirmados.

**Nota:** Se não configurar o WhatsApp, o sistema continua funcionando normalmente, apenas não enviará mensagens.

## 🗄️ Estrutura do Banco de Dados

### Modelos Principais
- **User**: Usuários admin
- **Customer**: Clientes do salão
- **Product**: Produtos vendidos
- **Service**: Serviços oferecidos
- **Appointment**: Agendamentos
- **Sale**: Vendas (PDV)
- **SaleItem**: Itens de cada venda
- **Expense**: Despesas fixas/variáveis
- **NotificationLog**: Histórico de mensagens

### Comandos Prisma úteis

```bash
# Abrir Prisma Studio (interface visual)
npm run prisma:studio

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Resetar banco (CUIDADO: apaga tudo)
npx prisma migrate reset

# Gerar o Prisma Client
npx prisma generate
```

## 🎨 Interface e Design

A interface foi desenvolvida com:
- **TailwindCSS** para estilização moderna
- **Lucide Icons** para ícones elegantes
- **Recharts** para gráficos interativos
- **Design responsivo** (mobile, tablet, desktop)
- **Paleta de cores** roxo/pink (personalizável)

### Personalizar cores
Edite `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    // Altere os valores aqui
    500: '#d946ef',
    600: '#c026d3',
    // ...
  },
}
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch
```

## 📦 Deploy em VPS (Ubuntu)

### 1. Conecte ao servidor
```bash
ssh usuario@seu-servidor.com
```

### 2. Instale Docker e Docker Compose
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get install docker-compose-plugin
```

### 3. Clone o projeto
```bash
git clone <seu-repositorio>
cd controle-salao
```

### 4. Configure o .env
```bash
nano .env
# Configure as variáveis, especialmente NEXTAUTH_URL com seu domínio
```

### 5. Inicie com Docker
```bash
sudo docker-compose up -d
```

### 6. Configure Nginx (opcional - para domínio)
```nginx
server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT via NextAuth
- ✅ Proteção de rotas no servidor
- ✅ Variáveis de ambiente sensíveis
- ✅ Prepared statements (Prisma)

**⚠️ IMPORTANTE:**
- Sempre altere o `NEXTAUTH_SECRET` em produção
- Use senhas fortes para o banco de dados
- Configure HTTPS em produção (Let's Encrypt)

## 📱 Portal do Cliente

### Ativação
O portal do cliente está incluído no mesmo projeto.

### Rotas do Cliente
- `/cliente/login` - Login do cliente
- `/cliente/cadastro` - Cadastro de novo cliente
- `/cliente/dashboard` - Painel do cliente
- `/cliente/agendar` - Agendar serviços
- `/cliente/historico` - Ver histórico
- `/cliente/perfil` - Editar dados

### Funcionalidades
- Cliente cria conta própria
- Agenda serviços (status: "aguardando confirmação")
- Admin confirma e cliente recebe WhatsApp
- Histórico completo de atendimentos

### Desativar Portal do Cliente
Se não quiser o portal do cliente, basta remover a pasta:
```bash
rm -rf app/cliente
```

## 🛠️ Estrutura do Projeto

```
controle-salao/
├── app/
│   ├── api/              # API Routes (REST)
│   │   ├── auth/         # NextAuth
│   │   ├── customers/    # Clientes
│   │   ├── products/     # Produtos
│   │   ├── services/     # Serviços
│   │   ├── appointments/ # Agendamentos
│   │   ├── expenses/     # Despesas
│   │   └── dashboard/    # Dashboard stats
│   ├── admin/            # Painel Admin
│   │   ├── dashboard/    # Dashboard
│   │   ├── clientes/     # Gestão de clientes
│   │   ├── produtos/     # Gestão de produtos
│   │   ├── servicos/     # Gestão de serviços
│   │   ├── agendamentos/ # Gestão de agendamentos
│   │   ├── pdv/          # Ponto de Venda
│   │   ├── despesas/     # Controle de despesas
│   │   └── relatorios/   # Relatórios
│   ├── cliente/          # Portal do Cliente
│   │   ├── login/        # Login do cliente
│   │   ├── cadastro/     # Cadastro
│   │   ├── dashboard/    # Dashboard do cliente
│   │   ├── agendar/      # Agendar serviços
│   │   ├── historico/    # Histórico
│   │   └── perfil/       # Perfil
│   ├── login/            # Login admin
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout raiz
│   └── providers.tsx     # Providers (NextAuth)
├── components/           # Componentes reutilizáveis
│   ├── AdminLayout.tsx   # Layout admin
│   └── Sidebar.tsx       # Sidebar
├── lib/                  # Bibliotecas
│   ├── prisma.ts         # Prisma Client
│   ├── utils.ts          # Funções utilitárias
│   ├── whatsapp.ts       # Integração WhatsApp
│   └── cron.ts           # Cron jobs
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   └── seed.ts           # Dados iniciais
├── types/                # TypeScript types
├── Dockerfile            # Docker config
├── docker-compose.yml    # Docker Compose
├── .env.example          # Exemplo de variáveis
├── package.json          # Dependências
└── README.md             # Este arquivo
```

## 🐛 Solução de Problemas

### Erro de conexão com banco
```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps

# Veja os logs
docker-compose logs postgres
```

### Erro ao aplicar migrations
```bash
# Entre no container
docker exec -it salao_app sh

# Execute a migration manualmente
npx prisma migrate deploy
```

### Porta 3000 já está em uso
```bash
# Altere a porta no docker-compose.yml
ports:
  - "3001:3000"  # Mude 3001 para qualquer porta livre
```

## 📝 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Autor

Desenvolvido para gerenciamento profissional de salões de beleza.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação acima
2. Veja os logs: `docker-compose logs -f`
3. Abra uma issue no repositório

---

**🎉 Pronto! Seu sistema de gerenciamento de salão está funcionando!**

Acesse `http://localhost:3000` e faça login com:
- Email: `admin@salao.com`
- Senha: `admin123`
