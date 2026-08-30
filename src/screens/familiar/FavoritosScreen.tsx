import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { colors, typo, space, radius, rs } from '../../theme'

const STORAGE_KEY = '@zelo:favoritos'

type Especialista = {
  id: string
  nome: string
  especialidade: string
  registro: string
  emoji: string
  cor: string
  corFundo: string
  avaliacao?: number
  modalidades: string[]
  valor?: string
  bio?: string
}

// Mapeamento de cores por especialidade
const COR_ESPECIALIDADE: Record<string, { cor: string; corFundo: string; emoji: string }> = {
  'Psicologia':        { cor: colors.blue,     corFundo: colors.blueLight,   emoji: '🧠' },
  'Fonoaudiologia':    { cor: '#3D9970',        corFundo: '#E8F5EE',           emoji: '🗣️' },
  'Terapia Ocupacional':{ cor: colors.purple,   corFundo: colors.purpleLight,  emoji: '✋' },
  'Ter. Ocupacional':  { cor: colors.purple,    corFundo: colors.purpleLight,  emoji: '✋' },
  'Fisioterapia':      { cor: '#E8A838',        corFundo: '#FEF6E4',           emoji: '🏃' },
  'Nutrição':          { cor: '#E8643A',        corFundo: colors.dangerBg,     emoji: '🥗' },
  'Musicoterapia':     { cor: colors.purple,    corFundo: colors.purpleLight,  emoji: '🎵' },
  'Psicopedagogia':    { cor: colors.blue,      corFundo: colors.blueLight,    emoji: '📖' },
  'Educação Física':   { cor: '#3D9970',        corFundo: '#E8F5EE',           emoji: '⚽' },
  'Neuropsicologia':   { cor: '#E8643A',        corFundo: colors.dangerBg,     emoji: '🔬' },
  'Psicomotricidade':  { cor: '#E8A838',        corFundo: '#FEF6E4',           emoji: '🤸' },
}

export default function FavoritosScreen() {
  const navigation = useNavigation() as any
  const insets = useSafeAreaInsets()
  const [especialistas, setEspecialistas] = useState<Especialista[]>([])
  const [favoritoIds, setFavoritoIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'todos' | 'salvos'>('todos')

  useEffect(() => {
    carregarTudo()
  }, [])

  const carregarTudo = useCallback(async () => {
    setLoading(true)
    try {
      // Busca profissionais cadastrados no Firebase
      const snap = await getDocs(
        query(collection(db, 'usuarios'), where('tipo', '==', 'profissional'))
      )

      const lista: Especialista[] = snap.docs.map(d => {
        const data = d.data()
        const esp = (data.especialidade as string) ?? ''
        const cores = COR_ESPECIALIDADE[esp] ?? { cor: colors.blue, corFundo: colors.blueLight, emoji: '👩‍⚕️' }
        return {
          id: d.id,
          nome: (data.nome as string) ?? '',
          especialidade: esp,
          registro: (data.conselho as string) ?? '',
          emoji: cores.emoji,
          cor: cores.cor,
          corFundo: cores.corFundo,
          avaliacao: (data.avaliacao as number) ?? 0,
          modalidades: (data.modalidades as string[]) ?? [],
          valor: data.valorConsulta ? `R$ ${data.valorConsulta},00` : undefined,
          bio: (data.bio as string) ?? '',
        }
      })

      setEspecialistas(lista)

      // Carrega favoritos salvos localmente
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      setFavoritoIds(raw ? JSON.parse(raw) : [])
    } catch (e) {
      console.warn('Erro ao carregar especialistas:', e)
      setEspecialistas([])
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleFavorito = async (id: string) => {
    try {
      const atuais = [...favoritoIds]
      const idx = atuais.indexOf(id)
      let novos: string[]
      if (idx >= 0) {
        novos = atuais.filter(x => x !== id)
        Alert.alert('Removido', 'Especialista removido dos favoritos.')
      } else {
        novos = [...atuais, id]
        Alert.alert('Salvo! 💾', 'Especialista salvo nos seus favoritos.')
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novos))
      setFavoritoIds(novos)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.')
    }
  }

  const limparTodos = () => {
    Alert.alert('Limpar favoritos', 'Remover todos os especialistas salvos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY)
          setFavoritoIds([])
        },
      },
    ])
  }

  const lista = aba === 'salvos'
    ? especialistas.filter(e => favoritoIds.includes(e.id))
    : especialistas

  const renderItem = ({ item }: { item: Especialista }) => {
    const salvo = favoritoIds.includes(item.id)
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PerfilEspecialista', { profissional: item })}
        activeOpacity={0.85}
      >
        <View style={[styles.cardIcone, { backgroundColor: item.corFundo }]}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <Text style={styles.cardEsp}>{item.especialidade}</Text>
          {item.bio ? (
            <Text style={styles.cardBio} numberOfLines={2}>{item.bio}</Text>
          ) : null}
          <View style={styles.cardMeta}>
            {item.avaliacao && item.avaliacao > 0 ? (
              <Text style={styles.cardAvaliacao}>⭐ {item.avaliacao.toFixed(1)}</Text>
            ) : null}
            {item.valor ? (
              <Text style={styles.cardValor}>{item.valor}</Text>
            ) : null}
          </View>
          {item.modalidades.length > 0 && (
            <View style={styles.cardModalidades}>
              {item.modalidades.map(m => (
                <View key={m} style={[styles.modalTag, { backgroundColor: item.corFundo }]}>
                  <Text style={[styles.modalTagTxt, { color: item.cor }]}>{m}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.favBtn, salvo && { backgroundColor: colors.dangerBg }]}
          onPress={() => toggleFavorito(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.favBtnEmoji}>{salvo ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitulo}>Especialistas</Text>
            <Text style={styles.headerSub}>
              {favoritoIds.length} salvo{favoritoIds.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {favoritoIds.length > 0 && (
            <TouchableOpacity onPress={limparTodos} style={styles.limparBtn}>
              <Text style={styles.limparTxt}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.abas}>
          <TouchableOpacity style={[styles.aba, aba === 'todos' && styles.abaAtiva]} onPress={() => setAba('todos')}>
            <Text style={[styles.abaTxt, aba === 'todos' && styles.abaTxtAtivo]}>Todos ({especialistas.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.aba, aba === 'salvos' && styles.abaAtiva]} onPress={() => setAba('salvos')}>
            <Text style={[styles.abaTxt, aba === 'salvos' && styles.abaTxtAtivo]}>Salvos ({favoritoIds.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5B9BD5" />
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioEmoji}>{aba === 'salvos' ? '🤍' : '👩‍⚕️'}</Text>
          <Text style={styles.vazioTitulo}>
            {aba === 'salvos' ? 'Nenhum favorito salvo' : 'Nenhum especialista cadastrado'}
          </Text>
          <Text style={styles.vazioSub}>
            {aba === 'salvos'
              ? 'Toque no coração de um especialista para salvar'
              : 'Os profissionais aparecerão aqui após o cadastro'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.blue, paddingHorizontal: 18, paddingBottom: 12,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  limparBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  limparTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  abas: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 3, gap: 2 },
  aba: { flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  abaAtiva: { backgroundColor: '#fff' },
  abaTxt: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  abaTxtAtivo: { color: colors.blue },
  lista: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 14, flexDirection: 'row', gap: 12,
  },
  cardIcone: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardEmoji: { fontSize: 22 },
  cardInfo: { flex: 1, gap: 3 },
  cardNome: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardEsp: { fontSize: 12, color: colors.textSecondary },
  cardBio: { fontSize: 12, color: '#7A8594', lineHeight: 17, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cardAvaliacao: { fontSize: 12, fontWeight: '600', color: '#E8A838' },
  cardValor: { fontSize: 12, fontWeight: '600', color: '#3D9970' },
  cardModalidades: { flexDirection: 'row', gap: 6, marginTop: 4 },
  modalTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  modalTagTxt: { fontSize: 11, fontWeight: '600' },
  favBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgMain, alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' },
  favBtnEmoji: { fontSize: 18 },
  vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  vazioEmoji: { fontSize: 48 },
  vazioTitulo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  vazioSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
})
