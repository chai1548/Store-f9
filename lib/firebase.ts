import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyB49vRPX8YaWuTP5GS3lsBDqdAaz_hJYAw",
  authDomain: "onlineshop-849c8.firebaseapp.com",
  databaseURL: "https://onlineshop-849c8.firebaseio.com",
  projectId: "onlineshop-849c8",
  storageBucket: "onlineshop-849c8.appspot.com",
  messagingSenderId: "883512833370",
  appId: "1:883512833370:web:a1c8412b158f8744afef63",
}

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
