import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { colors, typo, space, radius, rs } from '../../theme'
import { useAuth } from '../../context/AuthContext'

type ModalTipo = 'dados' | 'senha' | 'endereco' | 'pagamento' | 'apagarConta' | null

function ItemConfig({
  emoji,
  titulo,
  subtitulo,
  onPress,
  cor = '#1A2B4A',
  direita,
}: {
  emoji: string
  titulo: string
  subtitulo?: string
  onPress?: () => void
  cor?: string
  direita?: React.ReactNode
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.itemEsquerda}>
        <Text style={styles.itemEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitulo, { color: cor }]}>{titulo}</Text>
          {subtitulo ? <Text style={styles.itemSub}>{subtitulo}</Text> : null}
        </View>
      </View>
      {direita ?? (onPress ? <Text style={styles.itemSeta}>›</Text> : null)}
    </TouchableOpacity>
  )
}

export default function ConfiguracoesFamiliarScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { sair, user, atualizarPerfil, mudarSenha, apagarConta, buscarDadosPerfil } = useAuth()

  const [modalAberto, setModalAberto] = useState<ModalTipo>(null)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Notificações
  const [notifConsultas, setNotifConsultas] = useState(true)
  const [notifMensagens, setNotifMensagens] = useState(true)
  const [notifDicas, setNotifDicas] = useState(false)

  // Dados pessoais
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nomeFilho, setNomeFilho] = useState('')
  const [diagnostico, setDiagnostico] = useState('')

  // Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  // Endereço
  const [rua, setRua] = useState('')
  const [cidade, setCidade] = useState('')
  const [cep, setCep] = useState('')

  // Apagar conta
  const [senhaParaApagar, setSenhaParaApagar] = useState('')

  // Carrega dados do Firestore ao abrir a tela
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const dados = await buscarDadosPerfil()
      if (dados) {
        setNome(String(dados.nome || ''))
        setTelefone(String(dados.telefone || ''))
        setNomeFilho(String(dados.nomeFilho || ''))
        setDiagnostico(String(dados.diagnostico || ''))
        const end = (dados.endereco as Record<string, unknown>) ?? {}
        setRua(String(end.rua || ''))
        setCidade(String(end.cidade || ''))
        setCep(String(end.cep || ''))
      }
    } catch (e) {
      console.log('Erro ao carregar dados:', e)
    } finally {
      setCarregando(false)
    }
  }

  const fecharModal = () => {
    setModalAberto(null)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setSenhaParaApagar('')
  }

  const handleSair = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setSalvando(true)
          try {
            await sair()
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.')
          } finally {
            setSalvando(false)
          }
        },
      },
    ])
  }

  const handleSalvarDados = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.')
      return
    }
    setSalvando(true)
    try {
      await atualizarPerfil({ nome, telefone, nomeFilho, diagnostico })
      Alert.alert('✅ Salvo', 'Dados atualizados com sucesso!')
      fecharModal()
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarEndereco = async () => {
    setSalvando(true)
    try {
      await atualizarPerfil({ endereco: { rua, cidade, cep } })
      Alert.alert('✅ Salvo', 'Endereço atualizado com sucesso!')
      fecharModal()
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o endereço.')
    } finally {
      setSalvando(false)
    }
  }

  const handleMudarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.')
      return
    }
    if (novaSenha.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSalvando(true)
    try {
      await mudarSenha(senhaAtual, novaSenha)
      Alert.alert('✅ Senha alterada', 'Sua senha foi atualizada com sucesso!')
      fecharModal()
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Senha atual incorreta.'
        : 'Erro ao alterar senha. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setSalvando(false)
    }
  }

  const handleApagarConta = async () => {
    if (!senhaParaApagar) {
      Alert.alert('Atenção', 'Digite sua senha para confirmar.')
      return
    }
    Alert.alert(
      '⚠️ Tem certeza?',
      'Essa ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar conta',
          style: 'destructive',
          onPress: async () => {
            setSalvando(true)
            try {
              await apagarConta(senhaParaApagar)
              // RootNavigator redireciona automaticamente pro Onboarding
            } catch (e: any) {
              const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
                ? 'Senha incorreta.'
                : 'Erro ao apagar conta. Tente novamente.'
              Alert.alert('Erro', msg)
            } finally {
              setSalvando(false)
            }
          },
        },
      ]
    )
  }

  if (carregando) {
    return (
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color="#5B9BD5" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Configurações</Text>
        <Text style={styles.headerSub}>Gerencie sua conta · {user?.email}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* CONTA */}
        <Text style={styles.secaoTitulo}>Conta</Text>
        <View style={styles.card}>
          <ItemConfig emoji="👤" titulo="Dados pessoais" subtitulo="Nome, telefone, filho e diagnóstico" onPress={() => setModalAberto('dados')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="🔒" titulo="Mudar senha" subtitulo="Alterar sua senha de acesso" onPress={() => setModalAberto('senha')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="📍" titulo="Endereço" subtitulo="Rua, cidade e CEP" onPress={() => setModalAberto('endereco')} />
        </View>

        {/* FINANCEIRO */}
        <Text style={styles.secaoTitulo}>Financeiro</Text>
        <View style={styles.card}>
          <ItemConfig emoji="💳" titulo="Pagamentos e assinatura" subtitulo="Plano atual, histórico e métodos" onPress={() => setModalAberto('pagamento')} />
        </View>

        {/* NOTIFICAÇÕES */}
        <Text style={styles.secaoTitulo}>Notificações</Text>
        <View style={styles.card}>
          <ItemConfig
            emoji="📅" titulo="Lembretes de consulta"
            direita={<Switch value={notifConsultas} onValueChange={setNotifConsultas} trackColor={{ false: '#D1D5DB', true: colors.blue }} thumbColor="#fff" />}
          />
          <View style={styles.divisor} />
          <ItemConfig
            emoji="💬" titulo="Mensagens"
            direita={<Switch value={notifMensagens} onValueChange={setNotifMensagens} trackColor={{ false: '#D1D5DB', true: colors.blue }} thumbColor="#fff" />}
          />
          <View style={styles.divisor} />
          <ItemConfig
            emoji="💡" titulo="Dicas e novidades"
            direita={<Switch value={notifDicas} onValueChange={setNotifDicas} trackColor={{ false: '#D1D5DB', true: colors.blue }} thumbColor="#fff" />}
          />
        </View>

        {/* SUPORTE */}
        <Text style={styles.secaoTitulo}>Suporte</Text>
        <View style={styles.card}>
          <ItemConfig emoji="🆘" titulo="Central de ajuda" subtitulo="Dúvidas e tutoriais" onPress={() => Alert.alert('Em breve', 'Central de ajuda em desenvolvimento.')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="📩" titulo="Falar com o suporte" subtitulo="Enviar uma mensagem" onPress={() => Alert.alert('Em breve', 'Chat de suporte em desenvolvimento.')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="⭐" titulo="Avaliar o app" onPress={() => Alert.alert('Obrigado!', 'Sua avaliação é muito importante para nós.')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="👥" titulo="Sobre o grupo" subtitulo="Conheça a equipe do Zelo" onPress={() => (navigation as any)?.navigate?.('SobreOGrupo')} />
        </View>

        {/* SESSÃO */}
        <Text style={styles.secaoTitulo}>Sessão</Text>
        <View style={styles.card}>
          <ItemConfig emoji="🚪" titulo="Sair da conta" cor="#E8643A" onPress={handleSair} />
          <View style={styles.divisor} />
          <ItemConfig emoji="🗑️" titulo="Apagar minha conta" subtitulo="Remove todos os dados permanentemente" cor="#CC2936" onPress={() => setModalAberto('apagarConta')} />
        </View>

        <Text style={styles.versao}>Zelo v1.0.0</Text>
      </ScrollView>

      {/* ── MODAL: DADOS PESSOAIS ── */}
      <Modal visible={modalAberto === 'dados'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Dados pessoais</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Telefone</Text>
            <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} placeholder="(11) 99999-9999" keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Nome do filho/dependente</Text>
            <TextInput style={styles.input} value={nomeFilho} onChangeText={setNomeFilho} placeholder="Nome do filho" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Diagnóstico</Text>
            <TextInput style={styles.input} value={diagnostico} onChangeText={setDiagnostico} placeholder="Ex: TEA, TDAH..." placeholderTextColor="#9CA3AF" />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesativado]} onPress={handleSalvarDados} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar alterações</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── MODAL: SENHA ── */}
      <Modal visible={modalAberto === 'senha'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Mudar senha</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.label}>Senha atual</Text>
            <TextInput style={styles.input} value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Nova senha</Text>
            <TextInput style={styles.input} value={novaSenha} onChangeText={setNovaSenha} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Confirmar nova senha</Text>
            <TextInput style={styles.input} value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesativado]} onPress={handleMudarSenha} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Alterar senha</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── MODAL: ENDEREÇO ── */}
      <Modal visible={modalAberto === 'endereco'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Endereço</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.label}>Rua e número</Text>
            <TextInput style={styles.input} value={rua} onChangeText={setRua} placeholder="Rua das Flores, 123" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Cidade</Text>
            <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="São Paulo" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>CEP</Text>
            <TextInput style={styles.input} value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesativado]} onPress={handleSalvarEndereco} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar endereço</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── MODAL: PAGAMENTO ── */}
      <Modal visible={modalAberto === 'pagamento'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Pagamentos</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.planoCard}>
              <Text style={styles.planoLabel}>Plano atual</Text>
              <Text style={styles.planoNome}>✨ Gratuito</Text>
              <Text style={styles.planoDescricao}>Acesso básico ao Zelo</Text>
            </View>
            <TouchableOpacity style={styles.botaoPremium} onPress={() => Alert.alert('Em breve', 'Planos premium em desenvolvimento.')}>
              <Text style={styles.botaoPremiumTexto}>🚀 Fazer upgrade para Premium</Text>
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 24 }]}>Histórico de pagamentos</Text>
            <Text style={styles.semHistorico}>Nenhum pagamento registrado ainda.</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* ── MODAL: APAGAR CONTA ── */}
      <Modal visible={modalAberto === 'apagarConta'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitulo, { color: '#CC2936' }]}>⚠️ Apagar conta</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.avisoApagar}>
              Esta ação é permanente e não pode ser desfeita. Todos os seus dados, histórico e informações serão removidos para sempre.
            </Text>
            <Text style={styles.label}>Digite sua senha para confirmar</Text>
            <TextInput style={styles.input} value={senhaParaApagar} onChangeText={setSenhaParaApagar} secureTextEntry placeholder="••••••••" placeholderTextColor="#9CA3AF" />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoApagar, salvando && styles.botaoDesativado]} onPress={handleApagarConta} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Apagar minha conta</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {salvando && !modalAberto && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5B9BD5" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F7FB' },
  header: { backgroundColor: colors.blue, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
  voltarBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  secaoTitulo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  itemEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemEmoji: { fontSize: 20 },
  itemTitulo: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  itemSeta: { fontSize: 22, color: '#C4CDD6', fontWeight: '300' },
  divisor: { height: 1, backgroundColor: '#F0F4F8', marginLeft: 52 },
  versao: { textAlign: 'center', color: '#B0BAC4', fontSize: 12, marginTop: 24 },
  modal: { flex: 1, backgroundColor: '#F4F7FB' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#1A2B4A' },
  modalFechar: { fontSize: 18, color: colors.textMuted, padding: 4 },
  modalScroll: { flex: 1, padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6A7A', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A2B4A', borderWidth: 1, borderColor: '#E2E8F0' },
  botaoSalvar: { backgroundColor: colors.blue, margin: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  botaoApagar: { backgroundColor: '#CC2936', margin: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  botaoDesativado: { opacity: 0.6 },
  botaoSalvarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  planoCard: { backgroundColor: colors.blueLight, borderRadius: 14, padding: 16, marginTop: 16, alignItems: 'center' },
  planoLabel: { fontSize: 12, color: colors.blue, fontWeight: '600', textTransform: 'uppercase' },
  planoNome: { fontSize: 22, fontWeight: '700', color: '#1A2B4A', marginTop: 4 },
  planoDescricao: { fontSize: 13, color: '#5A6A7A', marginTop: 4 },
  botaoPremium: { backgroundColor: '#1A2B4A', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  botaoPremiumTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  semHistorico: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 12 },
  avisoApagar: { backgroundColor: colors.dangerBg, borderRadius: 12, padding: 14, color: '#CC2936', fontSize: 14, lineHeight: 20, marginTop: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
})