import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, typo, space, radius, rs } from '../../theme'
import { useAuth } from '../../context/AuthContext'
import { validarCPF, mascaraCPF, mascaraTelefone, validarEmail } from '../../utils/masks'

const ESPECIALIDADES = [
  { nome: 'Psicologia',          emoji: '🧠', sigla: 'CRP'     },
  { nome: 'Fonoaudiologia',      emoji: '🗣️', sigla: 'CRFa'    },
  { nome: 'Fisioterapia',        emoji: '🏃', sigla: 'CREFITO' },
  { nome: 'Ter. Ocupacional',    emoji: '✋', sigla: 'CREFITO' },
  { nome: 'Nutrição',            emoji: '🥗', sigla: 'CRN'     },
  { nome: 'Musicoterapia',       emoji: '🎵', sigla: 'CBM'     },
  { nome: 'Psicopedagogia',      emoji: '📖', sigla: 'ABPp'    },
  { nome: 'Educação Física',     emoji: '⚽', sigla: 'CREF'    },
  { nome: 'Neuropsicologia',     emoji: '🔬', sigla: 'CRP'     },
  { nome: 'Psicomotricidade',    emoji: '🤸', sigla: 'ABP'     },
]

type Props = { navigation: any }

export default function CadastroProfissionalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { cadastrar } = useAuth()

  const nomeRef      = useRef('')
  const emailRef     = useRef('')
  const cpfRef       = useRef('')
  const telefoneRef  = useRef('')
  const senhaRef     = useRef('')
  const confSenhaRef = useRef('')
  const conselhoRef  = useRef('')
  const bioRef       = useRef('')
  const anosRef      = useRef('')
  const valorRef     = useRef('')

  const [cpfVal, setCpfVal]           = useState('')
  const [telVal, setTelVal]           = useState('')
  const [conselhoVal, setConselhoVal] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [modalidades, setModalidades] = useState<string[]>([])
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando]   = useState(false)
  const [erros, setErros]             = useState<Record<string, string>>({})

  const limparErro = (campo: string) => setErros(e => ({ ...e, [campo]: '' }))

  const toggleModalidade = (m: string) => {
    setModalidades(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  const espSelecionada = ESPECIALIDADES.find(e => e.nome === especialidade)
  const siglaCons = espSelecionada?.sigla || 'CRP'

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nomeRef.current.trim())     e.nome = 'Nome obrigatório'
    if (!/\S+@\S+\.\S+/.test(emailRef.current)) e.email = 'E-mail inválido'
    if (!validarCPF(cpfRef.current)) e.cpf = 'CPF inválido'
    if (telefoneRef.current.replace(/\D/g,'').length < 10) e.telefone = 'Telefone inválido'
    if (senhaRef.current.length < 6) e.senha = 'Mínimo 6 caracteres'
    if (senhaRef.current !== confSenhaRef.current) e.confirmarSenha = 'Senhas não coincidem'
    if (!especialidade)              e.especialidade = 'Selecione a especialidade'
    if (!conselhoRef.current.trim()) e.conselho = 'Número do conselho obrigatório'
    setErros(e)
    return Object.keys(e).length === 0
  }

  const handleCadastro = async () => {
    if (!validar()) return
    setCarregando(true)
    try {
      await cadastrar(emailRef.current.trim(), senhaRef.current, {
        nome: nomeRef.current,
        cpf: cpfRef.current.replace(/\D/g,''),
        telefone: telefoneRef.current,
        especialidade,
        conselho: conselhoRef.current.toUpperCase(),
        bio: bioRef.current,
        anosExperiencia: anosRef.current,
        modalidades,
        valorConsulta: valorRef.current,
      }, 'profissional')
      
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado'
        : 'Erro ao cadastrar. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Cadastro — Profissional</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.secaoTitulo}>👤 Dados pessoais</Text>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput style={[styles.input, erros.nome && styles.inputErro]}
            placeholder="Dra. Ana Souza" placeholderTextColor="#A0A8B3"
            onChangeText={v => { nomeRef.current = v; limparErro('nome') }}
            autoCapitalize="words" />
          {erros.nome ? <Text style={styles.erroTxt}>{erros.nome}</Text> : null}
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput style={[styles.input, erros.email && styles.inputErro]}
            placeholder="ana@email.com" placeholderTextColor="#A0A8B3"
            onChangeText={v => { emailRef.current = v; limparErro('email') }}
            keyboardType="email-address" autoCapitalize="none" />
          {erros.email ? <Text style={styles.erroTxt}>{erros.email}</Text> : null}
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>CPF</Text>
          <TextInput style={[styles.input, erros.cpf && styles.inputErro]}
            placeholder="000.000.000-00" placeholderTextColor="#A0A8B3"
            value={cpfVal}
            onChangeText={v => { const m = mascaraCPF(v); setCpfVal(m); cpfRef.current = m; limparErro('cpf') }}
            keyboardType="numeric" />
          {erros.cpf ? <Text style={styles.erroTxt}>{erros.cpf}</Text> : null}
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput style={[styles.input, erros.telefone && styles.inputErro]}
            placeholder="(21) 99999-9999" placeholderTextColor="#A0A8B3"
            value={telVal}
            onChangeText={v => { const m = mascaraTelefone(v); setTelVal(m); telefoneRef.current = m; limparErro('telefone') }}
            keyboardType="numeric" />
          {erros.telefone ? <Text style={styles.erroTxt}>{erros.telefone}</Text> : null}
        </View>

        <Text style={[styles.secaoTitulo, { marginTop: 8 }]}>🔒 Senha</Text>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Senha</Text>
          <View style={[styles.senhaRow, erros.senha && styles.inputErro]}>
            <TextInput style={styles.senhaInput} placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#A0A8B3"
              onChangeText={v => { senhaRef.current = v; limparErro('senha') }}
              secureTextEntry={!mostrarSenha} />
            <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} style={styles.olhoBtn}>
              <Text>{mostrarSenha ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {erros.senha ? <Text style={styles.erroTxt}>{erros.senha}</Text> : null}
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput style={[styles.input, erros.confirmarSenha && styles.inputErro]}
            placeholder="••••••••" placeholderTextColor="#A0A8B3"
            onChangeText={v => { confSenhaRef.current = v; limparErro('confirmarSenha') }}
            secureTextEntry={!mostrarSenha} />
          {erros.confirmarSenha ? <Text style={styles.erroTxt}>{erros.confirmarSenha}</Text> : null}
        </View>

        <Text style={[styles.secaoTitulo, { marginTop: 8 }]}>🏥 Dados profissionais</Text>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Especialidade</Text>
          <View style={styles.especialidadesGrid}>
            {ESPECIALIDADES.map(esp => (
              <TouchableOpacity
                key={esp.nome}
                style={[styles.espChip, especialidade === esp.nome && styles.espChipAtivo]}
                onPress={() => { setEspecialidade(esp.nome); setConselhoVal(''); conselhoRef.current = ''; limparErro('especialidade') }}
              >
                <Text style={styles.espEmoji}>{esp.emoji}</Text>
                <Text style={[styles.espChipTxt, especialidade === esp.nome && styles.espChipTxtAtivo]}>
                  {esp.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {erros.especialidade ? <Text style={styles.erroTxt}>{erros.especialidade}</Text> : null}
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Número do conselho {espSelecionada ? `(${siglaCons})` : ''}</Text>
          <TextInput
            style={[styles.input, erros.conselho && styles.inputErro]}
            placeholder={espSelecionada ? `Ex: ${siglaCons}/RJ 12345` : 'Selecione a especialidade primeiro'}
            placeholderTextColor="#A0A8B3"
            value={conselhoVal}
            onChangeText={v => { const up = v.toUpperCase(); setConselhoVal(up); conselhoRef.current = up; limparErro('conselho') }}
            editable={!!especialidade}
          />
          {erros.conselho ? <Text style={styles.erroTxt}>{erros.conselho}</Text> : null}
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Bio (apresentação)</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Descreva sua experiência e abordagem..."
            placeholderTextColor="#A0A8B3"
            onChangeText={v => { bioRef.current = v }}
            multiline />
        </View>

        <View style={styles.duplaRow}>
          <View style={[styles.campoGroup, { flex: 1 }]}>
            <Text style={styles.label}>Anos de experiência</Text>
            <TextInput style={styles.input} placeholder="5" placeholderTextColor="#A0A8B3"
              onChangeText={v => { anosRef.current = v }} keyboardType="numeric" />
          </View>
          <View style={[styles.campoGroup, { flex: 1 }]}>
            <Text style={styles.label}>Valor da consulta (R$)</Text>
            <TextInput style={styles.input} placeholder="150" placeholderTextColor="#A0A8B3"
              onChangeText={v => { valorRef.current = v }} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.campoGroup}>
          <Text style={styles.label}>Modalidades de atendimento</Text>
          <View style={styles.modalRow}>
            {['Presencial', 'Online', 'Grupo'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modalChip, modalidades.includes(m) && styles.modalChipAtivo]}
                onPress={() => toggleModalidade(m)}
              >
                <Text style={[styles.modalChipTxt, modalidades.includes(m) && styles.modalChipTxtAtivo]}>
                  {m === 'Presencial' ? '📍' : m === 'Online' ? '💻' : '👥'} {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnCadastrar, carregando && { opacity: 0.7 }]}
          onPress={handleCadastro}
          disabled={carregando}
        >
          {carregando
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.btnCadastrarTxt}>Criar conta profissional</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.jaTemConta}>
          <Text style={styles.jaTemContaTxt}>Já tenho conta · <Text style={styles.link}>Fazer login</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    backgroundColor: colors.purpleDark, paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  voltarBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  voltarTxt: { fontSize: 20, color: '#FFF', fontWeight: '600' },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  campoGroup: { gap: 5 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: colors.textPrimary,
  },
  inputErro: { borderColor: colors.danger },
  erroTxt: { fontSize: 11, color: colors.danger },
  dica: { fontSize: 11, color: colors.textMuted },
  senhaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  senhaInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.textPrimary },
  olhoBtn: { paddingHorizontal: 12 },
  especialidadesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  espChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF',
  },
  espChipAtivo: { backgroundColor: colors.purpleDark, borderColor: colors.purpleDark },
  espEmoji: { fontSize: 14 },
  espChipTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  espChipTxtAtivo: { color: '#FFF' },
  duplaRow: { flexDirection: 'row', gap: 10 },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalChip: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#FFF',
  },
  modalChipAtivo: { backgroundColor: colors.purpleDark, borderColor: colors.purpleDark },
  modalChipTxt: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  modalChipTxtAtivo: { color: '#FFF' },
  btnCadastrar: {
    backgroundColor: colors.purpleDark, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  btnCadastrarTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  jaTemConta: { alignItems: 'center', marginTop: 8 },
  jaTemContaTxt: { fontSize: 13, color: colors.textSecondary },
  link: { color: colors.purpleDark, fontWeight: '600' },
})
