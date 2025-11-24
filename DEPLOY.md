# 🚀 Guia de Deploy - Controle Salão

## Opção Escolhida: Vercel + Turso (100% Gratuito)

### 📋 Pré-requisitos
- Conta no GitHub
- Conta no Vercel (https://vercel.com)
- Conta no Turso (https://turso.tech)

---

## 🗄️ PASSO 1: Configurar Banco de Dados (Turso)

### 1.1 Criar conta no Turso
Acesse: https://turso.tech e faça login com GitHub

### 1.2 Instalar Turso CLI

**Windows (PowerShell como Admin):**
```powershell
irm get.tur.so/install.ps1 | iex
```

**Ou baixe direto:**
https://github.com/tursodatabase/turso-cli/releases

### 1.3 Configurar Turso

```bash
# 1. Fazer login
turso auth login

# 2. Criar banco de dados
turso db create controle-salao

# 3. Pegar URL do banco (COPIE ESTE VALOR)
turso db show controle-salao

# 4. Criar token de acesso (COPIE ESTE VALOR)
turso db tokens create controle-salao
```

**IMPORTANTE:** Salve em um arquivo temporário:
- `DATABASE_URL` = URL do banco (começa com libsql://)
- `TURSO_AUTH_TOKEN` = Token gerado

---

## 📦 PASSO 2: Preparar Repositório GitHub

### 2.1 Inicializar Git (se ainda não foi feito)

```bash
git init
git add .
git commit -m "Sistema de controle de salão pronto para deploy"
```

### 2.2 Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `controle-salao`
3. Privado
4. NÃO adicione README, .gitignore ou license
5. Clique em "Create repository"

### 2.3 Enviar código para GitHub

```bash
git remote add origin https://github.com/SEU-USUARIO/controle-salao.git
git branch -M main
git push -u origin main
```

---

## ☁️ PASSO 3: Deploy na Vercel

### 3.1 Importar Projeto

1. Acesse: https://vercel.com
2. Clique em "Add New" → "Project"
3. Importe o repositório `controle-salao`
4. Clique em "Import"

### 3.2 Configurar Variáveis de Ambiente

Na tela de configuração do projeto, adicione as seguintes variáveis em "Environment Variables":

```env
# Banco de Dados Turso
DATABASE_URL=libsql://seu-banco.turso.io
TURSO_AUTH_TOKEN=seu-token-turso-aqui

# NextAuth (IMPORTANTE: Gere um novo secret!)
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=gere-um-secret-aleatorio-aqui

# WhatsApp (Opcional - Configure depois)
META_WA_TOKEN=seu-token-whatsapp
META_WA_PHONE_ID=seu-phone-id
META_WA_FROM=whatsapp:+5511999999999

# Ambiente
NODE_ENV=production
```

**Para gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Ou use: https://generate-secret.vercel.app/32

### 3.3 Build Settings

- Framework Preset: **Next.js**
- Build Command: `prisma generate && prisma migrate deploy && next build`
- Output Directory: `.next`
- Install Command: `npm install`

### 3.4 Deploy

Clique em **"Deploy"** e aguarde (2-3 minutos)

---

## 🔄 PASSO 4: Migrar Banco de Dados

Após o primeiro deploy, você precisa aplicar as migrações:

### 4.1 Via Turso CLI Local

```bash
# 1. Conectar ao banco remoto
turso db shell controle-salao

# 2. Ou aplicar migrations direto
npx prisma migrate deploy --preview-feature
```

### 4.2 Popular dados iniciais (Opcional)

No terminal Vercel ou localmente conectado ao Turso:

```bash
npm run prisma:seed-test
```

---

## ✅ PASSO 5: Verificar Deploy

1. Acesse a URL fornecida pela Vercel: `https://seu-app.vercel.app`
2. Teste o login: `admin@salao.com` / `admin123`
3. Verifique se o PDV está funcionando
4. Teste criação de clientes, produtos, etc.

---

## 🔧 Configurações Adicionais

### Domínio Personalizado

1. No Vercel, vá em "Settings" → "Domains"
2. Adicione seu domínio
3. Configure o DNS conforme instruções

### WhatsApp Cloud API

1. Acesse: https://developers.facebook.com/apps
2. Crie um app Business
3. Ative WhatsApp
4. Copie o Token e Phone Number ID
5. Adicione nas variáveis de ambiente da Vercel

### Backups Automáticos

Configure no Turso:
```bash
turso db backups schedule controle-salao --frequency daily
```

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se `DATABASE_URL` e `TURSO_AUTH_TOKEN` estão corretos
- Teste conexão local: `turso db shell controle-salao`

### Erro: "Prisma Client not generated"
- No Vercel: Settings → General → Redeploy
- Marque "Clear Build Cache"

### Erro 500 na aplicação
- Verifique logs: Vercel Dashboard → Project → Deployments → Logs
- Confirme que todas as variáveis de ambiente estão configuradas

### Migrations não aplicadas
```bash
# Aplicar migrations manualmente
turso db shell controle-salao < prisma/migrations/migration.sql
```

---

## 📊 Monitoramento

### Vercel Analytics (Gratuito)
1. No dashboard do projeto
2. Settings → Analytics
3. Ative

### Turso Metrics
```bash
turso db inspect controle-salao
```

---

## 💰 Custos

- **Vercel (Hobby):** GRATUITO
  - 100 GB bandwidth
  - Serverless Functions incluídas
  
- **Turso (Free Tier):** GRATUITO
  - 9 GB de armazenamento
  - 1 bilhão de leituras/mês
  - 25 milhões de escritas/mês

**Total: R$ 0,00/mês** 🎉

---

## 🔄 Atualizações Futuras

Para atualizar o sistema:

```bash
# 1. Fazer alterações localmente
git add .
git commit -m "Descrição da alteração"
git push

# 2. Vercel faz deploy automático!
```

---

## 🆘 Suporte

- Vercel Docs: https://vercel.com/docs
- Turso Docs: https://docs.turso.tech
- Prisma Docs: https://www.prisma.io/docs

---

**Sistema pronto para produção! 🚀**
