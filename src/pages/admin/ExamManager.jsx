import { useState, useEffect } from 'react';
import { FaPlus, FaRandom, FaPlay, FaPause, FaEdit, FaTrash, FaClock, FaBook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ExamManager() {
    const [exams, setExams] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        title: '', subject: '', duration: 60, total_questions: 40, start_time: '', end_time: '', password: ''
    });

    const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api') + '/exams';
    const token = localStorage.getItem('token');

    useEffect(() => { fetchExams(); }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch(API_URL, { 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            });
            if (!res.ok) throw new Error('Lỗi kết nối Backend (Có thể chưa migrate database)');
            const data = await res.json();
            setExams(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi fetchExams:", error);
            // alert("Không thể tải danh sách kỳ thi. Vui lòng kiểm tra Server.");
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? API_URL : `${API_URL}/${editingId}`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi lưu dữ liệu');
            
            setShowModal(false);
            fetchExams();
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            await fetch(`${API_URL}/${id}/toggle-status`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            });
            fetchExams();
        } catch (error) {
            alert("Lỗi khi thay đổi trạng thái!");
        }
    };

    const generateQuestions = async (id, subject, total) => {
        if (!window.confirm(`Xác nhận cấu hình đề: Lấy ngẫu nhiên ${total} câu hỏi môn ${subject}?`)) return;
        
        try {
            const res = await fetch(`${API_URL}/${id}/generate-questions`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
            });
            const data = await res.json();
            if (data.error) alert(`LỖI: ${data.error}`);
            else {
                alert("Đã tạo đề thi thành công!");
                fetchExams();
            }
        } catch (error) {
            alert("Lỗi server khi random câu hỏi!");
        }
    };

    const deleteExam = async (id) => {
        if (!window.confirm('Xóa kỳ thi này? Mọi đề thi và kết quả liên quan sẽ bị mất!')) return;
        await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        fetchExams();
    };

    const openModal = (mode, exam = null) => {
        setModalMode(mode);
        if (mode === 'edit') {
            setEditingId(exam.id);
            setFormData({
                title: exam.title, subject: exam.subject, duration: exam.duration, 
                total_questions: exam.total_questions, password: exam.password || '',
                start_time: exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : '',
                end_time: exam.end_time ? new Date(exam.end_time).toISOString().slice(0, 16) : '',
            });
        } else {
            setFormData({ title: '', subject: '', duration: 60, total_questions: 40, start_time: '', end_time: '', password: '' });
        }
        setShowModal(true);
    };

    return (
        <div className="container-fluid py-3">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div>
                    <h4 className="fw-bold text-dark mb-0">Quản lý Kỳ thi</h4>
                    <small className="text-muted">Danh sách các kỳ thi và cấu hình đề</small>
                </div>
                <button className="btn btn-sm btn-primary shadow-sm" onClick={() => openModal('add')}>
                    <FaPlus className="me-1" /> Thêm Kỳ Thi
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                        <thead className="table-light text-muted">
                            <tr>
                                <th className="ps-3">Kỳ thi</th>
                                <th>Cấu hình</th>
                                <th className="text-center">Số câu</th>
                                <th className="text-center">Trạng thái</th>
                                <th className="text-center pe-3" style={{ minWidth: '150px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có kỳ thi nào</td></tr>
                            ) : exams.map(exam => (
                                <tr key={exam.id}>
                                    <td className="ps-3">
                                        <div className="fw-bold text-dark">{exam.title}</div>
                                        <small className="text-muted d-flex align-items-center gap-1">
                                            <FaBook /> {exam.subject}
                                        </small>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="text-dark"><FaClock className="text-muted me-1"/>{exam.duration} phút</span>
                                            {exam.start_time && <small className="text-muted">Bắt đầu: {new Date(exam.start_time).toLocaleDateString('vi-VN')}</small>}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <span className={`badge rounded-pill ${exam.questions_count >= exam.total_questions ? 'bg-success' : 'bg-danger'}`}>
                                            {exam.questions_count} / {exam.total_questions}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {exam.is_active 
                                            ? <span className="badge bg-success-subtle text-success border border-success">Đang Mở</span>
                                            : <span className="badge bg-secondary-subtle text-secondary border border-secondary">Đã Đóng</span>
                                        }
                                    </td>
                                    <td className="text-center pe-3">
                                        <div className="btn-group btn-group-sm">
                                            <button className={`btn ${exam.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`} title={exam.is_active ? "Đóng thi" : "Mở thi"} onClick={() => toggleStatus(exam.id)}>
                                                {exam.is_active ? <FaPause /> : <FaPlay />}
                                            </button>
                                            <button className="btn btn-outline-primary" title="Random đề thi" onClick={() => generateQuestions(exam.id, exam.subject, exam.total_questions)}>
                                                <FaRandom />
                                            </button>
                                            <button className="btn btn-outline-warning" title="Sửa" onClick={() => openModal('edit', exam)}><FaEdit /></button>
                                            <button className="btn btn-outline-danger" title="Xóa" onClick={() => deleteExam(exam.id)}><FaTrash /></button>
                                        </div>
                                    </td>
                                    <td>
                                        {/* Các nút Sửa/Xóa hiện tại */}
                                        <button 
                                            onClick={() => navigate(`/admin/exams/${exam.id}/report`)}
                                            className="bg-purple-500 text-white px-3 py-1 rounded ml-2 hover:bg-purple-600"
                                        >
                                            Xem Thống Kê
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form Gọn Gàng */}
            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header bg-light border-bottom-0 pb-2">
                                    <h6 className="modal-title fw-bold text-dark">{modalMode === 'add' ? 'Thêm Kỳ Thi Mới' : 'Cập Nhật Kỳ Thi'}</h6>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body py-2" style={{ fontSize: '0.9rem' }}>
                                    <div className="mb-2">
                                        <label className="form-label mb-1 fw-medium text-muted">Tên kỳ thi</label>
                                        <input type="text" className="form-control form-control-sm" name="title" value={formData.title} onChange={handleInputChange} placeholder="VD: Thi Giữa Kỳ Môn Web" required />
                                    </div>
                                    
                                    <div className="row g-2 mb-2">
                                        <div className="col-8">
                                            <label className="form-label mb-1 fw-medium text-muted">Môn học (Khớp NHCH)</label>
                                            <input type="text" className="form-control form-control-sm" name="subject" value={formData.subject} onChange={handleInputChange} required />
                                        </div>
                                        <div className="col-4">
                                            <label className="form-label mb-1 fw-medium text-muted">Lấy Số Câu</label>
                                            <input type="number" className="form-control form-control-sm" name="total_questions" value={formData.total_questions} onChange={handleInputChange} min="1" required />
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-4">
                                            <label className="form-label mb-1 fw-medium text-muted">Thời gian (Phút)</label>
                                            <input type="number" className="form-control form-control-sm" name="duration" value={formData.duration} onChange={handleInputChange} min="1" required />
                                        </div>
                                        <div className="col-8">
                                            <label className="form-label mb-1 fw-medium text-muted">Mật khẩu phòng thi (Tùy chọn)</label>
                                            <input type="text" className="form-control form-control-sm" name="password" value={formData.password} onChange={handleInputChange} placeholder="Bỏ trống nếu không cần" />
                                        </div>
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <label className="form-label mb-1 fw-medium text-muted">Bắt đầu (Tùy chọn)</label>
                                            <input type="datetime-local" className="form-control form-control-sm" name="start_time" value={formData.start_time} onChange={handleInputChange} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label mb-1 fw-medium text-muted">Kết thúc (Tùy chọn)</label>
                                            <input type="datetime-local" className="form-control form-control-sm" name="end_time" value={formData.end_time} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top-0 pt-2">
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-sm btn-primary px-4" disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu lại'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .bg-success-subtle { background-color: #d1e7dd; }
                .bg-secondary-subtle { background-color: #e2e3e5; }
                .form-control-sm { padding: 0.4rem 0.5rem; }
            `}</style>
        </div>
    );
}