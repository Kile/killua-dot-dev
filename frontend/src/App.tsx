import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import PremiumPage from './pages/PremiumPage';
import TeamPage from './pages/TeamPage';
import CommandsPage from './pages/CommandsPage';
import DisclaimerPage from './pages/DisclaimerPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AccountPage from './pages/AccountPage';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-discord-darker text-white">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/commands" element={<CommandsPage />} />
                                   <Route path="/disclaimer" element={<DisclaimerPage />} />
                     <Route path="/auth/callback" element={<AuthCallbackPage />} />
                     <Route path="/account" element={<AccountPage />} />
                     <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
