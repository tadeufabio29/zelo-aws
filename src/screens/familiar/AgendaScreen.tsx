import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { colors, typo, space, radius, rs } from '../../theme'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

type Consulta = {
  id: string
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

function gerarDiasDoMes(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const dias: (number | null)[] = Array(primeiroDia).fill(null)
  for (let i = 1; i <= totalDias; i++) dias.push(i)
  return dias
}

export default function AgendaScreen() {
  const navigation = useNavigation() as any
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate())
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregarConsultas() }, [user])

  const carregarConsultas = async () => {
    if (!user) return
    setLoading(true)
    try {
      const q = query(collection(db, 'consultas'), where('userId', '==', user.uid))
      const snap = await getDocs(q)
      const lista: Consulta[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Consulta, 'id'>) }))
      setConsultas(lista)
    } catch (e) {
      console.warn('Erro ao carregar consultas:', e)
    } finally {
      setLoading(false)
    }
  }

  const dias = gerarDiasDoMes(ano, mes)

  const consultasDoDia = consultas.filter(c => {
    const d = new Date(c.data + 'T00:00:00')
    return d.getDate() === diaSelecionado && d.getMonth() === mes && d.getFullYear() === ano
  })

  const diasComConsulta = new Set(
    consultas
      .filter(c => {
        const d = new Date(c.data + 'T00:00:00')
        return d.getMonth() === mes && d.getFullYear() === ano
      })
      .map(c => new Date(c.data + 'T00:00:00').getDate())
  )

  const proximasConsultas = consultas
    .filter(c => new Date(`${c.data}T${c.hora}`) > new Date())
    .sort((a, b) => new Date(`${a.data}T${a.hora}`).getTime() - new Date(`${b.data}T${b.hora}`).getTime())
    .slice(0, 3)

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1)
    setDiaSelecionado(1)
  }

  const proximoMes = () => {
    if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1)
    setDiaSelecionado(1)
  }

  const abrirChamada = (c: Consulta) => {
    if (c.canalAgora && c.modalidade !== 'Presencial') {
      navigation.navigate('VideoCall', {
        canal: c.canalAgora,
        nomeOutro: c.profissional,
        isProfissional: false,
      })
    }
  }

  const corModalidade = (modalidade: string) => {
    if (modalidade === 'Videochamada') return { cor: colors.blue, fundo: colors.blueLight }
    if (modalidade === 'Grupo quinzenal') return { cor: colors.purpleDark, fundo: colors.purpleLight }
    return { cor: colors.success, fundo: colors.successBg }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Agenda</Text>
        <Text style={styles.headerSubtitulo}>Suas consultas agendadas</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.calendarioCard}>
            <View style={styles.mesNav}>
              <TouchableOpacity onPress={mesAnterior} style={styles.mesBtn}>
                <Text style={styles.mesBtnTexto}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.mesTitulo}>{MESES[mes]} {ano}</Text>
              <TouchableOpacity onPress={proximoMes} style={styles.mesBtn}>
                <Text style={styles.mesBtnTexto}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.semanaRow}>
              {DIAS_SEMANA.map(d => (
                <Text key={d} style={styles.semanaTexto}>{d}</Text>
              ))}
            </View>

            <View style={styles.diasGrid}>
              {dias.map((dia, index) => {
                if (!dia) return <View key={`e-${index}`} style={styles.diaCell} />
                const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
                const isSel = dia === diaSelecionado
                const temConsulta = diasComConsulta.has(dia)
                return (
                  <TouchableOpacity
                    key={`d-${dia}`}
                    style={[styles.diaCell, isSel && styles.diaCellSel, isHoje && !isSel && styles.diaCellHoje]}
                    onPress={() => setDiaSelecionado(dia)}
                  >
                    <Text style={[styles.diaTxt, isSel && styles.diaTxtSel, isHoje && !isSel && styles.diaTxtHoje]}>
                      {dia}
                    </Text>
                    {temConsulta && <View style={[styles.dot, isSel && styles.dotBranco]} />}
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={styles.secaoHeader}>
            <Text style={styles.secaoTitulo}>
              {diaSelecionado === hoje.getDate() && mes === hoje.getMonth() ? 'Hoje' : `${diaSelecionado} de ${MESES[mes]}`}
            </Text>
            <Text style={styles.secaoQtd}>
              {consultasDoDia.length > 0 ? `${consultasDoDia.length} consulta${consultasDoDia.length > 1 ? 's' : ''}` : 'Nenhuma'}
            </Text>
          </View>

          {consultasDoDia.length === 0 ? (
            <View style={styles.vazioCard}>
              <Text style={styles.vazioEmoji}>📅</Text>
              <Text style={styles.vazioTxt}>Nenhuma consulta neste dia</Text>
              <Text style={styles.vazioSub}>Toque em um dia marcado para ver suas consultas</Text>
            </View>
          ) : (
            consultasDoDia.map(c => {
              const { cor, fundo } = corModalidade(c.modalidade)
              return (
                <View key={c.id} style={styles.consultaCard}>
                  <View style={[styles.consultaIcone, { backgroundColor: fundo }]}>
                    <Text style={styles.consultaEmoji}>{c.emoji ?? '🧠'}</Text>
                  </View>
                  <View style={styles.consultaInfo}>
                    <Text style={styles.consultaNome}>{c.profissional}</Text>
                    <Text style={styles.consultaEsp}>{c.especialidade}</Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.horaBadge, { backgroundColor: fundo }]}>
                        <Text style={[styles.horaTexto, { color: cor }]}>🕐 {c.hora}</Text>
                      </View>
                      <View style={[styles.modalBadge, { backgroundColor: fundo }]}>
                        <Text style={[styles.modalTexto, { color: cor }]}>
                          {c.modalidade === 'Videochamada' ? '💻' : c.modalidade === 'Grupo quinzenal' ? '👥' : '📍'} {c.modalidade}
                        </Text>
                      </View>
                    </View>
                    {c.canalAgora && c.modalidade !== 'Presencial' && (
                      <TouchableOpacity style={[styles.entrarBtn, { backgroundColor: cor }]} onPress={() => abrirChamada(c)}>
                        <Text style={styles.entrarBtnTxt}>🎥 Entrar na chamada</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })
          )}

          {proximasConsultas.length > 0 && (
            <>
              <Text style={[styles.secaoTitulo, { marginTop: 8 }]}>Próximas consultas</Text>
              {proximasConsultas.map(c => {
                const { cor, fundo } = corModalidade(c.modalidade)
                const d = new Date(c.data + 'T00:00:00')
                return (
                  <View key={`p-${c.id}`} style={[styles.consultaCard, { opacity: 0.9 }]}>
                    <View style={styles.proximaDataCol}>
                      <Text style={styles.proximaDia}>{d.getDate()}</Text>
                      <Text style={styles.proximaMes}>{MESES[d.getMonth()].slice(0, 3)}</Text>
                    </View>
                    <View style={styles.dividerV} />
                    <View style={[styles.consultaIcone, { backgroundColor: fundo }]}>
                      <Text style={styles.consultaEmoji}>{c.emoji ?? '🧠'}</Text>
                    </View>
                    <View style={styles.consultaInfo}>
                      <Text style={styles.consultaNome}>{c.profissional}</Text>
                      <Text style={styles.consultaEsp}>{c.especialidade} · {c.hora}</Text>
                      <View style={[styles.modalBadge, { backgroundColor: fundo, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.modalTexto, { color: cor }]}>
                          {c.modalidade === 'Videochamada' ? '💻' : c.modalidade === 'Grupo quinzenal' ? '👥' : '📍'} {c.modalidade}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </>
          )}

        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.blue, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 24, fontWeight: '700', color: colors.bgCard, marginBottom: 4 },
  headerSubtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 12 },
  calendarioCard: {
    backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, gap: 6,
  },
  mesNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  mesBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.bgMain, alignItems: 'center', justifyContent: 'center' },
  mesBtnTexto: { fontSize: 20, color: colors.blue, fontWeight: '600' },
  mesTitulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  semanaRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  semanaTexto: { fontSize: 11, fontWeight: '600', color: colors.textMuted, width: `${100/7}%` as any, textAlign: 'center' },
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  diaCell: { width: `${100/7}%` as any, height: 32, alignItems: 'center', justifyContent: 'center', gap: 2 },
  diaCellSel: { backgroundColor: colors.blue, borderRadius: 8 },
  diaCellHoje: { backgroundColor: colors.blueLight, borderRadius: 8 },
  diaTxt: { fontSize: 12, fontWeight: '500', color: colors.textPrimary },
  diaTxtSel: { color: colors.bgCard, fontWeight: '700' },
  diaTxtHoje: { color: colors.blue, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.blue },
  dotBranco: { backgroundColor: colors.bgCard },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  secaoQtd: { fontSize: 12, color: colors.textSecondary },
  vazioCard: {
    backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 24, alignItems: 'center', gap: 6,
  },
  vazioEmoji: { fontSize: 32 },
  vazioTxt: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  vazioSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  consultaCard: {
    backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  consultaIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  consultaEmoji: { fontSize: 20 },
  consultaInfo: { flex: 1, gap: 4 },
  consultaNome: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  consultaEsp: { fontSize: 12, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  horaBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  horaTexto: { fontSize: 11, fontWeight: '600' },
  modalBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  modalTexto: { fontSize: 11, fontWeight: '600' },
  entrarBtn: { marginTop: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  entrarBtnTxt: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  proximaDataCol: { alignItems: 'center', width: 32 },
  proximaDia: { fontSize: 16, fontWeight: '700', color: colors.blue },
  proximaMes: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dividerV: { width: 1, alignSelf: 'stretch', backgroundColor: '#F0F2F5' },
})
