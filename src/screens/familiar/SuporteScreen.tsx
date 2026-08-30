import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, typo, space, radius, rs } from '../../theme'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const WIKI_API = 'https://pt.wikipedia.org/api/rest_v1/page/summary/'
const ITENS_POR_PAGINA = 2  // Quantos artigos carrega por vez ao rolar

const CATEGORIAS = [
  {
    label: 'Autismo', emoji: '🧩', cor: colors.blue, corFundo: colors.blueLight,
    termos: [
      'Transtorno do espectro autista', 'Síndrome de Asperger', 'Autismo infantil',
      'Terapia ABA', 'Comunicação alternativa', 'Hipersensibilidade sensorial',
      'Desenvolvimento atípico', 'Transtorno de Rett',
    ]
  },
  {
    label: 'TDAH', emoji: '⚡', cor: '#E8A838', corFundo: '#FEF6E4',
    termos: [
      'Transtorno de déficit de atenção', 'TDAH', 'Hiperatividade em crianças',
      'Metilfenidato', 'Neuropsicologia', 'Disfunção executiva',
      'Impulsividade', 'Terapia cognitivo-comportamental',
    ]
  },
  {
    label: 'Inclusão', emoji: '🤝', cor: '#3D9970', corFundo: '#E8F5EE',
    termos: [
      'Inclusão escolar', 'Lei Brasileira de Inclusão', 'Educação especial no Brasil',
      'Acessibilidade', 'Sala de recursos multifuncionais', 'Adaptação curricular',
      'Atendimento educacional especializado', 'Escola inclusiva',
    ]
  },
  {
    label: 'Direitos', emoji: '⚖️', cor: '#C0392B', corFundo: '#FDECEA',
    termos: [
      'Lei Orgânica da Assistência Social', 'Benefício de Prestação Continuada',
      'Estatuto da Pessoa com Deficiência', 'Estatuto da Criança e do Adolescente',
      'Convenção sobre os Direitos das Pessoas com Deficiência',
      'Cadastro Único para Programas Sociais', 'LOAS', 'CAPS',
    ]
  },
  {
    label: 'Terapias', emoji: '💚', cor: colors.purpleDark, corFundo: colors.purpleLight,
    termos: [
      'Fonoaudiologia', 'Terapia ocupacional', 'Fisioterapia pediátrica',
      'Psicologia infantil', 'Hidroterapia', 'Musicoterapia',
      'Equoterapia', 'Psicopedagogia',
    ]
  },
]

type Categoria = typeof CATEGORIAS[0]

type Artigo = {
  id: string
  title: string
  extract: string
  thumbnail?: { source: string }
  content_urls?: { mobile?: { page: string }; desktop?: { page: string } }
  categoria: string
  emoji: string
  cor: string
  corFundo: string
}

// ─── BUSCA INDIVIDUAL ─────────────────────────────────────────────────────────
async function buscarArtigo(termo: string, categoria: Categoria): Promise<Artigo | null> {
  try {
    const slug = encodeURIComponent(termo.replace(/ /g, '_'))
    const res = await fetch(`${WIKI_API}${slug}`, {
      headers: { 'Accept': 'application/json' }
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.title || !data.extract || data.type === 'disambiguation') return null
    return {
      id: String(data.pageid),
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail,
      content_urls: data.content_urls,
      categoria: categoria.label,
      emoji: categoria.emoji,
      cor: categoria.cor,
      corFundo: categoria.corFundo,
    }
  } catch {
    return null
  }
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function ArtigoCard({ item }: { item: Artigo }) {
  const url = item.content_urls?.mobile?.page || item.content_urls?.desktop?.page || ''
  const imagemUrl = item.thumbnail?.source
    ? item.thumbnail.source.replace(/\/\d+px-/, '/600px-')
    : null

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => url && Linking.openURL(url)}
    >
      <View style={styles.cardImagemWrap}>
        {imagemUrl ? (
          <Image source={{ uri: imagemUrl }} style={styles.cardImagem} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagem, { backgroundColor: item.corFundo, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 48 }}>{item.emoji}</Text>
            <Text style={{ fontSize: 13, color: item.cor, fontWeight: '600', marginTop: 8 }}>{item.categoria}</Text>
          </View>
        )}
        <View style={[styles.imagemBadge, { backgroundColor: item.cor }]}>
          <Text style={styles.imagemBadgeEmoji}>{item.emoji}</Text>
          <Text style={styles.imagemBadgeTexto}>{item.categoria}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitulo} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDescricao} numberOfLines={3}>{item.extract}</Text>
        <View style={styles.cardRodape}>
          <View style={[styles.wikiTag, { backgroundColor: item.corFundo }]}>
            <Text style={[styles.wikiTexto, { color: item.cor }]}>📖 Wikipedia</Text>
          </View>
          <Text style={[styles.lerMais, { color: item.cor }]}>Ler mais →</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── RODAPÉ DA LISTA  ───────────────────────────
function RodapeCarregando({ carregando, cor }: { carregando: boolean; cor: string }) {
  if (!carregando) return (
    <View style={styles.rodape}>
      <Text style={styles.rodapeTexto}>Fonte: Wikipedia em Português 🇧🇷</Text>
    </View>
  )
  return (
    <View style={styles.rodapeCarregando}>
      <ActivityIndicator size="small" color={cor} />
      <Text style={[styles.rodapeCarregandoTexto, { color: cor }]}>Carregando mais artigos...</Text>
    </View>
  )
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function SuporteScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const [artigos, setArtigos]             = useState<Artigo[]>([])
  const [carregando, setCarregando]       = useState(false)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [refreshing, setRefreshing]       = useState(false)
  const [erro, setErro]                   = useState<string | null>(null)
  const [categoriaAtiva, setCategoriaAtiva] = useState(0)

  // Controle de paginação — qual índice do array de termos já foi carregado
  const paginaAtual   = useRef(0)
  const temMais       = useRef(true)
  const carregandoRef = useRef(false) // evita chamadas duplicadas

  const categoriaAtual = CATEGORIAS[categoriaAtiva]

  // ── Carrega a primeira página ──────────────────────────────────────────────
  const carregarPrimeiraPagina = useCallback(async (catIndex: number) => {
    setCarregando(true)
    setErro(null)
    setArtigos([])
    paginaAtual.current = 0
    temMais.current = true
    carregandoRef.current = true

    try {
      const cat = CATEGORIAS[catIndex]
      const termosDaPagina = cat.termos.slice(0, ITENS_POR_PAGINA)
      const resultados = await Promise.all(termosDaPagina.map(t => buscarArtigo(t, cat)))
      const validos = resultados.filter((a): a is Artigo => a !== null)

      if (validos.length === 0) throw new Error('Nenhum artigo encontrado')

      setArtigos(validos)
      paginaAtual.current = ITENS_POR_PAGINA

      // Se já carregamos todos os termos, não tem mais páginas
      if (ITENS_POR_PAGINA >= cat.termos.length) temMais.current = false

    } catch {
      setErro('Não foi possível carregar os artigos. Verifique sua conexão.')
    } finally {
      setCarregando(false)
      setRefreshing(false)
      carregandoRef.current = false
    }
  }, [])

  // ── Carrega a próxima página ao rolar até o fim ────────────────────────────
  const carregarMais = useCallback(async () => {
    if (carregandoRef.current || !temMais.current) return

    const cat = CATEGORIAS[categoriaAtiva]
    const inicio = paginaAtual.current
    const fim    = inicio + ITENS_POR_PAGINA

    if (inicio >= cat.termos.length) {
      temMais.current = false
      return
    }

    carregandoRef.current = true
    setCarregandoMais(true)

    try {
      const termosDaPagina = cat.termos.slice(inicio, fim)
      const resultados = await Promise.all(termosDaPagina.map(t => buscarArtigo(t, cat)))
      const validos = resultados.filter((a): a is Artigo => a !== null)

      setArtigos(prev => {
        // Evita duplicatas pelo id
        const idsExistentes = new Set(prev.map(a => a.id))
        const novos = validos.filter(a => !idsExistentes.has(a.id))
        return [...prev, ...novos]
      })

      paginaAtual.current = fim

      if (fim >= cat.termos.length) temMais.current = false

    } catch {
      // Falha silenciosa ao carregar mais — usuário pode tentar novamente rolando
    } finally {
      setCarregandoMais(false)
      carregandoRef.current = false
    }
  }, [categoriaAtiva])

  // ── Troca de categoria — reinicia paginação ────────────────────────────────
  useEffect(() => {
    carregarPrimeiraPagina(categoriaAtiva)
  }, [categoriaAtiva, carregarPrimeiraPagina])

  const onRefresh = () => {
    setRefreshing(true)
    carregarPrimeiraPagina(categoriaAtiva)
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Suporte aos Pais</Text>
        <Text style={styles.headerSubtitulo}>Informações sobre crianças atípicas em português</Text>
      </View>

      {/* Categorias */}
      <View style={styles.categoriasWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriasScroll}>
          {CATEGORIAS.map((cat, index) => (
            <TouchableOpacity
              key={cat.label}
              style={[
                styles.categoriaBtn,
                { borderColor: cat.cor },
                index === categoriaAtiva && { backgroundColor: cat.cor }
              ]}
              onPress={() => index !== categoriaAtiva && setCategoriaAtiva(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoriaEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoriaBtnTexto,
                { color: index === categoriaAtiva ? colors.bgCard : cat.cor }
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Carregando primeira página */}
      {carregando && (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={categoriaAtual.cor} />
          <Text style={styles.carregandoTexto}>
            Buscando artigos sobre {categoriaAtual.label}...
          </Text>
        </View>
      )}

      {/* Erro */}
      {erro && !carregando && (
        <View style={styles.centro}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={styles.erroTexto}>{erro}</Text>
          <TouchableOpacity
            style={[styles.tentarNovamenteBtn, { backgroundColor: categoriaAtual.cor }]}
            onPress={() => carregarPrimeiraPagina(categoriaAtiva)}
          >
            <Text style={styles.tentarNovamenteTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista com paginação */}
      {!carregando && artigos.length > 0 && (
        <FlatList
          data={artigos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ArtigoCard item={item} />}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}

          // ── PAGINAÇÃO ────────────────────────────────────────────────────────
          onEndReached={carregarMais}         // dispara ao chegar no fim
          onEndReachedThreshold={0.3}         // 30% antes do fim já carrega

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[categoriaAtual.cor]}
              tintColor={categoriaAtual.cor}
            />
          }

          ListFooterComponent={
            <RodapeCarregando
              carregando={carregandoMais}
              cor={categoriaAtual.cor}
            />
          }
        />
      )}
    </View>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },

  header: {
    backgroundColor: colors.purpleDark,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 24, fontWeight: '700', color: colors.bgCard, marginBottom: 4 },
  headerSubtitulo: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },

  categoriasWrap: { paddingVertical: 14 },
  categoriasScroll: { paddingHorizontal: 16, gap: 8 },
  categoriaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bgCard,
  },
  categoriaEmoji: { fontSize: 14 },
  categoriaBtnTexto: { fontSize: 12, fontWeight: '700' },

  lista: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    },

  cardImagemWrap: { position: 'relative' },
  cardImagem: { width: '100%', height: 200 },
  imagemBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imagemBadgeEmoji: { fontSize: 12 },
  imagemBadgeTexto: { fontSize: 12, fontWeight: '700', color: colors.bgCard },

  cardBody: { padding: 16, gap: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, lineHeight: 22 },
  cardDescricao: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  cardRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    marginTop: 4,
  },
  wikiTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  wikiTexto: { fontSize: 12, fontWeight: '600' },
  lerMais: { fontSize: 12, fontWeight: '700' },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  carregandoTexto: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  erroTexto: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  tentarNovamenteBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  tentarNovamenteTexto: { fontSize: 14, fontWeight: '700', color: colors.bgCard },

  rodape: { paddingVertical: 20, alignItems: 'center' },
  rodapeTexto: { fontSize: 12, color: colors.textMuted },

  rodapeCarregando: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  rodapeCarregandoTexto: { fontSize: 13, fontWeight: '600' },
})