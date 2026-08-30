export type AuthUser = {
  uid: string;
  email: string | null;
};

export interface AuthService {
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  createAccount(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
