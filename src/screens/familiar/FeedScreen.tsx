import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Linking, RefreshControl, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const GNEWS_API_KEY = 'c20ff4c566e34c2c06e1e3a9b83bee10'
const PAGE_SIZE = 10

const CATEGORIAS = [
  { label: 'Todos',      query: 'autismo inclusão criança atípica',  emoji: '📰', cor: '#5B9BD5', corFundo: '#EAF3FB' },
  { label: 'Autismo',    query: 'autismo TEA espectro',              emoji: '🧩', cor: '#7B4FA6', corFundo: '#F0EBF8' },
  { label: 'TDAH',       query: 'TDAH hiperatividade déficit atenção', emoji: '⚡', cor: '#E8A838', corFundo: '#FEF6E4' },
  { label: 'Inclusão',   query: 'inclusão escolar deficiência',      emoji: '🤝', cor: '#3D9970', corFundo: '#E8F5EE' },
  { label: 'Terapias',   query: 'fonoaudiologia terapia ocupacional fisioterapia infantil', emoji: '💚', cor: '#E86B3D', corFundo: '#FDECEA' },
]

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type Noticia = {
  url: string
  title: string
  description: string | null
  image: string | null
  publishedAt: string
  source: { name: string, url: string }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function formatarData(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function NoticiaCard({ item, catCor, catCorFundo, catEmoji }: {
  item: Noticia
  catCor: string
  catCorFundo: string
  catEmoji: string
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => Linking.openURL(item.url)}
    >
      <View style={styles.cardImageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: catCorFundo, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 40 }}>{catEmoji}</Text>
          </View>
        )}
        <View style={[styles.sourceBadge, { backgroundColor: catCor }]}>
          <Text style={styles.sourceBadgeText}>{item.source.name}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{formatarData(item.publishedAt)}</Text>
          <View style={[styles.lerMaisBtn, { backgroundColor: catCorFundo }]}>
            <Text style={[styles.lerMaisTxt, { color: catCor }]}>Ler mais →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── TELA PRINCIPAL ──────────────────────────────────────────────────────────
export default function FeedScreen() {
  const insets = useSafeAreaInsets()

  const [catIdx, setCatIdx]         = useState(0)
  const [noticias, setNoticias]     = useState<Noticia[]>([])
  const [carregando, setCarregando] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [erro, setErro]             = useState<string | null>(null)
  const [busca, setBusca]           = useState('')

  const buscaRef = useRef(busca)
  buscaRef.current = busca

  const cat = CATEGORIAS[catIdx]

  // ─── FETCH ──────────────────────────────────────────────────────────────────
  const buscarNoticias = useCallback(async (reset: boolean) => {
    reset ? setRefreshing(true) : setCarregando(true)
    setErro(null)

    try {
      const query = buscaRef.current.trim() || cat.query
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=pt&max=${PAGE_SIZE}&apikey=${GNEWS_API_KEY}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.errors) {
        setErro(data.errors[0] || 'Erro ao carregar notícias.')
        return
      }

      const itens: Noticia[] = (data.articles || []).filter(
        (a: Noticia) => a.title && a.url
      )

      setNoticias(itens)
    } catch {
      setErro('Sem conexão. Verifique sua internet e tente novamente.')
    } finally {
      setCarregando(false)
      setRefreshing(false)
    }
  }, [cat.query])

  // Recarrega ao mudar categoria
  useEffect(() => {
    setBusca('')
    buscarNoticias(false)
  }, [catIdx])

  // Recarrega ao buscar (debounce simples)
  useEffect(() => {
    if (!busca) return
    const t = setTimeout(() => buscarNoticias(false), 600)
    return () => clearTimeout(t)
  }, [busca])

  const onRefresh = () => buscarNoticias(true)

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Notícias</Text>
        <Text style={styles.headerSub}>Informação para famílias e profissionais</Text>

        {/* Barra de busca */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar notícias..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => { setBusca(''); buscarNoticias(false) }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de categoria */}
      <View style={styles.categoriasWrap}>
        <FlatList
          horizontal
          data={CATEGORIAS}
          keyExtractor={i => i.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.catBtn, index === catIdx && { backgroundColor: item.cor, borderColor: item.cor }]}
              onPress={() => { if (index !== catIdx) { setCatIdx(index); setNoticias([]) } }}
            >
              <Text style={styles.catEmoji}>{item.emoji}</Text>
              <Text style={[styles.catLabel, index === catIdx && { color: '#FFF' }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Loading inicial */}
      {carregando && (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#5B9BD5" />
          <Text style={styles.loadingTxt}>Carregando notícias...</Text>
        </View>
      )}

      {/* Erro */}
      {erro && !carregando && (
        <View style={styles.erroWrap}>
          <Text style={styles.erroEmoji}>📡</Text>
          <Text style={styles.erroTxt}>{erro}</Text>
          <TouchableOpacity style={styles.erroBtn} onPress={() => buscarNoticias(false)}>
            <Text style={styles.erroBtnTxt}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {!carregando && !erro && (
        <FlatList
          data={noticias}
          keyExtractor={item => item.url}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5B9BD5']} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={styles.emptyTxt}>Nenhuma notícia encontrada</Text>
            </View>
          }
          ListFooterComponent={
            noticias.length > 0 ? (
              <Text style={styles.fimTxt}>— Você está em dia com as notícias —</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <NoticiaCard
              item={item}
              catCor={cat.cor}
              catCorFundo={cat.corFundo}
              catEmoji={cat.emoji}
            />
          )}
        />
      )}
    </View>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },

  header: {
    backgroundColor: '#5B9BD5',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, height: 38, paddingHorizontal: 12, gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 13 },

  categoriasWrap: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E8ECF0' },
  categoriasContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#E8ECF0',
    backgroundColor: '#FFF',
  },
  catEmoji: { fontSize: 13 },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#5A6478' },

  listContent: { padding: 14, gap: 12, paddingBottom: 24 },

  card: {
    backgroundColor: '#FFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E8ECF0', overflow: 'hidden',
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 180 },
  sourceBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  sourceBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  cardBody: { padding: 14, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', lineHeight: 21 },
  cardDesc: { fontSize: 13, color: '#5A6478', lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontSize: 11, color: '#9BA3AF' },
  lerMaisBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lerMaisTxt: { fontSize: 12, fontWeight: '700' },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 60 },
  loadingTxt: { fontSize: 13, color: '#5A6478' },

  erroWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, marginTop: 40 },
  erroEmoji: { fontSize: 48 },
  erroTxt: { fontSize: 14, color: '#5A6478', textAlign: 'center', lineHeight: 21 },
  erroBtn: { backgroundColor: '#5B9BD5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  erroBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTxt: { fontSize: 14, color: '#5A6478' },

  fimTxt: { textAlign: 'center', fontSize: 12, color: '#9BA3AF', paddingVertical: 20 },
})
