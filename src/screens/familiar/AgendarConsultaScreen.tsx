import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { colors, typo, space, radius, btnHeightMd, rs } from '../../theme'

type Props = { navigation: NativeStackNavigationProp<any>; route: RouteProp<any> }

const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

const MODALIDADES = [
  { label: 'Videochamada', valor: 'R$ 180,00', gratuito: false, tipo: 'online' },
  { label: 'Presencial',   valor: 'R$ 200,00', gratuito: false, tipo: 'presencial' },
  { label: 'Grupo quinzenal', valor: 'Gratuito', gratuito: true, tipo: 'grupo' },
]

function gerarDias() {
  const semana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  const meses  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const hoje = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    return {
      key: i,
      diaSemana: semana[d.getDay()],
      dia: d.getDate(),
      mes: meses[d.getMonth()],
      dataISO: d.toISOString().split('T')[0],
    }
  })
}

// Gera um nome de canal único para o Agora baseado no profissional + data + hora
function gerarCanal(nomeProfissional: string, data: string, hora: string): string {
  const slug = nomeProfissional
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20)
  const dataSlug = data.replace(/-/g, '')
  const horaSlug = hora.replace(':', '')
  return `zelo-${slug}-${dataSlug}-${horaSlug}`
}

export default function AgendarConsultaScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const profissional = route?.params?.profissional ?? {
    emoji: '🧠', nome: 'Dra. Ana Souza', registro: 'CRP 05/12345',
    especialidade: 'Psicologia',
  }

  const dias = gerarDias()
  const [diaSel, setDiaSel]     = useState(0)
  const [horaSel, setHoraSel]   = useState<string | null>(null)
  const [modalSel, setModalSel] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)

  const confirmar = async () => {
    if (!horaSel || modalSel === null) {
      Alert.alert('Atenção', 'Selecione um horário e uma modalidade para continuar.')
      return
    }
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.')
      return
    }

    const dia = dias[diaSel]
    const mod = MODALIDADES[modalSel]

    // Canal Agora para videochamada/grupo
    const canalAgora = mod.tipo !== 'presencial'
      ? gerarCanal(profissional.nome, dia.dataISO, horaSel)
      : null

    setSalvando(true)
    try {
      await addDoc(collection(db, 'consultas'), {
        userId:        user.uid,
        profissional:  profissional.nome,
        especialidade: profissional.especialidade ?? 'Especialista',
        emoji:         profissional.emoji ?? '🧠',
        registro:      profissional.registro ?? '',
        data:          dia.dataISO,
        hora:          horaSel,
        modalidade:    mod.label,
        valor:         mod.valor,
        canalAgora:    canalAgora,
        status:        'agendada',
        criadoEm:      new Date().toISOString(),
      })

      Alert.alert(
        'Consulta agendada! ✅',
        `${profissional.nome}\n${dia.diaSemana}, ${dia.dia} ${dia.mes} às ${horaSel}\n${mod.label} · ${mod.valor}${canalAgora ? '\n\n🎥 Sala de videochamada criada!' : ''}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (e) {
      console.error(e)
      Alert.alert('Erro', 'Não foi possível agendar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarRow}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Agendar consulta</Text>
        <View style={styles.profRow}>
          <View style={styles.profIcone}>
            <Text style={styles.profEmoji}>{profissional.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profNome} numberOfLines={1}>{profissional.nome}</Text>
            <Text style={styles.profRegistro}>{profissional.registro}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.secaoTitulo}>Selecione o dia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.diasScroll}>
          {dias.map((d, i) => (
            <TouchableOpacity
              key={d.key}
              style={[styles.diaBtn, i === diaSel && styles.diaBtnAtivo]}
              onPress={() => { setDiaSel(i); setHoraSel(null) }}
            >
              <Text style={[styles.diaSemana, i === diaSel && styles.diaTextoAtivo]}>{d.diaSemana}</Text>
              <Text style={[styles.diaDia,    i === diaSel && styles.diaTextoAtivo]}>{d.dia}</Text>
              <Text style={[styles.diaMes,    i === diaSel && styles.diaTextoAtivo]}>{d.mes}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.secaoTitulo}>Horários disponíveis</Text>
        <View style={styles.horariosGrid}>
          {HORARIOS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.horarioBtn, horaSel === h && styles.horarioBtnAtivo]}
              onPress={() => setHoraSel(h)}
            >
              <Text style={[styles.horarioTexto, horaSel === h && styles.horarioTextoAtivo]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.secaoTitulo}>Modalidade</Text>
        <View style={styles.modalidadesCol}>
          {MODALIDADES.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.modalidadeBtn, i === modalSel && styles.modalidadeBtnAtivo]}
              onPress={() => setModalSel(i)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalidadeLabel, i === modalSel && styles.modalidadeTextoAtivo]}>
                  {m.tipo === 'online' ? '🎥 ' : m.tipo === 'grupo' ? '👥 ' : '📍 '}{m.label}
                </Text>
                {m.tipo !== 'presencial' && (
                  <Text style={[styles.modalidadeHint, i === modalSel && { color: 'rgba(255,255,255,0.75)' }]}>
                    Videochamada via Agora.io — dentro do app
                  </Text>
                )}
              </View>
              <Text style={[
                styles.modalidadeValor,
                m.gratuito && styles.modalidadeGratuito,
                i === modalSel && styles.modalidadeTextoAtivo,
              ]}>
                {m.valor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {horaSel && modalSel !== null && (
          <View style={styles.resumoCard}>
            <Text style={styles.resumoTitulo}>Resumo do agendamento</Text>
            <Text style={styles.resumoTexto}>📅 {dias[diaSel].diaSemana}, {dias[diaSel].dia} {dias[diaSel].mes}</Text>
            <Text style={styles.resumoTexto}>🕐 {horaSel}</Text>
            <Text style={styles.resumoTexto}>📋 {MODALIDADES[modalSel].label} · {MODALIDADES[modalSel].valor}</Text>
            {MODALIDADES[modalSel].tipo !== 'presencial' && (
              <Text style={styles.resumoTexto}>🎥 Sala de videochamada será criada</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmarBtn, salvando && { opacity: 0.6 }]}
          onPress={confirmar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.confirmarTexto}>Confirmar agendamento</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    backgroundColor: colors.blue,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    borderBottomLeftRadius: rs(20, 24, 28),
    borderBottomRightRadius: rs(20, 24, 28),
    gap: space.sm,
  },
  voltarRow: { flexDirection: 'row' },
  voltarTexto: { fontSize: typo.xs, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  headerTitulo: { fontSize: typo.xl, fontWeight: '700', color: colors.white },
  profRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  profIcone: {
    width: rs(42, 46, 52), height: rs(42, 46, 52),
    borderRadius: radius.md, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  profEmoji: { fontSize: rs(20, 22, 26) },
  profNome: { fontSize: typo.sm, fontWeight: '700', color: colors.white },
  profRegistro: { fontSize: typo.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scrollContent: { padding: space.lg, paddingBottom: rs(40, 48, 56), gap: space.md },
  secaoTitulo: {
    fontSize: typo.xs, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase', marginTop: space.xs,
  },
  diasScroll: { gap: space.sm, paddingVertical: 4 },
  diaBtn: {
    alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    minWidth: rs(56, 62, 68), gap: 2,
  },
  diaBtnAtivo: { backgroundColor: colors.blue, borderColor: colors.blue },
  diaSemana: { fontSize: typo.xs, fontWeight: '600', color: colors.textMuted },
  diaDia: { fontSize: rs(18, 20, 22), fontWeight: '700', color: colors.textPrimary },
  diaMes: { fontSize: typo.xs, color: colors.textMuted },
  diaTextoAtivo: { color: colors.white },
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  horarioBtn: {
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: space.sm, width: '22%', alignItems: 'center',
  },
  horarioBtnAtivo: { backgroundColor: colors.blue, borderColor: colors.blue },
  horarioTexto: { fontSize: typo.xs, fontWeight: '600', color: colors.textPrimary },
  horarioTextoAtivo: { color: colors.white },
  modalidadesCol: { gap: space.sm },
  modalidadeBtn: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: space.md, paddingVertical: space.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  modalidadeBtnAtivo: { backgroundColor: colors.blue, borderColor: colors.blue },
  modalidadeLabel: { fontSize: typo.sm, fontWeight: '600', color: colors.textPrimary },
  modalidadeHint: { fontSize: typo.xs, color: colors.textMuted, marginTop: 2 },
  modalidadeValor: { fontSize: typo.sm, fontWeight: '700', color: colors.green },
  modalidadeGratuito: { color: colors.green },
  modalidadeTextoAtivo: { color: colors.white },
  resumoCard: {
    backgroundColor: colors.blueLight, borderRadius: radius.lg,
    padding: space.md, gap: space.xs, borderWidth: 1, borderColor: '#BDD9F0',
  },
  resumoTitulo: { fontSize: typo.xs, fontWeight: '700', color: colors.blueDark, marginBottom: 4 },
  resumoTexto: { fontSize: typo.sm, color: colors.textPrimary },
  confirmarBtn: {
    backgroundColor: colors.blue, borderRadius: radius.lg,
    height: btnHeightMd, alignItems: 'center', justifyContent: 'center', marginTop: space.xs,
  },
  confirmarTexto: { fontSize: typo.md, fontWeight: '700', color: colors.white },
})
