import { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  Animated, TouchableOpacity, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, typo, space, radius, rs } from '../../theme'

const fotoFabio     = require('../../assets/foto_fabio.jpeg')
const fotoGabrielli = require('../../assets/foto_gabrielli.jpeg')
const fotoDaniel    = require('../../assets/foto_daniel.jpeg')

const integrantes = [
  {
    nome: 'Fabio Tadeu',
    foto: fotoFabio,
    cor: colors.blue,
    corFundo: colors.blueLight,
    corBorda: colors.blue,
    turma: 'ADS',
    turno: 'Noturno',
    unidade: 'Campo Grande',
    papel: 'Dev Frontend',
    papelEmoji: '🎨',
    contribuicao: 'Wireframes, design das telas e navegação',
  },
  {
    nome: 'Gabrielli Correa',
    foto: fotoGabrielli,
    cor: colors.purple,
    corFundo: colors.purpleLight,
    corBorda: colors.purple,
    turma: 'ADS',
    turno: 'Noturno',
    unidade: 'Campo Grande',
    papel: 'Dev Backend',
    papelEmoji: '🔥',
    contribuicao: 'Firebase Auth, Firestore e lógica de negócio',
  },
  {
    nome: 'Daniel Nascimento',
    foto: fotoDaniel,
    cor: '#3D9970',
    corFundo: '#E8F5EE',
    corBorda: '#3D9970',
    turma: 'ADS',
    turno: 'Noturno',
    unidade: 'Campo Grande',
    papel: 'Dev Mobile',
    papelEmoji: '📱',
    contribuicao: 'Build APK, integração com API e testes',
  },
]

function CartaoIntegrante({
  pessoa,
  delay,
}: {
  pessoa: (typeof integrantes)[0]
  delay: number
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View
      style={[styles.cartao, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.avatarWrap, { borderColor: pessoa.corBorda + '50' }]}>
        <Image source={pessoa.foto} style={styles.foto} />
        <View style={[styles.papelBadge, { backgroundColor: pessoa.cor }]}>
          <Text style={styles.papelBadgeEmoji}>{pessoa.papelEmoji}</Text>
        </View>
      </View>

      <Text style={styles.cartaoNome}>{pessoa.nome}</Text>
      <View style={[styles.papelTag, { backgroundColor: pessoa.corFundo }]}>
        <Text style={[styles.papelTagTxt, { color: pessoa.cor }]}>{pessoa.papel}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Curso</Text>
          <Text style={styles.infoValor}>{pessoa.turma}</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Turno</Text>
          <Text style={styles.infoValor}>{pessoa.turno}</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Unidade</Text>
          <Text style={styles.infoValor}>{pessoa.unidade}</Text>
        </View>
      </View>

      <View style={[styles.contribuicaoBox, { backgroundColor: pessoa.corFundo }]}>
        <Text style={styles.contribuicaoLabel}>Contribuição</Text>
        <Text style={[styles.contribuicaoTxt, { color: pessoa.cor }]}>{pessoa.contribuicao}</Text>
      </View>
    </Animated.View>
  )
}

export default function SobreOGrupoScreen() {
  const navigation = useNavigation()
  const insets     = useSafeAreaInsets()
  const headerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 12, opacity: headerAnim }]}
      >
        <View style={styles.deco1} />
        <View style={styles.deco2} />
        <View style={styles.deco3} />

        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerProjeto}>Projeto</Text>
        <Text style={styles.headerNome}>ZELO 💙</Text>
        <Text style={styles.headerSubtitulo}>
          Conectando famílias a especialistas em saúde infantil
        </Text>

        <View style={styles.techRow}>
          {['React Native', 'Firebase', 'TypeScript', 'Expo'].map(tech => (
            <View key={tech} style={styles.techChip}>
              <Text style={styles.techChipTxt}>{tech}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.secaoTitulo}>Nossa equipe</Text>

        {integrantes.map((p, i) => (
          <CartaoIntegrante key={p.nome} pessoa={p} delay={i * 150} />
        ))}

        <View style={styles.disciplinaCard}>
          <Text style={styles.disciplinaEmoji}>🎓</Text>
          <Text style={styles.disciplinaTitulo}>Programação Mobile · 2026</Text>
          <Text style={styles.disciplinaSub}>Centro Universitário Augusto Motta — UNISUAM</Text>
          <Text style={styles.disciplinaSub}>Prof. Vinicius Silva · 1º Semestre</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },

  header: {
    backgroundColor: colors.blue,
    paddingHorizontal: 22, paddingBottom: 28,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    overflow: 'hidden', position: 'relative',
  },
  deco1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40 },
  deco2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -20 },
  deco3: { position: 'absolute', width: 70,  height: 70,  borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.08)', top: 30,  left: 60 },

  voltarBtn:       { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  voltarTxt:       { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerProjeto:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerNome:      { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 6 },
  headerSubtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginBottom: 16 },
  techRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techChip:        { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  techChipTxt:     { color: '#fff', fontSize: 11, fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  secaoTitulo:   { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },

  cartao: {
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    padding: 20, alignItems: 'center', gap: 10,
  },
  avatarWrap: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  foto:            { width: 94, height: 94, borderRadius: 47 },
  papelBadge:      { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  papelBadgeEmoji: { fontSize: 14 },

  cartaoNome:  { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  papelTag:    { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  papelTagTxt: { fontSize: 13, fontWeight: '700' },

  infoGrid:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, width: '100%' },
  infoItem:  { flex: 1, alignItems: 'center', gap: 2 },
  infoDiv:   { width: 1, height: 30, backgroundColor: '#E2E8F0' },
  infoLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  infoValor: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  contribuicaoBox:   { width: '100%', borderRadius: 12, padding: 12, gap: 2 },
  contribuicaoLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  contribuicaoTxt:   { fontSize: 13, fontWeight: '600', lineHeight: 18 },

  disciplinaCard:   { backgroundColor: colors.textPrimary, borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, marginTop: 8 },
  disciplinaEmoji:  { fontSize: 32, marginBottom: 4 },
  disciplinaTitulo: { fontSize: 16, fontWeight: '700', color: '#fff' },
  disciplinaSub:    { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
})
