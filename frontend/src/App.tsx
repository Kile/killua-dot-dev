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
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import NewsEditPage from './pages/NewsEditPage';
import ServersPage from './pages/ServersPage';
import ServerSettingsPage from './pages/ServerSettingsPage';
import DiscordSimulatorPage from './pages/DiscordSimulatorPage';
import ExploreLandingPage from './pages/ExploreLandingPage';

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
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:id" element={<NewsDetailPage />} />
              <Route path="/news/:id/edit" element={<NewsEditPage />} />
              <Route path="/news/create" element={<NewsEditPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/servers" element={<ServersPage />} />
              <Route path="/servers/:serverId" element={<ServerSettingsPage />} />
              <Route path="/explore" element={<ExploreLandingPage />} />
              <Route path="/explore/:categoryId" element={<DiscordSimulatorPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
