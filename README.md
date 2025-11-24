Sistema de Gerenciamento de Salão de Beleza

Sistema moderno para gerenciar salão de beleza: painel administrativo, clientes, agendamentos, PDV, despesas e portal do cliente.

Tecnologias

Frontend & Backend: Next.js 14 + React + TypeScript

Estilização: TailwindCSS + Lucide Icons

Banco de Dados: PostgreSQL + Prisma ORM

Autenticação: NextAuth.js

Mensagens: WhatsApp Cloud API

Agendamentos: node-cron

Gráficos: Recharts

Hospedagem: Docker + docker-compose

Funcionalidades
Painel Administrativo

Dashboard com estatísticas

Gestão de Clientes, Produtos e Serviços

Agendamentos com status e profissionais

PDV integrado

Controle de despesas

Relatórios (lucro, gráficos, CSV)

Lembretes automáticos via WhatsApp

Portal do Cliente

Login e cadastro próprio

Agendar serviços

Ver histórico de atendimentos

Editar dados pessoais

Instalação com Docker

Clone o repositório:

git clone <seu-repositório>
cd controle-salao


Configure o .env com suas variáveis (banco, NextAuth, WhatsApp).

Inicie os containers:

docker-compose up -d


Acesse: http://localhost:3000

Credenciais padrão:

Email: admin@salao.com

Senha: admin123

Comandos úteis
docker-compose logs -f app       # Logs da aplicação
docker-compose logs -f postgres  # Logs do banco
docker-compose down              # Parar containers
docker-compose down -v           # Parar e remover volumes
docker-compose up -d --build     # Reconstruir e subir containers

Estrutura do Projeto
controle-salao/
├── app/           # Páginas e rotas
├── components/    # Componentes reutilizáveis
├── lib/           # Utils, Prisma, WhatsApp, cron
├── prisma/        # Schema e seed do banco
├── types/         # Typescript types
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md

Licença

Projeto privado e proprietário.
