# 🎨 Personalização da Empresa

## 📋 Visão Geral

Sistema completo de personalização que permite configurar a identidade visual da empresa em relatórios e documentos.

## ✨ Funcionalidades Implementadas

### 1. **Upload de Logo da Empresa**
- ✅ Upload de imagens (PNG, JPG) até 2MB
- ✅ Preview em tempo real da logo
- ✅ Armazenamento seguro no Firebase Storage
- ✅ Opção de remover logo
- ✅ Validação de tipo e tamanho de arquivo

### 2. **Informações da Empresa**
Campos configuráveis:
- Nome da Empresa
- CNPJ
- Telefone
- E-mail
- Endereço Completo

### 3. **Cores Personalizadas**
- **Cor Primária**: Usada em cabeçalhos de tabelas e elementos principais dos PDFs
- **Cor Secundária**: Usada em elementos secundários
- Seletor de cores visual com preview em tempo real
- Input de código hexadecimal para precisão

### 4. **Integração com Relatórios PDF**

#### PDV - Exportação de Vendas
Os PDFs exportados agora incluem:
- **Logo da empresa** no cabeçalho (se configurada)
- **Nome da empresa** logo abaixo do título
- **Cores personalizadas** nos cabeçalhos das tabelas
- **Informações da empresa** no rodapé:
  - CNPJ
  - Telefone
  - E-mail

#### Estrutura do PDF
```
┌─────────────────────────────────────────┐
│  [LOGO]    RELATÓRIO DE VENDAS          │
│         Nome da Empresa                 │
│    Gerado em: DD/MM/YYYY às HH:mm       │
├─────────────────────────────────────────┤
│                                         │
│  [Tabela de Vendas com cores custom]   │
│                                         │
├─────────────────────────────────────────┤
│ CNPJ | Tel | Email    │    Página X/Y  │
└─────────────────────────────────────────┘
```

## 🎯 Melhorias de Legibilidade

### Tipografia Otimizada
- **Tamanho base**: 15px (antes: padrão do navegador ~16px)
- **Line-height**: 1.6 para melhor espaçamento
- **Labels**: 14px, peso 500 (medium)
- **Inputs**: 15px para melhor leitura
- **Botões**: 15px, peso 500
- **Tabelas**: 14px

### Contraste Melhorado
- Títulos (h1-h6) com cor forte do foreground
- Labels com cor mais escura e peso médio
- Textos com melhor line-height

### Cards e Sombras
- Box-shadow melhorada para melhor profundidade
- Separação visual mais clara entre elementos

## 📁 Arquivos Modificados

### Novos Arquivos
1. **`src/lib/storage.ts`**
   - Funções para upload e remoção de logos
   - `uploadLogo(file)`: Faz upload da logo
   - `deleteLogo(logoUrl)`: Remove logo do Storage

### Arquivos Atualizados
1. **`src/lib/firestore.ts`**
   - Interface `EmpresaConfig` com todos os campos
   - `getEmpresaConfig()`: Busca configurações
   - `updateEmpresaConfig(config)`: Atualiza configurações

2. **`src/pages/Configuracoes.tsx`**
   - Nova aba "Personalização"
   - Interface completa de upload de logo
   - Campos de informações da empresa
   - Seletores de cores personalizadas
   - Estados e handlers para gerenciamento

3. **`src/pages/PDV.tsx`**
   - `handleExportarPDF()` atualizado
   - Integração com logo e cores da empresa
   - Cabeçalho e rodapé personalizados
   - Função `hexToRgb()` para conversão de cores

4. **`src/lib/firebase.ts`**
   - Exporta instância `app` para uso no Storage

5. **`src/index.css`**
   - Novos estilos globais para melhor legibilidade
   - Tamanhos de fonte otimizados
   - Melhor espaçamento e contraste

## 🚀 Como Usar

### 1. Acessar Configurações
- Navegue até **Configurações** no menu lateral
- Clique na aba **Personalização**

### 2. Upload da Logo
- Clique em "Fazer Upload da Logo"
- Selecione uma imagem PNG ou JPG (max 2MB)
- A logo será exibida no preview
- Para remover, passe o mouse sobre a logo e clique no ícone de lixeira

### 3. Configurar Informações
- Preencha os campos de informações da empresa
- Essas informações aparecerão nos relatórios

### 4. Escolher Cores
- Use os seletores de cor ou digite o código hexadecimal
- As cores serão aplicadas nos próximos relatórios gerados

### 5. Salvar
- Clique em "Salvar Configurações"
- As configurações são salvas no Firebase

### 6. Gerar Relatórios
- Vá para o PDV
- Clique em "Exportar PDF"
- O PDF terá sua logo e cores personalizadas

## 🔧 Tecnologias Utilizadas

- **Firebase Storage**: Armazenamento de logos
- **Firebase Firestore**: Armazenamento de configurações
- **jsPDF**: Geração de PDFs personalizados
- **React**: Interface de usuário
- **TypeScript**: Tipagem forte
- **Tailwind CSS**: Estilização

## 📊 Estrutura de Dados

### EmpresaConfig Interface
```typescript
interface EmpresaConfig {
  nomeEmpresa: string;
  logoUrl: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  corPrimaria: string;      // hex color
  corSecundaria: string;    // hex color
}
```

### Armazenamento
- **Firestore**: `/empresa_config/config`
- **Storage**: `/logos/empresa_logo.{ext}`

## 🎨 Cores Padrão

Se não configuradas, o sistema usa:
- **Primária**: `#2980b9` (Azul profissional)
- **Secundária**: `#64748b` (Cinza ardósia)

## ✅ Status

- ✅ Upload de logo funcionando
- ✅ Configurações salvando corretamente
- ✅ PDFs com personalização
- ✅ Preview em tempo real
- ✅ Validações de arquivo
- ✅ Melhorias de legibilidade implementadas
- ✅ Build funcionando
- ✅ Deploy no GitHub realizado

## 📝 Próximos Passos (Sugestões)

- [ ] Aplicar logo e cores em outros relatórios (Comissões, Despesas, etc.)
- [ ] Adicionar preview das cores antes de salvar
- [ ] Permitir múltiplos temas salvos
- [ ] Adicionar logo no cabeçalho do sistema
- [ ] Exportar configurações para backup
- [ ] Aplicar cores personalizadas na interface do sistema

## 🔗 Deploy

As alterações foram enviadas para:
- **GitHub**: ✅ Commit `050406b`
- **Netlify**: Deploy automático ativado
- **URL**: https://creditflow-manager.netlify.app

---

**Desenvolvido com ❤️ para melhorar a experiência do usuário**
