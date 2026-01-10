import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Serviços genéricos para operações CRUD no Firestore
 */

// ===== CLIENTES =====

export interface Cliente {
  id?: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep?: string;
  dataNascimento: string;
  senhaINSS?: string;
  status: "ativo" | "inativo";
  createdAt?: Date;
  updatedAt?: Date;
}

export const clientesCollection = "clientes";

export async function addCliente(cliente: Omit<Cliente, "id">) {
  const docRef = await addDoc(collection(db, clientesCollection), {
    ...cliente,
    status: cliente.status || "ativo",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCliente(id: string, cliente: Partial<Cliente>) {
  const docRef = doc(db, clientesCollection, id);
  await updateDoc(docRef, {
    ...cliente,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCliente(id: string) {
  await deleteDoc(doc(db, clientesCollection, id));
}

export async function getClientes(): Promise<Cliente[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, clientesCollection), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Cliente[];
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return [];
  }
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const docRef = doc(db, clientesCollection, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Cliente;
  }
  return null;
}
// ===== VENDAS =====

export interface Venda {
  id?: string;
  clienteId: string;
  produtoId: string;
  funcionarioId: string;
  valorContrato: number;
  prazo: number;
  comissao: number;
  comissaoPercentual: number;
  status: "aprovada" | "pendente" | "em_analise" | "recusada";
  criadoPor: string;
  createdAt?: any;
  updatedAt?: any;
}

export const vendasCollection = "vendas";

export async function getVendas(): Promise<Venda[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, vendasCollection), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Venda[];
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return [];
  }
}

export async function getVendasPorPeriodo(inicio: Date, fim: Date): Promise<Venda[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, vendasCollection),
      where("createdAt", ">=", Timestamp.fromDate(inicio)),
      where("createdAt", "<=", Timestamp.fromDate(fim)),
      orderBy("createdAt", "desc")
    )
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Venda[];
}

export async function getVendasPorFuncionario(funcionarioId: string): Promise<Venda[]> {
  const querySnapshot = await getDocs(
    query(
      collection(db, vendasCollection),
      where("funcionarioId", "==", funcionarioId),
      orderBy("createdAt", "desc")
    )
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Venda[];
}

export async function getVendasPorCliente(clienteId: string): Promise<Venda[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, vendasCollection),
        where("clienteId", "==", clienteId)
      )
    );
    const vendas = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Venda[];
    
    // Ordenar manualmente por createdAt em ordem decrescente
    return vendas.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Erro ao buscar vendas do cliente:", error);
    return [];
  }
}
// ===== FORNECEDORES =====

export interface Fornecedor {
  id?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  status: "ativo" | "inativo";
  createdAt?: Date;
  updatedAt?: Date;
}

export const fornecedoresCollection = "fornecedores";

export async function addFornecedor(fornecedor: Omit<Fornecedor, "id">) {
  const docRef = await addDoc(collection(db, fornecedoresCollection), {
    ...fornecedor,
    status: fornecedor.status || "ativo",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateFornecedor(id: string, fornecedor: Partial<Fornecedor>) {
  const docRef = doc(db, fornecedoresCollection, id);
  await updateDoc(docRef, {
    ...fornecedor,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteFornecedor(id: string) {
  await deleteDoc(doc(db, fornecedoresCollection, id));
}

export async function getFornecedores(): Promise<Fornecedor[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, fornecedoresCollection), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Fornecedor[];
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return [];
  }
}

// ===== FUNCIONÁRIOS =====

export interface Funcionario {
  id?: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep?: string;
  dataNascimento: string;
  dataAdmissao: string;
  dataDemissao?: string;
  funcao?: string;
  cargo?: string;
  salario?: number;
  salarioBruto?: number;
  dependentes?: number;
  status: "ativo" | "inativo";
  aprovado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const funcionariosCollection = "funcionarios";

export async function addFuncionario(funcionario: Omit<Funcionario, "id">) {
  const docRef = await addDoc(collection(db, funcionariosCollection), {
    ...funcionario,
    status: funcionario.status || "ativo",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateFuncionario(id: string, funcionario: Partial<Funcionario>) {
  const docRef = doc(db, funcionariosCollection, id);
  await updateDoc(docRef, {
    ...funcionario,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteFuncionario(id: string) {
  await deleteDoc(doc(db, funcionariosCollection, id));
}

export async function getFuncionarios(): Promise<Funcionario[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, funcionariosCollection), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Funcionario[];
  } catch (error) {
    console.error("Erro ao buscar funcionários:", error);
    return [];
  }
}

// ===== PRODUTOS =====

export interface Produto {
  id?: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  preco?: number;
  categoria?: string;
  estoque?: number;
  prazoMin?: number;
  prazoMax?: number;
  tipoTabela?: string;
  comissao: number; // Percentual de comissão sobre o valor do contrato
  taxaJuros?: number;
  status: "ativo" | "inativo";
  createdAt?: Date;
  updatedAt?: Date;
}

export const produtosCollection = "produtos";

export async function addProduto(produto: Omit<Produto, "id">) {
  const docRef = await addDoc(collection(db, produtosCollection), {
    ...produto,
    status: produto.status || "ativo",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProduto(id: string, produto: Partial<Produto>) {
  const docRef = doc(db, produtosCollection, id);
  await updateDoc(docRef, {
    ...produto,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProduto(id: string) {
  await deleteDoc(doc(db, produtosCollection, id));
}

export async function getProdutos(): Promise<Produto[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, produtosCollection), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Produto[];
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
}

// ===== USUÁRIOS (USERS) =====

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "gerente" | "agente" | "atendente";
  status?: "ativo" | "bloqueado";
  aprovado?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const usersCollection = "users";

export async function getAllUsers(): Promise<UserProfile[]> {
  const querySnapshot = await getDocs(
    query(collection(db, usersCollection), orderBy("createdAt", "desc"))
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    uid: doc.data().uid,
    email: doc.data().email,
    displayName: doc.data().displayName,
    photoURL: doc.data().photoURL,
    role: doc.data().role,
    status: doc.data().status || "ativo",
    aprovado: doc.data().aprovado || false,
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as UserProfile[];
}

export async function updateUserRole(userId: string, role: "admin" | "gerente" | "agente" | "atendente") {
  const userRef = doc(db, usersCollection, userId);
  await updateDoc(userRef, {
    role,
    updatedAt: Timestamp.now(),
  });
}

export async function updateUserStatus(userId: string, status: "ativo" | "bloqueado") {
  const userRef = doc(db, usersCollection, userId);
  await updateDoc(userRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, usersCollection, userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role,
      status: data.status || "ativo",
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }
  return null;
}

// ===== SALÁRIOS VIGENTES =====

export interface SalarioVigente {
  id?: string;
  funcionarioId: string;
  salarioBase: number;
  dataVigencia: Date;
  observacao?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export const salariosVigentesCollection = "salariosVigentes";

export async function addSalarioVigente(salario: Omit<SalarioVigente, "id">) {
  try {
    const docRef = await addDoc(collection(db, salariosVigentesCollection), {
      ...salario,
      dataVigencia: Timestamp.fromDate(new Date(salario.dataVigencia)),
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar salário vigente:", error);
    throw error;
  }
}

export async function getSalariosVigentes(): Promise<SalarioVigente[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, salariosVigentesCollection), orderBy("dataVigencia", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      funcionarioId: doc.data().funcionarioId,
      salarioBase: doc.data().salarioBase,
      dataVigencia: doc.data().dataVigencia?.toDate() || new Date(),
      observacao: doc.data().observacao,
      criadoEm: doc.data().criadoEm?.toDate() || new Date(),
      atualizadoEm: doc.data().atualizadoEm?.toDate() || new Date(),
    })) as SalarioVigente[];
  } catch (error) {
    console.error("Erro ao buscar salários vigentes:", error);
    return [];
  }
}

export async function getSalarioVigentePorFuncionario(funcionarioId: string): Promise<SalarioVigente | null> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, salariosVigentesCollection),
        where("funcionarioId", "==", funcionarioId)
      )
    );
    
    if (querySnapshot.empty) return null;
    
    // Ordenar localmente por data de vigência (mais recente primeiro)
    const salarios = querySnapshot.docs.map(doc => ({
      id: doc.id,
      funcionarioId: doc.data().funcionarioId,
      salarioBase: doc.data().salarioBase,
      dataVigencia: doc.data().dataVigencia?.toDate() || new Date(),
      observacao: doc.data().observacao,
      criadoEm: doc.data().criadoEm?.toDate() || new Date(),
      atualizadoEm: doc.data().atualizadoEm?.toDate() || new Date(),
    }));
    
    salarios.sort((a, b) => b.dataVigencia.getTime() - a.dataVigencia.getTime());
    
    return salarios[0];
  } catch (error) {
    console.error("Erro ao buscar salário vigente do funcionário:", error);
    return null;
  }
}

export async function updateSalarioVigente(id: string, salario: Partial<SalarioVigente>) {
  try {
    const docRef = doc(db, salariosVigentesCollection, id);
    const updateData: any = {
      ...salario,
      atualizadoEm: Timestamp.now(),
    };
    
    if (salario.dataVigencia) {
      updateData.dataVigencia = Timestamp.fromDate(new Date(salario.dataVigencia));
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Erro ao atualizar salário vigente:", error);
    throw error;
  }
}

export async function deleteSalarioVigente(id: string) {
  try {
    await deleteDoc(doc(db, salariosVigentesCollection, id));
  } catch (error) {
    console.error("Erro ao deletar salário vigente:", error);
    throw error;
  }
}

// ===== DESPESAS =====

export interface Despesa {
  id?: string;
  descricao: string;
  categoria: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: "Pago" | "Pendente" | "Atrasado";
  observacoes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const despesasCollection = "despesas";

export async function addDespesa(despesa: Omit<Despesa, "id">) {
  try {
    const docRef = await addDoc(collection(db, despesasCollection), {
      ...despesa,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar despesa:", error);
    throw error;
  }
}

export async function updateDespesa(id: string, despesa: Partial<Despesa>) {
  try {
    const docRef = doc(db, despesasCollection, id);
    await updateDoc(docRef, {
      ...despesa,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Erro ao atualizar despesa:", error);
    throw error;
  }
}

export async function deleteDespesa(id: string) {
  try {
    await deleteDoc(doc(db, despesasCollection, id));
  } catch (error) {
    console.error("Erro ao deletar despesa:", error);
    throw error;
  }
}

export async function getDespesas(): Promise<Despesa[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, despesasCollection), orderBy("dataVencimento", "desc"))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Despesa[];
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    return [];
  }
}
