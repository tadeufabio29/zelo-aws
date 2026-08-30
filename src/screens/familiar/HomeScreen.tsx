import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { colors, typo, space, radius, rs } from '../../theme'

type Consulta = {
  id: string; profissional: string; especialidade: string
  data: string; hora: string; modalidade: string; emoji: string
  canalAgora?: string
}

const ESPECIALIDADES = [
  { emoji: '🧠', cor: '#F0EBF8', label: 'Psicologia',       tela: 'Favoritos' },
  { emoji: '🗣️', cor: '#EAF3FB', label: 'Fonoaudiologia',   tela: 'Favoritos' },
  { emoji: '🏃', cor: '#EEF7E4', label: 'Fisioterapia',      tela: 'Favoritos' },
  { emoji: '✋', cor: '#FEF3C7', label: 'Ter. Ocupacional',  tela: 'Favoritos' },
  { emoji: '🥗', cor: '#FDE8E8', label: 'Nutrição',          tela: 'Favoritos' },
  { emoji: '🎵', cor: '#F0EBF8', label: 'Musicoterapia',     tela: 'Favoritos' },
  { emoji: '📖', cor: '#EAF3FB', label: 'Psicopedagogia',    tela: 'Favoritos' },
  { emoji: '⚽', cor: '#EEF7E4', label: 'Educação Física',   tela: 'Favoritos' },
  { emoji: '🔬', cor: '#FDE8E8', label: 'Neuropsicologia',   tela: 'Favoritos' },
  { emoji: '🤸', cor: '#FEF3C7', label: 'Psicomotricidade',  tela: 'Favoritos' },
]

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user, buscarDadosPerfil } = useAuth()
  const navigation = useNavigation() as any

  const [nomeUsuario, setNomeUsuario]               = useState('')
  const [nomeFilho, setNomeFilho]                   = useState('')
  const [consultasAgendadas, setConsultasAgendadas] = useState<Consulta[]>([])
  const [proximaConsulta, setProximaConsulta]       = useState<Consulta | null>(null)
  const [artigosSalvos, setArtigosSalvos]           = useState(0)
  const [loading, setLoading]                       = useState(true)

  useEffect(() => { carregarDados() }, [user])

  const carregarDados = async () => {
    if (!user) return
    setLoading(true)
    try {
      const dados = await buscarDadosPerfil()
      if (dados) {
        setNomeUsuario(((dados.nome as string) ?? '').split(' ')[0])
        setNomeFilho((dados.nomeFilho as string) ?? '')
      }
      const q = query(collection(db, 'consultas'), where('userId', '==', user.uid))
      const snap = await getDocs(q)
      const lista: Consulta[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Consulta, 'id'>) }))
      setConsultasAgendadas(lista)
      const hoje = new Date()
      const futuras = lista
        .filter(c => new Date(`${c.data}T${c.hora}`) >= hoje)
        .sort((a, b) => new Date(`${a.data}T${a.hora}`).getTime() - new Date(`${b.data}T${b.hora}`).getTime())
      setProximaConsulta(futuras[0] ?? null)
      const qa = query(collection(db, 'artigosSalvos'), where('userId', '==', user.uid))
      const snapA = await getDocs(qa)
      setArtigosSalvos(snapA.size)
    } catch (e) {
      console.warn('Erro ao carregar dados da Home:', e)
    } finally {
      setLoading(false)
    }
  }

  const saudacao = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const iniciais = nomeUsuario
    ? nomeUsuario.charAt(0).toUpperCase()
    : (user?.email?.charAt(0).toUpperCase() ?? '?')

  const resumoCards = [
    { emoji: '📅', cor: colors.blueLight,   numero: String(consultasAgendadas.length), label: 'Consultas',       tela: 'Agenda' },
    { emoji: '🌱', cor: colors.successBg,   numero: '2',                               label: 'Grupos',          tela: 'Agenda' },
    { emoji: '📚', cor: colors.warningBg,   numero: String(artigosSalvos),             label: 'Artigos salvos',  tela: 'Feed' },
    { emoji: '👩‍⚕️', cor: colors.purpleLight, numero: '5',                               label: 'Especialistas',   tela: 'Favoritos' },
  ]

  const formatarData = (c: Consulta) => {
    const d = new Date(`${c.data}T${c.hora}`)
    const hoje = new Date()
    const amanha = new Date(); amanha.setDate(hoje.getDate() + 1)
    if (d.toDateString() === hoje.toDateString())   return `Hoje · ${c.hora}`
    if (d.toDateString() === amanha.toDateString()) return `Amanhã · ${c.hora}`
    return `${d.getDate()}/${d.getMonth() + 1} · ${c.hora}`
  }

  const abrirConsulta = (c: Consulta) => {
    if (c.canalAgora && c.modalidade !== 'Presencial') {
      navigation.navigate('VideoCall', {
        canal: c.canalAgora,
        nomeOutro: c.profissional,
        isProfissional: false,
      })
    } else {
      navigation.navigate('Agenda')
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerGreeting}>
              {saudacao()}{nomeFilho ? `, família de ${nomeFilho}` : ''}
            </Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {nomeUsuario || user?.email?.split('@')[0] || 'Bem-vindo'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={styles.avatarText}>{iniciais}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Favoritos')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Buscar especialistas e serviços...</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.resumoGrid}>
            {resumoCards.map(card => (
              <TouchableOpacity
                key={card.label}
                style={styles.resumoCard}
                onPress={() => navigation.navigate(card.tela)}
              >
                <View style={[styles.resumoIcon, { backgroundColor: card.cor }]}>
                  <Text style={styles.resumoEmoji}>{card.emoji}</Text>
                </View>
                <Text style={styles.resumoNumero}>{card.numero}</Text>
                <Text style={styles.resumoLabel}>{card.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Próxima consulta</Text>
          {proximaConsulta ? (
            <TouchableOpacity style={styles.consultaCard} onPress={() => abrirConsulta(proximaConsulta)}>
              <View style={styles.consultaAvatar}>
                <Text style={styles.consultaEmoji}>{proximaConsulta.emoji ?? '🧠'}</Text>
              </View>
              <View style={styles.consultaInfo}>
                <Text style={styles.consultaNome}>{proximaConsulta.profissional}</Text>
                <Text style={styles.consultaDetalhe}>
                  {formatarData(proximaConsulta)} · {proximaConsulta.modalidade}
                </Text>
              </View>
              <View style={styles.consultaBadge}>
                <Text style={styles.consultaBadgeText}>
                  {new Date(`${proximaConsulta.data}T${proximaConsulta.hora}`).toDateString() === new Date().toDateString()
                    ? 'Hoje' : 'Agendada'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.consultaVazia} onPress={() => navigation.navigate('Favoritos')}>
              <Text style={styles.consultaVaziaEmoji}>📅</Text>
              <Text style={styles.consultaVaziaTxt}>Nenhuma consulta agendada</Text>
              <Text style={[styles.consultaVaziaTxt, { color: colors.blue, marginTop: 4 }]}>Agendar agora →</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Especialidades disponíveis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.espContent}>
            {ESPECIALIDADES.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.espCard}
                onPress={() => navigation.navigate('Favoritos')}
              >
                <View style={[styles.espIcon, { backgroundColor: item.cor }]}>
                  <Text style={styles.espEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.espLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.blue, paddingHorizontal: space.lg, paddingBottom: space.lg,
    borderBottomLeftRadius: rs(20, 24, 28), borderBottomRightRadius: rs(20, 24, 28), gap: space.md,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting: { fontSize: typo.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  headerName: { fontSize: typo.lg, fontWeight: '700', color: colors.white },
  avatar: {
    width: rs(36, 40, 44), height: rs(36, 40, 44), borderRadius: radius.full,
    backgroundColor: colors.purple, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center', marginLeft: space.sm,
  },
  avatarText: { fontSize: typo.sm, fontWeight: '700', color: colors.white },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md, height: rs(36, 38, 42), paddingHorizontal: space.md, gap: space.sm,
  },
  searchIcon: { fontSize: 13 },
  searchText: { fontSize: typo.xs, color: 'rgba(255,255,255,0.65)' },
  scroll: { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: rs(24, 28, 32), gap: space.sm },
  sectionTitle: { fontSize: typo.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: space.sm },
  resumoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  resumoCard: {
    width: '48%', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: space.md, gap: space.xs, minHeight: rs(95, 105, 115), justifyContent: 'space-between',
  },
  resumoIcon: { width: rs(28, 32, 36), height: rs(28, 32, 36), borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  resumoEmoji: { fontSize: rs(14, 16, 18) },
  resumoNumero: { fontSize: rs(20, 22, 24), fontWeight: '700', color: colors.textPrimary },
  resumoLabel: { fontSize: typo.xs, color: colors.textSecondary, lineHeight: 15 },
  consultaCard: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, height: rs(64, 70, 76), flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: space.md, gap: space.md,
  },
  consultaAvatar: { width: rs(38, 42, 46), height: rs(38, 42, 46), borderRadius: radius.md, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  consultaEmoji: { fontSize: rs(16, 18, 20) },
  consultaInfo: { flex: 1 },
  consultaNome: { fontSize: typo.xs, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  consultaDetalhe: { fontSize: typo.xs, color: colors.textSecondary },
  consultaBadge: { backgroundColor: colors.successBg, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 3 },
  consultaBadgeText: { fontSize: typo.xs, fontWeight: '700', color: colors.success },
  consultaVazia: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: space.xl, alignItems: 'center', gap: space.sm,
  },
  consultaVaziaEmoji: { fontSize: rs(24, 28, 32) },
  consultaVaziaTxt: { fontSize: typo.xs, color: colors.textMuted },
  espContent: { gap: space.sm, paddingBottom: 4 },
  espCard: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, width: rs(68, 74, 82), height: rs(62, 68, 74),
    alignItems: 'center', justifyContent: 'center', gap: space.xs,
  },
  espIcon: { width: rs(28, 30, 34), height: rs(28, 30, 34), borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  espEmoji: { fontSize: rs(13, 15, 17) },
  espLabel: { fontSize: rs(9, 10, 11), fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
})
