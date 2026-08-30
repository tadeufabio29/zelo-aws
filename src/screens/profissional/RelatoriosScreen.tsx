import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, LayoutChangeEvent, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { colors, typo, space, radius, rs } from '../../theme'

const MESES_NOME = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type Consulta = {
  id: string
  userId: string
  profissional: string
  especialidade: string
  data: string
  hora: string
  modalidade: string
  valor: string
  status: string
}

function CardResumo({ label, valor, sub, cor, emoji }: {
  label: string; valor: string; sub: string; cor: string; emoji: string
}) {
  return (
    <View style={styles.cardResumo}>
      <View style={[styles.cardIcone, { backgroundColor: cor + '20' }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <Text style={styles.cardValor}>{valor}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  )
}

function GraficoBarras({ dados, labels, cor }: {
  dados: number[]; labels: string[]; cor: string
}) {
  const [containerWidth, setContainerWidth] = useState(0)

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width)
  }

  const maxVal = Math.max(...dados, 1)
  const barWidth = containerWidth > 0 ? (containerWidth / dados.length) - 8 : 0

  return (
    <View style={styles.graficoBarras} onLayout={handleLayout}>
      {dados.map((val, i) => {
        const altura = Math.max((val / maxVal) * 90, 4)
        return (
          <View key={i} style={styles.barraWrapper}>
            <Text style={styles.barraTopo}>{val}</Text>
            <View style={styles.barraFundo}>
              <View style={[styles.barra, { height: altura, width: barWidth, backgroundColor: cor }]} />
            </View>
            <Text style={styles.barraLabel}>{labels[i]}</Text>
          </View>
        )
      })}
    </View>
  )
}

function TagModalidade({ tipo }: { tipo: string }) {
  const isVideo = tipo === 'Videochamada'
  return (
    <View style={[styles.tag, { backgroundColor: isVideo ? '#EDE9F7' : '#E8F5E9' }]}>
      <Text style={[styles.tagText, { color: isVideo ? '#7C5CBF' : '#388E3C' }]}>
        {tipo}
      </Text>
    </View>
  )
}

export default function RelatoriosScreen() {
  const navigation = useNavigation()
  const { user, buscarDadosPerfil } = useAuth()
  const [periodoAtivo, setPeriodoAtivo] = useState('Mês')
  const periodos = ['Semana', 'Mês', 'Trimestre', 'Ano']

  const [loading, setLoading] = useState(true)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [nomeProfissional, setNomeProfissional] = useState('')

  useEffect(() => { carregarDados() }, [user])

  const carregarDados = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const dados = await buscarDadosPerfil()
      const nome = (dados?.nome as string) ?? ''
      setNomeProfissional(nome)

      const q = query(collection(db, 'consultas'), where('profissional', '==', nome))
      const snap = await getDocs(q)
      const lista: Consulta[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Consulta, 'id'>) }))
      setConsultas(lista)
    } catch (e) {
      console.warn('Erro ao carregar relatórios:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  const hoje = new Date()

  // Consultas dos últimos 6 meses agrupadas por mês
  const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1)
    return { ano: d.getFullYear(), mes: d.getMonth(), label: MESES_NOME[d.getMonth()] }
  })

  const consultasPorMes = ultimos6Meses.map(({ ano, mes }) =>
    consultas.filter(c => {
      const d = new Date(c.data + 'T00:00:00')
      return d.getFullYear() === ano && d.getMonth() === mes
    }).length
  )

  const faturamentoPorMes = ultimos6Meses.map(({ ano, mes }) =>
    consultas
      .filter(c => {
        const d = new Date(c.data + 'T00:00:00')
        return d.getFullYear() === ano && d.getMonth() === mes
      })
      .reduce((acc, c) => {
        const valor = parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0
        return acc + valor
      }, 0)
  )

  // Mês atual
  const consultasMesAtual = consultas.filter(c => {
    const d = new Date(c.data + 'T00:00:00')
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
  })

  const faturamentoMesAtual = consultasMesAtual.reduce((acc, c) => {
    const valor = parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    return acc + valor
  }, 0)

  const consultasPassadas = consultas
    .filter(c => new Date(`${c.data}T${c.hora}`) <= hoje)
    .sort((a, b) => new Date(`${b.data}T${b.hora}`).getTime() - new Date(`${a.data}T${a.hora}`).getTime())
    .slice(0, 5)

  const mesAtualNome = MESES_NOME[hoje.getMonth()]
  const anoAtual = hoje.getFullYear()

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C5CBF" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.voltarBtn}>
            <Text style={styles.voltarTxt}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Relatórios</Text>
          <Text style={styles.headerSub}>{mesAtualNome} {anoAtual}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroContainer}>
          {periodos.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriodoAtivo(p)}
              style={[styles.filtroBotao, periodoAtivo === p && styles.filtroBotaoAtivo]}
            >
              <Text style={[styles.filtroTexto, periodoAtivo === p && styles.filtroTextoAtivo]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cardsGrid}>
          <CardResumo label="Consultas" valor={String(consultasMesAtual.length)} sub="este mês" cor="#7C5CBF" emoji="📋" />
          <CardResumo
            label="Faturamento"
            valor={`R$ ${faturamentoMesAtual.toFixed(0)}`}
            sub="este mês" cor="#4DA6FF" emoji="💰"
          />
          <CardResumo label="Total" valor={String(consultas.length)} sub="desde o início" cor="#F5A623" emoji="📊" />
          <CardResumo
            label="Faturamento total"
            valor={`R$ ${consultas.reduce((acc, c) => {
              const v = parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0
              return acc + v
            }, 0).toFixed(0)}`}
            sub="acumulado" cor="#6FCF97" emoji="💰"
          />
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Consultas realizadas</Text>
          <Text style={styles.secaoSub}>Últimos 6 meses</Text>
          <GraficoBarras dados={consultasPorMes} labels={ultimos6Meses.map(m => m.label)} cor="#7C5CBF" />
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Faturamento</Text>
          <Text style={styles.secaoSub}>Últimos 6 meses · R$</Text>
          <GraficoBarras dados={faturamentoPorMes} labels={ultimos6Meses.map(m => m.label)} cor="#4DA6FF" />
        </View>

        {consultasPassadas.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Sessões recentes</Text>
            <Text style={styles.secaoSub}>Histórico de atendimentos</Text>
            {consultasPassadas.map((c, i) => {
              const d = new Date(c.data + 'T00:00:00')
              const dataFormatada = `${d.getDate()} ${MESES_NOME[d.getMonth()]}`
              const valor = parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0
              return (
                <View key={c.id} style={styles.sessaoCard}>
                  <View style={styles.sessaoAvatar}>
                    <Text style={styles.sessaoAvatarText}>
                      {c.especialidade.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.sessaoInfo}>
                    <Text style={styles.sessaoNome}>{c.especialidade}</Text>
                    <Text style={styles.sessaoDetalhe}>{dataFormatada} · {c.hora}</Text>
                  </View>
                  <View style={styles.sessaoDireita}>
                    <TagModalidade tipo={c.modalidade} />
                    {valor > 0 && <Text style={styles.sessaoValor}>R$ {valor.toFixed(0)}</Text>}
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {consultas.length === 0 && (
          <View style={styles.secao}>
            <Text style={{ textAlign: 'center', color: '#999', padding: 24 }}>
              Nenhuma consulta registrada ainda.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5FC' },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EDE9F7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#7C5CBF', fontWeight: '600' },
  headerTitulo: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  filtroContainer: { paddingHorizontal: 20, paddingBottom: 16, gap: 8, flexDirection: 'row' },
  filtroBotao: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDE9F7' },
  filtroBotaoAtivo: { backgroundColor: '#7C5CBF' },
  filtroTexto: { fontSize: 13, color: '#7C5CBF', fontWeight: '500' },
  filtroTextoAtivo: { color: '#fff' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 4 },
  cardResumo: {
    width: '48%',
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#7C5CBF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardIcone: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardValor: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  cardLabel: { fontSize: 12, color: '#555', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#AAA', marginTop: 1 },
  secao: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  secaoSub: { fontSize: 12, color: '#999', marginTop: 2, marginBottom: 16 },
  graficoBarras: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130 },
  barraWrapper: { alignItems: 'center', flex: 1 },
  barraTopo: { fontSize: 12, color: '#888', marginBottom: 3 },
  barraFundo: { height: 100, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  barra: { borderRadius: 6, minHeight: 4 },
  barraLabel: { fontSize: 12, color: '#888', marginTop: 5 },
  sessaoCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EDF9', gap: 10,
  },
  sessaoAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EDE9F7', justifyContent: 'center', alignItems: 'center',
  },
  sessaoAvatarText: { fontSize: 12, fontWeight: '700', color: '#7C5CBF' },
  sessaoInfo: { flex: 1 },
  sessaoNome: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  sessaoDetalhe: { fontSize: 12, color: '#999', marginTop: 2 },
  sessaoDireita: { alignItems: 'flex-end', gap: 4 },
  sessaoValor: { fontSize: 12, fontWeight: '700', color: '#7C5CBF' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 12, fontWeight: '600' },
})
