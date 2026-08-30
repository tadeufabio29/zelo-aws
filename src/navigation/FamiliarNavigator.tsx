import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import HomeScreen from '../screens/familiar/HomeScreen'
import AgendaScreen from '../screens/familiar/AgendaScreen'
import SuporteScreen from '../screens/familiar/SuporteScreen'
import FavoritosScreen from '../screens/familiar/FavoritosScreen'
import DiarioScreen from '../screens/familiar/DiarioScreen'
import PerfilEspecialistaScreen from '../screens/familiar/PerfilEspecialistaScreen'
import AgendarConsultaScreen from '../screens/familiar/AgendarConsultaScreen'
import ConfiguracoesFamiliarScreen from '../screens/familiar/ConfiguracoesFamiliarScreen'
import FeedScreen from '../screens/familiar/FeedScreen'
import VideoCallScreen from '../screens/shared/VideoCallScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === '#5B9BD5' ? 1 : 0.5 }}>{emoji}</Text>
}

function FamiliarTabs() {
  const insets = useSafeAreaInsets()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        tabBarActiveTintColor: '#5B9BD5',
        tabBarInactiveTintColor: '#8A95A3',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E8ECF0',
          height: 56 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom || 10,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: 'Início', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tab.Screen name="Agenda" component={AgendaScreen}
        options={{ tabBarLabel: 'Agenda', tabBarIcon: ({ color }) => <TabIcon emoji="📅" color={color} /> }} />
      <Tab.Screen name="Suporte" component={SuporteScreen}
        options={{ tabBarLabel: 'Suporte', tabBarIcon: ({ color }) => <TabIcon emoji="💚" color={color} /> }} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen}
        options={{ tabBarLabel: 'Favoritos', tabBarIcon: ({ color }) => <TabIcon emoji="❤️" color={color} /> }} />
      <Tab.Screen name="Diario" component={DiarioScreen}
        options={{ tabBarLabel: 'Diário', tabBarIcon: ({ color }) => <TabIcon emoji="📓" color={color} /> }} />
      <Tab.Screen name="Feed" component={FeedScreen}
        options={{ tabBarLabel: 'Notícias', tabBarIcon: ({ color }) => <TabIcon emoji="📰" color={color} /> }} />
      <Tab.Screen name="Configuracoes" component={ConfiguracoesFamiliarScreen}
        options={{ tabBarLabel: 'Config.', tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }} />
    </Tab.Navigator>
  )
}

export default function FamiliarNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamiliarTabs" component={FamiliarTabs} />
      <Stack.Screen name="PerfilEspecialista" component={PerfilEspecialistaScreen} />
      <Stack.Screen name="AgendarConsulta" component={AgendarConsultaScreen} />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
    </Stack.Navigator>
  )
}
