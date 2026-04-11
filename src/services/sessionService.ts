// Session Service - Firestore persistence for sessions
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Session } from '../types';

const SESSIONS_COLLECTION = 'sessions';

// Get all sessions from Firestore
export const fetchSessions = async (): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(sessionsRef, orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Session[];
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return [];
  }
};

// Save a session to Firestore
export const saveSession = async (session: Session): Promise<void> => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, session.id);
    await setDoc(sessionRef, session);
  } catch (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
};

// Delete a session from Firestore
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw error;
  }
};

// Subscribe to real-time session updates
export const subscribeToSessions = (
  onUpdate: (sessions: Session[]) => void
): Unsubscribe => {
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(sessionsRef, orderBy('startTime', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Session[];
    onUpdate(sessions);
  }, (error) => {
    console.error('Session subscription error:', error);
  });
};

// Batch save multiple sessions (useful for initial sync)
export const batchSaveSessions = async (sessions: Session[]): Promise<void> => {
  try {
    const promises = sessions.map(session => saveSession(session));
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to batch save sessions:', error);
    throw error;
  }
};
