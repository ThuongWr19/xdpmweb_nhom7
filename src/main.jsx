import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';

// 1. IMPORT AXIOS
import axios from 'axios';

// 2. CẤU HÌNH DOMAIN MẶC ĐỊNH (Thay đổi cổng 8000 nếu Backend của bạn chạy cổng khác)
axios.defaults.baseURL = 'http://127.0.0.1:8000';
axios.defaults.headers.common['Accept'] = 'application/json';

// 3. CẤU HÌNH INTERCEPTOR ĐỂ TỰ ĐỘNG GẮN TOKEN
axios.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (Giả sử lúc làm chức năng Login, bạn lưu tên biến là 'token')
    const token = localStorage.getItem('token'); 
    
    if (token) {
      // Gắn token vào Header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 4. (Tùy chọn) XỬ LÝ LỖI TOÀN CỤC KHI TOKEN HẾT HẠN
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Nếu Backend báo 401 (Token sai hoặc hết hạn), tự động xóa data cũ và ép đăng nhập lại
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// RENDER APP CHÍNH
createRoot(document.getElementById('root')).render(
  // Tạm tắt StrictMode nếu nó gọi API 2 lần gây khó chịu khi test
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)