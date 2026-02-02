REMOVIDO

## Como rodar o seed na Vercel

### Opção 1: Automaticamente no Build
O seed agora roda automaticamente durante o deploy com o script `vercel-build`.

### Opção 2: Manualmente via Terminal da Vercel
1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Functions**
3. Ou execute localmente com a connection string de produção:
   ```bash
   DATABASE_URL="sua-url-de-producao" npm run prisma:seed
   ```

---

## Dados de Exemplo Criados

O seed cria automaticamente:
- ✅ 1 usuário admin
- ✅ 3 clientes
- ✅ 5 profissionais
- ✅ 4 produtos
- ✅ 5 serviços
- ✅ 2 agendamentos
- ✅ 1 venda
- ✅ 3 despesas

---

## Variáveis de Ambiente Necessárias na Vercel

Certifique-se de ter configurado:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://seu-dominio.vercel.app"
NEXTAUTH_SECRET="string-aleatoria-segura-aqui"
```

Para gerar um `NEXTAUTH_SECRET` seguro:
```bash
openssl rand -base64 32
```
