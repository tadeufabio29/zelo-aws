import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { colors, typo, space, radius, rs } from '../../theme'

const STATUS_OPCOES = [
  'Disponível para novos agendamentos',
  'Agenda cheia por enquanto',
  'Ausente temporariamente',
]

type Consulta = {
  id: string
  userId: string
  profissional: string
  especialidade: string
  emoji: string
  data: string
  hora: string
  modalidade: string
  valor: string
  canalAgora?: string
  status: string
}

export default function HomeProfissionalScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation() as any
  const { user, buscarDadosPerfil } = useAuth()

  const [nomeProfissional, setNomeProfissional] = useState('')
  const [iniciaisProf, setIniciaisProf] = useState('P')
  const [statusAtual, setStatusAtual] = useState(STATUS_OPCOES[0])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregarDados() }, [user])

  const carregarDados = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const dados = await buscarDadosPerfil()
      const nome = (dados?.nome as string) ?? ''
      setNomeProfissional(nome)
      const partes = nome.trim().split(' ')
      const iniciais = partes.length >= 2
        ? partes[0][0] + partes[partes.length - 1][0]
        : nome.slice(0, 2)
      setIniciaisProf(iniciais.toUpperCase())

      const q = query(collection(db, 'consultas'), where('profissional', '==', nome))
      const snap = await getDocs(q)
      const lista: Consulta[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Consulta, 'id'>) }))
      setConsultas(lista)
    } catch (e) {
      console.warn('Erro ao carregar HomeProfissional:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]

  const consultasHoje = consultas.filter(c => c.data === hojeStr)
  const consultasFuturas = consultas.filter(c => new Date(`${c.data}T${c.hora}`) > hoje)
  const consultasPassadas = consultas.filter(c => new Date(`${c.data}T${c.hora}`) <= hoje)

  // Faturamento: soma das consultas passadas (exceto gratuitas)
  const faturamentoTotal = consultasPassadas.reduce((acc, c) => {
    const valor = parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    return acc + valor
  }, 0)

  const resumo = [
    { emoji: '📅', numero: String(consultasHoje.length), label: 'Hoje' },
    { emoji: '⏳', numero: String(consultasFuturas.length), label: 'Futuras' },
    { emoji: '✅', numero: String(consultasPassadas.length), label: 'Realizadas' },
  ]

  const faturamento = [
    { label: 'Consultas realizadas', valor: `${consultasPassadas.length} sessões`, destaque: false },
    { label: 'Valor total estimado', valor: `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`, destaque: true },
    { label: 'Próximas consultas', valor: `${consultasFuturas.length} agendadas`, destaque: false },
  ]

  const handleAlterarStatus = () => {
    Alert.alert('Alterar status', 'Selecione seu status de disponibilidade:', [
      ...STATUS_OPCOES.map(s => ({ text: s, onPress: () => setStatusAtual(s) })),
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const iniciarChamada = (c: Consulta) => {
    if (!c.canalAgora) return
    navigation.navigate('VideoCall', {
      canal: c.canalAgora,
      nomeOutro: 'Paciente',
      isProfissional: true,
    })
  }

  const corModalidade = (modalidade: string) => {
    if (modalidade === 'Videochamada') return { cor: colors.blueDark, fundo: colors.blueLight }
    if (modalidade === 'Grupo quinzenal') return { cor: colors.warning, fundo: colors.warningBg }
    return { cor: colors.success, fundo: colors.successBg }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSub}>Bem-vindo(a) de volta</Text>
            <Text style={styles.headerNome} numberOfLines={1}>{nomeProfissional || user?.email?.split('@')[0] || 'Profissional'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('PerfilProfissional')}>
            <Text style={styles.avatarTexto}>{iniciaisProf}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.statusBar} onPress={handleAlterarStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusTexto} numberOfLines={1}>{statusAtual}</Text>
          <View style={styles.alterarBtn}>
            <Text style={styles.alterarTexto}>Alterar</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.purpleDark} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.secaoTitulo}>Resumo</Text>
          <View style={styles.resumoRow}>
            {resumo.map(item => (
              <View key={item.label} style={styles.resumoCard}>
                <Text style={styles.resumoEmoji}>{item.emoji}</Text>
                <Text style={styles.resumoNumero}>{item.numero}</Text>
                <Text style={styles.resumoLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.secaoTitulo}>Agenda de hoje</Text>
          {consultasHoje.length === 0 ? (
            <View style={styles.vazioCard}>
              <Text style={styles.vazioEmoji}>📭</Text>
              <Text style={styles.vazioTexto}>Nenhuma consulta hoje</Text>
            </View>
          ) : (
            <View style={styles.listaCard}>
              {consultasHoje
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((item, i) => {
                  const { cor, fundo } = corModalidade(item.modalidade)
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.agendaItem, i < consultasHoje.length - 1 && styles.separador]}
                      onPress={() => navigation.navigate('Agenda')}
                    >
                      <Text style={styles.agendaHora}>{item.hora}</Text>
                      <View style={[styles.agendaIcone, { backgroundColor: fundo }]}>
                        <Text style={styles.agendaEmoji}>{item.emoji ?? '🧒'}</Text>
                      </View>
                      <View style={styles.agendaInfo}>
                        <Text style={styles.agendaNome} numberOfLines={1}>{item.especialidade}</Text>
                        <Text style={styles.agendaDetalhe}>{item.modalidade} · {item.valor}</Text>
                        {item.canalAgora && item.modalidade !== 'Presencial' && (
                          <TouchableOpacity
                            style={[styles.iniciarBtn, { backgroundColor: cor }]}
                            onPress={() => iniciarChamada(item)}
                          >
                            <Text style={styles.iniciarBtnTxt}>🎥 Iniciar chamada</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={[styles.tipoBadge, { backgroundColor: fundo }]}>
                        <Text style={[styles.tipoTexto, { color: cor }]}>{item.modalidade}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
            </View>
          )}

          {consultasFuturas.length > 0 && (
            <>
              <Text style={styles.secaoTitulo}>Próximas consultas</Text>
              <View style={styles.listaCard}>
                {consultasFuturas
                  .sort((a, b) => new Date(`${a.data}T${a.hora}`).getTime() - new Date(`${b.data}T${b.hora}`).getTime())
                  .slice(0, 3)
                  .map((item, i) => {
                    const { cor, fundo } = corModalidade(item.modalidade)
                    const d = new Date(item.data + 'T00:00:00')
                    return (
                      <View key={item.id} style={[styles.agendaItem, i < Math.min(consultasFuturas.length, 3) - 1 && styles.separador]}>
                        <Text style={styles.agendaHora}>{`${d.getDate()}/${d.getMonth() + 1}`}</Text>
                        <View style={[styles.agendaIcone, { backgroundColor: fundo }]}>
                          <Text style={styles.agendaEmoji}>{item.emoji ?? '🧒'}</Text>
                        </View>
                        <View style={styles.agendaInfo}>
                          <Text style={styles.agendaNome} numberOfLines={1}>{item.especialidade}</Text>
                          <Text style={styles.agendaDetalhe}>{item.hora} · {item.modalidade}</Text>
                        </View>
                        <View style={[styles.tipoBadge, { backgroundColor: fundo }]}>
                          <Text style={[styles.tipoTexto, { color: cor }]}>{item.modalidade}</Text>
                        </View>
                      </View>
                    )
                  })}
              </View>
            </>
          )}

          <Text style={styles.secaoTitulo}>Faturamento</Text>
          <TouchableOpacity style={styles.listaCard} onPress={() => navigation.navigate('Relatorios')}>
            {faturamento.map((item, i) => (
              <View key={i} style={[styles.faturamentoItem, i < faturamento.length - 1 && styles.separador]}>
                <Text style={styles.faturamentoLabel}>{item.label}</Text>
                <Text style={[styles.faturamentoValor, item.destaque && styles.faturamentoDestaque]}>
                  {item.valor}
                </Text>
              </View>
            ))}
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.purpleDark,
    paddingHorizontal: space.lg, paddingBottom: space.lg,
    borderBottomLeftRadius: rs(20, 24, 28), borderBottomRightRadius: rs(20, 24, 28),
    gap: space.md,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSub: { fontSize: typo.xs, color: 'rgba(255,255,255,0.75)', marginBottom: 3 },
  headerNome: { fontSize: typo.xl, fontWeight: '700', color: colors.white },
  avatar: {
    width: rs(40, 44, 48), height: rs(40, 44, 48), borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center', marginLeft: space.sm,
  },
  avatarTexto: { fontSize: typo.sm, fontWeight: '700', color: colors.white },
  statusBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: space.sm, gap: space.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', flexShrink: 0 },
  statusTexto: { flex: 1, fontSize: typo.xs, color: 'rgba(255,255,255,0.9)' },
  alterarBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 4 },
  alterarTexto: { fontSize: typo.xs, fontWeight: '600', color: colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: rs(28, 32, 40), gap: space.sm },
  secaoTitulo: { fontSize: typo.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: space.sm },
  resumoRow: { flexDirection: 'row', gap: space.sm },
  resumoCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, alignItems: 'center', gap: space.xs },
  resumoEmoji: { fontSize: rs(20, 22, 24) },
  resumoNumero: { fontSize: rs(22, 24, 26), fontWeight: '700', color: colors.textPrimary },
  resumoLabel: { fontSize: typo.xs, color: colors.textSecondary, textAlign: 'center' },
  vazioCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center', gap: 8 },
  vazioEmoji: { fontSize: 28 },
  vazioTexto: { fontSize: typo.xs, color: colors.textMuted },
  listaCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  separador: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  agendaItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: space.sm, gap: space.sm },
  agendaHora: { fontSize: typo.xs, fontWeight: '600', color: colors.textSecondary, width: rs(38, 42, 46), flexShrink: 0 },
  agendaIcone: { width: rs(34, 38, 42), height: rs(34, 38, 42), borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  agendaEmoji: { fontSize: rs(16, 18, 20) },
  agendaInfo: { flex: 1, minWidth: 0, gap: 2 },
  agendaNome: { fontSize: typo.xs, fontWeight: '700', color: colors.textPrimary },
  agendaDetalhe: { fontSize: typo.xs, color: colors.textSecondary },
  iniciarBtn: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  iniciarBtnTxt: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  tipoBadge: { borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 3, flexShrink: 0 },
  tipoTexto: { fontSize: typo.xs, fontWeight: '700' },
  faturamentoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: space.md },
  faturamentoLabel: { fontSize: typo.sm, color: colors.textSecondary },
  faturamentoValor: { fontSize: typo.sm, fontWeight: '700', color: colors.textPrimary },
  faturamentoDestaque: { color: colors.success },
})
