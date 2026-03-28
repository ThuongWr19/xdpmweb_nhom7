import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaFileAlt, FaQuestionCircle, FaHistory, FaCheckCircle, FaBan } from 'react-icons/fa';

export default function ReportDashboard() {
    const [stats, setStats] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/dashboard/statistics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error('Lỗi lấy dữ liệu thống kê:', error);
            }
        };
        fetchStats();
    }, [API_URL, token]);

    if (!stats) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    const statCards = [
        { title: 'Tổng Sinh Viên', value: stats.total_students, icon: <FaUsers size={30} />, color: 'primary' },
        { title: 'Tổng Kỳ Thi', value: stats.total_exams, icon: <FaFileAlt size={30} />, color: 'success' },
        { title: 'Ngân Hàng Câu Hỏi', value: stats.total_questions, icon: <FaQuestionCircle size={30} />, color: 'warning' },
        { title: 'Lượt Làm Bài', value: stats.total_attempts, icon: <FaHistory size={30} />, color: 'info' }
    ];

    return (
        <div className="container-fluid py-4">
            <h3 className="fw-bold mb-4 text-dark">Thống Kê Tổng Quan</h3>
            
            {/* 4 Thẻ Thống Kê */}
            <div className="row g-4 mb-5">
                {statCards.map((card, idx) => (
                    <div className="col-md-6 col-xl-3" key={idx}>
                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '12px' }}>
                            <div className="card-body p-4 d-flex align-items-center justify-content-between">
                                <div>
                                    <h6 className="text-muted fw-bold mb-2">{card.title}</h6>
                                    <h2 className="fw-bold mb-0 text-dark">{card.value}</h2>
                                </div>
                                <div className={`bg-${card.color} bg-opacity-10 text-${card.color} p-3 rounded-circle d-flex align-items-center justify-content-center`}>
                                    {card.icon}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bảng hoạt động gần đây */}
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white py-3 border-0">
                    <h5 className="mb-0 fw-bold">Hoạt Động Nộp Bài Gần Đây</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="px-4 py-3">Sinh viên</th>
                                <th className="py-3">Kỳ thi</th>
                                <th className="py-3">Trạng thái</th>
                                <th className="py-3">Điểm số</th>
                                <th className="py-3">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recent_attempts.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có hoạt động nào.</td></tr>
                            ) : (
                                stats.recent_attempts.map(attempt => (
                                    <tr key={attempt.id}>
                                        <td className="px-4 py-3">
                                            <div className="fw-bold text-dark">{attempt.user?.name}</div>
                                            <div className="small text-muted">{attempt.user?.class || 'N/A'}</div>
                                        </td>
                                        <td className="fw-medium">{attempt.exam?.title}</td>
                                        <td>
                                            {attempt.status === 'completed' ? <span className="badge bg-success"><FaCheckCircle className="me-1"/>Hoàn thành</span> :
                                             attempt.status === 'forced_submitted' ? <span className="badge bg-danger"><FaBan className="me-1"/>Bị đình chỉ</span> :
                                             <span className="badge bg-primary">Đang thi</span>}
                                        </td>
                                        <td className="fw-bold text-primary">{attempt.score !== null ? `${attempt.score}/10` : '-'}</td>
                                        <td className="text-muted small">{new Date(attempt.created_at).toLocaleString('vi-VN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}