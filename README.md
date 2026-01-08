# Crédito Gestor - Sistema de Gestão de Crédito

Sistema completo de gestão de crédito consignado com validações de CPF, CNPJ, telefone e integração com API de CEP.

## 🌐 Demo Online

**https://vinimacar.github.io/creditflow-manager/**

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral de vendas e desempenho
- Gráficos de análise de vendas
- Estatísticas de clientes e contratos
- Top agentes de vendas

### 👥 Gestão de Clientes
- Cadastro completo com validação de CPF
- Busca automática de endereço por CEP (ViaCEP)
- Validação de telefone (celular e fixo)
- Importação em massa via Excel/CSV

### 🏢 Gestão de Fornecedores
- Cadastro com validação de CNPJ
- Dados completos de contato
- Status ativo/inativo

### 👨‍💼 Gestão de Funcionários
- Cadastro completo de colaboradores
- Validação de CPF e telefone
- Controle de admissão e demissão
- Busca automática de endereço por CEP

### 📦 Gestão de Produtos
- Catálogo de produtos/serviços
- Controle de estoque
- Precificação

### 💰 PDV (Ponto de Venda)
- Sistema de vendas rápido
- Seleção de cliente
- Carrinho de compras
- Cálculo automático

### 📈 Relatórios
- Relatórios de vendas
- Análises de desempenho
- Exportação de dados

### 🔄 Conciliação
- Conciliação bancária
- Controle de pagamentos

## 🛠️ Tecnologias

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **React Router** - Navegação
- **Recharts** - Gráficos
- **Sonner** - Notificações toast

## 🔐 Validações Implementadas

### CPF (Cadastro de Pessoa Física)
- ✅ Validação completa com dígitos verificadores
- ✅ Máscara automática: `000.000.000-00`
- ✅ Verifica se não são todos dígitos iguais

### CNPJ (Cadastro Nacional de Pessoa Jurídica)
- ✅ Validação completa com dígitos verificadores
- ✅ Máscara automática: `00.000.000/0000-00`
- ✅ Verifica se não são todos dígitos iguais

### Telefone
- ✅ Valida celular (11 dígitos) e fixo (10 dígitos)
- ✅ Máscara automática: `(00) 00000-0000`
- ✅ Valida DDD e terceiro dígito 9 para celular

### CEP
- ✅ Validação de formato brasileiro
- ✅ Máscara automática: `00000-000`
- ✅ Integração com API ViaCEP
- ✅ Preenchimento automático de endereço, cidade e estado

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/vinimacar/creditflow-manager.git

# Entre na pasta
cd creditflow-manager

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

## 📦 Build para Produção

```bash
# Build otimizado
npm run build

# Preview do build
npm run preview
```

## 🌐 Deploy

### GitHub Pages (Automático)

O projeto está configurado para deploy automático via GitHub Actions. Quando você faz push para a branch `main`, o deploy é feito automaticamente.

**Configuração necessária no GitHub:**
1. Acesse: Settings → Pages
2. Source: GitHub Actions
3. O workflow `.github/workflows/deploy.yml` cuida do resto

### Netlify

Também pode ser implantado no Netlify:
```bash
npm run build
# Arraste a pasta dist/ para netlify.com/drop
```

## 📂 Estrutura do Projeto

```
creditflow-manager/
├── src/
│   ├── components/        # Componentes React
│   │   ├── forms/        # Formulários
│   │   ├── layout/       # Layout components
│   │   ├── ui/           # Componentes UI (shadcn)
│   │   └── dashboard/    # Componentes do dashboard
│   ├── pages/            # Páginas da aplicação
│   ├── lib/              # Utilitários e validações
│   │   ├── validations.ts      # Validações de CPF, CNPJ, etc
│   │   └── zod-validations.ts  # Validações Zod
│   └── hooks/            # React hooks customizados
├── public/               # Arquivos estáticos
└── .github/
    └── workflows/        # GitHub Actions
```

## 📖 Documentação Adicional

- [VALIDACOES.md](./VALIDACOES.md) - Documentação completa das validações
- [DEPLOY.md](./DEPLOY.md) - Guia completo de deploy
- [DEPLOY-RAPIDO.md](./DEPLOY-RAPIDO.md) - Guia rápido de deploy

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📝 Licença

Este projeto é de código aberto e está disponível sob a [Licença MIT](LICENSE).

## 👨‍💻 Autor

**Vinícius Macarenco**
- GitHub: [@vinimacar](https://github.com/vinimacar)

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [ViaCEP](https://viacep.com.br/) - API de CEP
- [Lucide Icons](https://lucide.dev/) - Ícones
- Comunidade React e TypeScript

---

**Desenvolvido com ❤️ por Vinícius Macarenco**
