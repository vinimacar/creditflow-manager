// Funções iniciais para Gestão de Contratos
import { Contrato, AssinaturaContrato, AditivoContrato, ContratoStatus } from '../types/contrato';

import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';

export async function criarContrato(contrato: Omit<Contrato, 'id' | 'criadoEm' | 'atualizadoEm' | 'assinaturas' | 'aditivos'>): Promise<Contrato> {
  const novo: Omit<Contrato, 'id'> = {
    ...contrato,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    assinaturas: [],
    aditivos: [],
  };
  const docRef = await addDoc(collection(db, 'contratos'), {
    ...novo,
    criadoEm: Timestamp.fromDate(novo.criadoEm),
    atualizadoEm: Timestamp.fromDate(novo.atualizadoEm),
    dataInicio: Timestamp.fromDate(novo.dataInicio),
    dataFim: Timestamp.fromDate(novo.dataFim),
  });
  return { ...novo, id: docRef.id } as Contrato;
}

export async function adicionarAssinatura(contratoId: string, assinatura: Omit<AssinaturaContrato, 'id' | 'contratoId'>): Promise<AssinaturaContrato | null> {
  const nova: AssinaturaContrato = {
    ...assinatura,
    id: Math.random().toString(36).slice(2),
    contratoId,
    data: new Date(),
  };
  const contratoRef = doc(db, 'contratos', contratoId);
  await updateDoc(contratoRef, {
    assinaturas: arrayUnion({
      ...nova,
      data: Timestamp.fromDate(nova.data),
    }),
    atualizadoEm: Timestamp.fromDate(new Date()),
  });
  return nova;
}

export async function adicionarAditivo(contratoId: string, aditivo: Omit<AditivoContrato, 'id' | 'contratoId'>): Promise<AditivoContrato | null> {
  const novo: AditivoContrato = {
    ...aditivo,
    id: Math.random().toString(36).slice(2),
    contratoId,
    data: new Date(),
  };
  const contratoRef = doc(db, 'contratos', contratoId);
  await updateDoc(contratoRef, {
    aditivos: arrayUnion({
      ...novo,
      data: Timestamp.fromDate(novo.data),
    }),
    atualizadoEm: Timestamp.fromDate(new Date()),
  });
  return novo;
}

export async function atualizarStatusContrato(contratoId: string, status: ContratoStatus): Promise<boolean> {
  const contratoRef = doc(db, 'contratos', contratoId);
  try {
    await updateDoc(contratoRef, {
      status,
      atualizadoEm: Timestamp.fromDate(new Date()),
    });
    return true;
  } catch {
    return false;
  }
}

export async function listarContratos(): Promise<Contrato[]> {
  const snap = await getDocs(collection(db, 'contratos'));
  return snap.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate() : data.criadoEm,
      atualizadoEm: data.atualizadoEm?.toDate ? data.atualizadoEm.toDate() : data.atualizadoEm,
      dataInicio: data.dataInicio?.toDate ? data.dataInicio.toDate() : data.dataInicio,
      dataFim: data.dataFim?.toDate ? data.dataFim.toDate() : data.dataFim,
      assinaturas: (data.assinaturas || []).map((a: any) => ({ ...a, data: a.data?.toDate ? a.data.toDate() : a.data })),
      aditivos: (data.aditivos || []).map((a: any) => ({ ...a, data: a.data?.toDate ? a.data.toDate() : a.data })),
    } as Contrato;
  });
}
