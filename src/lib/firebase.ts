import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
  authDomain: firebaseConfig.authDomain ? 'Set' : 'Missing',
  projectId: firebaseConfig.projectId ? 'Set' : 'Missing',
  storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Missing',
  appId: firebaseConfig.appId ? 'Set' : 'Missing',
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signInWithFirebase(email: string, password: string): Promise<{ success: true; idToken: string; user: any } | { success: false; error: string }> {
  try {
    console.log('Attempting Firebase sign in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    console.log('Firebase sign in successful, got ID token');
    return { success: true, idToken, user: userCredential.user };
  } catch (error: any) {
    console.error('Firebase sign in error:', error);
    return { success: false, error: error.message };
  }
}

export async function signUpWithFirebase(email: string, password: string): Promise<{ success: true; idToken: string; user: any } | { success: false; error: string }> {
  try {
    console.log('Attempting Firebase sign up...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    console.log('Firebase sign up successful, got ID token');
    return { success: true, idToken, user: userCredential.user };
  } catch (error: any) {
    console.error('Firebase sign up error:', error);
    return { success: false, error: error.message };
  }
}
