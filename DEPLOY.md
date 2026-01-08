# Deploy no Netlify - Crédito Gestor

Este projeto está configurado para deploy automático no Netlify.

## 🚀 URL de Produção

**https://creditogestor.netlify.app/**

## 📦 Configuração de Deploy

### Arquivos de Configuração

- **netlify.toml**: Configuração principal do Netlify
- **public/_redirects**: Regras de redirecionamento para SPA

### Build Settings

- **Comando de Build**: `npm run build`
- **Diretório de Publicação**: `dist`
- **Node Version**: 18

## 🔧 Deploy Manual

### Via Netlify CLI

1. Instale o Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Faça login no Netlify:
```bash
netlify login
```

3. Inicialize o site (primeira vez):
```bash
netlify init
```

4. Deploy manual:
```bash
netlify deploy --prod
```

### Via Git (Recomendado)

1. Conecte seu repositório ao Netlify:
   - Acesse [Netlify Dashboard](https://app.netlify.com/)
   - Clique em "Add new site" → "Import an existing project"
   - Conecte seu repositório GitHub/GitLab/Bitbucket

2. Configure as build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

3. Deploy automático:
   - Todo push para a branch principal dispara um deploy automático

## 🌐 Deploy via Drag & Drop

1. Execute o build localmente:
```bash
npm run build
```

2. Acesse [Netlify Drop](https://app.netlify.com/drop)

3. Arraste a pasta `dist` para o upload

## ⚙️ Variáveis de Ambiente

Se o projeto usar variáveis de ambiente, configure no Netlify:

1. Acesse: Site settings → Build & deploy → Environment
2. Adicione as variáveis necessárias (ex: API keys)

**Exemplo de variáveis que podem ser necessárias:**
```
VITE_API_URL=https://api.exemplo.com
VITE_APP_NAME=Crédito Gestor
```

## 🔄 CI/CD Pipeline

O Netlify oferece:

- ✅ Deploy automático em cada push
- ✅ Preview de branches (PRs)
- ✅ Rollback com um clique
- ✅ Deploy previews para cada commit
- ✅ Notificações de build

## 📊 Monitoramento

- **Status do site**: https://creditogestor.netlify.app
- **Dashboard**: https://app.netlify.com/
- **Logs de build**: Disponíveis no dashboard

## 🔒 Segurança

Headers de segurança configurados:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## 🎯 SPA Routing

Configurado para suportar React Router:
- Todas as rotas são redirecionadas para `/index.html`
- Preserva as rotas do frontend (`/clientes`, `/fornecedores`, etc.)

## 📱 Features do Netlify

- ✅ HTTPS automático (SSL grátis)
- ✅ CDN global
- ✅ Continuous deployment
- ✅ Branch previews
- ✅ Form handling
- ✅ Analytics (opcional)
- ✅ A/B testing (opcional)

## 🐛 Troubleshooting

### Build falha
- Verifique os logs no dashboard do Netlify
- Confirme que `npm run build` funciona localmente
- Verifique a versão do Node (deve ser 18+)

### Rotas não funcionam (404)
- Confirme que o arquivo `public/_redirects` existe
- Verifique as configurações de redirect no `netlify.toml`

### Deploy não dispara
- Verifique se o repositório está conectado
- Confirme se a branch está correta nas configurações
- Verifique se há hooks configurados

## 📚 Recursos

- [Documentação Netlify](https://docs.netlify.com/)
- [Netlify CLI](https://cli.netlify.com/)
- [Status do Netlify](https://www.netlifystatus.com/)

## 💡 Comandos Úteis

```bash
# Build local
npm run build

# Preview local do build
npm run preview

# Deploy via CLI
netlify deploy --prod

# Ver logs
netlify logs

# Abrir admin do site
netlify open
```

---

**Última atualização**: Janeiro 2026
