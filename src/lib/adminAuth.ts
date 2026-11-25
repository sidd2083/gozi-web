import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export const PRIMARY_OWNER_EMAIL = 'raghurl.202@gmail.com';

export interface AdminAuthResult {
  authorized: boolean;
  email: string | null;
  role: 'owner' | 'admin' | null;
  error?: string;
}

/**
 * Verify if email has admin privileges:
 * 1. Primary Owner check: raghurl.202@gmail.com is unconditionally authorized
 * 2. Firestore check: admins/{email} with active === true
 */
export async function verifyAdminStatus(email: string | null | undefined): Promise<AdminAuthResult> {
  if (!email) {
    return { authorized: false, email: null, role: null, error: 'No email provided' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Primary owner always has access
  if (normalizedEmail === PRIMARY_OWNER_EMAIL.toLowerCase()) {
    // Ensure primary owner record exists in Firestore for tracking
    try {
      const docRef = doc(db, 'admins', normalizedEmail);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, {
          email: normalizedEmail,
          role: 'owner',
          active: true,
          addedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not sync primary owner doc:', e);
    }
    return { authorized: true, email: normalizedEmail, role: 'owner' };
  }

  // Check admins collection in Firestore
  try {
    const docRef = doc(db, 'admins', normalizedEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.active === true) {
        return { authorized: true, email: normalizedEmail, role: data.role || 'admin' };
      }
    }
  } catch (e) {
    console.error('Error verifying admin in Firestore:', e);
  }

  return { 
    authorized: false, 
    email: normalizedEmail, 
    role: null, 
    error: `Access Denied: ${email} is not authorized to access Gozi Admin.` 
  };
}

/**
 * Sign in with Google Popup
 * Forces the account chooser dialog every time so you can pick any Gmail.
 */
export async function signInWithGoogle(): Promise<AdminAuthResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 
      prompt: 'select_account',
      auth_type: 'rerequest'
    });

    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const authStatus = await verifyAdminStatus(user.email);

    if (!authStatus.authorized) {
      // Force sign-out immediately for unauthorized accounts
      await firebaseSignOut(auth);
      return authStatus;
    }

    return authStatus;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    return { authorized: false, email: null, role: null, error: error.message || 'Login failed' };
  }
}

/**
 * Sign out of admin session
 */
export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}
