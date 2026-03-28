import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NotificationManager() {
    const [notifications, setNotifications] = useState([]);
    const [form, setForm] = useState({ title: '', content: '', is_active: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/notifications`);
            setNotifications(res.data);
        } catch (error) {
            console.error("Lỗi lấy danh sách thông báo", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/admin/notifications`, form);
            setForm({ title: '', content: '', is_active: true });
            alert("Đã đăng thông báo thành công!");
            fetchNotifications();
        } catch (error) {
            alert("Lỗi khi đăng thông báo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
            try {
                await axios.delete(`${API_URL}/admin/notifications/${id}`);
                fetchNotifications();
            } catch (error) {
                alert("Lỗi khi xóa thông báo.");
            }
        }
    };

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-5">
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Đăng Thông Báo Mới</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Tiêu đề</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="VD: Quy chế thi cuối kỳ..."
                                        value={form.title} 
                                        onChange={e => setForm({...form, title: e.target.value})} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Nội dung</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="4" 
                                        placeholder="Nhập nội dung chi tiết..."
                                        value={form.content} 
                                        onChange={e => setForm({...form, content: e.target.value})} 
                                        required
                                    ></textarea>
                                </div>
                                <div className="form-check mb-3">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="isActiveCheck" 
                                        checked={form.is_active}
                                        onChange={e => setForm({...form, is_active: e.target.checked})}
                                    />
                                    <label className="form-check-label" htmlFor="isActiveCheck">
                                        Hiển thị cho sinh viên
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang đăng...' : 'Đăng Thông Báo'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-7">
                    <div className="card shadow-sm">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0">Danh sách Thông báo</h5>
                        </div>
                        <ul className="list-group list-group-flush">
                            {notifications.length === 0 ? (
                                <li className="list-group-item text-center py-4 text-muted">Chưa có thông báo nào.</li>
                            ) : (
                                notifications.map(noti => (
                                    <li key={noti.id} className="list-group-item d-flex justify-content-between align-items-start py-3">
                                        <div className="ms-2 me-auto">
                                            <div className="fw-bold fs-5 mb-1">
                                                {noti.title} 
                                                {!noti.is_active && <span className="badge bg-secondary ms-2 text-sm">Đã ẩn</span>}
                                            </div>
                                            <div className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{noti.content}</div>
                                            <small className="text-primary mt-2 d-block">
                                                Ngày đăng: {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                                            </small>
                                        </div>
                                        <button className="btn btn-sm btn-outline-danger mt-1" onClick={() => handleDelete(noti.id)}>
                                            Xóa
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotificationManager;