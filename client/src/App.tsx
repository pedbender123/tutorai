import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import PersonasPage from './pages/PersonasPage';
import DisciplinasPage from './pages/DisciplinasPage';
import LabMural from './pages/LabMural';
import LabEditor from './pages/LabEditor';
import ClassPage from './pages/ClassPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/mural" replace />} />
                <Route path="mural" element={<PersonasPage />} />
                <Route path="disciplinas" element={<DisciplinasPage />} />
                <Route path="chat" element={<Chat />} />
                <Route path="chat/:chatId" element={<Chat />} />
                <Route path="lab" element={<LabMural />} />
                <Route path="lab/:projectId" element={<LabEditor />} />
                <Route path="class" element={<ClassPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
