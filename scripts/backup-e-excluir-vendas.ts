import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgU7J-2M2bfa_dFsQ6Ps8DAYOM-ify8Hg",
  authDomain: "ecofin-c974e.firebaseapp.com",
  projectId: "ecofin-c974e",
  storageBucket: "ecofin-c974e.firebasestorage.app",
  messagingSenderId: "378572542594",
  appId: "1:378572542594:web:3afc0e864be3220dd79a9b",
  measurementId: "G-DSKYLR3HYY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function backupVendas() {
  console.log("🔄 Iniciando backup das vendas...");
  
  try {
    const vendasRef = collection(db, "vendas");
    const snapshot = await getDocs(vendasRef);
    
    const vendas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Total de vendas encontradas: ${vendas.length}`);
    
    // Criar diretório de backups se não existir
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-vendas-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    // Salvar backup
    fs.writeFileSync(filepath, JSON.stringify(vendas, null, 2), "utf-8");
    
    console.log(`✅ Backup salvo com sucesso em: ${filepath}`);
    console.log(`📁 Total de ${vendas.length} vendas foram salvas no backup`);
    
    return { success: true, count: vendas.length, filepath };
  } catch (error) {
    console.error("❌ Erro ao fazer backup:", error);
    return { success: false, error };
  }
}

async function excluirTodasVendas() {
  console.log("\n⚠️  INICIANDO EXCLUSÃO DE TODAS AS VENDAS...");
  console.log("Aguardando 3 segundos...\n");
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const vendasRef = collection(db, "vendas");
    const snapshot = await getDocs(vendasRef);
    
    console.log(`🗑️  Excluindo ${snapshot.docs.length} vendas...`);
    
    let deleted = 0;
    const batchSize = 10;
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = snapshot.docs.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (document) => {
          await deleteDoc(doc(db, "vendas", document.id));
          deleted++;
          process.stdout.write(`\rExcluídas: ${deleted}/${snapshot.docs.length}`);
        })
      );
    }
    
    console.log(`\n✅ Total de ${deleted} vendas foram excluídas com sucesso!`);
    return { success: true, count: deleted };
  } catch (error) {
    console.error("\n❌ Erro ao excluir vendas:", error);
    return { success: false, error };
  }
}

async function main() {
  console.log("==========================================");
  console.log("  BACKUP E EXCLUSÃO DE VENDAS");
  console.log("==========================================\n");
  
  // Passo 1: Backup
  const backupResult = await backupVendas();
  
  if (!backupResult.success) {
    console.error("\n❌ Backup falhou. Operação cancelada.");
    process.exit(1);
  }
  
  // Passo 2: Exclusão
  const deleteResult = await excluirTodasVendas();
  
  if (deleteResult.success) {
    console.log("\n==========================================");
    console.log("  OPERAÇÃO CONCLUÍDA COM SUCESSO");
    console.log("==========================================");
    console.log(`📦 Backup: ${backupResult.count} vendas salvas`);
    console.log(`🗑️  Exclusão: ${deleteResult.count} vendas removidas`);
    console.log(`📁 Arquivo: ${backupResult.filepath}`);
    console.log("==========================================\n");
  }
  
  process.exit(0);
}

main();
