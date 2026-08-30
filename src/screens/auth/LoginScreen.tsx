import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { validarEmail } from '../../utils/masks'
import { colors, typo, space, radius, inputHeight, btnHeightMd, rs } from '../../theme'

const imgLogo = require('../../assets/logo_zelo.png')

type Props = { navigation: any }

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

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { login } = useAuth()

  const emailRef = useRef('')
  const senhaRef = useRef('')

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando]     = useState(false)
  const [erros, setErros]               = useState<{ email?: string; senha?: string }>({})

  const limparErro = (campo: string) => setErros(e => ({ ...e, [campo]: undefined }))

  const validar = () => {
    const e: typeof erros = {}
    if (!emailRef.current.trim())             e.email = 'E-mail obrigatório'
    else if (!validarEmail(emailRef.current)) e.email = 'E-mail inválido'
    if (!senhaRef.current)                    e.senha = 'Senha obrigatória'
    else if (senhaRef.current.length < 6)     e.senha = 'Mínimo 6 caracteres'
    setErros(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validar()) return
    setCarregando(true)
    try {
      await login(emailRef.current.trim(), senhaRef.current)
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'E-mail ou senha incorretos'
        : 'Erro ao fazer login. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <View style={styles.container}>

      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Image source={imgLogo} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.headerTitulo}>Bem-vindo ao Zelo</Text>
          <Text style={styles.headerSub}>Faça login para continuar</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.secaoTitulo}>🔐  Acesse sua conta</Text>

        <Campo label="E-mail" erro={erros.email}>
          <TextInput
            style={[styles.input, erros.email && styles.inputErro]}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textHint}
            onChangeText={v => { emailRef.current = v; limparErro('email') }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Campo>

        <Campo label="Senha" erro={erros.senha}>
          <View style={[styles.senhaRow, erros.senha && styles.inputErro]}>
            <TextInput
              style={styles.senhaInput}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.textHint}
              onChangeText={v => { senhaRef.current = v; limparErro('senha') }}
              secureTextEntry={!mostrarSenha}
            />
            <TouchableOpacity onPress={() => setMostrarSenha(v => !v)} style={styles.olhoBtn}>
              <Text style={styles.olhoEmoji}>{mostrarSenha ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </Campo>

        <TouchableOpacity
          style={[styles.btnEntrar, carregando && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={carregando}
        >
          {carregando
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.btnEntrarTxt}>Entrar</Text>
          }
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerTxt}>ou crie sua conta</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.secaoTitulo}>👤  Primeiro acesso</Text>

        <TouchableOpacity
          style={styles.btnCadastro}
          onPress={() => navigation.navigate('CadastroResponsavel')}
        >
          <Text style={styles.btnCadastroEmoji}>👨‍👩‍👧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.btnCadastroTitulo}>Sou familiar</Text>
            <Text style={styles.btnCadastroSub}>Acompanho uma criança</Text>
          </View>
          <Text style={styles.btnCadastroArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnCadastro, { borderColor: colors.purpleDark }]}
          onPress={() => navigation.navigate('CadastroProfissional')}
        >
          <Text style={styles.btnCadastroEmoji}>👩‍⚕️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.btnCadastroTitulo, { color: colors.purpleDark }]}>Sou profissional</Text>
            <Text style={styles.btnCadastroSub}>Atendo crianças e famílias</Text>
          </View>
          <Text style={[styles.btnCadastroArrow, { color: colors.purpleDark }]}>›</Text>
        </TouchableOpacity>

        <Text style={styles.rodape}>
          Ao entrar, você concorda com nossos{' '}
          <Text style={styles.link}>Termos de Uso</Text>
        </Text>

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
  logo: {
    width: rs(44, 50, 56),
    height: rs(44, 50, 56),
    borderRadius: radius.md,
  },
  headerTitulo: { fontSize: typo.lg, fontWeight: '700', color: colors.white },
  headerSub:    { fontSize: typo.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

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

  campo: { gap: 5 },
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
  erroTxt:   { fontSize: typo.xs, color: colors.danger, marginTop: 2 },

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
  olhoBtn:   { paddingHorizontal: space.md },
  olhoEmoji: { fontSize: 16 },

  btnEntrar: {
    backgroundColor: colors.blue,
    borderRadius: radius.lg,
    height: btnHeightMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
  btnEntrarTxt: { color: colors.white, fontSize: typo.md, fontWeight: '700' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginVertical: space.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerTxt:  { fontSize: typo.xs, color: colors.textMuted },

  btnCadastro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.blue,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  btnCadastroEmoji:  { fontSize: rs(22, 24, 26) },
  btnCadastroTitulo: { fontSize: typo.sm, fontWeight: '700', color: colors.blue },
  btnCadastroSub:    { fontSize: typo.xs, color: colors.textSecondary, marginTop: 1 },
  btnCadastroArrow:  { fontSize: 22, color: colors.blue, fontWeight: '300' },

  rodape: {
    fontSize: typo.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
  },
  link: { color: colors.blue, fontWeight: '600' },
})