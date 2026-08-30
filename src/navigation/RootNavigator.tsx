import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'

import OnboardingScreen from '../screens/auth/OnboardingScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import CadastroResponsavelScreen from '../screens/auth/CadastroResponsavelScreen'
import CadastroProfissionalScreen from '../screens/auth/CadastroProfissionalScreen'
import SobreOGrupoScreen from '../screens/auth/SobreOGrupoScreen'
import FamiliarNavigator from './FamiliarNavigator'
import ProfissionalNavigator from './ProfissionalNavigator'
import VideoCallScreen from '../screens/shared/VideoCallScreen'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const { user, perfil, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}>
        <ActivityIndicator size="large" color="#5B9BD5" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user || !perfil ? (
        <>
          <Stack.Screen name="Onboarding"           component={OnboardingScreen} />
          <Stack.Screen name="Login"                component={LoginScreen} />
          <Stack.Screen name="CadastroResponsavel"  component={CadastroResponsavelScreen} />
          <Stack.Screen name="CadastroProfissional" component={CadastroProfissionalScreen} />
          <Stack.Screen name="SobreOGrupo"          component={SobreOGrupoScreen} />
        </>
      ) : perfil === 'profissional' ? (
        <>
          <Stack.Screen name="ProfissionalApp" component={ProfissionalNavigator} />
          <Stack.Screen name="SobreOGrupo"     component={SobreOGrupoScreen} />
          <Stack.Screen name="VideoCall"       component={VideoCallScreen} options={{ animation: 'slide_from_bottom' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="FamiliarApp"  component={FamiliarNavigator} />
          <Stack.Screen name="SobreOGrupo"  component={SobreOGrupoScreen} />
          <Stack.Screen name="VideoCall"    component={VideoCallScreen} options={{ animation: 'slide_from_bottom' }} />
        </>
      )}
    </Stack.Navigator>
  )
}
