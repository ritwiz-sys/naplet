import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const db = getFirestore();

export const loadEvents = async (userId) => {
    const snapshot = await getDocs(collection(db, 'users', userId, 'events'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addEvent = async (userId, { title, date, color }) => {
    const docRef = await addDoc(collection(db, 'users', userId, 'events'), {
        title,
        date,       // stored as 'YYYY-MM-DD' string
        color: color || '#6366f1',
        createdAt: serverTimestamp(),
    });
    return { id: docRef.id, title, date, color: color || '#6366f1' };
};

export const updateEvent = async (userId, eventId, updates) => {
    await updateDoc(doc(db, 'users', userId, 'events', eventId), updates);
};

export const deleteEvent = async (userId, eventId) => {
    await deleteDoc(doc(db, 'users', userId, 'events', eventId));
};
