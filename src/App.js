import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Users() {
  const [users, setUsers] = useState([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = 'https://xaydungpmweb-nhom7.onrender.com/api/users'; 

  const fetchUsers = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Lỗi kết nối:', err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!id || !name) {
      alert('Vui lòng điền đầy đủ MSSV và Họ tên!');
      return;
    }

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/${id}` : API_URL;

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, name: name })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert(data.message);
        
        setId('');
        setName('');
        setIsEditing(false);
        fetchUsers();
      })
      .catch(err => alert(err.message));
  };

  const handleEdit = (user) => {
    setId(user.id);
    setName(user.name);
    setIsEditing(true);
  };

  const handleDelete = (deleteId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sinh viên này không?')) return;

    fetch(`${API_URL}/${deleteId}`, { method: 'DELETE' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert(data.message);
        fetchUsers();
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-9">
          <div className="text-center mb-4">
            <h2 className="text-uppercase fw-bold text-primary">Phòng Công Tác Sinh Viên</h2>
            <h5 className="text-secondary">Quản Lý Thí Sinh Dự Thi</h5>
          </div>

          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body">
              <form onSubmit={handleSave} className="row g-3">
                <div className="col-md-4">
                  <input type="text" className="form-control" placeholder="Mã số sinh viên (VD: 2201605)" 
                    value={id} onChange={(e) => setId(e.target.value)} disabled={isEditing} />
                </div>
                <div className="col-md-5">
                  <input type="text" className="form-control" placeholder="Họ và Tên sinh viên" 
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <button type="submit" className={`btn w-100 ${isEditing ? 'btn-warning' : 'btn-success'}`}>
                    {isEditing ? 'Lưu Cập Nhật' : 'Thêm Sinh Viên'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow border-0">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Danh Sách Đã Đăng Ký</h5>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover table-striped align-middle mb-0 text-center">
                <thead className="table-light">
                  <tr>
                    <th>MSSV</th>
                    <th>Họ và Tên</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.id}</strong></td>
                      <td>{user.name}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(user)}>
                          Sửa
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-4 text-muted">Chưa có dữ liệu sinh viên.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        
        <Route path="/users" element={<Users />} />
      </Routes>
    </Router>
  );
}

export default App;