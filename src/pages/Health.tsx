import { useState, useEffect, useMemo } from 'react';
import { Droplets, Scale, Activity, Footprints } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { subscribeToHealthByDate, subscribeToHealth, updateHealthData } from '../services/dataService';
import styles from './Health.module.css';

// ── Types ──────────────────────────────────────────────
interface HealthData {
    id?: string;
    steps?: number;
    waterGlasses?: number;
    waterGoal?: number;
    weight?: string;
    height?: string;
    targetWeight?: string;
}

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
    const [steps, setSteps] = useState<number>(0);
    const [waterGlasses, setWaterGlasses] = useState(0);
    const [waterGoal, setWaterGoal] = useState(8);
    const [weight, setWeight] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [height, setHeight] = useState('');
    
    // History data for charts and calendar
    const [healthHistory, setHealthHistory] = useState<HealthData[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        const unsubHealth = subscribeToHealthByDate(today, (data: HealthData) => {
            if (data.steps !== undefined) setSteps(data.steps);
            if (data.waterGlasses !== undefined) setWaterGlasses(data.waterGlasses);
            if (data.waterGoal !== undefined) setWaterGoal(data.waterGoal);
            if (data.weight !== undefined) setWeight(data.weight);
            if (data.targetWeight !== undefined) setTargetWeight(data.targetWeight);
            if (data.height !== undefined) setHeight(data.height);
        });
        
        const unsubHistory = subscribeToHealth((data: HealthData[]) => {
            setHealthHistory(data);
        });

        return () => {
            unsubHealth();
            unsubHistory();
        };
    }, [today]);

    // Use selectedDate to determine the 7 days to show in the chart
    const chartData = useMemo(() => {
        return Array.from({length: 7}).map((_, i) => {
            const d = subDays(selectedDate, 6 - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const record = healthHistory.find(h => h.id === dateStr) || {};
            return {
                name: format(d, 'EEE'),
                weight: Number(record.weight) || null,
                height: Number(record.height) || null,
            };
        });
    }, [healthHistory, selectedDate]);

    const startOfCurrentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const startWeek = startOfWeek(startOfCurrentMonth);
    const calendarDays = Array.from({length: 42}).map((_, i) => addDays(startWeek, i));

    const getSelectedDateData = () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return healthHistory.find(h => h.id === dateStr) || {};
    };
    const selectedData = getSelectedDateData();

    const bmi = calcBMI(Number(weight), Number(height));

    // Step calculations
    const caloriesBurned = Math.round(steps * 0.04);
    const stepsGoal = 10000;

    return (
        <div className={styles.healthPage}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Health &amp; Wellness</h1>
                    <p className={styles.subtitle}>Track your hydration, activity, and vitals</p>
                </div>
                <div className={styles.dateTag}>{format(new Date(), 'EEE, d MMM yyyy')}</div>
            </div>

            {/* ── Summary Rings ── */}
            <div className={`glass-panel ${styles.summaryCard}`}>
                <h3 className={styles.sectionTitle}><Activity size={18} /> Today's Overview</h3>
                <div className={styles.ringsRow}>
                    <RingProgress pct={waterGlasses / waterGoal} color="#06b6d4" label="Hydration" />
                    <RingProgress pct={steps / stepsGoal} color="#10b981" label="Steps" />
                    <RingProgress 
                        pct={weight && targetWeight ? Math.max(0, 1 - Math.abs(Number(weight) - Number(targetWeight)) / Number(targetWeight)) : 0} 
                        color="#8b5cf6" 
                        label="Weight Goal" 
                    />
                </div>
                <div className={styles.macroNumbers}>
                    <span className={styles.macroNum} style={{ color: '#06b6d4' }}>{waterGlasses} glasses of water</span>
                    <span className={styles.macroNum} style={{ color: '#10b981' }}>🔥 {caloriesBurned} kcal burnt</span>
                    <span className={styles.macroNum} style={{ color: '#8b5cf6' }}>⚖️ {weight || '—'} / {targetWeight || '—'} kg</span>
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

                    {/* Step Tracker */}
                    <div className={`glass-panel ${styles.card}`}>
                        <h3 className={styles.sectionTitle}><Footprints size={18} color="#10b981" /> Activity Tracker</h3>
                        <div className={styles.stepInputArea}>
                            <div className={styles.stepInputField}>
                                <label>Steps Today</label>
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
                                <div className={styles.burnLabel}>kcal</div>
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

                {/* ── RIGHT COLUMN ── */}
                <div className={styles.rightCol}>
                    {/* BMI Calculator & Weight Tracker */}
                    <div className={`glass-panel ${styles.card}`}>
                        <h3 className={styles.sectionTitle}><Scale size={18} color="#8b5cf6" /> BMI & Weight Tracker</h3>
                        <div className={styles.bmiInputs}>
                             <div className={styles.bmiField}>
                                <label>Weight (kg)</label>
                                <input type="number" placeholder="e.g. 70" value={weight}
                                    onChange={e => updateHealthData(today, { weight: e.target.value })} className={styles.bmiInput} />
                            </div>
                            <div className={styles.bmiField}>
                                <label>Target (kg)</label>
                                <input type="number" placeholder="e.g. 60" value={targetWeight}
                                    onChange={e => updateHealthData(today, { targetWeight: e.target.value })} className={styles.bmiInput} />
                            </div>
                            <div className={styles.bmiField}>
                                <label>Height (cm)</label>
                                <input type="number" placeholder="e.g. 175" value={height}
                                    onChange={e => updateHealthData(today, { height: e.target.value })} className={styles.bmiInput} />
                            </div>
                        </div>

                        {/* Weight Progress Bar (0-150kg) */}
                        <div className={styles.weightTrackerWrapper}>
                            <div className={styles.weightBarHeader}>
                                <span>Weight Progress</span>
                                <span className={styles.weightStatus}>
                                    {weight && targetWeight ? (
                                        Math.abs(Number(weight) - Number(targetWeight)) < 0.1 
                                            ? "Goal Reached! 🎉" 
                                            : `Need to ${Number(weight) > Number(targetWeight) ? 'reduce' : 'increase'} ${Math.abs(Number(weight) - Number(targetWeight)).toFixed(1)} kg to reach target`
                                    ) : 'Enter weights to track progress'}
                                </span>
                            </div>
                            <div className={styles.weightProgressBar}>
                                <div className={styles.weightScaleMarks}>
                                    {[0, 25, 50, 75, 100, 125, 150].map(val => (
                                        <span key={val} className={styles.scaleMark}>{val}</span>
                                    ))}
                                </div>
                                <div className={styles.weightBarRail}>
                                    {targetWeight && (
                                        <div 
                                            className={styles.targetIndicator} 
                                            style={{ left: `${(Number(targetWeight) / 150) * 100}%` }}
                                            title={`Target: ${targetWeight}kg`}
                                        >
                                            <div className={styles.targetLabel}>Target</div>
                                        </div>
                                    )}
                                    {weight && (
                                        <div 
                                            className={styles.currentPointer} 
                                            style={{ left: `${(Number(weight) / 150) * 100}%` }}
                                            title={`Current: ${weight}kg`}
                                        >
                                            <div className={styles.pointerLabel}>{weight}kg</div>
                                        </div>
                                    )}
                                </div>
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
                </div>
            </div>

            {/* Progress Trends & History */}
            <div className={`glass-panel ${styles.card}`}>
                <h3 className={styles.sectionTitle}><Activity size={18} color="#8b5cf6" /> Progress Trends & History</h3>
                <div className={styles.chartAndCalendarRow}>
                    <div className={styles.chartSection}>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                                    <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px'}}/>
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                                    <Line yAxisId="right" type="monotone" dataKey="height" name="Height (cm)" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className={styles.calendarSelectedData} style={{ marginTop: '16px', background: 'transparent', border: 'none', padding: '0' }}>
                            <h4 style={{ marginBottom: '8px', fontSize: '0.95rem' }}>Stats for {format(selectedDate, 'MMM d, yyyy')}</h4>
                            <div className={styles.statsRow}>
                                <div className={styles.calStatRow}>
                                    <span>Weight:</span>
                                    <span>{selectedData.weight ? `${selectedData.weight} kg` : 'No data'}</span>
                                </div>
                                <div className={styles.calStatRow}>
                                    <span>Height:</span>
                                    <span>{selectedData.height ? `${selectedData.height} cm` : 'No data'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.smallCalendarSection}>
                        <div className={styles.calendarHeader}>
                            <button className={styles.calNavBtn} onClick={() => setSelectedDate(subDays(selectedDate, 30))}>&lt;</button>
                            <span className={styles.calMonthLabel}>{format(selectedDate, 'MMM yyyy')}</span>
                            <button className={styles.calNavBtn} onClick={() => setSelectedDate(addDays(selectedDate, 30))}>&gt;</button>
                        </div>
                        <div className={styles.calendarGrid}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className={styles.calendarDayName}>{day}</div>
                            ))}
                            {calendarDays.map(date => {
                                const isSelected = isSameDay(date, selectedDate);
                                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const hasData = healthHistory.some(h => h.id === dateStr && (h.weight || h.height));

                                return (
                                    <button 
                                        key={date.toString()} 
                                        className={`${styles.calendarDate} ${isSelected ? styles.calendarDateSelected : ''} ${!isCurrentMonth ? styles.calendarDateMuted : ''} ${hasData ? styles.calendarDateHasData : ''}`}
                                        onClick={() => setSelectedDate(date)}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
