import { Routes, Route, Outlet, Navigate, HashRouter} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppHeader from './components/AppHeader';
import Login from './feature/login';
import PrescriptionForm from './feature/prescriptionForm';
import PrescriptionList from './feature/prescriptions';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                  <AppHeader />
                  <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <Outlet />
                  </main>
                </div>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/prescriptions" />} />
            <Route path="prescriptions" element={<Outlet />}>
              <Route index element={<PrescriptionList />} />
              <Route path="new" element={<PrescriptionForm />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;