import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, typo, space, radius, rs } from '../../theme'

const imgLogo       = require('../../assets/logo_zelo.png')
const imgIlustracao = require('../../assets/ilustracao_onboarding.png')

type Props = { navigation: NativeStackNavigationProp<any> }

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + rs(12, 16, 20), paddingBottom: insets.bottom + rs(20, 28, 32) }
    ]}>

      <TouchableOpacity
        style={styles.sobreBtn}
        onPress={() => navigation.navigate('SobreOGrupo')}
      >
        <Text style={styles.sobreBtnText}>Sobre o grupo</Text>
      </TouchableOpacity>

      <View style={styles.logoArea}>
        <Image source={imgLogo} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logoText}>Zelo</Text>
        <Text style={styles.logoSubtitle}>Saúde especializada para crianças atípicas</Text>
      </View>

      <View style={[styles.illustrationBox, { maxHeight: height * 0.22 }]}>
        <Image source={imgIlustracao} style={styles.illustrationImage} resizeMode="contain" />
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>
          Conectamos famílias a especialistas{'\n'}com cuidado e zelo
        </Text>
        <Text style={styles.subtitle}>
          Fisioterapia, fonoaudiologia, terapia ocupacional, nutrição e psicologia — tudo em um só lugar.
        </Text>
      </View>

      <View style={styles.dotsArea}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <View style={styles.buttonsArea}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate('CadastroResponsavel')}
        >
          <Text style={styles.buttonPrimaryText}>Sou responsável / familiar</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('CadastroProfissional')}
        >
          <Text style={styles.buttonSecondaryText}>Sou profissional de saúde</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkTxt}>
            Já tenho conta · <Text style={styles.loginLinkBold}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgWarm,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sobreBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.purpleLight,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  sobreBtnText: {
    fontSize: typo.xs,
    fontWeight: '600',
    color: colors.purple,
  },
  logoArea: {
    alignItems: 'center',
    gap: space.xs,
  },
  logoImage: {
    width: rs(72, 84, 96),
    height: rs(72, 84, 96),
    borderRadius: radius.lg,
    marginBottom: space.xs,
  },
  logoText: {
    fontSize: typo.xxl,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.blue,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: typo.xs,
    fontWeight: '500',
    color: colors.purple,
    textAlign: 'center',
  },
  illustrationBox: {
    width: '100%',
    aspectRatio: 400 / 260,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  textArea: {
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xs,
  },
  title: {
    fontSize: typo.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: rs(22, 24, 26),
  },
  subtitle: {
    fontSize: typo.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: rs(18, 19, 20),
  },
  dotsArea: {
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  buttonsArea: {
    width: '100%',
    alignItems: 'center',
    gap: space.sm,
  },
  buttonPrimary: {
    width: '100%',
    backgroundColor: colors.blue,
    height: rs(48, 52, 56),
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: colors.white,
    fontSize: typo.sm,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: space.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typo.xs,
    color: colors.textMuted,
  },
  buttonSecondary: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    height: rs(48, 52, 56),
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: colors.textSecondary,
    fontSize: typo.sm,
    fontWeight: '500',
  },
  loginLink: {
    paddingVertical: space.xs,
  },
  loginLinkTxt: {
    fontSize: typo.sm,
    color: colors.textMuted,
  },
  loginLinkBold: {
    color: colors.blue,
    fontWeight: '700',
  },
})
