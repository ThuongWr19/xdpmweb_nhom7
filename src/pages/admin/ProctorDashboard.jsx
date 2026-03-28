import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ProctorDashboard() {
    const { examId } = useParams();
    const [attempts, setAttempts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL;

    const fetchActiveAttempts = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/exams/${examId}/active-attempts`);
            setAttempts(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Lỗi tải dữ liệu giám sát", error);
        }
    };

    useEffect(() => {
        fetchActiveAttempts(); // Gọi lần đầu ngay khi vào trang
        
        // Thiết lập Polling: Gọi lại API mỗi 5 giây
        const interval = setInterval(() => {
            fetchActiveAttempts();
        }, 5000);

        return () => clearInterval(interval); // Dọn dẹp khi rời khỏi trang
    }, [examId]);

    const handleForceSubmit = async (attemptId) => {
        if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn cưỡng chế thu bài của sinh viên này?")) {
            try {
                await axios.post(`${API_URL}/admin/exam-attempts/${attemptId}/force-submit`);
                alert("Đã thu bài thành công!");
                fetchActiveAttempts(); // Cập nhật danh sách ngay lập tức
            } catch (error) {
                alert("Có lỗi xảy ra khi thu bài.");
            }
        }
    };

    if (isLoading) return <div className="container mt-4 text-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-1">Giám sát phòng thi</h2>
            <p className="text-muted"><small>🔄 Dữ liệu được cập nhật tự động mỗi 5 giây...</small></p>
            
            <div className="card shadow-sm mt-3">
                <div className="card-body p-0">
                    <table className="table table-hover mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Tên Sinh viên</th>
                                <th>Thời gian bắt đầu</th>
                                <th>Trạng thái</th>
                                <th className="text-center">Số lần vi phạm</th>
                                <th className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4">Chưa có sinh viên nào đang làm bài trong phòng thi này.</td></tr>
                            ) : (
                                attempts.map(attempt => (
                                    <tr key={attempt.id} className={attempt.cheat_count > 0 ? "table-warning" : ""}>
                                        <td className="align-middle fw-bold">{attempt.user?.name || 'Unknown User'}</td>
                                        <td className="align-middle">{new Date(attempt.start_time).toLocaleTimeString('vi-VN')}</td>
                                        <td className="align-middle">
                                            {attempt.cheat_count === 0 ? (
                                                <span className="badge bg-success">Đang làm bài (An toàn)</span>
                                            ) : (
                                                <span className="badge bg-danger">Cảnh báo gian lận</span>
                                            )}
                                        </td>
                                        <td className="align-middle text-center">
                                            <strong className={attempt.cheat_count > 0 ? "text-danger fs-5" : ""}>
                                                {attempt.cheat_count}
                                            </strong>
                                        </td>
                                        <td className="align-middle text-center">
                                            {attempt.cheat_count > 0 && (
                                                <button 
                                                    className="btn btn-sm btn-danger fw-bold"
                                                    onClick={() => handleForceSubmit(attempt.id)}
                                                >
                                                    Cưỡng chế thu bài
                                                </button>
                                            )}
                                        </td>
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

export default ProctorDashboard;