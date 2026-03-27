import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault(); // Chặn hành vi load lại trang của form
        
        fetch('https://xaydungpmweb-nhom7.onrender.com/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                // Lưu token và thông tin role vào bộ nhớ
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('role', data.user.role); 
                localStorage.setItem('userName', data.user.name); // Lưu thêm tên để hiển thị cho đẹp

                // PHÂN QUYỀN CHUYỂN TRANG:
                if (data.user.role === 1) {
                    // Nếu là Admin/CTSV -> Vào trang Quản trị
                    navigate('/admin/students'); 
                } else {
                    // Nếu là Sinh viên -> Vào trang Làm bài thi
                    navigate('/student'); 
                }
            } else {
                setError('Email hoặc mật khẩu không đúng!');
            }
        })
        .catch(() => setError('Không thể kết nối đến máy chủ!'));
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="card shadow p-4" style={{ width: '400px' }}>
                <h3 className="text-center text-primary mb-4">Hệ Thống Thi Trắc Nghiệm</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email đăng nhập</label>
                        <input type="email" className="form-control" required
                            onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Mật khẩu</label>
                        <input type="password" className="form-control" required
                            onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mt-2">Đăng Nhập</button>
                </form>
            </div>
        </div>
    );
}
