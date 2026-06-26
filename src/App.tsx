import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Messages } from './pages/Messages';
import { Files } from './pages/Files';
import { Timeline } from './pages/Timeline';
import { Tasks } from './pages/Tasks';
import { Team } from './pages/Team';
import { Meeting } from './pages/Meeting';
import { Polls } from './pages/Polls';
import { Assets } from './pages/Assets';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/" />} />

      {/* Protected Routes */}
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="messages" element={<Messages />} />
        <Route path="files" element={<Files />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="team" element={<Team />} />
        <Route path="meeting" element={<Meeting />} />
        <Route path="polls" element={<Polls />} />
        <Route path="assets" element={<Assets />} />
      </Route>
    </Routes>
  );
}
