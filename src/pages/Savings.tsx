import { useState, useEffect } from 'react';
import {
    PiggyBank,
    Plus,
    Home,
    Bike,
    Smartphone,
    Trash2,
    TrendingUp,
    Target,
    Edit2,
    Award,
    X,
    Pin,
    PinOff
} from 'lucide-react';
import { subscribeToSavings, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '../services/dataService';
import styles from './Savings.module.css';

interface SavingsGoal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    icon: string;
    color: string;
    type: 'long-term' | 'short-term';
    pinned?: boolean;
}

const ICON_MAP: Record<string, any> = {
    'Home': Home,
    'Bike': Bike,
    'Device': Smartphone,
    'Other': PiggyBank
};

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function Savings() {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
    const [achievementsType, setAchievementsType] = useState<'long-term' | 'short-term' | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    // Form States
    const [goalForm, setGoalForm] = useState({ title: '', target: '', icon: 'Home', color: COLORS[0], type: 'short-term' as 'long-term' | 'short-term' });
    const [topUpAmount, setTopUpAmount] = useState('');
    const [manualAmount, setManualAmount] = useState('');

    useEffect(() => {
        return subscribeToSavings(setGoals);
    }, []);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalForm.title || !goalForm.target) return;

        try {
            await addSavingsGoal({
                title: goalForm.title,
                targetAmount: Number(goalForm.target),
                currentAmount: 0,
                icon: goalForm.icon,
                color: goalForm.color,
                type: goalForm.type,
            });
            setIsAddModalOpen(false);
            setGoalForm({ title: '', target: '', icon: 'Home', color: COLORS[0], type: 'short-term' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoalId || !goalForm.title || !goalForm.target) return;

        try {
            await updateSavingsGoal(selectedGoalId, {
                title: goalForm.title,
                targetAmount: Number(goalForm.target),
                icon: goalForm.icon,
                color: goalForm.color,
                type: goalForm.type
            });
            setIsEditModalOpen(false);
            setGoalForm({ title: '', target: '', icon: 'Home', color: COLORS[0], type: 'short-term' });
            setSelectedGoalId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoalId || !topUpAmount) return;

        const goal = goals.find(g => g.id === selectedGoalId);
        if (!goal) return;

        try {
            await updateSavingsGoal(selectedGoalId, {
                currentAmount: goal.currentAmount + Number(topUpAmount)
            });
            setIsTopUpModalOpen(false);
            setTopUpAmount('');
            setSelectedGoalId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAmountUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoalId || manualAmount === '') return;

        try {
            await updateSavingsGoal(selectedGoalId, {
                currentAmount: Number(manualAmount)
            });
            setIsAmountModalOpen(false);
            setManualAmount('');
            setSelectedGoalId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const togglePin = async (id: string, currentPinned: boolean) => {
        try {
            await updateSavingsGoal(id, { pinned: !currentPinned });
        } catch (err) {
            console.error(err);
        }
    };

    const deleteGoal = async (id: string) => {
        if (window.confirm('Delete this savings goal?')) {
            try {
                await deleteSavingsGoal(id);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const openEditModal = (goal: SavingsGoal) => {
        setSelectedGoalId(goal.id);
        setGoalForm({
            title: goal.title,
            target: goal.targetAmount.toString(),
            icon: goal.icon,
            color: goal.color,
            type: goal.type
        });
        setIsEditModalOpen(true);
    };

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTarget === 0 ? 0 : Math.round((totalSaved / totalTarget) * 100);

    const longTermGoals = goals.filter(g => g.type === 'long-term');
    const shortTermGoals = goals.filter(g => g.type === 'short-term');

    const renderGoal = (goal: SavingsGoal) => {
        const Icon = ICON_MAP[goal.icon] || PiggyBank;
        const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

        return (
            <div key={goal.id} className={`glass-panel ${styles.goalCard}`}>
                <div className={styles.goalHeader}>
                    <div className={styles.goalInfo}>
                        <div className={styles.goalIconWrapper} style={{ backgroundColor: `${goal.color}15`, color: goal.color }}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className={styles.goalTitle}>{goal.title}</h3>
                            <p className={styles.goalTarget}>Target: ₹{goal.targetAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button 
                            className={`${styles.iconBtn} ${goal.pinned ? styles.pinnedBtn : ''}`} 
                            onClick={() => togglePin(goal.id, !!goal.pinned)}
                            title={goal.pinned ? "Unpin from Dashboard" : "Pin to Dashboard"}
                        >
                            {goal.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>
                        <button className={styles.iconBtn} onClick={() => openEditModal(goal)}>
                            <Edit2 size={16} />
                        </button>
                        <button className={styles.iconBtn} onClick={() => deleteGoal(goal.id)}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className={styles.progressSection}>
                    <div className={styles.progressLabels}>
                        <div className={styles.currentAmountGroup}>
                            <span className={styles.currentAmount}>₹{goal.currentAmount.toLocaleString()} saved</span>
                            <button
                                className={styles.inlineEditBtn}
                                onClick={() => {
                                    setSelectedGoalId(goal.id);
                                    setManualAmount(goal.currentAmount.toString());
                                    setIsAmountModalOpen(true);
                                }}
                                title="Edit total saved amount"
                            >
                                <Edit2 size={12} />
                            </button>
                        </div>
                        <span className={styles.percentage} style={{ color: '#8b5cf6' }}>{pct}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${pct}%`, backgroundColor: '#8b5cf6' }}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.topUpBtn}
                        onClick={() => {
                            setSelectedGoalId(goal.id);
                            setIsTopUpModalOpen(true);
                        }}
                    >
                        Add Savings
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.savingsPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Savings Goals</h1>
                    <p className={styles.subtitle}>Track and achieve your financial targets</p>
                </div>
                <button className={styles.addBtn} onClick={() => {
                    setGoalForm({ title: '', target: '', icon: 'Home', color: COLORS[0], type: 'short-term' });
                    setIsAddModalOpen(true);
                }}>
                    <Plus size={20} />
                    <span>New Goal</span>
                </button>
            </div>

            <div className={styles.summaryCards}>
                <div className={`glass-panel ${styles.summaryCard}`}>
                    <div className={styles.summaryIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <PiggyBank size={24} />
                    </div>
                    <div>
                        <p className={styles.summaryLabel}>Total Saved</p>
                        <h3 className={styles.summaryValue}>₹{totalSaved.toLocaleString()}</h3>
                    </div>
                </div>
                <div className={`glass-panel ${styles.summaryCard}`}>
                    <div className={styles.summaryIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <Target size={24} />
                    </div>
                    <div>
                        <p className={styles.summaryLabel}>Total Needs</p>
                        <h3 className={styles.summaryValue}>₹{totalTarget.toLocaleString()}</h3>
                    </div>
                </div>
                <div className={`glass-panel ${styles.summaryCard}`}>
                    <div className={styles.summaryIcon} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className={styles.summaryLabel}>Overall Progress</p>
                        <h3 className={styles.summaryValue} style={{ color: '#8b5cf6' }}>{overallProgress}%</h3>
                    </div>
                </div>
            </div>

            <div className={styles.goalsContainer}>
                <div className={styles.goalColumn}>
                    <div className={styles.columnHeader}>
                        <h2 className={styles.columnTitle}>Long Term</h2>
                        <button className={styles.achBtn} onClick={() => setAchievementsType('long-term')}>
                            <Award size={16} />
                            <span>Progress</span>
                        </button>
                    </div>
                    <div className={styles.goalsList}>
                        {longTermGoals.map(renderGoal)}
                        {longTermGoals.length === 0 && (
                            <div className={styles.emptyColumn}>No long term goals added yet.</div>
                        )}
                    </div>
                </div>

                <div className={styles.goalColumn}>
                    <div className={styles.columnHeader}>
                        <h2 className={styles.columnTitle}>Short Term</h2>
                        <button className={styles.achBtn} onClick={() => setAchievementsType('short-term')}>
                            <Award size={16} />
                            <span>Progress</span>
                        </button>
                    </div>
                    <div className={styles.goalsList}>
                        {shortTermGoals.map(renderGoal)}
                        {shortTermGoals.length === 0 && (
                            <div className={styles.emptyColumn}>No short term goals added yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Goal Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className={styles.modalOverlay} onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                }}>
                    <form className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()} onSubmit={isAddModalOpen ? handleAddGoal : handleEditGoal}>
                        <h2 className={styles.modalTitle}>{isAddModalOpen ? 'New Savings Goal' : 'Edit Savings Goal'}</h2>

                        <div className={styles.formGroup}>
                            <label>Goal Name</label>
                            <input
                                type="text"
                                placeholder="e.g. New Bike"
                                value={goalForm.title}
                                onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Target Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={goalForm.target}
                                onChange={e => setGoalForm({ ...goalForm, target: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label>Goal Term</label>
                                <select
                                    value={goalForm.type}
                                    onChange={e => setGoalForm({ ...goalForm, type: e.target.value as any })}
                                    className={styles.selectInput}
                                >
                                    <option value="short-term">Short Term</option>
                                    <option value="long-term">Long Term</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Choose Icon</label>
                            <div className={styles.iconGrid}>
                                {Object.keys(ICON_MAP).map(iconName => {
                                    const IconComp = ICON_MAP[iconName];
                                    return (
                                        <div
                                            key={iconName}
                                            className={`${styles.iconOption} ${goalForm.icon === iconName ? styles.iconOptionActive : ''}`}
                                            onClick={() => setGoalForm({ ...goalForm, icon: iconName })}
                                        >
                                            <IconComp size={24} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Theme Color</label>
                            <div className={styles.colorGrid}>
                                {COLORS.map(color => (
                                    <div
                                        key={color}
                                        className={`${styles.colorOption} ${goalForm.color === color ? styles.colorOptionActive : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setGoalForm({ ...goalForm, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => {
                                setIsAddModalOpen(false);
                                setIsEditModalOpen(false);
                            }}>Cancel</button>
                            <button type="submit" className={styles.submitBtn}>{isAddModalOpen ? 'Create Goal' : 'Save Changes'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Top Up Modal */}
            {isTopUpModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsTopUpModalOpen(false)}>
                    <form className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()} onSubmit={handleTopUp}>
                        <h2 className={styles.modalTitle}>Add to Savings</h2>
                        <div className={styles.formGroup}>
                            <label>Amount to Add (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={topUpAmount}
                                onChange={e => setTopUpAmount(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setIsTopUpModalOpen(false)}>Cancel</button>
                            <button type="submit" className={styles.submitBtn}>Add Amount</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Manual Amount Edit Modal */}
            {isAmountModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsAmountModalOpen(false)}>
                    <form className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()} onSubmit={handleAmountUpdate}>
                        <h2 className={styles.modalTitle}>Adjust Total Savings</h2>
                        <div className={styles.formGroup}>
                            <label>Current Total Saved (₹)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={manualAmount}
                                onChange={e => setManualAmount(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <p className={styles.modalNote}>Use this to manually set the total amount, e.g., if you withdrawn money.</p>
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setIsAmountModalOpen(false)}>Cancel</button>
                            <button type="submit" className={styles.submitBtn}>Set Amount</button>
                        </div>
                    </form>
                </div>
            )}
            {/* Achievements/Progress Modal */}
            {achievementsType !== null && (
                <div className={styles.modalOverlay} onClick={() => setAchievementsType(null)}>
                    <div className={`${styles.modal} ${styles.achievementsModal} glass-panel`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                <Award size={24} style={{ marginRight: '8px', color: '#f59e0b', verticalAlign: 'middle' }} />
                                {achievementsType === 'long-term' ? 'Long Term' : 'Short Term'} Achievements
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setAchievementsType(null)}><X size={24} /></button>
                        </div>
                        <div className={styles.achievementsContent}>
                            {(() => {
                                const list = achievementsType === 'long-term' ? longTermGoals : shortTermGoals;
                                const avg = list.length === 0 ? 0 : Math.round(
                                    list.reduce((sum, g) => sum + (g.targetAmount === 0 ? 0 : (g.currentAmount / g.targetAmount) * 100), 0) / list.length
                                );
                                return (
                                    <div className={styles.achSection}>
                                        <div className={styles.achHeader}>
                                            <span className={styles.achCount}>{list.length} Goals Active</span>
                                            <span className={styles.achAvg}>Average Completion: {avg}%</span>
                                        </div>
                                        <div className={styles.achList}>
                                            {list.map(g => {
                                                const p = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                                                return (
                                                    <div key={g.id} className={styles.achItem}>
                                                        <div className={styles.achItemInfo}>
                                                            <span className={styles.achItemTitle}>{g.title}</span>
                                                            <span className={styles.achItemPerc}>{p}%</span>
                                                        </div>
                                                        <div className={styles.achProgressBar}>
                                                            <div className={styles.achProgressFill} style={{ width: `${p}%`, backgroundColor: g.color }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
