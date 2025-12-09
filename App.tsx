import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import { ShieldCheck, ScanLine, Home as HomeIcon } from 'lucide-react';

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  // Navigation is always visible now to allow switching from Scanner
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 p-1.5 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
        <Link to="/">
          <div className={`p-3 rounded-full transition-all ${location.pathname === '/' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <HomeIcon size={20} />
          </div>
        </Link>
        <Link to="/admin">
          <div className={`p-3 rounded-full transition-all ${location.pathname === '/admin' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <ShieldCheck size={20} />
          </div>
        </Link>
        <Link to="/scanner">
          <div className={`p-3 rounded-full transition-all ${location.pathname === '/scanner' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <ScanLine size={20} />
          </div>
        </Link>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500/30 selection:text-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/scanner" element={<Scanner />} />
        </Routes>
        <Navigation />
      </div>
    </HashRouter>
  );
};

export default App;