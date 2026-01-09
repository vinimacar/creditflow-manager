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
  const querySnapshot = await getDocs(
    query(collection(db, clientesCollection), orderBy("createdAt", "desc"))
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Cliente[];
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
  const querySnapshot = await getDocs(
    query(collection(db, vendasCollection), orderBy("createdAt", "desc"))
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Venda[];
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
  const querySnapshot = await getDocs(
    query(collection(db, fornecedoresCollection), orderBy("createdAt", "desc"))
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Fornecedor[];
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
  const querySnapshot = await getDocs(
    query(collection(db, funcionariosCollection), orderBy("createdAt", "desc"))
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Funcionario[];
}

// ===== PRODUTOS =====

export interface Produto {
  id?: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  estoque?: number;
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
  const querySnapshot = await getDocs(
    query(collection(db, produtosCollection), orderBy("createdAt", "desc"))
  );
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Produto[];
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
