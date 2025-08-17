import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import { Home } from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { RedirectIfAuth } from "./components/RedirectIfAuth";
import { HabitsPage } from "./pages/Habits";
import { ProfilePage } from "./pages/Profile";
import { AuthProvider } from "./context/AuthContext";
import { CreateHabitPage } from "./pages/CreateHabit";
import GroupListPage from "./pages/GroupListPage";
import GroupChatPage  from "./pages/GroupChat";

function AppContent() {
  const location = useLocation();
  const noHeaderPaths = ["/signup", "/login"];
  const hideHeader = noHeaderPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/habits/new" element={<CreateHabitPage />} />
          <Route path="/groups" element={<GroupListPage />} />
          <Route path="/groups/:groupId" element={<GroupChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/login"
            element={
                <Login />
            }
          />
          <Route
            path="/signup"
            element={
              <RedirectIfAuth>
                <Signup />
              </RedirectIfAuth>
            }
          />
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
