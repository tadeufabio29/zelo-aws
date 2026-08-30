import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { validarCPF, mascaraCPF, mascaraTelefone, validarEmail } from '../../utils/masks'
import { colors, typo, space, radius, inputHeight, btnHeightMd, rs } from '../../theme'

type Props = { navigation: any }

function Secao({ titulo }: { titulo: string }) {
  return <Text style={styles.secaoTitulo}>{titulo}</Text>
}

function Campo({
  label, erro, children,
}: {
  label: string; erro?: string; children: React.ReactNode
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {erro ? <Text style={styles.erroTxt}>{erro}</Text> : null}
    </View>
  )
}

export default function CadastroResponsavelScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { cadastrar } = useAuth()

  const nomeRef        = useRef('')
  const emailRef       = useRef('')
  const cpfRef         = useRef('')
  const telefoneRef    = useRef('')
  const senhaRef       = useRef('')
  const confSenhaRef   = useRef('')
  const nomeFilhoRef   = useRef('')
  const idadeRef       = useRef('')
  const diagnosticoRef = useRef('')

  const [cpfVal, setCpfVal]             = useState('')
  const [telVal, setTelVal]             = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando]     = useState(false)
  const [erros, setErros]               = useState<Record<string, string>>({})

  const limparErro = (campo: string) => setErros(e => ({ ...e, [campo]: '' }))

  const validar = () => {
    const e: Record<string, string> = {}
    if (!nomeRef.current.trim())                              e.nome = 'Nome obrigatório'
    if (!validarEmail(emailRef.current))                      e.email = 'E-mail inválido'
    if (!validarCPF(cpfRef.current))                          e.cpf = 'CPF inválido'
    if (telefoneRef.current.replace(/\D/g, '').length < 10)   e.telefone = 'Telefone inválido'
    if (senhaRef.current.length < 6)                          e.senha = 'Mínimo 6 caracteres'
    if (senhaRef.current !== confSenhaRef.current)            e.confirmarSenha = 'Senhas não coincidem'
    if (!nomeFilhoRef.current.trim())                         e.nomeFilho = 'Nome da criança obrigatório'
    setErros(e)
    return Object.keys(e).length === 0
  }

  const handleCadastro = async () => {
    if (!validar()) return
    setCarregando(true)
    try {
      await cadastrar(emailRef.current.trim(), senhaRef.current, {
        nome: nomeRef.current,
        cpf: cpfRef.current.replace(/\D/g, ''),
        telefone: telefoneRef.current,
        nomeFilho: nomeFilhoRef.current,
        idadeFilho: idadeRef.current,
        diagnostico: diagnosticoRef.current,
      }, 'familiar')
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado'
        : 'Erro ao cadastrar. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setCarregando(false)
    }
  }

  const inp = (erro?: string) => [styles.input, erro && styles.inputErro]

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltarBtn}>
          <Text style={styles.voltarTxt}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitulo}>Cadastro Familiar</Text>
          <Text style={styles.headerSub}>Crie sua conta para começar</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <Secao titulo="👤  Seus dados" />

        <Campo label="Nome completo" erro={erros.nome}>
          <TextInput style={inp(erros.nome)}
            placeholder="Maria Silva" placeholderTextColor={colors.textHint}
            onChangeText={v => { nomeRef.current = v; limparErro('nome') }}
            autoCapitalize="words" />
        </Campo>

        <Campo label="E-mail" erro={erros.email}>
          <TextInput style={inp(erros.email)}
            placeholder="maria@email.com" placeholderTextColor={colors.textHint}
            onChangeText={v => { emailRef.current = v; limparErro('email') }}
            keyboardType="email-address" autoCapitalize="none" />
        </Campo>

        <View style={styles.row}>
          <Campo label="CPF" erro={erros.cpf}>
            <TextInput style={[inp(erros.cpf), { flex: 1 }]}
              placeholder="000.000.000-00" placeholderTextColor={colors.textHint}
              value={cpfVal}
              onChangeText={v => { const m = mascaraCPF(v); setCpfVal(m); cpfRef.current = m; limparErro('cpf') }}
              keyboardType="numeric" />
          </Campo>
          <Campo label="Telefone" erro={erros.telefone}>
            <TextInput style={[inp(erros.telefone), { flex: 1 }]}
              placeholder="(21) 99999-9999" placeholderTextColor={colors.textHint}
              value={telVal}
              onChangeText={v => { const m = mascaraTelefone(v); setTelVal(m); telefoneRef.current = m; limparErro('telefone') }}
              keyboardType="numeric" />
          </Campo>
        </View>

        <Secao titulo="🔒  Senha" />

        <Campo label="Senha" erro={erros.senha}>
          <View style={[styles.senhaRow, erros.senha && styles.inputErro]}>
            <TextInput style={styles.senhaInput}
              placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.textHint}
              onChangeText={v => { senhaRef.current = v; limparErro('senha') }}
              secureTextEntry={!mostrarSenha} />
            <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} style={styles.olhoBtn}>
              <Text>{mostrarSenha ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </Campo>

        <Campo label="Confirmar senha" erro={erros.confirmarSenha}>
          <TextInput style={inp(erros.confirmarSenha)}
            placeholder="••••••••" placeholderTextColor={colors.textHint}
            onChangeText={v => { confSenhaRef.current = v; limparErro('confirmarSenha') }}
            secureTextEntry={!mostrarSenha} />
        </Campo>

        <Secao titulo="👧  Dados da criança" />

        <Campo label="Nome da criança" erro={erros.nomeFilho}>
          <TextInput style={inp(erros.nomeFilho)}
            placeholder="João Pedro" placeholderTextColor={colors.textHint}
            onChangeText={v => { nomeFilhoRef.current = v; limparErro('nomeFilho') }}
            autoCapitalize="words" />
        </Campo>

        <View style={styles.row}>
          <Campo label="Idade">
            <TextInput style={[styles.input, { flex: 1 }]}
              placeholder="7" placeholderTextColor={colors.textHint}
              onChangeText={v => { idadeRef.current = v }}
              keyboardType="numeric" />
          </Campo>
          <Campo label="Diagnóstico (opcional)">
            <TextInput style={[styles.input, { flex: 1 }]}
              placeholder="Ex: TEA Nível 1" placeholderTextColor={colors.textHint}
              onChangeText={v => { diagnosticoRef.current = v }} />
          </Campo>
        </View>

        <TouchableOpacity
          style={[styles.btnCadastrar, carregando && { opacity: 0.7 }]}
          onPress={handleCadastro}
          disabled={carregando}
        >
          {carregando
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnCadastrarTxt}>Criar conta</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkTxt}>
            Já tenho conta · <Text style={styles.link}>Fazer login</Text>
          </Text>
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
    paddingBottom: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderBottomLeftRadius: rs(20, 24, 28),
    borderBottomRightRadius: rs(20, 24, 28),
  },
  voltarBtn: {
    width: rs(34, 38, 42),
    height: rs(34, 38, 42),
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarTxt: { fontSize: typo.lg, color: colors.white, fontWeight: '600' },
  headerTitulo: { fontSize: typo.lg, fontWeight: '700', color: colors.white },
  headerSub: { fontSize: typo.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: rs(40, 48, 56),
  },
  secaoTitulo: {
    fontSize: typo.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: space.sm,
    marginBottom: 2,
  },
  row: { flexDirection: 'row', gap: space.sm },
  campo: { gap: 5, flex: 1 },
  label: { fontSize: typo.xs, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    height: inputHeight,
    fontSize: typo.sm,
    color: colors.textPrimary,
  },
  inputErro: { borderColor: colors.danger },
  erroTxt: { fontSize: typo.xs, color: colors.danger, marginTop: 2 },
  senhaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: inputHeight,
  },
  senhaInput: {
    flex: 1,
    paddingHorizontal: space.md,
    fontSize: typo.sm,
    color: colors.textPrimary,
    height: '100%',
  },
  olhoBtn: { paddingHorizontal: space.md },
  btnCadastrar: {
    backgroundColor: colors.blue,
    borderRadius: radius.lg,
    height: btnHeightMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  btnCadastrarTxt: { color: colors.white, fontSize: typo.md, fontWeight: '700' },
  loginLink: { alignItems: 'center', paddingVertical: space.xs },
  loginLinkTxt: { fontSize: typo.sm, color: colors.textSecondary },
  link: { color: colors.blue, fontWeight: '600' },
})
