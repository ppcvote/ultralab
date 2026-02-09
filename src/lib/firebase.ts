import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// TODO: 替換為你的 Firebase 專案設定
// 1. 到 https://console.firebase.google.com 建立專案
// 2. 新增 Web App，取得 firebaseConfig
// 3. 啟用 Firestore Database（production mode）
// 4. 設定 Firestore 規則允許寫入 'inquiries' collection
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)