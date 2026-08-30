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

type ModalTipo = 'dados' | 'senha' | 'endereco' | 'bancario' | 'horarios' | 'apagarConta' | null

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

export default function ConfiguracoesProfissionalScreen() {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { sair, user, atualizarPerfil, mudarSenha, apagarConta, buscarDadosPerfil } = useAuth()

  const [modalAberto, setModalAberto] = useState<ModalTipo>(null)
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Notificações
  const [notifConsultas, setNotifConsultas] = useState(true)
  const [notifMensagens, setNotifMensagens] = useState(true)
  const [notifAvaliacao, setNotifAvaliacao] = useState(true)
  const [notifDicas, setNotifDicas] = useState(false)

  // Dados profissionais
  const [bio, setBio] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [conselho, setConselho] = useState('')
  const [valor, setValor] = useState('')
  const [anosExp, setAnosExp] = useState('')

  // Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  // Endereço consultório
  const [rua, setRua] = useState('')
  const [cidade, setCidade] = useState('')
  const [cep, setCep] = useState('')
  const [complemento, setComplemento] = useState('')

  // Dados bancários
  const [banco, setBanco] = useState('')
  const [agencia, setAgencia] = useState('')
  const [conta, setConta] = useState('')
  const [tipoConta, setTipoConta] = useState<'corrente' | 'poupanca'>('corrente')
  const [pixChave, setPixChave] = useState('')

  // Apagar conta
  const [senhaParaApagar, setSenhaParaApagar] = useState('')

  // Carrega dados do Firestore ao abrir
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const dados = await buscarDadosPerfil()
      if (dados) {
        setBio(String(dados.bio || ''))
        setEspecialidade(String(dados.especialidade || ''))
        setConselho(String(dados.conselho || ''))
        setValor(String(dados.valorConsulta || ''))
        setAnosExp(String(dados.anosExperiencia || ''))
        const end = (dados.endereco as Record<string, unknown>) ?? {}
        const ban = (dados.bancario as Record<string, unknown>) ?? {}
        setRua(String(end.rua || ''))
        setCidade(String(end.cidade || ''))
        setCep(String(end.cep || ''))
        setComplemento(String(end.complemento || ''))
        setBanco(String(ban.banco || ''))
        setAgencia(String(ban.agencia || ''))
        setConta(String(ban.conta || ''))
        setTipoConta((ban.tipoConta as 'corrente' | 'poupanca') || 'corrente')
        setPixChave(String(ban.pixChave || ''))
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
    setSalvando(true)
    try {
      await atualizarPerfil({
        bio,
        especialidade,
        conselho,
        valorConsulta: valor,
        anosExperiencia: anosExp,
      })
      Alert.alert('✅ Salvo', 'Dados profissionais atualizados!')
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
      await atualizarPerfil({
        endereco: { rua, cidade, cep, complemento }
      })
      Alert.alert('✅ Salvo', 'Endereço atualizado!')
      fecharModal()
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o endereço.')
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarBancario = async () => {
    setSalvando(true)
    try {
      await atualizarPerfil({
        bancario: { banco, agencia, conta, tipoConta, pixChave }
      })
      Alert.alert('✅ Salvo', 'Dados bancários atualizados!')
      fecharModal()
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar os dados bancários.')
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
      'Essa ação é permanente. Seu perfil, agenda e histórico serão removidos para sempre.',
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
        <ActivityIndicator size="large" color="#7B4FA6" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Configurações</Text>
        <Text style={styles.headerSub}>Gerencie seu perfil profissional · {user?.email}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* PERFIL PROFISSIONAL */}
        <Text style={styles.secaoTitulo}>Perfil profissional</Text>
        <View style={styles.card}>
          <ItemConfig emoji="🧠" titulo="Dados profissionais" subtitulo="Bio, especialidade, conselho e valor" onPress={() => setModalAberto('dados')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="🕐" titulo="Horários de atendimento" subtitulo="Defina sua disponibilidade" onPress={() => setModalAberto('horarios')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="📍" titulo="Endereço do consultório" subtitulo="Rua, cidade e CEP" onPress={() => setModalAberto('endereco')} />
        </View>

        {/* FINANCEIRO */}
        <Text style={styles.secaoTitulo}>Financeiro</Text>
        <View style={styles.card}>
          <ItemConfig emoji="💰" titulo="Dados bancários" subtitulo="Banco, agência, conta e PIX" onPress={() => setModalAberto('bancario')} />
          <View style={styles.divisor} />
          <ItemConfig emoji="📊" titulo="Extrato de recebimentos" subtitulo="Histórico de pagamentos recebidos" onPress={() => Alert.alert('Em breve', 'Extrato em desenvolvimento.')} />
        </View>

        {/* CONTA */}
        <Text style={styles.secaoTitulo}>Conta</Text>
        <View style={styles.card}>
          <ItemConfig emoji="🔒" titulo="Mudar senha" subtitulo="Alterar sua senha de acesso" onPress={() => setModalAberto('senha')} />
        </View>

        {/* NOTIFICAÇÕES */}
        <Text style={styles.secaoTitulo}>Notificações</Text>
        <View style={styles.card}>
          <ItemConfig emoji="📅" titulo="Novas consultas"
            direita={<Switch value={notifConsultas} onValueChange={setNotifConsultas} trackColor={{ false: '#D1D5DB', true: colors.purpleDark }} thumbColor="#fff" />}
          />
          <View style={styles.divisor} />
          <ItemConfig emoji="💬" titulo="Mensagens de pacientes"
            direita={<Switch value={notifMensagens} onValueChange={setNotifMensagens} trackColor={{ false: '#D1D5DB', true: colors.purpleDark }} thumbColor="#fff" />}
          />
          <View style={styles.divisor} />
          <ItemConfig emoji="⭐" titulo="Novas avaliações"
            direita={<Switch value={notifAvaliacao} onValueChange={setNotifAvaliacao} trackColor={{ false: '#D1D5DB', true: colors.purpleDark }} thumbColor="#fff" />}
          />
          <View style={styles.divisor} />
          <ItemConfig emoji="💡" titulo="Dicas e novidades"
            direita={<Switch value={notifDicas} onValueChange={setNotifDicas} trackColor={{ false: '#D1D5DB', true: colors.purpleDark }} thumbColor="#fff" />}
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

      {/* ── MODAL: DADOS PROFISSIONAIS ── */}
      <Modal visible={modalAberto === 'dados'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Dados profissionais</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.label}>Especialidade</Text>
            <TextInput style={styles.input} value={especialidade} onChangeText={setEspecialidade} placeholder="Ex: Psicologia, Fonoaudiologia..." placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Número do conselho (CRP, CRFa...)</Text>
            <TextInput style={styles.input} value={conselho} onChangeText={setConselho} placeholder="Ex: CRP/RJ 05-12345" placeholderTextColor="#9CA3AF" autoCapitalize="characters" />
            <Text style={styles.label}>Valor da consulta (R$)</Text>
            <TextInput style={styles.input} value={valor} onChangeText={setValor} placeholder="Ex: 200" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Anos de experiência</Text>
            <TextInput style={styles.input} value={anosExp} onChangeText={setAnosExp} placeholder="Ex: 8" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Bio / Apresentação</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} placeholder="Fale um pouco sobre você e sua abordagem..." placeholderTextColor="#9CA3AF" multiline />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesativado]} onPress={handleSalvarDados} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar alterações</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── MODAL: HORÁRIOS ── */}
      <Modal visible={modalAberto === 'horarios'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Horários de atendimento</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia) => (
              <HorarioDia key={dia} dia={dia} />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.botaoSalvar} onPress={() => { Alert.alert('✅ Salvo', 'Horários atualizados!'); fecharModal() }}>
            <Text style={styles.botaoSalvarTexto}>Salvar horários</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── MODAL: ENDEREÇO ── */}
      <Modal visible={modalAberto === 'endereco'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Endereço do consultório</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.label}>Rua e número</Text>
            <TextInput style={styles.input} value={rua} onChangeText={setRua} placeholder="Av. Paulista, 1000" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Complemento</Text>
            <TextInput style={styles.input} value={complemento} onChangeText={setComplemento} placeholder="Sala 42, 3º andar" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Cidade</Text>
            <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="Rio de Janeiro" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>CEP</Text>
            <TextInput style={styles.input} value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesativado]} onPress={handleSalvarEndereco} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar endereço</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── MODAL: DADOS BANCÁRIOS ── */}
      <Modal visible={modalAberto === 'bancario'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Dados bancários</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.label}>Banco</Text>
            <TextInput style={styles.input} value={banco} onChangeText={setBanco} placeholder="Ex: Nubank, Itaú, Bradesco..." placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Agência</Text>
            <TextInput style={styles.input} value={agencia} onChangeText={setAgencia} placeholder="0000" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Número da conta</Text>
            <TextInput style={styles.input} value={conta} onChangeText={setConta} placeholder="00000-0" keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Tipo de conta</Text>
            <View style={styles.tipoContaRow}>
              <TouchableOpacity style={[styles.tipoContaBtn, tipoConta === 'corrente' && styles.tipoContaBtnAtivo]} onPress={() => setTipoConta('corrente')}>
                <Text style={[styles.tipoContaTexto, tipoConta === 'corrente' && styles.tipoContaTextoAtivo]}>Corrente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tipoContaBtn, tipoConta === 'poupanca' && styles.tipoContaBtnAtivo]} onPress={() => setTipoConta('poupanca')}>
                <Text style={[styles.tipoContaTexto, tipoConta === 'poupanca' && styles.tipoContaTextoAtivo]}>Poupança</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Chave PIX</Text>
            <TextInput style={styles.input} value={pixChave} onChangeText={setPixChave} placeholder="CPF, e-mail ou telefone" placeholderTextColor="#9CA3AF" />
          </ScrollView>
          <TouchableOpacity style={[styles.botaoSalvar, salvando && styles.botaoDesativado]} onPress={handleSalvarBancario} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoSalvarTexto}>Salvar dados bancários</Text>}
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

      {/* ── MODAL: APAGAR CONTA ── */}
      <Modal visible={modalAberto === 'apagarConta'} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitulo, { color: '#CC2936' }]}>⚠️ Apagar conta</Text>
            <TouchableOpacity onPress={fecharModal}><Text style={styles.modalFechar}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.avisoApagar}>
              Esta ação é permanente e não pode ser desfeita. Todos os seus dados, agenda e histórico serão removidos para sempre.
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
          <ActivityIndicator size="large" color="#7B4FA6" />
        </View>
      )}
    </View>
  )
}

function HorarioDia({ dia }: { dia: string }) {
  const [ativo, setAtivo] = useState(dia !== 'Sábado')
  const [inicio, setInicio] = useState('08:00')
  const [fim, setFim] = useState('18:00')

  return (
    <View style={styles.horarioDia}>
      <View style={styles.horarioDiaHeader}>
        <Text style={styles.horarioDiaNome}>{dia}</Text>
        <Switch value={ativo} onValueChange={setAtivo} trackColor={{ false: '#D1D5DB', true: colors.purpleDark }} thumbColor="#fff" />
      </View>
      {ativo && (
        <View style={styles.horarioInputsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.horarioLabel}>Início</Text>
            <TextInput style={styles.horarioInput} value={inicio} onChangeText={setInicio} placeholder="08:00" placeholderTextColor="#9CA3AF" />
          </View>
          <Text style={styles.horarioSeparador}>→</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.horarioLabel}>Fim</Text>
            <TextInput style={styles.horarioInput} value={fim} onChangeText={setFim} placeholder="18:00" placeholderTextColor="#9CA3AF" />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F0F8' },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F0F8' },
  header: { backgroundColor: colors.purpleDark, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 12 },
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
  modal: { flex: 1, backgroundColor: '#F4F0F8' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#1A2B4A' },
  modalFechar: { fontSize: 18, color: colors.textMuted, padding: 4 },
  modalScroll: { flex: 1, padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6A7A', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A2B4A', borderWidth: 1, borderColor: '#E2E8F0' },
  botaoSalvar: { backgroundColor: colors.purpleDark, margin: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  botaoApagar: { backgroundColor: '#CC2936', margin: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  botaoDesativado: { opacity: 0.6 },
  botaoSalvarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tipoContaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  tipoContaBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#fff' },
  tipoContaBtnAtivo: { backgroundColor: colors.purpleDark, borderColor: colors.purpleDark },
  tipoContaTexto: { fontSize: 14, fontWeight: '600', color: '#5A6A7A' },
  tipoContaTextoAtivo: { color: '#fff' },
  horarioDia: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  horarioDiaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  horarioDiaNome: { fontSize: 15, fontWeight: '600', color: '#1A2B4A' },
  horarioInputsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  horarioLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  horarioInput: { backgroundColor: '#F4F0F8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1A2B4A', textAlign: 'center' },
  horarioSeparador: { fontSize: 16, color: colors.textMuted, marginTop: 16 },
  avisoApagar: { backgroundColor: colors.dangerBg, borderRadius: 12, padding: 14, color: '#CC2936', fontSize: 14, lineHeight: 20, marginTop: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
})