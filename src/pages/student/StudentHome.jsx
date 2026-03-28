import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaBook, FaLock, FaPlayCircle } from 'react-icons/fa';

export default function StudentHome() {
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State cho Modal Mật khẩu
    const [showModal, setShowModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_URL}/student/exams`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            setExams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải danh sách kỳ thi:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Khi sinh viên bấm "Vào thi"
    const handleJoinExam = (exam) => {
        if (exam.has_password) {
            // Nếu có mật khẩu thì mở Modal yêu cầu nhập
            setSelectedExam(exam);
            setPasswordInput('');
            setErrorMsg('');
            setShowModal(true);
        } else {
            // Không có mật khẩu thì chuyển thẳng tới trang làm bài
            navigate(`/student/exam/${exam.id}/do`);
        }
    };

    // Xử lý submit Mật khẩu
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

    return (
        <div className="container py-5">
            <div className="mb-4 text-center">
                <h2 className="fw-bold text-primary">Kỳ thi của bạn</h2>
                <p className="text-muted">Chọn một kỳ thi đang mở để bắt đầu làm bài</p>
            </div>

            {isLoading ? (
                <div className="text-center mt-5"><span className="spinner-border text-primary"></span> Đang tải...</div>
            ) : exams.length === 0 ? (
                <div className="alert alert-info text-center mt-5">Hiện tại không có kỳ thi nào đang mở!</div>
            ) : (
                <div className="row g-4">
                    {exams.map(exam => (
                        <div className="col-md-6 col-lg-4" key={exam.id}>
                            <div className="card h-100 shadow-sm border-0 position-relative hover-card">
                                {exam.has_password && (
                                    <span className="position-absolute top-0 end-0 badge bg-danger m-3 p-2 shadow-sm" title="Cần mật khẩu">
                                        <FaLock />
                                    </span>
                                )}
                                <div className="card-body p-4">
                                    <h5 className="card-title fw-bold text-dark mb-3">{exam.title}</h5>
                                    
                                    <p className="card-text mb-2 d-flex align-items-center text-muted">
                                        <FaBook className="me-2 text-primary" /> Môn thi: <strong className="ms-1 text-dark">{exam.subject}</strong>
                                    </p>
                                    <p className="card-text mb-2 d-flex align-items-center text-muted">
                                        <FaClock className="me-2 text-warning" /> Thời gian: <strong className="ms-1 text-dark">{exam.duration} phút</strong>
                                    </p>
                                    <p className="card-text mb-4 text-muted">
                                        🎯 Số lượng: <strong>{exam.total_questions} câu</strong>
                                    </p>
                                    
                                    <button 
                                        className="btn btn-primary w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                        onClick={() => handleJoinExam(exam)}
                                    >
                                        <FaPlayCircle fs-5 /> VÀO THI NGAY
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Nhập Mật Khẩu */}
            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="modal-header bg-danger text-white border-0">
                                    <h5 className="modal-title fw-bold d-flex align-items-center gap-2"><FaLock/> Yêu cầu Mật khẩu</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-4 text-center">
                                    <p className="text-muted mb-4">Kỳ thi <strong>{selectedExam?.title}</strong> yêu cầu mật khẩu để truy cập.</p>
                                    
                                    <input 
                                        type="password" 
                                        className={`form-control form-control-lg text-center ${errorMsg ? 'is-invalid' : ''}`}
                                        placeholder="Nhập mật khẩu phòng thi..." 
                                        value={passwordInput} 
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        required 
                                        autoFocus
                                    />
                                    {errorMsg && <div className="invalid-feedback mt-2 fw-bold">{errorMsg}</div>}
                                </div>
                                <div className="modal-footer border-0 bg-light justify-content-center pb-4">
                                    <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                    <button type="submit" className="btn btn-danger px-5 fw-bold shadow-sm">Xác nhận & Vào thi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .hover-card { transition: transform 0.2s, box-shadow 0.2s; border-radius: 12px; }
                .hover-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
            `}</style>
        </div>
    );
}