import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Collection Names
const TASKS_COLLECTION = "tasks";
const CALENDAR_COLLECTION = "calendar_events";
const USER_COLLECTION = "user_settings";

// --- Tasks ---

export const subscribeToTasks = (callback: (tasks: any[]) => void) => {
  const q = query(collection(db, TASKS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(tasks);
  });
};

export const addTask = async (task: any) => {
  return await addDoc(collection(db, TASKS_COLLECTION), {
    ...task,
    createdAt: new Date().toISOString()
  });
};

export const updateTask = async (id: string, updates: any) => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  return await updateDoc(taskRef, updates);
};

export const deleteTask = async (id: string) => {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  return await deleteDoc(taskRef);
};

// --- Calendar Events ---

export const subscribeToCalendarEvents = (callback: (events: any[]) => void) => {
  const q = query(collection(db, CALENDAR_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(events);
  });
};

export const addCalendarEvent = async (event: any) => {
  return await addDoc(collection(db, CALENDAR_COLLECTION), {
    ...event,
    createdAt: new Date().toISOString()
  });
};

export const updateCalendarEvent = async (id: string, updates: any) => {
  const eventRef = doc(db, CALENDAR_COLLECTION, id);
  return await updateDoc(eventRef, updates);
};

export const deleteCalendarEvent = async (id: string) => {
  const eventRef = doc(db, CALENDAR_COLLECTION, id);
  return await deleteDoc(eventRef);
};

// --- User Settings ---

export const subscribeToUserSettings = (callback: (user: any) => void) => {
  const userRef = doc(db, USER_COLLECTION, "current_user"); // For now, single user
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
};

export const updateUserSettings = async (updates: any) => {
  const userRef = doc(db, USER_COLLECTION, "current_user");
  return await setDoc(userRef, updates, { merge: true });
};
