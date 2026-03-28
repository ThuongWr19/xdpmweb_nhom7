import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';
export default function DoingExam() {
    const { id } = useParams(); // Lấy ID kỳ thi từ URL
    const navigate = useNavigate();
    
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [result, setResult] = useState(null);
    
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const timerRef = useRef(null);

    useEffect(() => {
        // Tải dữ liệu đề thi
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
    }, [id]);

    // Xử lý Đồng hồ đếm ngược
    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        autoSubmit(); // Hết giờ tự động nộp bài
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft]);

    // Xử lý chọn đáp án và Auto-save (Lưu nháp)
    const handleSelectAnswer = (questionId, option) => {
        const newAnswers = { ...answers, [questionId]: option };
        setAnswers(newAnswers);

        // Gọi API lưu tạm ngay lập tức (Chạy ngầm không ảnh hưởng UI)
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
        alert("Hết giờ làm bài! Hệ thống đang tự động nộp bài...");
        handleSubmit();
    };

    const handleSubmit = async () => {
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
            setResult(response.data); // Lưu kết quả trả về từ API
        } catch (error) {
            console.error("Lỗi khi nộp bài", error);
        }
    };

    if (result) {
        return (
            <div className="result-container p-6 bg-white rounded shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-center">Kết Quả Bài Thi</h2>
                <div className="text-center mb-6">
                    <p className="text-xl">Điểm số: <span className="font-bold text-blue-600">{result.score} / 10</span></p>
                    <p>Số câu đúng: {result.correct_count} / {result.total_questions}</p>
                </div>
                
                <h3 className="text-lg font-bold mb-3">Chi tiết:</h3>
                <div className="space-y-4">
                    {result.details.map((item, index) => (
                        <div key={item.question_id} className={`p-4 border rounded ${item.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="font-semibold">Câu {index + 1}: {item.question_text}</p>
                            <p className="text-sm mt-2">
                                Bạn chọn: <span className={item.is_correct ? 'text-green-600' : 'text-red-600'}>{item.user_answer || 'Chưa chọn'}</span>
                            </p>
                            {!item.is_correct && (
                                <p className="text-sm text-green-600 font-semibold">Đáp án đúng: {item.correct_answer}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Format thời gian hiển thị (MM:SS)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Cuộn tới câu hỏi khi bấm vào Menu bên phải
    const scrollToQuestion = (qId) => {
        const el = document.getElementById(`question-${qId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (isLoading) return <div className="text-center mt-5"><h3>Đang tải đề thi...</h3></div>;

    return (
        <div className="container-fluid bg-light min-vh-100 py-4">
            <div className="row">
                {/* CỘT TRÁI: DANH SÁCH CÂU HỎI */}
                <div className="col-md-9">
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-body">
                            <h4 className="fw-bold text-primary mb-0">{exam?.title}</h4>
                            <p className="text-muted mb-0">Môn thi: {exam?.subject} | Tổng số: {questions.length} câu</p>
                        </div>
                    </div>

                    {questions.map((q, index) => (
                        <div key={q.id} id={`question-${q.id}`} className="card shadow-sm border-0 mb-4">
                            <div className="card-header bg-white fw-bold d-flex gap-2">
                                <span className="badge bg-primary fs-6">Câu {index + 1}</span>
                                {/* Dùng dangerouslySetInnerHTML để render ảnh/công thức từ CKEditor */}
                                <div dangerouslySetInnerHTML={{ __html: q.content }} />
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const optionField = `option_${opt.toLowerCase()}`;
                                        const isSelected = answers[q.id] === opt;
                                        
                                        return (
                                            <div className="col-md-6" key={opt}>
                                                <div 
                                                    className={`p-3 border rounded ${isSelected ? 'border-primary bg-primary text-white shadow' : 'bg-light'} `}
                                                    style={{ cursor: 'pointer', transition: '0.2s' }}
                                                    onClick={() => handleSelectAnswer(q.id, opt)}
                                                >
                                                    <div className="form-check m-0">
                                                        <input 
                                                            className="form-check-input" 
                                                            type="radio" 
                                                            name={`question-${q.id}`} 
                                                            checked={isSelected}
                                                            onChange={() => {}} // Handle ở thẻ div cha
                                                        />
                                                        <label className="form-check-label fw-medium w-100" style={{ cursor: 'pointer' }}>
                                                            {opt}. {q[optionField]}
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
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
                        <div className="card-body text-center bg-dark text-white rounded-top">
                            <h5 className="mb-2"><FaClock className="me-2" />Thời gian còn lại</h5>
                            <h2 className={`fw-bold font-monospace mb-0 ${timeLeft <= 300 ? 'text-danger' : 'text-warning'}`}>
                                {formatTime(timeLeft)}
                            </h2>
                            {timeLeft <= 300 && <small className="text-danger flash-text">Sắp hết giờ!</small>}
                        </div>
                        
                        <div className="card-body">
                            <h6 className="fw-bold mb-3 border-bottom pb-2">Danh sách câu hỏi</h6>
                            <div className="d-flex flex-wrap gap-2 mb-4">
                                {questions.map((q, index) => {
                                    const isAnswered = !!answers[q.id];
                                    return (
                                        <button 
                                            key={q.id}
                                            onClick={() => scrollToQuestion(q.id)}
                                            className={`btn btn-sm ${isAnswered ? 'btn-success' : 'btn-outline-secondary'}`}
                                            style={{ width: '40px', height: '40px', fontWeight: 'bold' }}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="d-flex justify-content-between mb-4 small text-muted">
                                <div><FaCheckCircle className="text-success me-1"/> Đã làm: {Object.keys(answers).length}</div>
                                <div><FaExclamationCircle className="text-secondary me-1"/> Chưa làm: {questions.length - Object.keys(answers).length}</div>
                            </div>

                            <div>
                                {/* Form chọn đáp án và nút nộp bài */}
                                <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Nộp bài</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}