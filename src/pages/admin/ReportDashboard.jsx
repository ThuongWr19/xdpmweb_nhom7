import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

const ReportDashboard = ({ examId }) => {
    const [stats, setStats] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Lấy token từ localStorage
                const token = localStorage.getItem('token'); 

                const response = await axios.get(`${API_URL}/exams/${examId}/statistics`, {
                    headers: {
                        // 2. Thêm header Authorization
                        'Authorization': `Bearer ${token}` 
                    }
                });
                
                setStats(response.data);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    console.error("Lỗi 401: Bạn không có quyền truy cập hoặc phiên đăng nhập hết hạn.");
                    // Có thể điều hướng người dùng về trang login ở đây
                } else {
                    console.error("Lỗi kết nối API:", error);
                }
                console.error("Nội dung lỗi từ Server:", error.response?.data);
                console.error("Mã lỗi:", error.response?.status);
            }
        };
        fetchStats();
    }, [examId]);

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/exams/${examId}/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob', // Quan trọng: Để nhận file nhị phân
            });

            // Tạo đường dẫn tạm thời để tải file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BaoCao_KỳThi_${examId}.xlsx`); // Tên file
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            if (error.response && error.response.data instanceof Blob) {
            // Đọc nội dung lỗi thực sự từ Backend gửi về
            const reader = new FileReader();
            reader.onload = () => {
                console.error("LỖI CHI TIẾT TỪ BACKEND:", reader.result);
                alert("Lỗi Backend: " + reader.result);
            };
            reader.readAsText(error.response.data);
        }
        }
    };

    if (!stats) return <p>Đang tải dữ liệu thống kê...</p>;
    console.log("Dữ liệu API:", stats);
    // Dữ liệu cho PieChart (Đậu/Rớt)
    const pieData = [
        { name: 'Đậu', value: stats?.passed || 0 },
        { name: 'Rớt', value: stats?.failed || 0 },
    ];
    const COLORS = ['#4CAF50', '#F44336'];

    // Dữ liệu cho BarChart (Phổ điểm)
    const barData = [
        { name: '0-3 Điểm', count: stats?.distribution?.['0-3'] || 0 },
        { name: '4-6 Điểm', count: stats?.distribution?.['4-6'] || 0 },
        { name: '7-8 Điểm', count: stats?.distribution?.['7-8'] || 0 },
        { name: '9-10 Điểm', count: stats?.distribution?.['9-10'] || 0 },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Báo Cáo Thống Kê</h2>
                <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Xuất Excel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Biểu đồ tròn - Tỉ lệ Đậu/Rớt */}
                <div className="bg-white p-4 shadow rounded">
                    <h3 className="text-lg font-semibold text-center mb-4">Tỉ Lệ Đậu / Rớt</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center mt-2">Tổng số bài nộp: {stats.total_students}</p>
                </div>

                {/* Biểu đồ cột - Phổ điểm */}
                <div className="bg-white p-4 shadow rounded">
                    <h3 className="text-lg font-semibold text-center mb-4">Phổ Điểm Sinh Viên</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3B82F6" name="Số lượng sinh viên" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ReportDashboard;