import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import './AdminLayout.css'; // Import file CSS vừa tạo
// Import các icon từ thư viện react-icons
import { FaChartPie, FaUsers, FaFileAlt, FaUserCircle, FaSignOutAlt, FaCog } from 'react-icons/fa';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation(); // Lấy đường dẫn URL hiện tại
    const userName = localStorage.getItem('userName') || 'Admin';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Khai báo danh sách Menu để render cho gọn gàng
    const menuItems = [
        { path: '/admin/dashboard', name: 'Thống kê', icon: <FaChartPie className="sidebar-icon" /> },
        { path: '/admin/students', name: 'Quản lý sinh viên', icon: <FaUsers className="sidebar-icon" /> },
        { path: '/admin/exams', name: 'Quản lý đề thi', icon: <FaFileAlt className="sidebar-icon" /> },
        { path: '/admin/settings', name: 'Cài đặt hệ thống', icon: <FaCog className="sidebar-icon" /> },
    ];

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            
            {/* --- SIDEBAR BÊN TRÁI --- */}
            <div className="custom-sidebar shadow-sm">
                {/* Logo / Header của Sidebar */}
                <div className="p-4 text-center border-bottom">
                    <h5 className="text-primary fw-bold mb-0">Trang Quản Trị</h5>
                    <small className="text-muted">Xin chào, {userName}</small>
                </div>
                
                {/* Danh sách Menu */}
                <div className="d-flex flex-column flex-grow-1 py-3">
                    {menuItems.map((item, index) => {
                        // Kiểm tra xem URL hiện tại có khớp với path của menu không để gắn class 'active'
                        const isActive = location.pathname.includes(item.path);
                        
                        return (
                            <Link 
                                key={index} 
                                to={item.path} 
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Khu vực dưới cùng (Tài khoản & Đăng xuất) */}
                <div className="border-top py-3">
                    <Link to="/admin/profile" className={`sidebar-item ${location.pathname.includes('/admin/profile') ? 'active' : ''}`}>
                        <FaUserCircle className="sidebar-icon" />
                        Thông tin tài khoản
                    </Link>
                    
                    <div className="sidebar-item sidebar-logout mt-1" onClick={handleLogout}>
                        <FaSignOutAlt className="sidebar-icon" />
                        Đăng xuất
                    </div>
                </div>
            </div>

            {/* --- NỘI DUNG BÊN PHẢI --- */}
            <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f4f6f9', overflowY: 'auto', maxHeight: '100vh' }}>
                <Outlet /> 
            </div>
            
        </div>
    );
}