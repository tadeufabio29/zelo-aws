import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, typo, space, radius, rs } from '../../theme'

type Props = {
  navigation: NativeStackNavigationProp<any>
  route: RouteProp<any>
}

export default function PerfilEspecialistaScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets()

  // ✅ Usa os dados passados pela navegação (FavoritosScreen ou HomeScreen)
  const profissional = route?.params?.profissional ?? {
    emoji: '👩‍⚕️',
    nome: 'Especialista',
    registro: '',
    experiencia: '',
    especialidades: [],
    avaliacao: 0,
    totalAvaliacoes: 0,
    bio: '',
    valor: '',
    modalidades: [],
  }

  const disponibilidade = [
    { dia: 'Segunda · 09h–17h', tipo: 'individual' },
    { dia: 'Quarta · 09h–17h', tipo: 'individual' },
    { dia: 'Sexta · 09h–13h', tipo: 'individual' },
    { dia: 'Grupo quinzenal', tipo: 'grupo' },
  ]

  const valores = profissional.modalidades?.length
    ? [
        profissional.modalidades.includes('Online') && {
          modalidade: 'Videochamada (50 min)',
          valor: profissional.valor ?? 'Consultar',
          gratuito: false,
        },
        profissional.modalidades.includes('Presencial') && {
          modalidade: 'Presencial (50 min)',
          valor: profissional.valor ?? 'Consultar',
          gratuito: false,
        },
        profissional.modalidades.includes('Grupo') && {
          modalidade: 'Grupo quinzenal gratuito',
          valor: 'Gratuito',
          gratuito: true,
        },
      ].filter(Boolean)
    : [
        { modalidade: 'Videochamada (50 min)', valor: profissional.valor ?? 'R$ 180,00', gratuito: false },
        { modalidade: 'Presencial (50 min)', valor: profissional.valor ?? 'R$ 200,00', gratuito: false },
        { modalidade: 'Grupo quinzenal gratuito', valor: 'Gratuito', gratuito: true },
      ]

  return (
    <View style={styles.container}>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.voltarRow} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar para resultados</Text>
        </TouchableOpacity>

        <View style={styles.profRow}>
          <View style={styles.profIcone}>
            <Text style={styles.profEmoji}>{profissional.emoji}</Text>
          </View>
          <View style={styles.profInfo}>
            <Text style={styles.profNome}>{profissional.nome}</Text>
            <Text style={styles.profRegistro}>
              {profissional.registro}
              {profissional.experiencia ? ` · ${profissional.experiencia}` : ''}
            </Text>
            {profissional.especialidades?.length > 0 && (
              <View style={styles.tagsRow}>
                {profissional.especialidades.map((tag: string) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagTexto}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {profissional.avaliacao > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>AVALIAÇÃO DOS PACIENTES</Text>
            <View style={styles.avaliacaoRow}>
              <Text style={styles.estrelas}>★★★★★</Text>
              <Text style={styles.avaliacaoNumero}>{profissional.avaliacao}</Text>
              {profissional.totalAvaliacoes > 0 && (
                <Text style={styles.avaliacaoTotal}>· {profissional.totalAvaliacoes} avaliações</Text>
              )}
            </View>
          </View>
        )}

        {profissional.bio ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>SOBRE</Text>
            <Text style={styles.bioTexto}>{profissional.bio}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>DISPONIBILIDADE SEMANAL</Text>
          <View style={styles.disponibilidadeGrid}>
            {disponibilidade.map((item) => (
              <View
                key={item.dia}
                style={[
                  styles.disponibilidadeItem,
                  item.tipo === 'grupo' && styles.disponibilidadeItemVerde,
                ]}
              >
                <View
                  style={[
                    styles.disponibilidadeDot,
                    item.tipo === 'grupo' && styles.disponibilidadeDotVerde,
                  ]}
                />
                <Text
                  style={[
                    styles.disponibilidadeTexto,
                    item.tipo === 'grupo' && styles.disponibilidadeTextoVerde,
                  ]}
                >
                  {item.dia}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>VALORES POR SESSÃO</Text>
          {(valores as any[]).map((item, i) => (
            <View
              key={i}
              style={[
                styles.valorItem,
                i < valores.length - 1 && styles.valorItemBorder,
              ]}
            >
              <Text style={styles.valorModalidade}>{item.modalidade}</Text>
              <Text style={[styles.valorPreco, item.gratuito && styles.valorGratuito]}>
                {item.valor}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.agendarBtn}
          onPress={() => navigation.navigate('AgendarConsulta', { profissional })}
        >
          <Text style={styles.agendarTexto}>Agendar consulta</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    gap: 16,
  },
  voltarRow: { flexDirection: 'row', alignItems: 'center' },
  voltarTexto: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12,
  },
  cardTitulo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  bioTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  avaliacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  estrelas: { fontSize: 22, color: '#F5A623' },
  avaliacaoNumero: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  avaliacaoTotal: { fontSize: 13, color: colors.textSecondary },
  disponibilidadeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  disponibilidadeItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blueLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, width: '47%',
  },
  disponibilidadeItemVerde: { backgroundColor: colors.successBg },
  disponibilidadeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A7ABF' },
  disponibilidadeDotVerde: { backgroundColor: colors.success },
  disponibilidadeTexto: { fontSize: 12, fontWeight: '600', color: '#2A7ABF', flex: 1 },
  disponibilidadeTextoVerde: { color: colors.success },
  valorItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  valorItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  valorModalidade: { fontSize: 13, color: colors.textPrimary },
  valorPreco: { fontSize: 14, fontWeight: '700', color: colors.success },
  valorGratuito: { color: colors.success, fontWeight: '700' },
  agendarBtn: {
    backgroundColor: colors.blue, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  agendarTexto: { fontSize: 15, fontWeight: '700', color: colors.bgCard },
})
