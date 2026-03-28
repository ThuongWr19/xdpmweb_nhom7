import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaExclamationCircle, FaHome, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';

export default function DoingExam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cheatCount, setCheatCount] = useState(0);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState(null); // State chứa kết quả thi
    
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const timerRef = useRef(null);

    // 1. Tải đề thi
    useEffect(() => {
        fetch(`${API_URL}/student/exams/${id}/do`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'completed') {
                alert('Bạn đã nộp bài thi này rồi!');
                navigate('/student/home');
                return;
            }
            setExam(data.exam);
            setQuestions(data.questions);
            setAnswers(data.saved_answers || {});
            setTimeLeft(data.time_left_seconds);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            alert("Lỗi tải đề thi!");
        });
    }, [id, navigate, token, API_URL]);

    // 2. Xử lý đồng hồ đếm ngược
    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !result) { // Chỉ đếm khi chưa nộp bài
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        autoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, result]); // Thêm result vào dependency

    // 3. XỬ LÝ CHỐNG GIAN LẬN (CHỈ KHI ĐANG LÀM BÀI)
    useEffect(() => {
        // Hàm xử lý khi chuyển tab/ẩn cửa sổ
        const handleVisibilityChange = async () => {
            // SỬA LỖI TẠI ĐÂY: Chỉ kiểm tra nếu ĐANG LÀM BÀI (chưa có result)
            if (document.hidden && !result) { 
                alert("CẢNH BÁO: Bạn vừa rời khỏi màn hình làm bài! Hành vi này đã được ghi nhận.");
                try {
                    const res = await axios.post(`${API_URL}/exams/${id}/log-violation`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setCheatCount(res.data.cheat_count);
                    
                    if (res.data.forced) {
                        alert("BẠN ĐÃ VI PHẠM QUY CHẾ QUÁ NHIỀU LẦN. HỆ THỐNG ĐÃ TỰ ĐỘNG THU BÀI!");
                        navigate('/student/home');
                    }
                } catch (error) {
                    console.error("Lỗi khi ghi nhận vi phạm", error);
                }
            }
        };

        const handlePreventCheating = (e) => {
            if (!result) { // Chỉ chặn nếu chưa nộp bài
                e.preventDefault();
                alert("Hành động này không được phép trong phòng thi!");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("copy", handlePreventCheating);
        window.addEventListener("paste", handlePreventCheating);
        window.addEventListener("contextmenu", handlePreventCheating);

        // Cleanup function
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("copy", handlePreventCheating);
            window.removeEventListener("paste", handlePreventCheating);
            window.removeEventListener("contextmenu", handlePreventCheating);
        };
    }, [id, navigate, token, API_URL, result]); // Thêm result vào dependency để useEffect chạy lại khi nộp bài

    // 4. Lưu tiến độ
    const handleSelectAnswer = (questionId, option) => {
        if (result) return; // Không cho chọn nếu đã nộp bài

        const newAnswers = { ...answers, [questionId]: option };
        setAnswers(newAnswers);

        fetch(`${API_URL}/student/exams/${id}/save-progress`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ answers: newAnswers })
        });
    };

    const autoSubmit = () => {
        if (result) return; // Không nộp nếu đã nộp rồi
        alert("Hết giờ làm bài! Hệ thống đang tự động nộp bài...");
        handleSubmit();
    };

    const handleSubmit = async () => {
        if (result) return; // Tránh nộp 2 lần
        if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;

        try {
            const response = await axios.post(
                `${API_URL}/exams/${id}/submit`,
                { answers },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            setResult(response.data);
            window.scrollTo(0, 0); // Cuộn lên đầu trang khi có kết quả
        } catch (error) {
            console.error("Lỗi khi nộp bài", error);
            if (error.response && error.response.status === 422) {
                alert("Dữ liệu nộp bài không hợp lệ!");
            } else {
                alert("Lỗi máy chủ: Không thể nộp bài lúc này!");
            }
        }
    };

    // Định dạng thời gian mm:ss
    const formatTime = (seconds) => {
        if (!seconds || seconds < 0) return "00:00";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const scrollToQuestion = (qId) => {
        const el = document.getElementById(`question-${qId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (isLoading) return <div className="text-center mt-5"><span className="spinner-border text-primary"></span><h4 className="mt-3">Đang tải đề thi...</h4></div>;

    // =========================================================
    // SỬA GIAO DIỆN KẾT QUẢ NẾU ĐÃ NỘP BÀI (CHỮ NHỎ LẠI)
    // =========================================================
    if (result) {
        return (
            <div className="container py-4" style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card shadow-sm border-0" style={{ borderRadius: '16px' }}>
                            {/* Tiêu đề nhỏ lại (h5) */}
                            <div className="card-header bg-success bg-opacity-75 text-white text-center py-3" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                <h5 className="mb-0 fw-bold d-flex align-items-center justify-content-center">
                                    <FaCheckCircle className="me-2"/> NỘP BÀI THÀNH CÔNG
                                </h5>
                            </div>
                            <div className="card-body p-4 p-md-4">
                                <div className="row text-center mb-4 g-3">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 border shadow-sm h-100">
                                            <h6 className="text-muted fw-bold mb-2">Điểm số của bạn</h6>
                                            {/* Chữ nhỏ lại (fs-2 thay vì display-3) */}
                                            <h2 className="fw-bold text-primary mb-0 fs-2">{result.score} <span className="fs-5 text-muted">/ 10</span></h2>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 border shadow-sm h-100">
                                            <h6 className="text-muted fw-bold mb-2">Số câu đúng</h6>
                                            {/* Chữ nhỏ lại (fs-2 thay vì display-3) */}
                                            <h2 className="fw-bold text-success mb-0 fs-2">{result.correct_count} <span className="fs-5 text-muted">/ {result.total_questions}</span></h2>
                                        </div>
                                    </div>
                                </div>

                                <h6 className="fw-bold border-bottom pb-2 mb-3">Chi tiết đáp án:</h6>
                                <div className="d-flex flex-column gap-3">
                                    {result.details.map((item, index) => (
                                        <div key={item.question_id} className={`card border-0 shadow-sm ${item.is_correct ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`} style={{ borderLeft: item.is_correct ? '4px solid #198754' : '4px solid #dc3545' }}>
                                            <div className="card-body p-3">
                                                <div className="fw-bold mb-2 d-flex small">
                                                    <span className="me-1">Câu {index + 1}:</span> 
                                                    {/* Font chữ nhỏ hơn (dangerouslySetInnerHTML) */}
                                                    <span className="small text-dark" dangerouslySetInnerHTML={{ __html: item.question_text }} />
                                                </div>
                                                <div className="d-flex flex-wrap gap-1 mt-2">
                                                    {/* Badge nhỏ hơn (py-1 px-2 small) */}
                                                    <span className={`badge ${item.is_correct ? 'bg-success' : 'bg-danger'} px-2 py-1 small rounded-pill`}>
                                                        {item.is_correct ? <FaCheckCircle className="me-1"/> : <FaTimesCircle className="me-1"/>}
                                                        Bạn chọn: {item.user_answer || 'Không làm'}
                                                    </span>
                                                    {!item.is_correct && (
                                                        <span className="badge bg-success px-2 py-1 small rounded-pill">
                                                            <FaCheckCircle className="me-1"/>
                                                            Đúng: {item.correct_answer}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-center mt-4">
                                    <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => navigate('/student/home')}>
                                        <FaHome className="me-2" /> Về Trang Chủ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // HIỂN THỊ GIAO DIỆN ĐANG LÀM BÀI (Giữ nguyên)
    // =========================================================
    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <div className="row">
                {/* CỘT TRÁI: DANH SÁCH CÂU HỎI */}
                <div className="col-lg-9 col-md-8">
                    {/* Header bài thi */}
                    <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-3">
                            <h5 className="fw-bold text-primary mb-1">{exam?.title}</h5>
                            <p className="text-muted mb-0 small">
                                Môn thi: <strong className="text-dark">{exam?.subject}</strong> | Tổng số: <strong className="text-dark">{questions.length} câu</strong>
                            </p>
                            {cheatCount > 0 && (
                                <div className="alert alert-danger mt-2 mb-0 py-1 px-3 fw-bold d-inline-block small rounded-pill">
                                    <FaExclamationCircle className="me-1"/>
                                    Cảnh báo: {cheatCount} / 3
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Danh sách câu hỏi */}
                    {questions.map((q, index) => (
                        <div key={q.id} id={`question-${q.id}`} className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0 fw-bold d-flex gap-2 align-items-center py-2" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                                <span className="badge bg-primary fs-7 px-2 py-1 rounded-pill">Câu {index + 1}</span>
                                <div className="mt-0 fs-6 text-dark fw-medium" dangerouslySetInnerHTML={{ __html: q.content }} />
                            </div>
                            <div className="card-body px-3 pb-3 pt-1">
                                <div className="row g-2">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const optionField = `option_${opt.toLowerCase()}`;
                                        const isSelected = answers[q.id] === opt;
                                        
                                        return (
                                            <div className="col-md-6" key={opt}>
                                                <div 
                                                    className={`p-2 border rounded-3 ${isSelected ? 'border-primary bg-primary text-white' : 'bg-light'} `}
                                                    style={{ cursor: 'pointer', transition: 'all 0.1s' }}
                                                    onClick={() => handleSelectAnswer(q.id, opt)}
                                                >
                                                    <div className="form-check m-0 d-flex align-items-center gap-2">
                                                        <input 
                                                            className="form-check-input mt-0" 
                                                            type="radio" 
                                                            name={`question-${q.id}`} 
                                                            checked={isSelected}
                                                            onChange={() => {}} 
                                                        />
                                                        <label className="form-check-label fw-normal w-100 small" style={{ cursor: 'pointer' }}>
                                                            <strong>{opt}.</strong> {q[optionField]}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CỘT PHẢI: ĐỒNG HỒ & MENU ĐIỀU HƯỚNG */}
                <div className="col-lg-3 col-md-4">
                    <div className="card shadow-sm border-0 sticky-top" style={{ top: '10px', borderRadius: '12px' }}>
                        <div className="card-body text-center bg-dark text-white p-3" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                            <h6 className="mb-1 text-uppercase fw-bold opacity-75 small"><FaClock className="me-1" />Còn lại</h6>
                            <h2 className={`fw-bold font-monospace mb-0 display-6 ${timeLeft <= 300 ? 'text-danger flash-text' : 'text-warning'}`}>
                                {formatTime(timeLeft)}
                            </h2>
                        </div>
                        
                        <div className="card-body p-3">
                            <h6 className="fw-bold mb-2 border-bottom pb-1 small">Danh sách câu</h6>
                            <div className="d-flex flex-wrap gap-1 mb-3 justify-content-center">
                                {questions.map((q, index) => {
                                    const isAnswered = !!answers[q.id];
                                    return (
                                        <button 
                                            key={q.id}
                                            onClick={() => scrollToQuestion(q.id)}
                                            className={`btn btn-sm ${isAnswered ? 'btn-primary' : 'btn-light border'} p-0`}
                                            style={{ width: '32px', height: '32px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px' }}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="d-flex justify-content-between mb-3 small fw-medium">
                                <div className="text-primary"><FaCheckCircle className="me-1"/> Đã làm: {Object.keys(answers).length}</div>
                                <div className="text-danger"><FaExclamationCircle className="me-1"/> Chưa: {questions.length - Object.keys(answers).length}</div>
                            </div>

                            <button onClick={handleSubmit} className="btn btn-success w-100 fw-bold py-2 shadow-sm rounded-pill">
                                NỘP BÀI THI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* CSS Tùy chỉnh (flash text cho đồng hồ khi sắp hết giờ) */}
            <style>{`
                .btn:focus { box-shadow: none; }
                .form-check-input:checked { background-color: #0d6efd; border-color: #0d6efd; }
                .flash-text { animation: flash 1s infinite alternate; }
                @keyframes flash { from { opacity: 1; } to { opacity: 0.5; } }
                .fs-7 { fontSize: 13px; }
            `}</style>
        </div>
    );
}