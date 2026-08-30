import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Platform } from 'react-native'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  User
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const Storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key)
    const AS = await import('@react-native-async-storage/async-storage')
    return AS.default.getItem(key)
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return }
    const AS = await import('@react-native-async-storage/async-storage')
    await AS.default.setItem(key, value)
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return }
    const AS = await import('@react-native-async-storage/async-storage')
    await AS.default.removeItem(key)
  },
}

export type Perfil = 'familiar' | 'profissional' | null

export type DadosFamiliar = {
  nome: string
  cpf: string
  telefone: string
  nomeFilho: string
  idadeFilho?: string
  diagnostico?: string
}

export type DadosProfissional = {
  nome: string
  cpf: string
  telefone: string
  especialidade: string
  conselho: string
  bio?: string
  anos?: string
  anosExperiencia?: string
  valor?: string
  valorConsulta?: string
  modalidades?: string[]
}

type DadosCadastro = DadosFamiliar | DadosProfissional

type AuthContextType = {
  user: User | null
  perfil: Perfil
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (email: string, senha: string, dados: DadosCadastro, tipo: Perfil) => Promise<void>
  sair: () => Promise<void>
  atualizarPerfil: (dados: Record<string, unknown>) => Promise<void>
  mudarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>
  apagarConta: (senhaAtual: string) => Promise<void>
  buscarDadosPerfil: () => Promise<Record<string, unknown> | null>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

const PERFIL_KEY = '@zelo:perfil'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [perfil, setPerfil]   = useState<Perfil>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // Timeout de segurança: se demorar mais de 8s, libera a tela
      const timeout = setTimeout(() => {
        console.warn('AuthContext: timeout ao buscar perfil')
        setLoading(false)
      }, 8000)

      try {
        if (!u) {
          setUser(null)
          setPerfil(null)
          try { await Storage.remove(PERFIL_KEY) } catch { }
          return
        }

        setUser(u)

        // 1. Tenta cache local primeiro (mais rápido)
        try {
          const perfilLocal = await Storage.get(PERFIL_KEY)
          if (perfilLocal === 'familiar' || perfilLocal === 'profissional') {
            setPerfil(perfilLocal as Perfil)
            // NÃO faz return aqui — deixa o finally rodar e chamar setLoading(false)
            clearTimeout(timeout)
            setLoading(false)
            return
          }
        } catch { }

        // 2. Busca no Firestore
        try {
          const snap = await getDoc(doc(db, 'usuarios', u.uid))
          if (snap.exists()) {
            const tipo = snap.data().tipo as Perfil
            setPerfil(tipo)
            try { await Storage.set(PERFIL_KEY, tipo!) } catch { }
          } else {
            setPerfil(null)
          }
        } catch (e) {
          console.warn('Erro ao buscar perfil no Firestore:', e)
          setPerfil(null)
        }
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    })

    return unsub
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = async (email: string, senha: string) => {
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha)
      const snap = await getDoc(doc(db, 'usuarios', cred.user.uid))
      if (snap.exists()) {
        const tipo = snap.data().tipo as Perfil
        try { await Storage.set(PERFIL_KEY, tipo!) } catch { }
        setPerfil(tipo)
      }
      setUser(cred.user)
    } finally {
      setLoading(false)
    }
  }

  // ── Cadastro ─────────────────────────────────────────────────────────────────
  const cadastrar = async (email: string, senha: string, dados: DadosCadastro, tipo: Perfil) => {
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha)
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        ...dados, tipo, email,
        criadoEm: new Date().toISOString()
      })
      try { await Storage.set(PERFIL_KEY, tipo!) } catch { }
      setPerfil(tipo)
      setUser(cred.user)
    } catch (e) {
      try { await Storage.remove(PERFIL_KEY) } catch { }
      throw e
    } finally {
      setLoading(false)
    }
  }

  // ── Logout ── 
  const sair = async () => {
    try { await Storage.remove(PERFIL_KEY) } catch { }
    await signOut(auth)
    // onAuthStateChanged detecta user=null e zera user/perfil automaticamente
  }

  // ── Atualizar perfil ─────────────────────────────────────────────────────────
  const atualizarPerfil = async (dados: Record<string, unknown>) => {
    if (!user) throw new Error('Usuário não autenticado')
    await updateDoc(doc(db, 'usuarios', user.uid), {
      ...dados,
      atualizadoEm: new Date().toISOString()
    })
  }

  // ── Buscar dados do perfil ───────────────────────────────────────────────────
  const buscarDadosPerfil = async (): Promise<Record<string, unknown> | null> => {
    if (!user) return null
    const snap = await getDoc(doc(db, 'usuarios', user.uid))
    return snap.exists() ? (snap.data() as Record<string, unknown>) : null
  }

  // ── Mudar senha ──────────────────────────────────────────────────────────────
  const mudarSenha = async (senhaAtual: string, novaSenha: string) => {
    if (!user || !user.email) throw new Error('Usuário não autenticado')
    const credencial = EmailAuthProvider.credential(user.email, senhaAtual)
    await reauthenticateWithCredential(user, credencial)
    await updatePassword(user, novaSenha)
  }

  // ── Apagar conta ── 
  const apagarConta = async (senhaAtual: string) => {
    if (!user || !user.email) throw new Error('Usuário não autenticado')

    // 1. Reautentica
    const credencial = EmailAuthProvider.credential(user.email, senhaAtual)
    await reauthenticateWithCredential(user, credencial)

    // 2. Deleta doc do Firestore
    await deleteDoc(doc(db, 'usuarios', user.uid))

    // 3. Limpa cache local
    try { await Storage.remove(PERFIL_KEY) } catch { }

    // 4. Deleta do Firebase Auth — 
    await deleteUser(user)
  }

  return (
    <AuthContext.Provider value={{
      user, perfil, loading,
      login, cadastrar, sair,
      atualizarPerfil, mudarSenha, apagarConta, buscarDadosPerfil
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
