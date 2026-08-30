/**
 * Augmentação de tipos para @firebase/auth
 *
 * O TypeScript resolve o mapa de exports do @firebase/auth usando o campo "types"
 * (auth-public.d.ts), que tem prioridade sobre a entrada "react-native".
 * Por isso getReactNativePersistence não aparece para o compilador mesmo existindo
 * no bundle de runtime que o Metro carrega.
 *
 * Este arquivo declara explicitamente a função para o TypeScript,
 * sem custo algum em runtime.
 */

import { Persistence } from '@firebase/auth'

export interface ReactNativeAsyncStorage {
  setItem(key: string, value: string): Promise<void>
  getItem(key: string): Promise<string | null>
  removeItem(key: string): Promise<void>
}

declare module '@firebase/auth' {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): Persistence
}