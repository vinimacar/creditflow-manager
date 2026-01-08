import { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type UserRole = "admin" | "gerente" | "agente" | "atendente";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const roleHierarchy: Record<UserRole, number> = {
  admin: 4,
  gerente: 3,
  agente: 2,
  atendente: 1,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (firebaseUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || undefined,
          role: userData.role || "atendente",
          createdAt: userData.createdAt?.toDate() || new Date(),
        });
      } else {
        // Criar perfil inicial para novo usuário
        const newUserProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || undefined,
          role: "atendente", // role padrão
          createdAt: new Date(),
        };
        
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...newUserProfile,
          createdAt: new Date(),
        });
        
        setUser(newUserProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUser(null);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    
    const userLevel = roleHierarchy[user.role];
    return requiredRoles.some(role => userLevel >= roleHierarchy[role]);
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

