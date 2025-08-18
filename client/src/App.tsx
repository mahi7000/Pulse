import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import { Home } from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { HabitsPage } from "./pages/Habits";
import { ProfilePage } from "./pages/Profile";
import { AuthProvider } from "./context/AuthContext";
import { CreateHabitPage } from "./pages/CreateHabit";
import GroupListPage from "./pages/GroupListPage";
import GroupChatPage  from "./pages/GroupChat";
import NotFound from "./pages/NotFound";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  const location = useLocation();
  const noHeaderPaths = ["/signup", "/login"];
  const hideHeader = noHeaderPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
           } />
          <Route path="/habits" element={
            <ProtectedRoute>
              <HabitsPage />
            </ProtectedRoute>
          } />
          <Route path="/habits/new" element={
            <ProtectedRoute>
              <CreateHabitPage />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupListPage />
            </ProtectedRoute>
          } />
          <Route path="/groups/:groupId" element={
           <ProtectedRoute>
            <GroupChatPage />
           </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
