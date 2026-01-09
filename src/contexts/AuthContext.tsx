import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserRole, UserProfile, AuthContextType } from "./AuthTypes";

const roleHierarchy: Record<UserRole, number> = {
  admin: 4,
  gerente: 3,
  agente: 2,
  atendente: 1,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUserProfile = async (firebaseUser: User): Promise<UserProfile> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || undefined,
        role: data.role || "atendente",
        aprovado: data.aprovado || false,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } else {
      // Novo usuário - precisa ser aprovado
      const newUserProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || undefined,
        role: "atendente",
        aprovado: false,
        createdAt: new Date(),
      };

      await setDoc(userDocRef, {
        email: newUserProfile.email,
        displayName: newUserProfile.displayName,
        photoURL: newUserProfile.photoURL,
        role: newUserProfile.role,
        aprovado: newUserProfile.aprovado,
        createdAt: newUserProfile.createdAt,
      });

      return newUserProfile;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    const userLevel = roleHierarchy[user.role];
    return requiredRoles.some(role => roleHierarchy[role] <= userLevel);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

