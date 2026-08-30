import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, PermissionsAndroid, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
} from 'react-native-agora'

const APP_ID = '1439a3f8f4924a12b7290ac580f2a644'
const FUNCTION_URL = 'https://agora-token-worker.zelo-app-tokens.workers.dev'

async function buscarToken(canal: string): Promise<string> {
  const resp = await fetch(`${FUNCTION_URL}?canal=${encodeURIComponent(canal)}`)
  const data = await resp.json()
  if (!data.token) throw new Error('Token não retornado')
  return data.token
}

async function pedirPermissoes(): Promise<boolean> {
  if (Platform.OS !== 'android') return true
  try {
    const resultado = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ])
    const cameraOk = resultado[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
    const micOk    = resultado[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    if (!cameraOk || !micOk) {
      Alert.alert(
        'Permissões necessárias',
        'Para usar a videochamada, permita o acesso à câmera e ao microfone nas configurações do celular.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  } catch (e) {
    console.warn('Erro ao pedir permissões:', e)
    return false
  }
}

export default function VideoCallScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const route = useRoute() as any

  const { canal, nomeOutro, isProfissional } = route.params ?? {
    canal: 'zelo-teste',
    nomeOutro: 'Participante',
    isProfissional: false,
  }

  const engineRef = useRef<IRtcEngine | null>(null)
  const [joined, setJoined]             = useState(false)
  const [remoteUid, setRemoteUid]       = useState<number | null>(null)
  const [micAtivo, setMicAtivo]         = useState(true)
  const [camAtiva, setCamAtiva]         = useState(true)
  const [carregando, setCarregando]     = useState(true)
  const [semPermissao, setSemPermissao] = useState(false)

  useEffect(() => {
    iniciar()
    return () => { encerrarEngine() }
  }, [])

  const iniciar = async () => {
    const permitido = await pedirPermissoes()
    if (!permitido) {
      setSemPermissao(true)
      setCarregando(false)
      return
    }

    try {
      const engine = createAgoraRtcEngine()
      engineRef.current = engine

      engine.initialize({ appId: APP_ID })
      engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication)
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster)
      engine.enableVideo()
      engine.startPreview()

      engine.addListener('onUserJoined', (connection, uid) => {
        setRemoteUid(uid)
      })

      engine.addListener('onUserOffline', () => {
        setRemoteUid(null)
      })

      engine.addListener('onJoinChannelSuccess', () => {
        setJoined(true)
        setCarregando(false)
      })

      engine.addListener('onError', (err) => {
        console.warn('Agora error:', err)
        setCarregando(false)
      })

      const token = await buscarToken(canal)
      await engine.joinChannel(token, canal, 0, {})
    } catch (e) {
      console.error('Erro ao iniciar Agora:', e)
      setCarregando(false)
      Alert.alert('Erro', 'Não foi possível iniciar a videochamada.')
    }
  }

  const encerrarEngine = () => {
    engineRef.current?.leaveChannel()
    engineRef.current?.release()
    engineRef.current = null
  }

  const encerrarChamada = () => {
    encerrarEngine()
    navigation.goBack()
  }

  const toggleMic = () => {
    engineRef.current?.muteLocalAudioStream(micAtivo)
    setMicAtivo(v => !v)
  }

  const toggleCam = () => {
    engineRef.current?.muteLocalVideoStream(camAtiva)
    setCamAtiva(v => !v)
  }

  const virarCamera = () => {
    engineRef.current?.switchCamera()
  }

  if (semPermissao) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 }]}>
        <Text style={{ fontSize: 48 }}>📷</Text>
        <Text style={{ fontSize: 18, color: '#FFF', fontWeight: '700', textAlign: 'center' }}>
          Permissões necessárias
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 }}>
          Permita o acesso à câmera e ao microfone nas configurações do celular.
        </Text>
        <TouchableOpacity style={styles.encerrarBtn} onPress={encerrarChamada}>
          <Text style={styles.encerrarTxt}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {remoteUid !== null ? (
        <RtcSurfaceView
          style={styles.videoRemoto}
          canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
        />
      ) : (
        <View style={styles.videoRemoto}>
          <View style={styles.aguardandoWrap}>
            {carregando ? (
              <>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.aguardandoTxt}>Conectando...</Text>
              </>
            ) : (
              <>
                <Text style={styles.aguardandoEmoji}>👤</Text>
                <Text style={styles.aguardandoTxt}>Aguardando {nomeOutro}...</Text>
              </>
            )}
          </View>
        </View>
      )}

      {joined && (
        <View style={styles.videoLocalWrap}>
          <RtcSurfaceView
            style={styles.videoLocal}
            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
          />
          {!camAtiva && (
            <View style={styles.camDesligadaOverlay}>
              <Text style={{ fontSize: 28 }}>📷</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.topoInfo}>
        <View style={styles.topoBadge}>
          <View style={[styles.dotVerde, !joined && { backgroundColor: '#FFA500' }]} />
          <Text style={styles.topoTxt}>
            {joined ? (remoteUid ? 'Em chamada' : 'Aguardando') : 'Conectando...'}
          </Text>
        </View>
        <Text style={styles.topoNome}>{nomeOutro}</Text>
      </View>

      <View style={[styles.controles, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.ctrlBtn, !micAtivo && styles.ctrlBtnDesativo]} onPress={toggleMic}>
          <Text style={styles.ctrlEmoji}>{micAtivo ? '🎙️' : '🔇'}</Text>
          <Text style={styles.ctrlTxt}>{micAtivo ? 'Mic' : 'Mudo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.ctrlBtn, !camAtiva && styles.ctrlBtnDesativo]} onPress={toggleCam}>
          <Text style={styles.ctrlEmoji}>{camAtiva ? '📹' : '📷'}</Text>
          <Text style={styles.ctrlTxt}>{camAtiva ? 'Câmera' : 'Sem cam'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.encerrarBtn} onPress={encerrarChamada}>
          <Text style={styles.encerrarEmoji}>📵</Text>
          <Text style={styles.encerrarTxt}>Encerrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={virarCamera}>
          <Text style={styles.ctrlEmoji}>🔄</Text>
          <Text style={styles.ctrlTxt}>Virar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn}>
          <Text style={styles.ctrlEmoji}>💬</Text>
          <Text style={styles.ctrlTxt}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  videoRemoto: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1a2e' },
  aguardandoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  aguardandoEmoji: { fontSize: 64 },
  aguardandoTxt: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  videoLocalWrap: {
    position: 'absolute', top: 100, right: 16,
    width: 100, height: 140, borderRadius: 12,
    overflow: 'hidden', borderWidth: 2, borderColor: '#FFF',
  },
  videoLocal: { width: '100%', height: '100%' },
  camDesligadaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  topoInfo: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', gap: 6 },
  topoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20,
  },
  dotVerde: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  topoTxt: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  topoNome: { fontSize: 18, color: '#FFF', fontWeight: '700' },
  controles: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingTop: 16, paddingHorizontal: 8,
  },
  ctrlBtn: {
    alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center',
  },
  ctrlBtnDesativo: { backgroundColor: 'rgba(255,80,80,0.4)' },
  ctrlEmoji: { fontSize: 22 },
  ctrlTxt: { fontSize: 10, color: '#FFF', fontWeight: '500' },
  encerrarBtn: {
    alignItems: 'center', gap: 4, backgroundColor: '#E53935',
    width: 70, height: 70, borderRadius: 35, justifyContent: 'center',
  },
  encerrarEmoji: { fontSize: 26 },
  encerrarTxt: { fontSize: 10, color: '#FFF', fontWeight: '700' },
})
