import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'

admin.initializeApp()

const APP_ID = '1439a3f8f4924a12b7290ac580f2a644'
const APP_CERTIFICATE = 'b40c6fd1daef4c56a19ba44d8cd97e7e'

export const gerarTokenAgora = functions.https.onRequest((req, res) => {
  // Permitir CORS
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  const canal = req.query.canal as string || req.body?.canal

  if (!canal) {
    res.status(400).json({ erro: 'Canal é obrigatório' })
    return
  }

  // Token válido por 24 horas
  const expiracao = Math.floor(Date.now() / 1000) + 86400

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    canal,
    0, // uid 0 = qualquer usuário
    RtcRole.PUBLISHER,
    expiracao
  )

  res.status(200).json({ token, canal, expiracao })
})
