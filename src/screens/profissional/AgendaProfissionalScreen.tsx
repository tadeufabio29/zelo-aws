import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { colors, typo, space, radius, rs } from '../../theme'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

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

function gerarDiasDoMes(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const dias: (number | null)[] = Array(primeiroDia).fill(null)
  for (let i = 1; i <= totalDias; i++) dias.push(i)
  return dias
}

export default function AgendaProfissionalScreen() {
  const navigation = useNavigation() as any
  const insets = useSafeAreaInsets()
  const { user, buscarDadosPerfil } = useAuth()

  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate())
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [nomeProfissional, setNomeProfissional] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregarDados() }, [user])

  const carregarDados = async () => {
    if (!user) return
    setLoading(true)
    try {
      const dados = await buscarDadosPerfil()
      const nome = (dados?.nome as string) ?? ''
      setNomeProfissional(nome)

      // Busca consultas onde o nome do profissional bate
      const q = query(
        collection(db, 'consultas'),
        where('profissional', '==', nome)
      )
      const snap = await getDocs(q)
      const lista: Consulta[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Consulta, 'id'>) }))
      setConsultas(lista)
    } catch (e) {
      console.warn('Erro ao carregar agenda profissional:', e)
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

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1)
    setDiaSelecionado(1)
  }

  const proximoMes = () => {
    if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1)
    setDiaSelecionado(1)
  }

  const iniciarChamada = (c: Consulta) => {
    if (!c.canalAgora) return
    navigation.navigate('VideoCall', {
      canal: c.canalAgora,
      nomeOutro: `Paciente`,
      isProfissional: true,
    })
  }

  const corModalidade = (modalidade: string) => {
    if (modalidade === 'Videochamada') return { cor: '#2A7ABF', fundo: colors.blueLight }
    if (modalidade === 'Grupo quinzenal') return { cor: colors.purpleDark, fundo: colors.purpleLight }
    return { cor: colors.success, fundo: colors.successBg }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Minha Agenda</Text>
        <Text style={styles.headerSubtitulo}>{MESES[mes]} {ano}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.purpleDark} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
                if (!dia) return <View key={`empty-${index}`} style={styles.diaCell} />
                const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
                const isSelecionado = dia === diaSelecionado
                const temConsulta = diasComConsulta.has(dia)
                return (
                  <TouchableOpacity
                    key={`dia-${dia}`}
                    style={[styles.diaCell, isSelecionado && styles.diaCellSelecionado, isHoje && !isSelecionado && styles.diaCellHoje]}
                    onPress={() => setDiaSelecionado(dia)}
                  >
                    <Text style={[styles.diaCellTexto, isSelecionado && styles.diaCellTextoSelecionado, isHoje && !isSelecionado && styles.diaCellTextoHoje]}>
                      {dia}
                    </Text>
                    {temConsulta && <View style={[styles.consultaDot, isSelecionado && styles.consultaDotBranco]} />}
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
              {consultasDoDia.length > 0 ? `${consultasDoDia.length} consulta${consultasDoDia.length > 1 ? 's' : ''}` : 'Nenhuma consulta'}
            </Text>
          </View>

          {consultasDoDia.length === 0 ? (
            <View style={styles.vazioCard}>
              <Text style={styles.vazioEmoji}>📭</Text>
              <Text style={styles.vazioTexto}>Nenhuma consulta neste dia</Text>
            </View>
          ) : (
            <View style={styles.consultasCard}>
              {consultasDoDia.map((item, i) => {
                const { cor, fundo } = corModalidade(item.modalidade)
                return (
                  <View key={item.id} style={[styles.consultaItem, i < consultasDoDia.length - 1 && styles.consultaItemBorder]}>
                    <Text style={styles.consultaHora}>{item.hora}</Text>
                    <View style={[styles.consultaIcone, { backgroundColor: fundo }]}>
                      <Text style={styles.consultaEmoji}>{item.emoji ?? '🧒'}</Text>
                    </View>
                    <View style={styles.consultaInfo}>
                      <Text style={styles.consultaNome}>{item.especialidade}</Text>
                      <Text style={styles.consultaDetalhe}>{item.modalidade} · {item.valor}</Text>
                      {item.canalAgora && item.modalidade !== 'Presencial' && (
                        <TouchableOpacity style={styles.iniciarBtn} onPress={() => iniciarChamada(item)}>
                          <Text style={styles.iniciarBtnTxt}>🎥 Iniciar chamada</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={[styles.tipoBadge, { backgroundColor: fundo }]}>
                      <Text style={[styles.tipoTexto, { color: cor }]}>{item.modalidade}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
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
    backgroundColor: colors.purpleDark, paddingHorizontal: 20, paddingBottom: 24,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 24, fontWeight: '700', color: colors.bgCard, marginBottom: 4 },
  headerSubtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12 },
  calendarioCard: {
    backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10, gap: 6,
  },
  mesNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  mesBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.bgMain, alignItems: 'center', justifyContent: 'center' },
  mesBtnTexto: { fontSize: 20, color: colors.purpleDark, fontWeight: '600' },
  mesTitulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  semanaRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  semanaTexto: { fontSize: 11, fontWeight: '600', color: colors.textMuted, width: `${100/7}%` as any, textAlign: 'center' },
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  diaCell: { width: `${100/7}%` as any, height: 32, alignItems: 'center', justifyContent: 'center', gap: 2 },
  diaCellSelecionado: { backgroundColor: colors.purpleDark, borderRadius: 8 },
  diaCellHoje: { backgroundColor: colors.purpleLight, borderRadius: 8 },
  diaCellTexto: { fontSize: 12, fontWeight: '500', color: colors.textPrimary },
  diaCellTextoSelecionado: { color: colors.bgCard, fontWeight: '700' },
  diaCellTextoHoje: { color: colors.purpleDark, fontWeight: '700' },
  consultaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.purpleDark },
  consultaDotBranco: { backgroundColor: colors.bgCard },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  secaoQtd: { fontSize: 12, color: colors.textSecondary },
  vazioCard: {
    backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 32, alignItems: 'center', gap: 10,
  },
  vazioEmoji: { fontSize: 32 },
  vazioTexto: { fontSize: 13, color: colors.textMuted },
  consultasCard: { backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  consultaItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  consultaItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  consultaHora: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, width: 42, paddingTop: 2 },
  consultaIcone: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  consultaEmoji: { fontSize: 20 },
  consultaInfo: { flex: 1, gap: 2 },
  consultaNome: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  consultaDetalhe: { fontSize: 12, color: colors.textSecondary },
  iniciarBtn: { marginTop: 6, backgroundColor: '#2A7ABF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  iniciarBtnTxt: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  tipoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tipoTexto: { fontSize: 11, fontWeight: '700' },
})
