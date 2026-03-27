import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import StudentManager from './pages/admin/StudentManager';
import StudentHome from './pages/student/StudentHome';
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* --- KHU VỰC CỦA SINH VIÊN --- */}
        <Route path="/student" element={<StudentHome />} />

        {/* --- KHU VỰC CỦA ADMIN/CTSV --- */}
        <Route path="/admin" element={<AdminLayout />}>
            {/* Khi vào /admin/students thì nó sẽ nhét StudentManager vào phần Outlet của AdminLayout */}
            <Route path="students" element={<StudentManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;