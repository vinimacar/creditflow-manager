# Sistema de Autenticação e Permissões

## Autenticação Google (Firebase Auth)

O sistema utiliza Firebase Authentication com login via Google Account.

### Primeiro Acesso
- Usuário faz login com conta Google
- Sistema cria automaticamente um perfil com role padrão: **"agente"**
- Aguarda aprovação do administrador para liberação de permissões

## Níveis de Acesso (Roles)

### 1. Admin (Administrador)
- ✅ Acesso completo a todas as funcionalidades
- ✅ Dashboard, Clientes, Fornecedores, Produtos
- ✅ Funcionários, PDV, Relatórios, Conciliação
- ✅ Configurações

### 2. Gerente
- ✅ Dashboard, Clientes, Fornecedores, Produtos
- ✅ Funcionários, PDV, Relatórios, Conciliação
- ✅ Configurações
- ⚠️ Mesmo acesso que Admin (pode ser diferenciado futuramente)

### 3. Agente
- ✅ Dashboard, Clientes, Fornecedores
- ✅ Funcionários, PDV, Configurações
- ❌ **Bloqueado**: Produtos, Relatórios, Conciliação
- 🔒 **Restrição**: Não visualiza comissões em contratos

### 4. Atendente
- ✅ Dashboard, Clientes, Fornecedores
- ✅ Funcionários, PDV, Configurações
- ❌ **Bloqueado**: Produtos, Relatórios, Conciliação
- 🔒 **Restrição**: Não visualiza comissões em contratos

## Gerenciamento de Usuários

### Como Alterar a Role de um Usuário

1. Acesse o Firebase Console: https://console.firebase.google.com
2. Selecione o projeto: **ecofin-c974e**
3. Vá em **Firestore Database** → Collection: **users**
4. Encontre o usuário pelo email
5. Edite o campo `role` para: `admin`, `gerente`, `agente` ou `atendente`

### Estrutura do Documento do Usuário

```javascript
{
  uid: "string",              // ID do Firebase Auth
  email: "usuario@email.com", // Email do Google
  displayName: "Nome Usuário",// Nome da conta Google
  photoURL: "url",            // Foto da conta Google (opcional)
  role: "agente",             // Role padrão no primeiro login
  createdAt: Timestamp        // Data de criação
}
```

## Componentes de Segurança

### 1. AuthContext
- Gerencia estado de autenticação
- Fornece funções: `signInWithGoogle()`, `signOut()`, `hasPermission()`
- Carrega perfil do usuário do Firestore

### 2. ProtectedRoute
- Componente wrapper para rotas protegidas
- Valida permissões antes de renderizar página
- Exibe mensagem de "Acesso Negado" se não autorizado

### 3. LoginPage
- Tela de login com botão "Entrar com Google"
- Design responsivo e moderno

## Regras de Segurança do Firestore (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection: users
    match /users/{userId} {
      // Usuários podem ler apenas seu próprio perfil
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Apenas admins podem alterar roles
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Collections de dados (clientes, fornecedores, etc)
    match /{collection}/{document=**} {
      // Leitura: todos os autenticados
      allow read: if request.auth != null;
      
      // Escrita: todos exceto atendentes (podem customizar conforme necessário)
      allow write: if request.auth != null;
    }
  }
}
```

## Interface do Usuário

### Sidebar
- Links de navegação filtrados por role
- Exibe apenas itens permitidos para o usuário

### Header
- Foto e nome do usuário logado
- Badge com a role atual
- Botão de logout

## Próximos Passos

1. **Configurar primeiro Admin:**
   - Fazer login no sistema
   - Acessar Firestore e alterar role para "admin"

2. **Configurar Regras de Segurança:**
   - Implementar as regras recomendadas no Firestore
   - Testar permissões

3. **Tela de Gerenciamento de Usuários (Admin):**
   - Criar página para admin gerenciar roles
   - Aprovar novos usuários
   - Bloquear/desbloquear acessos
