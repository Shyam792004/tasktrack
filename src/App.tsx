import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Timer } from './pages/Timer';
import { Expenses } from './pages/Expenses';
import { Goals } from './pages/Goals';
import { Habits } from './pages/Habits';
import { Health } from './pages/Health';
import { Savings } from './pages/Savings';
import { Analytics } from './pages/Analytics';

// Placeholder Pages
const Settings = () => <div><h2>Settings</h2></div>;

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <DashboardLayout theme={theme} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/health" element={<Health />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
