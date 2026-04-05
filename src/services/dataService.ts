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
const HABITS_COLLECTION = "habits";
const FLEX_HABITS_COLLECTION = "flexible_habits";
const SAVINGS_COLLECTION = "savings";
const TRANSACTIONS_COLLECTION = "transactions";
const HEALTH_COLLECTION = "health_data";
const CATEGORIES_COLLECTION = "categories";

// --- Tasks ---

export const subscribeToTasks = (callback: (tasks: any[]) => void) => {
  const q = query(collection(db, TASKS_COLLECTION), orderBy("position", "asc"));
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

// --- Generic Helper for Boilerplate ---

const createSubscriber = (collectionName: string, sortField: string = "createdAt") => (callback: (data: any[]) => void) => {
    const q = query(collection(db, collectionName), orderBy(sortField, "desc"));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
};

const createAdd = (collectionName: string) => async (data: any) => {
    return await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString()
    });
};

const createUpdate = (collectionName: string) => async (id: string, updates: any) => {
    return await updateDoc(doc(db, collectionName, id), updates);
};

const createDelete = (collectionName: string) => async (id: string) => {
    return await deleteDoc(doc(db, collectionName, id));
};

// --- Habits ---
export const subscribeToHabits = createSubscriber(HABITS_COLLECTION, "startTime");
export const addHabit = createAdd(HABITS_COLLECTION);
export const updateHabit = createUpdate(HABITS_COLLECTION);
export const deleteHabit = createDelete(HABITS_COLLECTION);

export const subscribeToFlexHabits = createSubscriber(FLEX_HABITS_COLLECTION, "title");
export const addFlexHabit = createAdd(FLEX_HABITS_COLLECTION);
export const updateFlexHabit = createUpdate(FLEX_HABITS_COLLECTION);
export const deleteFlexHabit = createDelete(FLEX_HABITS_COLLECTION);

// --- Goals ---
const GOALS_COLLECTION = "goals";
export const subscribeToGoals = createSubscriber(GOALS_COLLECTION);
export const addGoal = createAdd(GOALS_COLLECTION);
export const updateGoal = createUpdate(GOALS_COLLECTION);
export const deleteGoal = createDelete(GOALS_COLLECTION);

// --- Savings ---
export const subscribeToSavings = createSubscriber(SAVINGS_COLLECTION, "title");
export const addSavingsGoal = createAdd(SAVINGS_COLLECTION);
export const updateSavingsGoal = createUpdate(SAVINGS_COLLECTION);
export const deleteSavingsGoal = createDelete(SAVINGS_COLLECTION);

// --- Transactions ---
export const subscribeToTransactions = createSubscriber(TRANSACTIONS_COLLECTION, "date");
export const addTransaction = createAdd(TRANSACTIONS_COLLECTION);
export const updateTransaction = createUpdate(TRANSACTIONS_COLLECTION);
export const deleteTransaction = createDelete(TRANSACTIONS_COLLECTION);

// --- Health ---
export const subscribeToHealth = (callback: (data: any[]) => void) => {
    const q = query(collection(db, HEALTH_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    });
};
export const updateHealthData = async (date: string, updates: any) => {
    const healthRef = doc(db, HEALTH_COLLECTION, date);
    return await setDoc(healthRef, { date, ...updates }, { merge: true });
};
export const subscribeToHealthByDate = (date: string, callback: (data: any) => void) => {
    const healthRef = doc(db, HEALTH_COLLECTION, date);
    return onSnapshot(healthRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback({});
        }
    });
};

// --- Categories ---
export const subscribeToCategories = (callback: (cats: any) => void) => {
    const catRef = doc(db, CATEGORIES_COLLECTION, "app_categories");
    return onSnapshot(catRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        }
    });
};

export const updateCategories = async (updates: any) => {
    const catRef = doc(db, CATEGORIES_COLLECTION, "app_categories");
    return await setDoc(catRef, updates, { merge: true });
};

// --- Food Database ---
export const subscribeToFoodDatabase = (callback: (foods: any) => void) => {
    const foodRef = doc(db, CATEGORIES_COLLECTION, "food_db");
    return onSnapshot(foodRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().foods || []);
        }
    });
};

export const updateFoodDatabase = async (foods: any[]) => {
    const foodRef = doc(db, CATEGORIES_COLLECTION, "food_db");
    return await setDoc(foodRef, { foods }, { merge: true });
};
