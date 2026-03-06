import admin from 'firebase-admin'

export function getAdminDb() {
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      let privateKey = process.env.FIREBASE_PRIVATE_KEY

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase Admin credentials')
      }

      // Normalize private key format
      privateKey = privateKey.replace(/\\n/g, '\n')

      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      })

      console.log('[Firebase] Admin SDK initialized successfully')
    } catch (error) {
      console.error('[Firebase] Initialization failed:', error)
      throw error
    }
  }

  return admin.firestore()
}
