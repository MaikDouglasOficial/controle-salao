# 📦 Como Subir para o GitHub

## Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name**: `controle-salao`
   - **Description**: `Sistema completo de gerenciamento de salão de beleza`
   - **Visibility**: Escolha `Private` ou `Public`
3. **NÃO** marque nenhuma opção (README, .gitignore, license)
4. Clique em **Create repository**

## Passo 2: Conectar e Enviar o Código

No terminal PowerShell, execute:

```powershell
# Adicionar o repositório remoto (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/controle-salao.git

# Renomear branch para main (se necessário)
git branch -M main

# Enviar o código
git push -u origin main
```

## Passo 3: Verificar

1. Atualize a página do GitHub
2. Você verá todos os arquivos do projeto
3. Pronto! Código no GitHub ✅

## 🔐 Importante

O arquivo `.env` **NÃO** será enviado (está no .gitignore)
- Suas senhas e credenciais estão seguras
- Apenas o `.env.example` será enviado (sem dados sensíveis)

## 🚀 Próximos Passos

Depois de subir no GitHub, você pode:

1. **Deploy na Vercel**:
   - Acesse: https://vercel.com
   - Clique em "Import Project"
   - Selecione seu repositório `controle-salao`
   - Configure as variáveis de ambiente
   - Deploy automático! 🎉

2. **Configurar Turso**:
   - Siga o guia em `DEPLOY.md`
   - Configure o banco de dados
   - Atualize as variáveis na Vercel

## ❓ Problemas Comuns

### "Permission denied (publickey)"
```powershell
# Solução: Use HTTPS em vez de SSH
git remote set-url origin https://github.com/SEU-USUARIO/controle-salao.git
```

### "Username e senha pedidos"
```powershell
# Configure suas credenciais do GitHub
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@example.com"
```

### Token de acesso necessário
1. Vá em: https://github.com/settings/tokens
2. Gere um token (classic)
3. Use o token como senha

---

**✅ Pronto! Seu código está seguro no GitHub!**
