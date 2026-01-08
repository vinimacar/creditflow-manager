# 🚀 Deploy Rápido no GitHub Pages

## Passo a Passo para Deploy

### 1️⃣ Inicialize o repositório Git

```bash
# Inicialize o Git (se ainda não tiver)
git init

# Adicione todos os arquivos
git add .

# Faça o commit inicial
git commit -m "Initial commit - Sistema Crédito Gestor"
```

### 2️⃣ Crie o repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: **creditflow-manager**
3. Deixe como **público**
4. **NÃO** inicialize com README, .gitignore ou licença
5. Clique em "Create repository"

### 3️⃣ Conecte ao GitHub e faça o push

```bash
# Adicione o remote do GitHub
git remote add origin https://github.com/vinimacar/creditflow-manager.git

# Renomeie a branch para main (se necessário)
git branch -M main

# Faça o push
git push -u origin main
```

### 4️⃣ Configure GitHub Pages

1. Acesse: https://github.com/vinimacar/creditflow-manager/settings/pages
2. Em **Source**, selecione: **GitHub Actions**
3. Pronto! O GitHub Actions fará o deploy automaticamente

### 5️⃣ Aguarde o deploy

- O GitHub Actions iniciará automaticamente
- Acompanhe em: https://github.com/vinimacar/creditflow-manager/actions
- Aguarde até aparecer ✅ (cerca de 2-3 minutos)

### 6️⃣ Acesse seu site

**URL**: https://vinimacar.github.io/creditflow-manager/

---

## 🔄 Atualizações Futuras

Para atualizar o site após fazer mudanças:

```bash
# Adicione as mudanças
git add .

# Faça o commit
git commit -m "Descrição das mudanças"

# Envie para o GitHub
git push
```

O GitHub Actions fará o deploy automaticamente! ✨

---

## 🐛 Problemas Comuns

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/vinimacar/creditflow-manager.git
```

### Erro de autenticação
Use um Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Marque: `repo`
4. Use o token como senha ao fazer push

### Site não aparece
1. Aguarde 2-5 minutos após o deploy
2. Verifique se o workflow rodou com sucesso
3. Limpe o cache do navegador (Ctrl+Shift+R)

---

## ✅ Checklist

- [ ] Repositório criado no GitHub
- [ ] Git configurado localmente
- [ ] Push feito para `main`
- [ ] GitHub Pages configurado (Source: GitHub Actions)
- [ ] Workflow rodou com sucesso
- [ ] Site acessível em https://vinimacar.github.io/creditflow-manager/

---

## 📚 Recursos

- **Repositório**: https://github.com/vinimacar/creditflow-manager
- **Site**: https://vinimacar.github.io/creditflow-manager/
- **Actions**: https://github.com/vinimacar/creditflow-manager/actions
- **Settings**: https://github.com/vinimacar/creditflow-manager/settings/pages

---

**Pronto! Seu site está no ar! 🎉**
