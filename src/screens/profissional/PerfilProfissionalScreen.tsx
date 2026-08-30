import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { colors, typo, space, radius, rs } from '../../theme'

type Props = {
  navigation: NativeStackNavigationProp<any>
}

export default function PerfilProfissionalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { user, buscarDadosPerfil } = useAuth()

  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<Record<string, any>>({})
  const [totalConsultas, setTotalConsultas] = useState(0)

  useEffect(() => { carregarDados() }, [user])

  const carregarDados = async () => {
    if (!user) return
    setLoading(true)
    try {
      const perfil = await buscarDadosPerfil()
      setDados(perfil ?? {})

      const nome = (perfil?.nome as string) ?? ''
      if (nome) {
        const q = query(collection(db, 'consultas'), where('profissional', '==', nome))
        const snap = await getDocs(q)
        setTotalConsultas(snap.size)
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil profissional:', e)
    } finally {
      setLoading(false)
    }
  }

  const nome = (dados.nome as string) ?? user?.email?.split('@')[0] ?? 'Profissional'
  const especialidade = (dados.especialidade as string) ?? ''
  const conselho = (dados.conselho as string) ?? ''
  const anosExperiencia = (dados.anosExperiencia as string) ?? ''
  const bio = (dados.bio as string) ?? ''
  const avaliacao = (dados.avaliacao as number) ?? 0
  const totalAvaliacoes = (dados.totalAvaliacoes as number) ?? 0
  const modalidades = (dados.modalidades as string[]) ?? []

  // Emoji baseado na especialidade
  const emojiEsp: Record<string, string> = {
    'Psicologia': '🧠', 'Fonoaudiologia': '🗣️', 'Fisioterapia': '🏃',
    'Ter. Ocupacional': '✋', 'Nutrição': '🥗', 'Musicoterapia': '🎵',
    'Psicopedagogia': '📖', 'Educação Física': '⚽', 'Neuropsicologia': '🔬', 'Psicomotricidade': '🤸',
  }
  const emoji = emojiEsp[especialidade] ?? '👩‍⚕️'

  const tags = especialidade
    ? [especialidade, ...(dados.areas as string[] ?? [])]
    : []

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.purpleDark} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.profRow}>
          <View style={styles.profIcone}>
            <Text style={styles.profEmoji}>{emoji}</Text>
          </View>
          <View style={styles.profInfo}>
            <Text style={styles.profNome}>{nome}</Text>
            <Text style={styles.profRegistro}>
              {conselho}{anosExperiencia ? ` · ${anosExperiencia} anos de exp.` : ''}
            </Text>
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.slice(0, 3).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagTexto}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{avaliacao > 0 ? avaliacao.toFixed(1) : '—'}</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
            <Text style={styles.statSub}>{avaliacao > 0 ? '★★★★★' : 'sem avaliações'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{totalConsultas}</Text>
            <Text style={styles.statLabel}>Consultas</Text>
            <Text style={styles.statSub}>realizadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumero}>{totalAvaliacoes}</Text>
            <Text style={styles.statLabel}>Avaliações</Text>
            <Text style={styles.statSub}>de pacientes</Text>
          </View>
        </View>

        {bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>SOBRE MIM</Text>
            <Text style={styles.bioTexto}>{bio}</Text>
          </View>
        ) : null}

        {modalidades.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>MODALIDADES</Text>
            <View style={styles.modalidadesRow}>
              {modalidades.map(m => (
                <View key={m} style={styles.modalBadge}>
                  <Text style={styles.modalBadgeTxt}>
                    {m === 'Online' ? '💻 ' : m === 'Presencial' ? '📍 ' : '👥 '}{m}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>CONFIGURAÇÕES</Text>
          {[
            { emoji: '✏️', label: 'Editar perfil', tela: 'ConfiguracoesProfissional' },
            { emoji: '🕐', label: 'Gerenciar disponibilidade', tela: 'ConfiguracoesProfissional' },
            { emoji: '💰', label: 'Configurar valores', tela: 'ConfiguracoesProfissional' },
            { emoji: '📊', label: 'Ver relatórios', tela: 'Relatorios' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.acaoItem}
              onPress={() => navigation.navigate(item.tela)}
            >
              <Text style={styles.acaoEmoji}>{item.emoji}</Text>
              <Text style={styles.acaoLabel}>{item.label}</Text>
              <Text style={styles.acaoSeta}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    backgroundColor: colors.purpleDark,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  profRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  profIcone: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  profEmoji: { fontSize: 36 },
  profInfo: { flex: 1, gap: 4 },
  profNome: { fontSize: 20, fontWeight: '700', color: colors.bgCard },
  profRegistro: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagTexto: { fontSize: 12, fontWeight: '600', color: colors.bgCard },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, alignItems: 'center', gap: 2,
  },
  statNumero: { fontSize: 22, fontWeight: '700', color: colors.purpleDark },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  statSub: { fontSize: 11, color: '#F5A623' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12,
  },
  cardTitulo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  bioTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  modalidadesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalBadge: {
    backgroundColor: colors.purpleLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  modalBadgeTxt: { fontSize: 12, fontWeight: '600', color: colors.purpleDark },
  acaoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  acaoEmoji: { fontSize: 18 },
  acaoLabel: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  acaoSeta: { fontSize: 20, color: colors.textMuted },
})
