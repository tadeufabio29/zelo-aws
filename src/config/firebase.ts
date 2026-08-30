import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { Platform } from 'react-native'

import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from '@firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "AIzaSyByM6H6XbZkkwEPaOJ-0itCJGNUr9W6t-U",
  authDomain: "zelo-app-25362.firebaseapp.com",
  projectId: "zelo-app-25362",
  storageBucket: "zelo-app-25362.firebasestorage.app",
  messagingSenderId: "928702691541",
  appId: "1:928702691541:web:aef0486cb0d89315590a5c"
}

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0]

// ─── Auth com persistência correta por plataforma ──────────────────────────────
// initializeAuth só pode ser chamado uma vez por app Firebase.
// Na segunda chamada (ex: hot reload no dev) ele lança erro — o catch captura isso.
function criarAuth() {
  if (Platform.OS === 'web') {
    // Web: usa persistência padrão (IndexedDB/localStorage do browser)
    return getAuth(app)
  }

  try {
    // Android / iOS: usa AsyncStorage como persistência
    // Isso resolve o crash "NativeException" no APK gerado pelo EAS Build
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } catch {
    // initializeAuth já foi chamado (hot reload / fast refresh)
    return getAuth(app)
  }
}

export const auth = criarAuth()
export const db = getFirestore(app)
export default app