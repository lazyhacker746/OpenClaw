import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LeadForm from './components/LeadForm';
import ResultsTable from './components/ResultsTable';
import HistoryDashboard from './components/HistoryDashboard';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('generator');

  const [formData, setFormData] = useState({
    city: '',
    category: '',
    target_leads: 10,
    min_reviews: 20,
    mode: '1',
    use_ai: true,
    sadapay_link: ''
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleTheme = () => setIsDark(!isDark);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === 'error') {
        setError(data.message.join(', '));
      } else {
        setResults(data.data);
      }
    } catch (err) {
      setError("SYSTEM OFFLINE: Backend API connection failed. Verify engine status.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = Object.keys(results[0]).join(',');
    const csvData = results.map(row =>
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');

    const blob = new Blob([`${headers}\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OpenClaw_Intel_${formData.city}.csv`;
    a.click();
  };

  // --- SECURITY LAYER ---
  if (!isAuthenticated) {
    return (
      <div className={isDark ? "dark" : ""}>
        <LoginScreen onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  // --- MAIN APP LAYER ---
  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-gray-800 dark:text-gray-300 relative overflow-hidden font-sans selection:bg-purple-500/30 transition-colors duration-300">

        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-900/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-300"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-900/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-300"></div>

        <Navbar isDark={isDark} toggleTheme={toggleTheme} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Mobile Padding (p-3 on phones, p-8 on laptops) */}
        <div className="relative z-10 max-w-7xl mx-auto p-3 sm:p-8">
          {activeTab === 'generator' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-4 space-y-6">
                <LeadForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  loading={loading}
                />
              </div>
              <div className="xl:col-span-8 flex flex-col">
                <ResultsTable
                  results={results}
                  loading={loading}
                  error={error}
                  exportCSV={exportCSV}
                />
              </div>
            </div>
          ) : (
            <HistoryDashboard />
          )}
        </div>
      </div>
    </div>
  );
}