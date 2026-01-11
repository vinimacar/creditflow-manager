/**
 * Script para popular categorias padrão no banco de dados
 * Execute este arquivo uma vez para criar as categorias iniciais
 */

import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

const CATEGORIAS_PADRAO = [
  "Empréstimo Pessoal",
  "Empréstimo Consignado",
  "Portabilidade",
  "FGTS",
  "Troca Cartão",
  "Venda Digital",
  "Refin da Portabilidade",
  "REFIN",
  "Saque Digital",
];

/**
 * Popula as categorias padrão no banco de dados
 * Evita duplicatas verificando antes de inserir
 */
export async function popularCategoriasInicial() {
  try {
    console.log("Iniciando população de categorias...");
    
    for (const nomeCategoria of CATEGORIAS_PADRAO) {
      // Verifica se a categoria já existe
      const q = query(
        collection(db, "categoriasProdutos"),
        where("nome", "==", nomeCategoria)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Categoria não existe, cria
        await addDoc(collection(db, "categoriasProdutos"), {
          nome: nomeCategoria,
          ativo: true,
          criadoEm: new Date(),
        });
        console.log(`✓ Categoria "${nomeCategoria}" criada`);
      } else {
        console.log(`⊘ Categoria "${nomeCategoria}" já existe`);
      }
    }
    
    console.log("População de categorias concluída!");
    return { success: true, message: "Categorias criadas com sucesso" };
  } catch (error) {
    console.error("Erro ao popular categorias:", error);
    return { success: false, message: "Erro ao criar categorias", error };
  }
}

/**
 * Remove todas as categorias (usar com cuidado!)
 */
export async function limparCategorias() {
  try {
    const snapshot = await getDocs(collection(db, "categoriasProdutos"));
    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log("Todas as categorias foram removidas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao limpar categorias:", error);
    return { success: false, error };
  }
}
