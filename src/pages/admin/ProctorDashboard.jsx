import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaSync, FaExclamationTriangle, FaBan, FaCheckCircle } from 'react-icons/fa';

export default function ProctorDashboard() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    // 1. Lấy danh sách tất cả kỳ thi
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await axios.get(`${API_URL}/exams`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Lọc ra các kỳ thi đang mở (is_active = 1)
                const activeExams = res.data.filter(e => e.is_active);
                setExams(activeExams);
            } catch (error) {
                console.error("Lỗi lấy danh sách kỳ thi", error);
            }
        };
        fetchExams();
    }, [API_URL, token]);

    // 2. Lấy danh sách giám sát sinh viên đang thi
    const fetchAttempts = async () => {
        if (!selectedExam) return;
        try {
            const res = await axios.get(`${API_URL}/admin/exams/${selectedExam}/active-attempts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttempts(res.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách giám sát", error);
        }
    };

    // 3. Real-time Polling: Tự động refresh mỗi 5 giây khi đã chọn kỳ thi
    useEffect(() => {
        if (selectedExam) {
            setIsLoading(true);
            fetchAttempts().finally(() => setIsLoading(false));
            
            const intervalId = setInterval(() => {
                fetchAttempts();
            }, 5000); // 5000ms = 5 giây
            
            return () => clearInterval(intervalId); // Cleanup khi đổi kỳ thi hoặc thoát trang
        } else {
            setAttempts([]);
        }
    }, [selectedExam]);

    // 4. Nút bấm Thu bài
    const handleForceSubmit = async (attemptId, studentName) => {
        if (window.confirm(`XÁC NHẬN: Bạn muốn đình chỉ và THU BÀI của sinh viên [ ${studentName} ] ngay lập tức?`)) {
            try {
                await axios.post(`${API_URL}/admin/exam-attempts/${attemptId}/force-submit`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Đã đình chỉ thành công!');
                fetchAttempts(); // Refresh lại data ngay lập tức
            } catch (error) {
                alert('Có lỗi xảy ra khi thực hiện lệnh thu bài!');
                console.error(error);
            }
        }
    };

    return (
        <div className="container-fluid py-4">
            <h3 className="fw-bold mb-4 d-flex align-items-center text-primary">
                <FaEye className="me-2 fs-2" /> Hệ Thống Giám Sát Phòng Thi
            </h3>

            {/* Bộ lọc chọn kỳ thi */}
            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <label className="fw-bold text-dark mb-2">Chọn phòng thi / kỳ thi đang diễn ra:</label>
                            <select 
                                className="form-select form-select-lg shadow-sm border-primary"
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                            >
                                <option value="">-- Vui lòng chọn một phòng thi --</option>
                                {exams.map(exam => (
                                    <option key={exam.id} value={exam.id}>
                                        {exam.title} (Môn: {exam.subject})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4 text-end mt-4 mt-md-0">
                            <button className="btn btn-outline-primary fw-bold shadow-sm" onClick={fetchAttempts} disabled={!selectedExam || isLoading}>
                                <FaSync className={`me-2 ${isLoading ? 'fa-spin' : ''}`} /> Cập nhật tức thì
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bảng theo dõi sinh viên */}
            {selectedExam && (
                <div className="card shadow border-0" style={{ borderRadius: '12px' }}>
                    <div className="card-header bg-dark text-white py-3" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                        <h5 className="mb-0 fw-bold">Trạng thái sinh viên trong phòng</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4 py-3">Họ và tên / Email</th>
                                        <th className="py-3">Lớp</th>
                                        <th className="py-3">Giờ bắt đầu</th>
                                        <th className="py-3 text-center">Trạng thái</th>
                                        <th className="py-3 text-center">Cảnh báo vi phạm</th>
                                        <th className="py-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5 text-muted fw-bold">
                                                Chưa có sinh viên nào bắt đầu tham gia kỳ thi này.
                                            </td>
                                        </tr>
                                    ) : (
                                        attempts.map(attempt => (
                                            // Highlight nền vàng nhạt nếu vi phạm từ 2 lần trở lên
                                            <tr key={attempt.id} className={attempt.cheat_count >= 2 && attempt.status === 'in_progress' ? 'table-warning' : ''}>
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold text-dark fs-6">{attempt.user?.name || 'Unknown'}</div>
                                                    <div className="text-muted small">{attempt.user?.email}</div>
                                                </td>
                                                <td className="fw-medium">{attempt.user?.class || 'N/A'}</td>
                                                <td>{new Date(attempt.started_at).toLocaleTimeString('vi-VN')}</td>
                                                
                                                <td className="text-center">
                                                    {attempt.status === 'in_progress' && <span className="badge bg-primary px-3 py-2 rounded-pill">Đang làm bài</span>}
                                                    {attempt.status === 'completed' && <span className="badge bg-success px-3 py-2 rounded-pill"><FaCheckCircle className="me-1"/> Đã nộp bài</span>}
                                                    {attempt.status === 'forced_submitted' && <span className="badge bg-danger px-3 py-2 rounded-pill"><FaBan className="me-1"/> Bị đình chỉ</span>}
                                                </td>
                                                
                                                <td className="text-center">
                                                    {attempt.cheat_count > 0 ? (
                                                        <span className={`badge ${attempt.cheat_count >= 3 ? 'bg-danger' : 'bg-warning text-dark'} fs-6 px-3 py-2 rounded-pill shadow-sm`}>
                                                            <FaExclamationTriangle className="me-1" /> {attempt.cheat_count} lần
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-sm btn-danger fw-bold rounded-pill px-3 shadow-sm"
                                                        onClick={() => handleForceSubmit(attempt.id, attempt.user?.name)}
                                                        disabled={attempt.status !== 'in_progress'}
                                                    >
                                                        Thu bài ngay
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}