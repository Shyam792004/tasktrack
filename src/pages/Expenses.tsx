import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Plus, Coffee, Briefcase, ShoppingBag, Home, Zap, X } from 'lucide-react';
import { format } from 'date-fns';
import { subscribeToTransactions, addTransaction, deleteTransaction, subscribeToCategories, updateCategories } from '../services/dataService';
import styles from './Expenses.module.css';

interface Transaction {
    id: string;
    amount: number;
    category: string;
    title: string;
    date: string;
    type: 'income' | 'expense';
}

const ICON_MAP: Record<string, React.ReactNode> = {
    Coffee: <Coffee size={18} />,
    Briefcase: <Briefcase size={18} />,
    ShoppingBag: <ShoppingBag size={18} />,
    Home: <Home size={18} />,
    Zap: <Zap size={18} />,
};

const INITIAL_EXPENSE_CATEGORIES = [
    { id: 'Food', icon: 'Coffee', color: '#f59e0b' },
    { id: 'Travel', icon: 'Briefcase', color: '#3b82f6' },
    { id: 'Shopping', icon: 'ShoppingBag', color: '#8b5cf6' },
    { id: 'Bills', icon: 'Home', color: '#ef4444' },
    { id: 'Other', icon: 'Zap', color: '#10b981' },
];

const INITIAL_INCOME_CATEGORIES = [
    { id: 'Salary', icon: 'Briefcase', color: '#10b981' },
    { id: 'Freelance', icon: 'Zap', color: '#3b82f6' },
    { id: 'Investment', icon: 'Home', color: '#8b5cf6' },
    { id: 'Other', icon: 'Coffee', color: '#f59e0b' },
];

export function Expenses() {
    const [expenseCategories, setExpenseCategories] = useState<any[]>(INITIAL_EXPENSE_CATEGORIES);
    const [incomeCategories, setIncomeCategories] = useState<any[]>(INITIAL_INCOME_CATEGORIES);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const unsubTrans = subscribeToTransactions(setTransactions);
        const unsubCats = subscribeToCategories((data) => {
            if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
            if (data.incomeCategories) setIncomeCategories(data.incomeCategories);
        });
        return () => {
            unsubTrans();
            unsubCats();
        };
    }, []);


    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeTitle, setIncomeTitle] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseTitle, setExpenseTitle] = useState('');

    const [expenseCategory, setExpenseCategory] = useState('Food');
    const [incomeCategory, setIncomeCategory] = useState('Salary');

    const [isAddingExpenseCategory, setIsAddingExpenseCategory] = useState(false);
    const [newExpenseCategoryName, setNewExpenseCategoryName] = useState('');

    const [isAddingIncomeCategory, setIsAddingIncomeCategory] = useState(false);
    const [newIncomeCategoryName, setNewIncomeCategoryName] = useState('');

    const renderIcon = (iconName: string) => {
        return ICON_MAP[iconName] || <Zap size={18} />;
    };

    const handleAddCategory = async (type: 'income' | 'expense') => {
        const name = type === 'expense' ? newExpenseCategoryName : newIncomeCategoryName;
        if (!name.trim()) {
            if (type === 'expense') setIsAddingExpenseCategory(false);
            else setIsAddingIncomeCategory(false);
            return;
        }

        const colors = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newCat = {
            id: name.trim(),
            icon: 'Zap',
            color: randomColor
        };

        try {
            if (type === 'expense') {
                const updated = [...expenseCategories, newCat];
                await updateCategories({ expenseCategories: updated });
                setExpenseCategory(newCat.id);
                setNewExpenseCategoryName('');
                setIsAddingExpenseCategory(false);
            } else {
                const updated = [...incomeCategories, newCat];
                await updateCategories({ incomeCategories: updated });
                setIncomeCategory(newCat.id);
                setNewIncomeCategoryName('');
                setIsAddingIncomeCategory(false);
            }
        } catch (err) { console.error(err); }
    };

    const handleRemoveCategory = async (e: React.MouseEvent, catId: string, type: 'income' | 'expense') => {
        e.stopPropagation();

        try {
            if (type === 'expense') {
                if (expenseCategories.length <= 1) return;
                const newCats = expenseCategories.filter((c: any) => c.id !== catId);
                await updateCategories({ expenseCategories: newCats });
                if (expenseCategory === catId && newCats.length > 0) {
                    setExpenseCategory(newCats[0].id);
                }
            } else {
                if (incomeCategories.length <= 1) return;
                const newCats = incomeCategories.filter((c: any) => c.id !== catId);
                await updateCategories({ incomeCategories: newCats });
                if (incomeCategory === catId && newCats.length > 0) {
                    setIncomeCategory(newCats[0].id);
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleAddTransaction = async (e: React.FormEvent, type: 'income' | 'expense') => {
        e.preventDefault();
        const amt = type === 'income' ? incomeAmount : expenseAmount;
        const ttl = type === 'income' ? incomeTitle : expenseTitle;
        if (!amt || !ttl) return;

        try {
            await addTransaction({
                amount: parseFloat(amt),
                title: ttl,
                category: type === 'expense' ? expenseCategory : incomeCategory,
                date: new Date().toISOString(),
                type
            });

            if (type === 'income') {
                setIncomeAmount('');
                setIncomeTitle('');
            } else {
                setExpenseAmount('');
                setExpenseTitle('');
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (confirm('Delete this transaction?')) {
            await deleteTransaction(id);
        }
    };

    const expensesList = transactions.filter(t => t.type === 'expense');
    const incomeList = transactions.filter(t => t.type === 'income');

    const getChartData = (list: Transaction[]) => {
        const dataObj: Record<string, number> = {};
        list.forEach((t: Transaction) => {
            dataObj[t.category] = (dataObj[t.category] || 0) + t.amount;
        });
        return Object.keys(dataObj).map(key => ({
            name: key,
            value: dataObj[key]
        }));
    };

    const expenseChartData = getChartData(expensesList);
    const incomeChartData = getChartData(incomeList);

    const totalExpenses = expensesList.reduce((sum: number, exp: Transaction) => sum + exp.amount, 0);
    const totalIncome = incomeList.reduce((sum: number, inc: Transaction) => sum + inc.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    return (
        <div className={styles.expensesPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Finance Tracker</h1>
                    <p className={styles.subtitle}>Monitor your income and expenses</p>
                </div>
                <div className={styles.totalBadge}>
                    <span>Net Balance</span>
                    <h2 style={{ backgroundImage: netBalance >= 0 ? 'linear-gradient(to right, #10b981, #34d399)' : 'linear-gradient(to right, var(--accent-danger), #f43f5e)' }}>
                        ₹{Math.abs(netBalance).toFixed(2)} {netBalance < 0 && <span style={{ fontSize: '1rem', color: 'var(--accent-danger)' }}>(Negative)</span>}
                    </h2>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* INCOME COLUMN */}
                <div className={styles.columnWrapper}>
                    <div className={styles.columnHeader}>
                        <h2 className={styles.incomeTitle}>Income</h2>
                        <span className={styles.columnTotal}>₹{totalIncome.toFixed(2)}</span>
                    </div>

                    <div className={`glass-panel ${styles.addFormCard}`}>
                        <h3>Add Income</h3>
                        <form onSubmit={(e) => handleAddTransaction(e, 'income')} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <span className={styles.currencyPrefix}>₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={incomeAmount}
                                    onChange={(e) => setIncomeAmount(e.target.value)}
                                    className={styles.amountInput}
                                    required
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="What is the source of income?"
                                value={incomeTitle}
                                onChange={(e) => setIncomeTitle(e.target.value)}
                                className={styles.titleInput}
                                required
                            />
                            <div className={styles.categorySelector}>
                                {incomeCategories.map((cat: any) => (
                                    <div key={cat.id} className={styles.catBtnWrapper}>
                                        <button
                                            type="button"
                                            className={`${styles.catBtn} ${incomeCategory === cat.id ? styles.activeCat : ''}`}
                                            onClick={() => setIncomeCategory(cat.id)}
                                            style={incomeCategory === cat.id ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color } : {}}
                                        >
                                            {renderIcon(cat.icon)} {cat.id}
                                        </button>
                                        {incomeCategories.length > 1 && (
                                            <button
                                                type="button"
                                                className={styles.removeCatBtn}
                                                onClick={(e) => handleRemoveCategory(e, cat.id, 'income')}
                                                title={`Remove ${cat.id}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isAddingIncomeCategory ? (
                                    <div className={styles.addCatInputWrapper}>
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="New category..."
                                            value={newIncomeCategoryName}
                                            onChange={(e) => setNewIncomeCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCategory('income');
                                                } else if (e.key === 'Escape') {
                                                    setIsAddingIncomeCategory(false);
                                                    setNewIncomeCategoryName('');
                                                }
                                            }}
                                            className={styles.addCatInput}
                                        />
                                        <button type="button" onMouseDown={(e) => { e.preventDefault(); handleAddCategory('income'); }} className={styles.addCatConfirmBtn}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingIncomeCategory(true)}
                                        className={`${styles.catBtn} ${styles.addCatBtn}`}
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                )}
                            </div>
                            <button type="submit" className={`${styles.submitBtn} ${styles.incomeSubmitBtn}`}>
                                <Plus size={18} /> Add Income
                            </button>
                        </form>
                    </div>

                    <div className={`glass-panel ${styles.chartCard}`}>
                        <h3>Income Breakdown</h3>
                        {incomeChartData.length > 0 ? (
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeChartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {incomeChartData.map((entry, index) => {
                                                const cat = incomeCategories.find((c: any) => c.id === entry.name);
                                                return <Cell key={`cell-${index}`} fill={cat?.color || '#ccc'} />;
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `${Number(value).toFixed(2)}`}
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={styles.emptyChart}>No income yet</div>
                        )}
                    </div>

                    <div className={`glass-panel ${styles.listCard}`}>
                        <h3>Recent Income</h3>
                        <div className={styles.expenseList}>
                            {incomeList.map((income: Transaction) => {
                                const catInfo = incomeCategories.find((c: any) => c.id === income.category);
                                return (
                                    <div key={income.id} className={styles.expenseItem}>
                                        <div className={styles.expenseLeft}>
                                            <div
                                                className={styles.expenseIcon}
                                                style={{ backgroundColor: `${catInfo?.color}20`, color: catInfo?.color }}
                                            >
                                                {renderIcon(catInfo?.icon)}
                                            </div>
                                            <div className={styles.expenseDetails}>
                                                <span className={styles.expenseTitle}>{income.title}</span>
                                                <span className={styles.expenseDate}>{format(new Date(income.date), 'MMM d, yyyy • h:mm a')}</span>
                                            </div>
                                        </div>
                                        <div className={`${styles.expenseAmount} ${styles.incomeAmount}`} title="Click to delete" onClick={() => handleDeleteTransaction(income.id)} style={{ cursor: 'pointer' }}>
                                            +₹{income.amount.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                            {incomeList.length === 0 && (
                                <div className={styles.emptyList}>
                                    No income transactions found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* EXPENSES COLUMN */}
                <div className={styles.columnWrapper}>
                    <div className={styles.columnHeader}>
                        <h2 className={styles.expenseTitle}>Expenses</h2>
                        <span className={styles.columnTotal}>₹{totalExpenses.toFixed(2)}</span>
                    </div>

                    <div className={`glass-panel ${styles.addFormCard}`}>
                        <h3>Add Expense</h3>
                        <form onSubmit={(e) => handleAddTransaction(e, 'expense')} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <span className={styles.currencyPrefix}>₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={expenseAmount}
                                    onChange={(e) => setExpenseAmount(e.target.value)}
                                    className={styles.amountInput}
                                    required
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="What did you pay for?"
                                value={expenseTitle}
                                onChange={(e) => setExpenseTitle(e.target.value)}
                                className={styles.titleInput}
                                required
                            />
                            <div className={styles.categorySelector}>
                                {expenseCategories.map((cat: any) => (
                                    <div key={cat.id} className={styles.catBtnWrapper}>
                                        <button
                                            type="button"
                                            className={`${styles.catBtn} ${expenseCategory === cat.id ? styles.activeCat : ''}`}
                                            onClick={() => setExpenseCategory(cat.id)}
                                            style={expenseCategory === cat.id ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color } : {}}
                                        >
                                            {renderIcon(cat.icon)} {cat.id}
                                        </button>
                                        {expenseCategories.length > 1 && (
                                            <button
                                                type="button"
                                                className={styles.removeCatBtn}
                                                onClick={(e) => handleRemoveCategory(e, cat.id, 'expense')}
                                                title={`Remove ${cat.id}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isAddingExpenseCategory ? (
                                    <div className={styles.addCatInputWrapper}>
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="New category..."
                                            value={newExpenseCategoryName}
                                            onChange={(e) => setNewExpenseCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCategory('expense');
                                                } else if (e.key === 'Escape') {
                                                    setIsAddingExpenseCategory(false);
                                                    setNewExpenseCategoryName('');
                                                }
                                            }}
                                            className={styles.addCatInput}
                                        />
                                        <button type="button" onMouseDown={(e) => { e.preventDefault(); handleAddCategory('expense'); }} className={styles.addCatConfirmBtn}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingExpenseCategory(true)}
                                        className={`${styles.catBtn} ${styles.addCatBtn}`}
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                )}
                            </div>
                            <button type="submit" className={`${styles.submitBtn} ${styles.expenseSubmitBtn}`}>
                                <Plus size={18} /> Add Expense
                            </button>
                        </form>
                    </div>

                    <div className={`glass-panel ${styles.chartCard}`}>
                        <h3>Spending Breakdown</h3>
                        {expenseChartData.length > 0 ? (
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expenseChartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {expenseChartData.map((entry, index) => {
                                                const cat = expenseCategories.find((c: any) => c.id === entry.name);
                                                return <Cell key={`cell-${index}`} fill={cat?.color || '#ccc'} />;
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `${Number(value).toFixed(2)}`}
                                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={styles.emptyChart}>No expenses yet</div>
                        )}
                    </div>

                    <div className={`glass-panel ${styles.listCard}`}>
                        <h3>Recent Expenses</h3>
                        <div className={styles.expenseList}>
                            {expensesList.map((expense: Transaction) => {
                                const catInfo = expenseCategories.find((c: any) => c.id === expense.category);
                                return (
                                    <div key={expense.id} className={styles.expenseItem}>
                                        <div className={styles.expenseLeft}>
                                            <div
                                                className={styles.expenseIcon}
                                                style={{ backgroundColor: `${catInfo?.color}20`, color: catInfo?.color }}
                                            >
                                                {renderIcon(catInfo?.icon)}
                                            </div>
                                            <div className={styles.expenseDetails}>
                                                <span className={styles.expenseTitle}>{expense.title}</span>
                                                <span className={styles.expenseDate}>{format(new Date(expense.date), 'MMM d, yyyy • h:mm a')}</span>
                                            </div>
                                        </div>
                                        <div className={`${styles.expenseAmount} ${styles.expenseNegativeAmount}`} title="Click to delete" onClick={() => handleDeleteTransaction(expense.id)} style={{ cursor: 'pointer' }}>
                                            -₹{expense.amount.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                            {expensesList.length === 0 && (
                                <div className={styles.emptyList}>
                                    No expense transactions found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
