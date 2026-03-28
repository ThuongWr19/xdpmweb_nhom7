import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFileImport, FaQuestionCircle } from 'react-icons/fa';

export default function QuestionManager() {
    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    
    const [formData, setFormData] = useState({
        subject: '', content: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', difficulty: 'medium'
    });

    const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api') + '/questions'; //
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = () => {
        fetch(API_URL, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } 
        })
        .then(res => res.json())
        .then(data => setQuestions(Array.isArray(data) ? data : []))
        .catch(err => console.error("Lỗi:", err));
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        const method = modalMode === 'add' ? 'POST' : 'PUT';
        const url = modalMode === 'add' ? API_URL : `${API_URL}/${editingId}`;

        fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(() => {
            setShowModal(false);
            fetchQuestions();
        });
    };

    // Lọc danh sách hiển thị
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) || q.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm(`Xác nhận import câu hỏi từ file: ${file.name}?`)) {
            e.target.value = null;
            return;
        }

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file); // 'file' phải khớp với $request->file('file') bên Laravel

        // Sử dụng VITE_API_URL từ file .env
        fetch(`${API_URL}/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Lưu ý: KHÔNG đặt Content-Type khi gửi FormData chứa file
            },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            e.target.value = null; // Reset ô chọn file
            fetchQuestions(); // Tải lại danh sách câu hỏi để thấy dữ liệu mới
        })
        .catch(err => {
            console.error("Lỗi Import:", err);
            alert("Có lỗi xảy ra khi import file!");
        });
    };

    return (
        <div className="container-fluid py-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Ngân hàng Câu hỏi</h2>
                    <p className="text-muted small mb-0">Quản lý và biên soạn nội dung các kỳ thi</p>
                </div>
                <div className="d-flex gap-2">
                    <div className="col-auto">
                        {/* Ô chọn file bị ẩn */}
                        <input 
                            type="file" 
                            id="importQuestionFile" 
                            className="d-none" 
                            accept=".xlsx, .xls"
                            onChange={handleImportExcel} 
                        />
                        
                        {/* Nút bấm hiển thị cho người dùng */}
                        <button 
                            className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
                            onClick={() => document.getElementById('importQuestionFile').click()}
                        >
                            <FaFileImport /> Import Excel
                        </button>
                    </div>
                    <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4" 
                            onClick={() => { setModalMode('add'); setFormData({subject:'', content:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_answer:'A', difficulty:'medium'}); setShowModal(true); }}>
                        <FaPlus /> Thêm Câu hỏi
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted" /></span>
                                <input type="text" className="form-control border-start-0" 
                                       placeholder="Tìm kiếm theo nội dung hoặc môn học..." 
                                       onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select" onChange={(e) => setFilterDifficulty(e.target.value)}>
                                <option value="all">Tất cả độ khó</option>
                                <option value="easy">Dễ</option>
                                <option value="medium">Trung bình</option>
                                <option value="hard">Khó</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Table */}
            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="ps-4" style={{ width: '150px' }}>Môn học</th>
                                <th>Nội dung câu hỏi</th>
                                <th style={{ width: '120px' }}>Độ khó</th>
                                <th className="text-center" style={{ width: '100px' }}>Đáp án</th>
                                <th className="text-center pe-4" style={{ width: '150px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuestions.map(q => (
                                <tr key={q.id}>
                                    <td className="ps-4">
                                        <span className="badge bg-soft-primary text-primary border border-primary px-3 py-2">{q.subject}</span>
                                    </td>
                                    <td>
                                        <div className="text-dark fw-medium" style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {q.content}
                                        </div>
                                    </td>
                                    <td>
                                        {q.difficulty === 'easy' && <span className="badge bg-success-subtle text-success border border-success px-2 py-1">Dễ</span>}
                                        {q.difficulty === 'medium' && <span className="badge bg-warning-subtle text-warning border border-warning px-2 py-1">Trung bình</span>}
                                        {q.difficulty === 'hard' && <span className="badge bg-danger-subtle text-danger border border-danger px-2 py-1">Khó</span>}
                                    </td>
                                    <td className="text-center font-monospace fw-bold text-primary">{q.correct_answer}</td>
                                    <td className="text-center pe-4">
                                        <button className="btn btn-sm btn-outline-warning me-2" 
                                                onClick={() => { setModalMode('edit'); setEditingId(q.id); setFormData(q); setShowModal(true); }}>
                                            <FaEdit />
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger" 
                                                onClick={() => { if(window.confirm('Xóa câu hỏi này?')) fetch(`${API_URL}/${q.id}`, {method:'DELETE', headers:{'Authorization':`Bearer ${token}`}}).then(()=>fetchQuestions()) }}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Modal */}
            {showModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <form onSubmit={handleSubmit}>
                                <div className={`modal-header ${modalMode === 'add' ? 'bg-primary' : 'bg-warning'} text-white border-0`}>
                                    <h5 className="modal-title d-flex align-items-center gap-2">
                                        <FaQuestionCircle /> {modalMode === 'add' ? 'Thêm câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-7">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Môn học</label>
                                            <input type="text" className="form-control" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="VD: Lập trình Web" required />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label fw-bold small text-uppercase text-muted">Độ khó</label>
                                            <select className="form-select" name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                                                <option value="easy">Dễ (Dành cho kiến thức cơ bản)</option>
                                                <option value="medium">Trung bình (Vận dụng thấp)</option>
                                                <option value="hard">Khó (Vận dụng cao/Tổng hợp)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-uppercase text-muted">Nội dung câu hỏi</label>
                                        <textarea className="form-control border-primary-subtle" rows="3" name="content" value={formData.content} onChange={handleInputChange} placeholder="Nhập câu hỏi tại đây..." required></textarea>
                                    </div>
                                    
                                    <label className="form-label fw-bold small text-uppercase text-muted mb-2">Các đáp án lựa chọn</label>
                                    <div className="row g-3">
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <div className="col-md-6" key={opt}>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light fw-bold">{opt.toUpperCase()}</span>
                                                    <input type="text" className="form-control" name={`option_${opt}`} value={formData[`option_${opt}`]} onChange={handleInputChange} required />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 p-3 bg-light rounded-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <label className="fw-bold text-primary mb-0">ĐÁP ÁN ĐÚNG LÀ:</label>
                                            <div className="d-flex gap-3">
                                                {['A', 'B', 'C', 'D'].map(val => (
                                                    <div className="form-check form-check-inline" key={val}>
                                                        <input className="form-check-input" type="radio" name="correct_answer" id={`ans${val}`} value={val} 
                                                               checked={formData.correct_answer === val} onChange={handleInputChange} />
                                                        <label className="form-check-label fw-bold" htmlFor={`ans${val}`}>{val}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                    <button type="submit" className="btn btn-primary px-5 shadow-sm">Lưu dữ liệu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS tùy chỉnh bổ sung trực tiếp */}
            <style>{`
                .bg-soft-primary { background-color: #e7f1ff; }
                .bg-success-subtle { background-color: #d1e7dd; }
                .bg-warning-subtle { background-color: #fff3cd; }
                .bg-danger-subtle { background-color: #f8d7da; }
                .table-hover tbody tr:hover { background-color: #f8f9fa; cursor: pointer; }
                .form-control:focus, .form-select:focus { border-color: #0d6efd; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15); }
            `}</style>
        </div>
    );
}