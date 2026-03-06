import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

let _app: FirebaseApp | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null

function getApp() {
  if (!_app) {
    _app = initializeApp(firebaseConfig)
  }
  return _app
}

export function getDb() {
  if (!_db) {
    _db = getFirestore(getApp())
  }
  return _db
}

export function getFirebaseAuth() {
  if (!_auth) {
    _auth = getAuth(getApp())
  }
  return _auth
}
