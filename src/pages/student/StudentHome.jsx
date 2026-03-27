import { useNavigate } from 'react-router-dom';

export default function StudentHome() {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Sinh viên';

    const handleLogout = () => {
        localStorage.clear(); // Xóa sạch token và role
        navigate('/login');
    };

    return (
        <div>
            {/* Navbar (Thanh điều hướng trên cùng) */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container">
                    <a className="navbar-brand fw-bold" href="#">Hệ Thống Thi Trắc Nghiệm</a>
                    <div className="d-flex align-items-center">
                        <span className="text-white me-3">Xin chào, <strong>{userName}</strong></span>
                        <button className="btn btn-danger btn-sm" onClick={handleLogout}>Đăng xuất</button>
                    </div>
                </div>
            </nav>

            {/* Nội dung chính */}
            <div className="container mt-5">
                <h2 className="text-center mb-4">Danh Sách Kỳ Thi Của Bạn</h2>
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow-sm border-primary">
                            <div className="card-body text-center">
                                <h4 className="card-title text-primary">Thi Giữa Kỳ - Môn Lập Trình Web</h4>
                                <p className="card-text text-muted">Thời gian: 45 phút | Số lượng: 40 câu</p>
                                <button className="btn btn-success btn-lg mt-3 px-5">Bắt Đầu Thi</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}