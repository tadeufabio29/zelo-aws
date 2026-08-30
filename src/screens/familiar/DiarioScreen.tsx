import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, typo, space, radius, rs } from '../../theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, orderBy,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'

const CACHE_KEY = '@zelo:diario'

type Registro = {
  id: string
  data: string
  humor: string
  titulo: string
  texto: string
  tags: string[]
  criadoEm: string
}

const HUMORES = [
  { label: 'Ótimo', emoji: '😄', cor: '#3D9970' },
  { label: 'Bem', emoji: '🙂', cor: colors.blue },
  { label: 'Ok', emoji: '😐', cor: '#E8A838' },
  { label: 'Difícil', emoji: '😟', cor: '#E8643A' },
  { label: 'Exausto', emoji: '😔', cor: colors.purple },
]

const TAGS_OPCOES = ['Progresso', 'Crise', 'Terapia', 'Escola', 'Sono', 'Alimentação', 'Socialização', 'Consulta']

export default function DiarioScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)


  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [humorSel, setHumorSel] = useState(HUMORES[1])
  const [tagsSel, setTagsSel] = useState<string[]>([])

  useEffect(() => { carregarRegistros() }, [user])

  const carregarRegistros = async () => {
    if (!user) return
    setLoading(true)
    try {
   
      const cached = await AsyncStorage.getItem(CACHE_KEY + user.uid)
      if (cached) setRegistros(JSON.parse(cached))

    
      const q = query(
        collection(db, 'diario'),
        where('userId', '==', user.uid),
        orderBy('criadoEm', 'desc')
      )
      const snap = await getDocs(q)
      const lista: Registro[] = snap.docs.map(d => ({
        id: d.id, ...(d.data() as Omit<Registro, 'id'>),
      }))
      setRegistros(lista)
      await AsyncStorage.setItem(CACHE_KEY + user.uid, JSON.stringify(lista))
    } catch (e) {
      console.warn('Erro ao carregar diário:', e)
    } finally {
      setLoading(false)
    }
  }

  const salvarRegistro = async () => {
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'Digite um título para o registro.')
      return
    }
    if (!user) return
    setSalvando(true)
    try {
      const agora = new Date()
      const novoDoc = {
        userId: user.uid,
        data: agora.toLocaleDateString('pt-BR'),
        humor: humorSel.label,
        titulo: titulo.trim(),
        texto: texto.trim(),
        tags: tagsSel,
        criadoEm: agora.toISOString(),
      }
      const docRef = await addDoc(collection(db, 'diario'), novoDoc)
      const novo: Registro = { id: docRef.id, ...novoDoc }
      const novos = [novo, ...registros]
      setRegistros(novos)
      await AsyncStorage.setItem(CACHE_KEY + user.uid, JSON.stringify(novos))
      fecharModal()
      Alert.alert('✅ Salvo!', 'Registro adicionado ao diário.')
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const excluirRegistro = (id: string) => {
    Alert.alert('Excluir registro', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'diario', id))
            const novos = registros.filter(r => r.id !== id)
            setRegistros(novos)
            if (user) await AsyncStorage.setItem(CACHE_KEY + user.uid, JSON.stringify(novos))
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.')
          }
        },
      },
    ])
  }

  const fecharModal = () => {
    setModalAberto(false)
    setTitulo('')
    setTexto('')
    setHumorSel(HUMORES[1])
    setTagsSel([])
  }

  const toggleTag = (tag: string) => {
    setTagsSel(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const humorAtual = HUMORES.find(h => h.label === '') ?? HUMORES[1]

  const renderItem = ({ item }: { item: Registro }) => {
    const humor = HUMORES.find(h => h.label === item.humor) ?? HUMORES[1]
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderEsq}>
            <Text style={styles.cardEmoji}>{humor.emoji}</Text>
            <View>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardData}>{item.data} · {item.humor}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => excluirRegistro(item.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnTxt}>🗑️</Text>
          </TouchableOpacity>
        </View>
        {item.texto ? (
          <Text style={styles.cardTexto} numberOfLines={3}>{item.texto}</Text>
        ) : null}
        {item.tags.length > 0 && (
          <View style={styles.cardTags}>
            {item.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: humor.cor + '18' }]}>
                <Text style={[styles.tagTxt, { color: humor.cor }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitulo}>Diário do Cuidador</Text>
            <Text style={styles.headerSub}>{registros.length} registro{registros.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalAberto(true)}>
            <Text style={styles.addBtnTxt}>+ Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5B9BD5" />
        </View>
      ) : registros.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.vazioEmoji}>📓</Text>
          <Text style={styles.vazioTitulo}>Seu diário está vazio</Text>
          <Text style={styles.vazioSub}>Registre o dia a dia do seu filho, progressos e observações importantes.</Text>
          <TouchableOpacity style={styles.vazioBtn} onPress={() => setModalAberto(true)}>
            <Text style={styles.vazioBtnTxt}>Fazer primeiro registro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={registros}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal novo registro */}
      <Modal visible={modalAberto} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={[styles.modal, { paddingTop: insets.top + 16 }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Novo registro</Text>
            <TouchableOpacity onPress={fecharModal}>
              <Text style={styles.modalFechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={
              <View style={styles.modalBody}>
                {/* Humor */}
                <Text style={styles.label}>Como foi o dia?</Text>
                <View style={styles.humores}>
                  {HUMORES.map(h => (
                    <TouchableOpacity
                      key={h.label}
                      style={[styles.humorBtn, humorSel.label === h.label && { backgroundColor: h.cor + '22', borderColor: h.cor }]}
                      onPress={() => setHumorSel(h)}
                    >
                      <Text style={styles.humorEmoji}>{h.emoji}</Text>
                      <Text style={[styles.humorLabel, humorSel.label === h.label && { color: h.cor, fontWeight: '700' }]}>
                        {h.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Título */}
                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  value={titulo}
                  onChangeText={setTitulo}
                  placeholder="Ex: Progresso na escola hoje"
                  placeholderTextColor="#9CA3AF"
                  maxLength={60}
                />

                {/* Texto */}
                <Text style={styles.label}>Observações (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={texto}
                  onChangeText={setTexto}
                  placeholder="Descreva o que aconteceu..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                {/* Tags */}
                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagsGrid}>
                  {TAGS_OPCOES.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagOpcao, tagsSel.includes(tag) && { backgroundColor: colors.blue, borderColor: colors.blue }]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[styles.tagOpcaoTxt, tagsSel.includes(tag) && { color: '#fff' }]}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
          />

          <TouchableOpacity
            style={[styles.botaoSalvar, salvando && { opacity: 0.6 }]}
            onPress={salvarRegistro}
            disabled={salvando}
          >
            {salvando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.botaoSalvarTxt}>Salvar registro</Text>
            }
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.purple, paddingHorizontal: 18, paddingBottom: 16,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  lista: { padding: 16, gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderEsq: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  cardEmoji: { fontSize: 26 },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardData: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  deleteBtn: { padding: 4 },
  deleteBtnTxt: { fontSize: 16 },
  cardTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontSize: 11, fontWeight: '600' },
  vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  vazioEmoji: { fontSize: 52 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  vazioSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  vazioBtn: { backgroundColor: colors.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  vazioBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modal: { flex: 1, backgroundColor: colors.bgMain },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalFechar: { fontSize: 18, color: colors.textMuted, padding: 4 },
  modalBody: { padding: 20, gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6A7A', marginBottom: 6, marginTop: 12 },
  humores: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  humorBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', paddingVertical: 8, gap: 3,
  },
  humorEmoji: { fontSize: 22 },
  humorLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: '#E2E8F0',
  },
  inputMultiline: { height: 110, paddingTop: 12 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagOpcao: {
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6,
  },
  tagOpcaoTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  botaoSalvar: {
    backgroundColor: colors.purple, margin: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  botaoSalvarTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
})