import { useState, useEffect } from 'react';
import { Droplets, Utensils, Moon, Scale, Plus, Trash2, ChevronDown, ChevronUp, Flame, Settings, Edit, Save, Footprints } from 'lucide-react';
import { format } from 'date-fns';
import { subscribeToHealthByDate, updateHealthData, subscribeToFoodDatabase, updateFoodDatabase } from '../services/dataService';
import styles from './Health.module.css';

// ── Types ──────────────────────────────────────────────
interface MealEntry {
    id: string;
    name: string;
    calories: number;
    protein: number; // g
    carbs: number;   // g
    fat: number;     // g
}

interface Meal {
    id: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    label: string;
    icon: string;
    entries: MealEntry[];
}

interface SleepLog {
    id: string;
    date: string;
    hours: number;
    quality: 'poor' | 'fair' | 'good' | 'great';
}

interface FoodItem {
    id: string;
    name: string;
    serving: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

// ── Goals ────────────────────────────────────────────────
const CALORIE_GOAL = 2000;
const PROTEIN_GOAL = 150;
const CARBS_GOAL = 250;
const FAT_GOAL = 65;

const DEFAULT_FOODS: FoodItem[] = [
    { id: 'f1', name: 'Dosa', serving: '1 medium (80g)', calories: 160, protein: 4, carbs: 29, fat: 4 },
    { id: 'f2', name: 'Idli', serving: '2 pieces (100g)', calories: 116, protein: 4, carbs: 24, fat: 0 },
    { id: 'f3', name: 'Chicken Rice', serving: '1 bowl (300g)', calories: 520, protein: 35, carbs: 65, fat: 12 },
    { id: 'f4', name: 'Egg Sandwich', serving: '1 sandwich', calories: 280, protein: 12, carbs: 32, fat: 10 },
    { id: 'f5', name: 'Paneer Tikka', serving: '6 pieces', calories: 240, protein: 14, carbs: 6, fat: 18 },
    { id: 'f6', name: 'Oats with Fruit', serving: '1 bowl', calories: 300, protein: 8, carbs: 52, fat: 6 },
    { id: 'f7', name: 'Greek Yogurt', serving: '1 cup (150g)', calories: 130, protein: 15, carbs: 6, fat: 4 },
    { id: 'f8', name: 'Protein Shake', serving: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1 },
];

const initialMeals: Meal[] = [
    {
        id: 'breakfast', label: 'Breakfast', icon: '🌅', entries: [
            { id: 'b1', name: 'Oats with Banana', calories: 320, protein: 10, carbs: 58, fat: 5 },
        ]
    },
    {
        id: 'lunch', label: 'Lunch', icon: '☀️', entries: [
            { id: 'l1', name: 'Chicken Rice Bowl', calories: 520, protein: 40, carbs: 55, fat: 12 },
        ]
    },
    { id: 'dinner', label: 'Dinner', icon: '🌙', entries: [] },
    { id: 'snacks', label: 'Snacks', icon: '🍎', entries: [] },
];

const QUALITY_COLORS = { poor: '#ef4444', fair: '#f59e0b', good: '#10b981', great: '#3b82f6' };

// ── BMI Helper ──────────────────────────────────────────
function calcBMI(weight: number, height: number): { value: number; category: string; color: string } {
    if (!weight || !height) return { value: 0, category: '—', color: '#94a3b8' };
    const h = height / 100;
    const bmi = weight / (h * h);
    if (bmi < 18.5) return { value: bmi, category: 'Underweight', color: '#3b82f6' };
    if (bmi < 25) return { value: bmi, category: 'Normal ✅', color: '#10b981' };
    if (bmi < 30) return { value: bmi, category: 'Overweight', color: '#f59e0b' };
    return { value: bmi, category: 'Obese', color: '#ef4444' };
}

// ── SVG Ring ────────────────────────────────────────────
function RingProgress({ pct, size = 80, stroke = 8, color = '#6366f1', label }: {
    pct: number; size?: number; stroke?: number; color?: string; label: string
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * Math.min(pct, 1);
    return (
        <div className={styles.ring}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--text-primary)">{Math.round(pct * 100)}%</text>
            </svg>
            <span className={styles.ringLabel}>{label}</span>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────
export function Health() {
    const today = format(new Date(), 'yyyy-MM-dd');

    // --- State Persistence & Initialization ---
    const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>(DEFAULT_FOODS);
    const [steps, setSteps] = useState<number>(0);
    const [meals, setMeals] = useState<Meal[]>(initialMeals);
    const [waterGlasses, setWaterGlasses] = useState(0);
    const [waterGoal, setWaterGoal] = useState(8);
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);

    useEffect(() => {
        const unsubFood = subscribeToFoodDatabase(setFoodDatabase);
        const unsubHealth = subscribeToHealthByDate(today, (data) => {
            if (data.steps !== undefined) setSteps(data.steps);
            if (data.meals) setMeals(data.meals);
            if (data.waterGlasses !== undefined) setWaterGlasses(data.waterGlasses);
            if (data.waterGoal !== undefined) setWaterGoal(data.waterGoal);
            if (data.weight !== undefined) setWeight(data.weight);
            if (data.height !== undefined) setHeight(data.height);
            if (data.sleepLogs) setSleepLogs(data.sleepLogs);
        });
        return () => {
            unsubFood();
            unsubHealth();
        };
    }, [today]);

    const [expandedMeal, setExpandedMeal] = useState<string | null>('breakfast');
    const [addingTo, setAddingTo] = useState<string | null>(null);

    // Food logging state
    const [selectedFoodId, setSelectedFoodId] = useState<string>(foodDatabase.length > 0 ? foodDatabase[0].id : '');
    const [foodQuantity, setFoodQuantity] = useState<number>(1);

    // Manage Library state
    const [showManageLibrary, setShowManageLibrary] = useState(false);
    const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
    const [foodInProgress, setFoodInProgress] = useState<Partial<FoodItem>>({});

    const addStaticEntry = async (mealId: string) => {
        const food = foodDatabase.find(f => f.id === selectedFoodId);
        if (!food) return;

        const entry: MealEntry = {
            id: Date.now().toString(),
            name: `${food.name} (x${foodQuantity})`,
            calories: Math.round(food.calories * foodQuantity),
            protein: Math.round(food.protein * foodQuantity),
            carbs: Math.round(food.carbs * foodQuantity),
            fat: Math.round(food.fat * foodQuantity),
        };
        const updatedMeals = meals.map(m => m.id === mealId ? { ...m, entries: [...m.entries, entry] } : m);
        await updateHealthData(today, { meals: updatedMeals });
        setAddingTo(null);
        setFoodQuantity(1);
    };

    const cancelAddFood = () => {
        setAddingTo(null);
        setFoodQuantity(1);
    };

    const removeEntry = async (mealId: string, entryId: string) => {
        const updatedMeals = meals.map(m => m.id === mealId ? { ...m, entries: m.entries.filter(e => e.id !== entryId) } : m);
        await updateHealthData(today, { meals: updatedMeals });
    };

    // Library CRUD
    const handleAddOrUpdateFood = async () => {
        if (!foodInProgress.name || foodInProgress.calories === undefined) return;

        let updatedDb = [...foodDatabase];
        if (editingFoodId) {
            updatedDb = updatedDb.map(f => f.id === editingFoodId ? { ...f, ...foodInProgress } as FoodItem : f);
        } else {
            const newItem: FoodItem = {
                id: 'f' + Date.now().toString(),
                name: foodInProgress.name || '',
                serving: foodInProgress.serving || '1 serving',
                calories: Number(foodInProgress.calories) || 0,
                protein: Number(foodInProgress.protein) || 0,
                carbs: Number(foodInProgress.carbs) || 0,
                fat: Number(foodInProgress.fat) || 0,
            };
            updatedDb.push(newItem);
        }
        await updateFoodDatabase(updatedDb);
        setEditingFoodId(null);
        setFoodInProgress({});
    };

    const startEditFood = (food: FoodItem) => {
        setEditingFoodId(food.id);
        setFoodInProgress(food);
    };

    const deleteFood = async (id: string) => {
        if (!confirm('Delete this food from library?')) return;
        const updatedDb = foodDatabase.filter(f => f.id !== id);
        await updateFoodDatabase(updatedDb);
        if (selectedFoodId === id && updatedDb.length > 1) {
            setSelectedFoodId(updatedDb[0].id);
        }
    };

    const bmi = calcBMI(Number(weight), Number(height));

    // Sleep state
    const [sleepHours, setSleepHours] = useState('');
    const [sleepQuality, setSleepQuality] = useState<SleepLog['quality']>('good');

    const logSleep = async () => {
        if (!sleepHours) return;
        const updatedLogs = [{ id: Date.now().toString(), date: today, hours: Number(sleepHours), quality: sleepQuality }, ...sleepLogs];
        await updateHealthData(today, { sleepLogs: updatedLogs });
        setSleepHours('');
    };

    const todaySleep = sleepLogs.find(s => s.date === today);
    const avgSleep = sleepLogs.length > 0
        ? (sleepLogs.reduce((s, l) => s + l.hours, 0) / sleepLogs.length).toFixed(1)
        : '—';

    // Step calculations
    const caloriesBurned = Math.round(steps * 0.04);
    const stepsGoal = 10000;

    // Totals
    const allEntries = meals.flatMap(m => m.entries);
    const totalCal = allEntries.reduce((s, e) => s + e.calories, 0);
    const totalProt = allEntries.reduce((s, e) => s + e.protein, 0);
    const totalCarb = allEntries.reduce((s, e) => s + e.carbs, 0);
    const totalFat = allEntries.reduce((s, e) => s + e.fat, 0);

    return (
        <div className={styles.healthPage}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Health &amp; Diet</h1>
                    <p className={styles.subtitle}>Track your nutrition, hydration, and wellness</p>
                </div>
                <div className={styles.dateTag}>{format(new Date(), 'EEE, d MMM yyyy')}</div>
            </div>

            {/* ── Summary Rings ── */}
            <div className={`glass-panel ${styles.summaryCard}`}>
                <h3 className={styles.sectionTitle}><Flame size={18} /> Today's Overview</h3>
                <div className={styles.ringsRow}>
                    <RingProgress pct={totalCal / CALORIE_GOAL} color="#ef4444" label="Calories" />
                    <RingProgress pct={totalProt / PROTEIN_GOAL} color="#3b82f6" label="Protein" />
                    <RingProgress pct={totalCarb / CARBS_GOAL} color="#f59e0b" label="Carbs" />
                    <RingProgress pct={totalFat / FAT_GOAL} color="#8b5cf6" label="Fat" />
                    <RingProgress pct={waterGlasses / waterGoal} color="#06b6d4" label="Hydration" />
                    <RingProgress pct={steps / stepsGoal} color="#10b981" label="Steps" />
                </div>
                <div className={styles.macroNumbers}>
                    <span className={styles.macroNum} style={{ color: '#ef4444' }}>{totalCal} / {CALORIE_GOAL} kcal</span>
                    <span className={styles.macroNum} style={{ color: '#10b981' }}>🔥 {caloriesBurned} kcal burnt</span>
                    <span className={styles.macroNum} style={{ color: '#3b82f6' }}>{totalProt}g / {PROTEIN_GOAL}g Protein</span>
                    <span className={styles.macroNum} style={{ color: '#f59e0b' }}>{totalCarb}g / {CARBS_GOAL}g Carbs</span>
                    <span className={styles.macroNum} style={{ color: '#8b5cf6' }}>{totalFat}g / {FAT_GOAL}g Fat</span>
                </div>
            </div>

            <div className={styles.twoCol}>

                {/* ── LEFT COLUMN ── */}
                <div className={styles.leftCol}>

                    {/* Water Tracker */}
                    <div className={`glass-panel ${styles.card}`}>
                        <div className={styles.waterHeader}>
                            <h3 className={styles.sectionTitle}><Droplets size={18} color="#06b6d4" /> Water Intake</h3>
                            <div className={styles.waterGoalInput}>
                                <label>Daily goal</label>
                                <input type="number" min="1" max="20" value={waterGoal}
                                    onChange={async (e) => {
                                        const v = Math.max(1, Number(e.target.value));
                                        await updateHealthData(today, { waterGoal: v });
                                        if (waterGlasses > v) await updateHealthData(today, { waterGlasses: v });
                                    }}
                                    className={styles.waterGoalNum}
                                />
                                <span>glasses</span>
                            </div>
                        </div>
                        <p className={styles.cardSub}>{waterGlasses} of {waterGoal} glasses today</p>
                        <div className={styles.waterGlasses}>
                            {Array.from({ length: waterGoal }).map((_, i) => (
                                <button key={i}
                                    className={`${styles.glass} ${i < waterGlasses ? styles.glassFilled : ''}`}
                                    onClick={() => updateHealthData(today, { waterGlasses: i < waterGlasses ? i : i + 1 })}
                                    title={`${i + 1} glass${i > 0 ? 'es' : ''}`}
                                >💧</button>
                            ))}
                        </div>
                        <div className={styles.waterBar}>
                            <div className={styles.waterFill} style={{ width: `${(waterGlasses / waterGoal) * 100}%` }} />
                        </div>
                        <div className={styles.waterBtns}>
                            <button className={styles.waterBtn} onClick={() => updateHealthData(today, { waterGlasses: Math.max(0, waterGlasses - 1) })}>− Remove</button>
                            <button className={`${styles.waterBtn} ${styles.waterBtnAdd}`} onClick={() => updateHealthData(today, { waterGlasses: Math.min(waterGoal, waterGlasses + 1) })}>+ Add Glass</button>
                        </div>
                    </div>

                    {/* BMI Calculator */}
                    <div className={`glass-panel ${styles.card}`}>
                        <h3 className={styles.sectionTitle}><Scale size={18} color="#8b5cf6" /> BMI Calculator</h3>
                        <div className={styles.bmiInputs}>
                             <div className={styles.bmiField}>
                                <label>Weight (kg)</label>
                                <input type="number" placeholder="e.g. 70" value={weight}
                                    onChange={e => updateHealthData(today, { weight: e.target.value })} className={styles.bmiInput} />
                            </div>
                            <div className={styles.bmiField}>
                                <label>Height (cm)</label>
                                <input type="number" placeholder="e.g. 175" value={height}
                                    onChange={e => updateHealthData(today, { height: e.target.value })} className={styles.bmiInput} />
                            </div>
                        </div>
                        {bmi.value > 0 && (
                            <div className={styles.bmiResult}>
                                <span className={styles.bmiValue} style={{ color: bmi.color }}>{bmi.value.toFixed(1)}</span>
                                <span className={styles.bmiCategory} style={{ color: bmi.color }}>{bmi.category}</span>
                                <div className={styles.bmiScale}>
                                    <div className={styles.bmiScaleBar}>
                                        <span style={{ color: '#3b82f6' }}>Underweight</span>
                                        <span style={{ color: '#10b981' }}>Normal</span>
                                        <span style={{ color: '#f59e0b' }}>Overweight</span>
                                        <span style={{ color: '#ef4444' }}>Obese</span>
                                    </div>
                                    <div className={styles.bmiRanges}>
                                        <div style={{ background: '#3b82f6', flex: 1 }} />
                                        <div style={{ background: '#10b981', flex: 1.3 }} />
                                        <div style={{ background: '#f59e0b', flex: 1 }} />
                                        <div style={{ background: '#ef4444', flex: 1.5 }} />
                                    </div>
                                    <div className={styles.bmiPointer} style={{
                                        left: `${Math.min(Math.max(((bmi.value - 15) / 25) * 100, 0), 98)}%`,
                                        borderColor: bmi.color
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sleep Tracker */}
                    <div className={`glass-panel ${styles.card}`}>
                        <h3 className={styles.sectionTitle}><Moon size={18} color="#6366f1" /> Sleep Tracker</h3>
                        <div className={styles.sleepInput}>
                            <input type="number" min="1" max="12" step="0.5" placeholder="Hours slept"
                                value={sleepHours} onChange={e => setSleepHours(e.target.value)} className={styles.sleepHourInput} />
                            <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value as SleepLog['quality'])} className={styles.sleepSelect}>
                                <option value="poor">😴 Poor</option>
                                <option value="fair">😐 Fair</option>
                                <option value="good">😊 Good</option>
                                <option value="great">🌟 Great</option>
                            </select>
                            <button onClick={logSleep} className={styles.sleepLogBtn}><Plus size={16} /> Log</button>
                        </div>
                        <div className={styles.sleepStats}>
                            <div className={styles.sleepStat}>
                                <span className={styles.sleepStatVal}>{todaySleep?.hours ?? '—'}h</span>
                                <span>Tonight</span>
                            </div>
                            <div className={styles.sleepStat}>
                                <span className={styles.sleepStatVal}>{avgSleep}h</span>
                                <span>Avg (7 day)</span>
                            </div>
                            <div className={styles.sleepStat}>
                                <span className={styles.sleepStatVal}
                                    style={{ color: todaySleep ? QUALITY_COLORS[todaySleep.quality] : 'var(--text-secondary)' }}>
                                    {todaySleep?.quality ?? '—'}
                                </span>
                                <span>Quality</span>
                            </div>
                        </div>
                    </div>

                    {/* Step Tracker */}
                    <div className={`glass-panel ${styles.card}`}>
                        <h3 className={styles.sectionTitle}><Footprints size={18} color="#10b981" /> Step Tracker</h3>
                        <div className={styles.stepInputArea}>
                            <div className={styles.stepInputField}>
                                <label>Daily Steps</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 8000"
                                    value={steps || ''}
                                    onChange={async e => await updateHealthData(today, { steps: Number(e.target.value) })}
                                    className={styles.bmiInput}
                                />
                            </div>
                            <div className={styles.calorieBurnInfo}>
                                <div className={styles.burnVal}>🔥 {caloriesBurned}</div>
                                <div className={styles.burnLabel}>kcal burnt</div>
                            </div>
                        </div>
                        <div className={styles.stepProgressContainer}>
                            <div className={styles.stepProgressHeader}>
                                <span>Goal: {stepsGoal}</span>
                                <span>{Math.round((steps / stepsGoal) * 100)}%</span>
                            </div>
                            <div className={styles.stepProgressBar}>
                                <div className={styles.stepProgressFill} style={{ width: `${Math.min((steps / stepsGoal) * 100, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN — Meal Logger ── */}
                <div className={styles.rightCol}>
                    <div className={`glass-panel ${styles.card}`}>
                        <div className={styles.mealTrackerHeader}>
                            <h3 className={styles.sectionTitle}><Utensils size={18} color="#10b981" /> Meal Logger</h3>
                            <button
                                className={`${styles.manageBtn} ${showManageLibrary ? styles.manageBtnActive : ''}`}
                                onClick={() => setShowManageLibrary(!showManageLibrary)}
                                title="Manage Food Library"
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                        <p className={styles.cardSub}>Calories remaining: <strong style={{ color: totalCal > CALORIE_GOAL ? '#ef4444' : '#10b981' }}>{CALORIE_GOAL - totalCal} kcal</strong></p>

                        {showManageLibrary && (
                            <div className={styles.libraryManager}>
                                <h4>Manage Food Library</h4>
                                <div className={styles.libraryAddForm}>
                                    <input type="text" placeholder="Food Name" value={foodInProgress.name || ''}
                                        onChange={e => setFoodInProgress({ ...foodInProgress, name: e.target.value })} />
                                    <input type="text" placeholder="Serving (e.g. 1 bowl)" value={foodInProgress.serving || ''}
                                        onChange={e => setFoodInProgress({ ...foodInProgress, serving: e.target.value })} />
                                    <div className={styles.libMacros}>
                                        <input type="number" placeholder="Kcal" value={foodInProgress.calories || ''} onChange={e => setFoodInProgress({ ...foodInProgress, calories: Number(e.target.value) })} />
                                        <input type="number" placeholder="Prot" value={foodInProgress.protein || ''} onChange={e => setFoodInProgress({ ...foodInProgress, protein: Number(e.target.value) })} />
                                        <input type="number" placeholder="Carb" value={foodInProgress.carbs || ''} onChange={e => setFoodInProgress({ ...foodInProgress, carbs: Number(e.target.value) })} />
                                        <input type="number" placeholder="Fat" value={foodInProgress.fat || ''} onChange={e => setFoodInProgress({ ...foodInProgress, fat: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.libActions}>
                                        <button className={styles.libSaveBtn} onClick={handleAddOrUpdateFood}>
                                            <Save size={14} /> {editingFoodId ? 'Update' : 'Add to Library'}
                                        </button>
                                        {editingFoodId && <button className={styles.libCancelBtn} onClick={() => { setEditingFoodId(null); setFoodInProgress({}); }}>Cancel</button>}
                                    </div>
                                </div>
                                <div className={styles.libraryList}>
                                    {foodDatabase.map(food => (
                                        <div key={food.id} className={styles.libItem}>
                                            <div className={styles.libInfo}>
                                                <strong>{food.name}</strong>
                                                <span>{food.serving} · {food.calories}kcal</span>
                                            </div>
                                            <div className={styles.libItemBtns}>
                                                <button onClick={() => startEditFood(food)}><Edit size={13} /></button>
                                                <button onClick={() => deleteFood(food.id)}><Trash2 size={13} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {meals.map(meal => {
                            const mealCal = meal.entries.reduce((s, e) => s + e.calories, 0);
                            const isExpanded = expandedMeal === meal.id;
                            return (
                                <div key={meal.id} className={styles.mealBlock}>
                                    <button className={styles.mealHeader} onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}>
                                        <span className={styles.mealIcon}>{meal.icon}</span>
                                        <span className={styles.mealLabel}>{meal.label}</span>
                                        <span className={styles.mealCal}>{mealCal} kcal</span>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {isExpanded && (
                                        <div className={styles.mealEntries}>
                                            {meal.entries.length === 0 && (
                                                <p className={styles.emptyMeal}>No food logged yet. Add something!</p>
                                            )}
                                            {meal.entries.map(entry => (
                                                <div key={entry.id} className={styles.entryRow}>
                                                    <span className={styles.entryName}>{entry.name}</span>
                                                    <span className={styles.entryMacros}>
                                                        <span style={{ color: '#3b82f6' }}>P:{entry.protein}g</span>
                                                        <span style={{ color: '#f59e0b' }}>C:{entry.carbs}g</span>
                                                        <span style={{ color: '#8b5cf6' }}>F:{entry.fat}g</span>
                                                    </span>
                                                    <span className={styles.entryCal}>{entry.calories} kcal</span>
                                                    <button className={styles.removeEntry} onClick={() => removeEntry(meal.id, entry.id)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}

                                            {addingTo === meal.id ? (
                                                <div className={styles.addEntryForm}>
                                                    <div className={styles.aiPanel}>
                                                        <div className={styles.aiInputGrid}>
                                                            <div className={styles.aiInputGroup}>
                                                                <label>Select Food</label>
                                                                <select
                                                                    value={selectedFoodId}
                                                                    onChange={e => setSelectedFoodId(e.target.value)}
                                                                    className={styles.aiInput}
                                                                >
                                                                    {foodDatabase.map(food => (
                                                                        <option key={food.id} value={food.id}>
                                                                            {food.name} ({food.serving})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className={styles.aiInputGroup}>
                                                                <label>Quantity</label>
                                                                <input
                                                                    type="number"
                                                                    min="0.25"
                                                                    step="0.25"
                                                                    value={foodQuantity}
                                                                    onChange={e => setFoodQuantity(Number(e.target.value))}
                                                                    onKeyDown={e => e.key === 'Enter' && addStaticEntry(meal.id)}
                                                                    className={styles.aiInput}
                                                                />
                                                            </div>
                                                        </div>

                                                        <button
                                                            className={styles.aiAnalyzeBtn}
                                                            onClick={() => addStaticEntry(meal.id)}
                                                        >
                                                            ✅ Add to {meal.label}
                                                        </button>
                                                        <button onClick={cancelAddFood} className={styles.cancelLink}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button className={styles.addFoodBtn} onClick={() => setAddingTo(meal.id)}>
                                                    <Plus size={14} /> Add Food
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Daily Tips */}
                    <div className={`glass-panel ${styles.card} ${styles.tipsCard}`}>
                        <h3 className={styles.sectionTitle}>💡 Daily Health Tips</h3>
                        <ul className={styles.tipsList}>
                            <li>🥗 Eat at least <strong>5 servings</strong> of fruits &amp; vegetables daily</li>
                            <li>💧 Drink <strong>8 glasses</strong> of water — more if you exercise</li>
                            <li>🏃 Aim for <strong>30 min</strong> of moderate activity daily</li>
                            <li>😴 Get <strong>7–9 hours</strong> of quality sleep every night</li>
                            <li>🥩 Protein goal: <strong>0.8–1.2g per kg</strong> of body weight</li>
                            <li>🚫 Limit ultra-processed foods and added sugars</li>
                            <li>🧘 Manage stress — it directly affects metabolism</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
