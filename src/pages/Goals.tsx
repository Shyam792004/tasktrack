import { useState, useEffect, type FormEvent } from 'react';
import { Target, CheckCircle2, Circle, Flag, Trash2, Plus, X, Edit2, Award, Star, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { format, differenceInDays } from 'date-fns';
import { subscribeToGoals, addGoal, updateGoal, deleteGoal } from '../services/dataService';
import styles from './Goals.module.css';

interface GoalTask {
    id: string;
    title: string;
    completed: boolean;
}

interface Goal {
    id: string;
    title: string;
    description: string;
    type: 'short-term' | 'long-term' | 'extra';
    targetDate: string | null;
    tasks: GoalTask[];
}


export function Goals() {
    const [goals, setGoals] = useState<Goal[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToGoals(setGoals);
        return () => unsubscribe();
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [achievementsType, setAchievementsType] = useState<'long-term' | 'short-term' | 'extra' | null>(null);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newType, setNewType] = useState<'short-term' | 'long-term' | 'extra'>('short-term');
    const [newTargetDate, setNewTargetDate] = useState('');
    const [newTasks, setNewTasks] = useState<{ id?: string, title: string }[]>([{ title: '' }]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddTaskField = () => {
        setNewTasks([...newTasks, { title: '' }]);
    };

    const handleTaskFieldChange = (index: number, value: string) => {
        const updated = [...newTasks];
        updated[index] = { ...updated[index], title: value };
        setNewTasks(updated);
    };

    const handleRemoveTaskField = (index: number) => {
        if (newTasks.length === 1) return;
        setNewTasks(newTasks.filter((_, i) => i !== index));
    };

    const openEditModal = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setNewTitle(goal.title);
        setNewDescription(goal.description);
        setNewType(goal.type);
        setNewTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : ''); // Handle null date

        if (goal.tasks.length > 0) {
            setNewTasks(goal.tasks.map(t => ({ id: t.id, title: t.title })));
        } else {
            setNewTasks([{ title: '' }]);
        }

        setIsModalOpen(true);
    };

    const handleAddGoal = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTitle || isSaving) return;

        setIsSaving(true);
        try {
            const dateToSave = newTargetDate ? new Date(newTargetDate).toISOString() : null;
            const filteredTasks = newTasks.filter(t => t.title.trim() !== '');

            if (editingGoalId) {
                const goalToUpdate = goals.find(g => g.id === editingGoalId);
                if (!goalToUpdate) {
                    setIsSaving(false);
                    return;
                }

                const updatedGoalData = {
                    title: newTitle,
                    description: newDescription || '',
                    type: newType,
                    targetDate: dateToSave,
                    tasks: filteredTasks.map((t, idx) => {
                        const existing = goalToUpdate.tasks.find(existingTask => existingTask.id === t.id);
                        return {
                            id: existing ? existing.id : `new-t-${Date.now()}-${idx}`,
                            title: t.title,
                            completed: existing ? existing.completed : false
                        };
                    })
                };
                await updateGoal(editingGoalId, updatedGoalData);
            } else {
                const newGoalData = {
                    title: newTitle,
                    description: newDescription || '',
                    type: newType,
                    targetDate: dateToSave,
                    tasks: filteredTasks.map((t, idx) => ({
                        id: `new-t-${Date.now()}-${idx}`,
                        title: t.title,
                        completed: false
                    }))
                };
                await addGoal(newGoalData);
            }
            closeModal();
        } catch (error) {
            console.error("Error saving goal:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGoalId(null);
        resetForm();
    };

    const resetForm = () => {
        setNewTitle('');
        setNewDescription('');
        setNewType('short-term');
        setNewTargetDate('');
        setNewTasks([{ title: '' }]);
    };

    const toggleTask = async (goalId: string, taskId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const updatedTasks = goal.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        await updateGoal(goalId, { tasks: updatedTasks });
    };

    const deleteGoalHandler = async (goalId: string) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            await deleteGoal(goalId);
        }
    };

    const longTermGoals = goals.filter(g => g.type === 'long-term');
    const shortTermGoals = goals.filter(g => g.type === 'short-term');
    const extraGoals = goals.filter(g => g.type === 'extra');

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId === destination.droppableId && source.index === destination.index) return;
        
        const goalId = source.droppableId;
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const newTasks = Array.from(goal.tasks);
        const [moved] = newTasks.splice(source.index, 1);
        newTasks.splice(destination.index, 0, moved);

        const newGoals = goals.map(g => g.id === goalId ? { ...g, tasks: newTasks } : g);
        setGoals(newGoals);
        await updateGoal(goalId, { tasks: newTasks });
    };

    const renderGoal = (goal: Goal) => {
        const completedTasks = goal.tasks.filter(t => t.completed).length;
        const totalTasks = goal.tasks.length;
        const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        const daysLeft = goal.targetDate ? differenceInDays(new Date(goal.targetDate), new Date()) : null;

        return (
            <div key={goal.id} className={`glass-panel ${styles.goalCard}`}>
                <div className={styles.goalHeader}>
                    <div className={styles.goalTitleRow}>
                        <div className={styles.goalIcon} style={{ backgroundColor: goal.type === 'long-term' ? 'rgba(59, 130, 246, 0.1)' : goal.type === 'extra' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                            {goal.type === 'long-term' ? <Flag color="#3b82f6" /> : goal.type === 'extra' ? <Star color="#8b5cf6" /> : <Target color="#10b981" />}
                        </div>
                        <div>
                            <h3 className={styles.goalTitle}>{goal.title}</h3>
                            <div className={styles.goalMeta}>
                                <span className={styles.goalType}>{goal.type}</span>
                                {goal.targetDate && (
                                    <span className={styles.daysLeft}>• {daysLeft} days left ({format(new Date(goal.targetDate), 'MMM d, yyyy')})</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.actionButtons}>
                        <button className={styles.editBtn} onClick={() => openEditModal(goal)}><Edit2 size={18} /></button>
                        <button className={styles.deleteBtn} onClick={() => deleteGoalHandler(goal.id)}><Trash2 size={18} /></button>
                    </div>
                </div>

                <p className={styles.goalDescription}>{goal.description}</p>

                <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                        <span className={styles.progressText}>Progress • {completedTasks}/{totalTasks} tasks</span>
                        <span className={styles.progressPerc}>{progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%`, backgroundColor: progress === 100 ? 'var(--accent-success)' : 'var(--accent-primary)' }}
                        />
                    </div>
                </div>

                <Droppable droppableId={goal.id}>
                    {(provided) => (
                        <div className={styles.tasksList} {...provided.droppableProps} ref={provided.innerRef}>
                            {goal.tasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided) => (
                                        <div
                                            className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <div {...provided.dragHandleProps} className={styles.dragHandle}>
                                                <GripVertical size={16} />
                                            </div>
                                            <div className={styles.taskContent} onClick={() => toggleTask(goal.id, task.id)}>
                                                {task.completed ? <CheckCircle2 size={18} className={styles.checkedIcon} /> : <Circle size={18} className={styles.uncheckedIcon} />}
                                                <span className={styles.taskTitle}>{task.title}</span>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        );
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className={styles.goalsPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Goal Tracker</h1>
                    <p className={styles.subtitle}>Stay focused on what matters</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.addGoalBtn} onClick={() => {
                        resetForm();
                        setEditingGoalId(null);
                        setIsModalOpen(true);
                    }}>
                        <Plus size={18} /> New Goal
                    </button>
                </div>
            </div>

            <div className={styles.goalsContainer}>
                <div className={styles.goalColumn}>
                    <div className={styles.columnTitleRow}>
                        <h2 className={styles.columnTitle}>Long Term Goals</h2>
                        <button className={styles.achColumnBtn} onClick={() => setAchievementsType('long-term')}>
                            <Award size={14} /> Progress
                        </button>
                    </div>
                    <div className={styles.goalsList}>
                        {longTermGoals.map(renderGoal)}
                        {longTermGoals.length === 0 && (
                            <div className={styles.emptyList}>No long term goals right now.</div>
                        )}
                    </div>
                </div>

                <div className={styles.goalColumn}>
                    <div className={styles.columnTitleRow}>
                        <h2 className={styles.columnTitle}>Short Term Goals</h2>
                        <button className={styles.achColumnBtn} onClick={() => setAchievementsType('short-term')}>
                            <Award size={14} /> Progress
                        </button>
                    </div>
                    <div className={styles.goalsList}>
                        {shortTermGoals.map(renderGoal)}
                        {shortTermGoals.length === 0 && (
                            <div className={styles.emptyList}>No short term goals right now.</div>
                        )}
                    </div>
                </div>
                <div className={styles.goalColumn}>
                    <div className={styles.columnTitleRow}>
                        <h2 className={styles.columnTitle}>Extra Goals</h2>
                        <button className={styles.achColumnBtn} onClick={() => setAchievementsType('extra')}>
                            <Award size={14} /> Progress
                        </button>
                    </div>
                    <div className={styles.goalsList}>
                        {extraGoals.map(renderGoal)}
                        {extraGoals.length === 0 && (
                            <div className={styles.emptyList}>No extra goals right now.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Goal Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingGoalId ? 'Edit Goal' : 'Create New Goal'}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleAddGoal} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Goal Title</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g., Run a Marathon"
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description (Optional)</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="Why is this important?"
                                    className={styles.textarea}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Goal Type</label>
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value as 'short-term' | 'long-term' | 'extra')}
                                        className={styles.select}
                                    >
                                        <option value="short-term">Short Term</option>
                                        <option value="long-term">Long Term</option>
                                        <option value="extra">Extra Goal</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Target Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={newTargetDate}
                                        onChange={(e) => setNewTargetDate(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Milestone Tasks (Optional)</label>
                                {newTasks.map((task, idx) => (
                                    <div key={idx} className={styles.taskInputRow}>
                                        <input
                                            type="text"
                                            value={task.title}
                                            onChange={(e) => handleTaskFieldChange(idx, e.target.value)}
                                            placeholder={`Task ${idx + 1}`}
                                            className={styles.input}
                                        />
                                        {newTasks.length > 1 && (
                                            <button
                                                type="button"
                                                className={styles.removeTaskBtn}
                                                onClick={() => handleRemoveTaskField(idx)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className={styles.addTaskFieldBtn} onClick={handleAddTaskField}>
                                    <Plus size={16} /> Add Another Task
                                </button>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={isSaving}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : (editingGoalId ? 'Save Changes' : 'Save Goal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {achievementsType !== null && (
                <div className={styles.modalOverlay} onClick={() => setAchievementsType(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>
                                <Award size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: '#f59e0b' }} />
                                {achievementsType === 'long-term' ? '🚩 Long Term' : achievementsType === 'extra' ? '⭐ Extra' : '🎯 Short Term'} Achievements
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setAchievementsType(null)}><X size={24} /></button>
                        </div>

                        <div className={styles.achievementsBody}>
                            {(() => {
                                const list = achievementsType === 'long-term' ? longTermGoals : achievementsType === 'extra' ? extraGoals : shortTermGoals;
                                const color = achievementsType === 'long-term' ? '#3b82f6' : achievementsType === 'extra' ? '#8b5cf6' : '#10b981';
                                const avg = list.length === 0 ? 0 : Math.round(
                                    list.reduce((sum, g) => sum + (g.tasks.length === 0 ? 0 : Math.round(g.tasks.filter(t => t.completed).length / g.tasks.length * 100)), 0) / list.length
                                );
                                return (
                                    <div className={styles.achSection}>
                                        <div className={styles.achSectionHeader}>
                                            {achievementsType === 'long-term' ? <Flag size={16} color={color} /> : achievementsType === 'extra' ? <Star size={16} color={color} /> : <Target size={16} color={color} />}
                                            <span className={styles.achSectionTitle} style={{ color }}>
                                                {achievementsType === 'long-term' ? 'Long Term Goals' : achievementsType === 'extra' ? 'Extra Goals' : 'Short Term Goals'}
                                            </span>
                                            {list.length > 0 && (
                                                <span className={styles.achSectionAvg}>Avg {avg}% complete</span>
                                            )}
                                        </div>
                                        <div className={styles.achievementsList}>
                                            {list.length === 0 && <div className={styles.emptyList}>No goals yet.</div>}
                                            {list.map(g => {
                                                const completed = g.tasks.filter(t => t.completed).length;
                                                const total = g.tasks.length;
                                                const prog = total === 0 ? 0 : Math.round((completed / total) * 100);
                                                return (
                                                    <div key={g.id} className={styles.achievementItem}>
                                                        <div className={styles.achievementHeader}>
                                                            <span className={styles.achievementTitle}>{g.title}</span>
                                                            <span className={styles.achievementMeta}>{completed}/{total} tasks</span>
                                                            <span className={styles.achievementPerc} style={{ color: prog === 100 ? '#10b981' : color }}>{prog}%</span>
                                                        </div>
                                                        <div className={styles.progressBar}>
                                                            <div className={styles.progressFill}
                                                                style={{ width: `${prog}%`, backgroundColor: prog === 100 ? 'var(--accent-success)' : color }} />
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
        </DragDropContext>
    );
}
