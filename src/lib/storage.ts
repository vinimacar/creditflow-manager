import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export async function uploadLogo(file: File): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileName = `logo_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `empresa/logos/${fileName}`);
    
    // Upload do arquivo
    await uploadBytes(storageRef, file);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload da logo:", error);
    throw error;
  }
}

export async function deleteLogo(logoUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, logoUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Erro ao deletar logo:", error);
    // Não lança erro pois a logo pode não existir
  }
}
