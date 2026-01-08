# 🚀 Guia Rápido de Deploy no Netlify

## Seu projeto está pronto para deploy!

**URL do site**: https://creditogestor.netlify.app/

---

## Opção 1: Deploy via Netlify CLI (Recomendado)

### 1. Instale o Netlify CLI globalmente:
```bash
npm install -g netlify-cli
```

### 2. Faça login no Netlify:
```bash
netlify login
```

### 3. Inicialize e faça o deploy:
```bash
# Na primeira vez
netlify init

# Para deploy em produção
netlify deploy --prod
```

---

## Opção 2: Deploy via Git (Automático)

### 1. Inicialize um repositório Git (se ainda não tiver):
```bash
git init
git add .
git commit -m "Initial commit - Sistema de Crédito Gestor"
```

### 2. Crie um repositório no GitHub/GitLab/Bitbucket

### 3. Conecte e faça push:
```bash
git remote add origin https://github.com/seu-usuario/creditogestor.git
git branch -M main
git push -u origin main
```

### 4. No Netlify Dashboard (https://app.netlify.com/):
- Clique em "Add new site"
- Selecione "Import an existing project"
- Conecte seu provedor Git
- Selecione o repositório
- As configurações já estão no `netlify.toml`:
  - **Build command**: `npm run build`
  - **Publish directory**: `dist`
- Clique em "Deploy site"

---

## Opção 3: Deploy via Drag & Drop

### 1. O build já está pronto na pasta `dist/`:
```bash
# Se precisar rebuildar
npm run build
```

### 2. Acesse: https://app.netlify.com/drop

### 3. Arraste a pasta `dist/` para o navegador

---

## ✅ O que já está configurado

- ✅ `netlify.toml` - Configuração de build e redirects
- ✅ `public/_redirects` - Suporte para React Router (SPA)
- ✅ Build otimizado em `dist/`
- ✅ Headers de segurança
- ✅ Cache para assets estáticos

---

## 📝 Próximos Passos Após Deploy

### 1. Configure um domínio personalizado (opcional):
- No Netlify Dashboard → Domain settings
- Adicione seu domínio customizado

### 2. Configure variáveis de ambiente (se necessário):
- Site settings → Build & deploy → Environment
- Adicione variáveis como `VITE_API_URL`

### 3. Ative HTTPS (automático):
- O Netlify fornece SSL grátis via Let's Encrypt

---

## 🔄 Atualizações Futuras

### Via Git (Automático):
```bash
git add .
git commit -m "Descrição das mudanças"
git push
```
O Netlify fará deploy automaticamente!

### Via CLI (Manual):
```bash
npm run build
netlify deploy --prod
```

---

## 🐛 Troubleshooting

### Build falha no Netlify:
1. Verifique os logs no dashboard
2. Teste localmente: `npm run build`
3. Verifique a versão do Node (18+)

### Rotas não funcionam (404):
1. Confirme que `public/_redirects` existe
2. Verifique `netlify.toml` redirects

### Site não atualiza:
1. Clear o cache do Netlify
2. Force um novo deploy
3. Limpe o cache do navegador (Ctrl+Shift+R)

---

## 📊 Monitoramento

- **Dashboard**: https://app.netlify.com/
- **Status do build**: Visível no dashboard
- **Logs**: Disponíveis em cada deploy
- **Analytics**: Ative nas configurações (opcional)

---

## 🎯 Comandos Úteis

```bash
# Build local
npm run build

# Preview local
npm run preview

# Deploy de teste (draft)
netlify deploy

# Deploy em produção
netlify deploy --prod

# Ver status do site
netlify status

# Abrir dashboard
netlify open

# Ver logs
netlify logs
```

---

**Pronto! Seu sistema está configurado e pronto para deploy! 🚀**

Para mais informações, consulte [DEPLOY.md](./DEPLOY.md)
