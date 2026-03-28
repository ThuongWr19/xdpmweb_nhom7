import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaClock, FaBook, FaLock, FaPlayCircle, 
    FaSignOutAlt, FaHistory, FaListAlt, FaCheckCircle, FaUserGraduate, FaBell 
} from 'react-icons/fa';
import axios from 'axios';

export default function StudentHome() {
    // --- KHAI BÁO STATE ---
    const [exams, setExams] = useState([]);
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('available'); // 'available' hoặc 'history'
    
    // State cho Modal Mật khẩu
    const [showModal, setShowModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    
    // Lấy thông tin user từ localStorage (nếu có lưu lúc đăng nhập)
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // --- CÁC HÀM XỬ LÝ (LOGIC) ---
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchNotices = async () => {
            try {
                // Sửa lại đường dẫn API cho đồng nhất với biến API_URL
                const response = await axios.get(`${API_URL}/notifications`); 
                setNotifications(response.data);
            } catch (error) {
                console.error("Lỗi lấy thông báo", error);
            }
        };

        fetchNotices();
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        // Tải song song cả danh sách kỳ thi và lịch sử
        await Promise.all([fetchExams(), fetchHistory()]);
        setIsLoading(false);
    };

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_URL}/student/exams`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            setExams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải danh sách kỳ thi:", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/student/exams/history`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải lịch sử thi:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleJoinExam = (exam) => {
        if (exam.has_password) {
            setSelectedExam(exam);
            setPasswordInput('');
            setErrorMsg('');
            setShowModal(true);
        } else {
            navigate(`/student/exam/${exam.id}/do`);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/student/exams/${selectedExam.id}/check-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ password: passwordInput })
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                navigate(`/student/exam/${selectedExam.id}/do`);
            } else {
                setErrorMsg(data.error || 'Mật khẩu sai!');
            }
        } catch (error) {
            setErrorMsg('Lỗi kết nối tới máy chủ!');
        }
    };

    // --- GIAO DIỆN (UI) ---
    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f4f6f9' }}>
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
                <div className="container">
                    <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
                        <FaUserGraduate className="fs-4" /> HỆ THỐNG THI TRỰC TUYẾN
                    </span>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-white text-end d-none d-sm-block">
                            <small className="d-block opacity-75">Sinh viên</small>
                            <span className="fw-bold">{user.name || 'Người dùng'}</span>
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="btn btn-danger btn-sm d-flex align-items-center gap-2 fw-bold shadow-sm"
                        >
                            <FaSignOutAlt /> Đăng xuất
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="row g-4">
                    
                    {/* CỘT TRÁI: DANH SÁCH BÀI THI / LỊCH SỬ (Chiếm 8/12 màn hình) */}
                    <div className="col-lg-8">
                        
                        {/* Tabs Điều hướng */}
                        <div className="bg-white p-2 rounded-pill shadow-sm d-inline-flex mb-4">
                            <button 
                                onClick={() => setActiveTab('available')}
                                className={`btn rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'available' ? 'btn-primary shadow' : 'btn-light text-muted border-0'}`}
                            >
                                <FaListAlt /> Kỳ thi hiện có
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`btn rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 transition-all ms-2 ${activeTab === 'history' ? 'btn-primary shadow' : 'btn-light text-muted border-0'}`}
                            >
                                <FaHistory /> Lịch sử làm bài
                            </button>
                        </div>

                        {/* Nội dung Tabs */}
                        {isLoading ? (
                            <div className="text-center py-5">
                                <span className="spinner-border text-primary fs-4"></span>
                                <p className="mt-3 text-muted fw-bold">Đang tải dữ liệu...</p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {/* TAB 1: KỲ THI HIỆN CÓ */}
                                {activeTab === 'available' && (
                                    exams.length === 0 ? (
                                        <div className="col-12 text-center py-5">
                                            <div className="alert alert-info border-0 shadow-sm d-inline-block px-5 py-4 rounded-4 bg-white">
                                                <FaBook className="fs-1 text-info mb-3 d-block mx-auto" />
                                                <h5 className="fw-bold text-dark">Chưa có kỳ thi nào</h5>
                                                <p className="mb-0 text-muted">Hiện tại không có kỳ thi nào đang mở dành cho bạn!</p>
                                            </div>
                                        </div>
                                    ) : (
                                        exams.map(exam => (
                                            <div className="col-md-6" key={exam.id}>
                                                <div className="card h-100 shadow-sm border-0 position-relative hover-card" style={{ borderRadius: '16px' }}>
                                                    {exam.has_password && (
                                                        <span className="position-absolute top-0 end-0 badge bg-danger m-3 p-2 shadow-sm rounded-pill" title="Cần mật khẩu">
                                                            <FaLock className="me-1" /> Có khóa
                                                        </span>
                                                    )}
                                                    <div className="card-body p-4 d-flex flex-column">
                                                        <h5 className="card-title fw-bold text-dark mb-3">{exam.title}</h5>
                                                        
                                                        <div className="mb-4 flex-grow-1">
                                                            <p className="card-text mb-2 d-flex align-items-center text-muted">
                                                                <FaBook className="me-2 text-primary" /> Môn thi: <strong className="ms-1 text-dark">{exam.subject}</strong>
                                                            </p>
                                                            <p className="card-text mb-2 d-flex align-items-center text-muted">
                                                                <FaClock className="me-2 text-warning" /> Thời gian: <strong className="ms-1 text-dark">{exam.duration} phút</strong>
                                                            </p>
                                                            <p className="card-text mb-0 d-flex align-items-center text-muted">
                                                                <FaListAlt className="me-2 text-info" /> Số lượng: <strong className="ms-1 text-dark">{exam.total_questions} câu</strong>
                                                            </p>
                                                        </div>
                                                        
                                                        <button 
                                                            className="btn btn-primary w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-pill mt-auto"
                                                            onClick={() => handleJoinExam(exam)}
                                                        >
                                                            <FaPlayCircle className="fs-5" /> VÀO THI NGAY
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}

                                {/* TAB 2: LỊCH SỬ LÀM BÀI */}
                                {activeTab === 'history' && (
                                    history.length === 0 ? (
                                        <div className="col-12 text-center py-5">
                                            <div className="alert alert-light border-0 shadow-sm d-inline-block px-5 py-4 rounded-4 bg-white">
                                                <FaHistory className="fs-1 text-secondary mb-3 d-block mx-auto" />
                                                <h5 className="fw-bold text-dark">Chưa có lịch sử</h5>
                                                <p className="mb-0 text-muted">Bạn chưa hoàn thành bài thi nào.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        history.map(item => (
                                            <div className="col-md-6" key={item.id}>
                                                <div className="card h-100 shadow-sm border-0 border-start border-success border-4 hover-card" style={{ borderRadius: '16px' }}>
                                                    <div className="card-body p-4 d-flex flex-column">
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <h5 className="fw-bold mb-0 text-dark">{item.exam_title || 'Bài thi'}</h5>
                                                            <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1 rounded-pill">
                                                                <FaCheckCircle className="me-1"/> Đã nộp
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="row text-center g-2 mb-3 flex-grow-1">
                                                            <div className="col-6">
                                                                <div className="bg-light p-3 rounded-3 border h-100">
                                                                    <small className="text-muted d-block fw-bold mb-1">Điểm số</small>
                                                                    <strong className="text-primary fs-4">{item.score}/10</strong>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div className="bg-light p-3 rounded-3 border h-100">
                                                                    <small className="text-muted d-block fw-bold mb-1">Số câu đúng</small>
                                                                    <strong className="text-success fs-4">{item.correct_answers}/{item.total_questions || '-'}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-muted small d-flex align-items-center justify-content-end mt-auto">
                                                            <FaClock className="me-1" /> Nộp lúc: {new Date(item.completed_at || item.created_at).toLocaleString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI: BẢNG TIN / THÔNG BÁO (Chiếm 4/12 màn hình) */}
                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0 sticky-top" style={{ borderRadius: '16px', top: '20px', zIndex: 10 }}>
                            <div className="card-header bg-white border-bottom-0 pt-4 pb-2">
                                <h5 className="card-title fw-bold text-dark d-flex align-items-center mb-0">
                                    <FaBell className="me-2 text-warning" /> Thông báo từ CTSV
                                </h5>
                            </div>
                            <div className="card-body p-4" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                                {notifications.length > 0 ? (
                                    notifications.map((noti) => (
                                        <div key={noti.id} className="alert alert-light border shadow-sm mb-3" style={{ borderRadius: '12px', backgroundColor: '#fff' }}>
                                            <div className="fw-bold text-primary mb-2 fs-6">{noti.title}</div>
                                            <div className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                                {noti.content}
                                            </div>
                                            <div className="text-secondary d-flex align-items-center mt-2 border-top pt-2" style={{ fontSize: '0.8rem' }}>
                                                <FaClock className="me-1"/> 
                                                Ngày đăng: {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <FaBell className="fs-1 text-light mb-2 d-block mx-auto" />
                                        Chưa có thông báo mới.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal Nhập Mật Khẩu */}
            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="modal-header bg-danger text-white border-0 rounded-top-4">
                                    <h5 className="modal-title fw-bold d-flex align-items-center gap-2"><FaLock/> Yêu cầu Mật khẩu</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <p className="text-muted mb-4">Kỳ thi <strong className="text-dark">{selectedExam?.title}</strong> yêu cầu mật khẩu để truy cập.</p>
                                    
                                    <input 
                                        type="password" 
                                        className={`form-control form-control-lg text-center bg-light ${errorMsg ? 'is-invalid' : ''}`}
                                        placeholder="Nhập mật khẩu phòng thi..." 
                                        value={passwordInput} 
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        required 
                                        autoFocus
                                    />
                                    {errorMsg && <div className="invalid-feedback mt-2 fw-bold">{errorMsg}</div>}
                                </div>
                                <div className="modal-footer border-0 justify-content-center pb-4 pt-0">
                                    <button type="button" className="btn btn-light px-4 fw-bold rounded-pill" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                    <button type="submit" className="btn btn-danger px-5 fw-bold shadow-sm rounded-pill">Xác nhận & Vào thi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* CSS Tùy chỉnh trực tiếp cho trang này */}
            <style>{`
                .hover-card { 
                    transition: all 0.25s ease-in-out; 
                }
                .hover-card:hover { 
                    transform: translateY(-6px); 
                    box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important; 
                }
                /* Tùy chỉnh thanh cuộn cho cột thông báo */
                .card-body::-webkit-scrollbar {
                    width: 6px;
                }
                .card-body::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 10px;
                }
                .card-body::-webkit-scrollbar-track {
                    background: transparent;
                }
            `}</style>
        </div>
    );
}