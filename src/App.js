import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useWallet } from './contexts/WalletContext';
import Layout from './components/Layout';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Launchpad from './pages/Launchpad';
import Settings from './pages/Settings';

function App() {
  const { isLocked, wallet } = useWallet();

  // 如果没有钱包或钱包被锁定，显示欢迎屏幕
  if (!wallet || isLocked) {
    return <WelcomeScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/market" element={<Market />} />
        <Route path="/launchpad" element={<Launchpad />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App; 