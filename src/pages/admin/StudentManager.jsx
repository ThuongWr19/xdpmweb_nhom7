import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentManager() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    // State điều khiển ẩn/hiện Modal
    const [showModal, setShowModal] = useState(false);

    // State chứa dữ liệu người dùng nhập vào form
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', class: '' });
    // State xác định chế độ Modal: 'add' (Thêm) hoặc 'edit' (Sửa)
    const [modalMode, setModalMode] = useState('add');

    // State lưu ID của sinh viên đang được chọn để sửa
    const [editingId, setEditingId] = useState(null);
    // Hàm lấy danh sách sinh viên
    const fetchUsers = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login'); // Nếu chưa có thẻ từ thì đuổi về trang login
            return;
        }

        // Đính kèm token vào Header để gửi cho Laravel xác thực
        fetch(`https://xaydungpmweb-nhom7.onrender.com/api/users?search=${search}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => setUsers(data));
    };

    // Chạy fetchUsers mỗi khi từ khóa tìm kiếm thay đổi
    useEffect(() => {
        fetchUsers();
    }, [search]);

    const handleLogout = () => {
        localStorage.removeItem('token'); // Xóa thẻ từ
        navigate('/login');
    };
    // Hàm xử lý khi bấm nút "Lưu Sinh Viên" trên form Modal
    const handleSubmit = (e) => {
        e.preventDefault(); // Chặn load lại trang
        const token = localStorage.getItem('token');

        // Xác định URL API và phương thức dựa trên chế độ modalMode
        let url = 'https://xaydungpmweb-nhom7.onrender.com//api/users';
        let method = 'POST';

        if (modalMode === 'edit') {
            url = `https://xaydungpmweb-nhom7.onrender.com/api/users/${editingId}`; // Thêm ID vào url
            method = 'PUT'; // Dùng phương thức PUT để cập nhật
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.student) {
                    if (modalMode === 'add') {
                        // Chế độ thêm: nhét người mới vào đầu danh sách
                        setUsers([data.student, ...users]);
                        alert('Thêm sinh viên thành công!');
                    } else {
                        // Chế độ sửa: cập nhật lại dữ liệu của người đó trong mảng users
                        setUsers(users.map(u => u.id === editingId ? data.student : u));
                        alert('Cập nhật thông tin thành công!');
                    }
                    setShowModal(false); // Đóng Modal
                } else {
                    alert('Lỗi: Email đã tồn tại hoặc nhập sai định dạng!');
                }
            })
            .catch(error => console.error("Lỗi:", error));
    };
    // Hàm xử lý khi bấm nút "Sửa" ở trên bảng
    const handleEditClick = (user) => {
        setModalMode('edit');
        setEditingId(user.id);
        // Thêm user.class vào đây:
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            class: user.class || ''
        });
        setShowModal(true);
    };
    // Hàm xử lý khi bấm nút Xóa
    const handleDelete = (id) => {
        // Hiện hộp thoại hỏi lại cho chắc chắn
        if (window.confirm('Bạn có thực sự muốn xóa sinh viên này không?')) {
            const token = localStorage.getItem('token');

            // Gọi API Xóa của Laravel (phương thức DELETE)
            fetch(`https://xaydungpmweb-nhom7.onrender.com/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(data => {
                    // Xóa thành công thì lọc (filter) bỏ người dùng đó khỏi giao diện ngay lập tức
                    setUsers(users.filter(user => user.id !== id));
                    alert('Đã xóa sinh viên thành công!');
                })
                .catch(error => console.error("Lỗi khi xóa:", error));
        }
    };
    // Hàm xử lý khi chọn file Excel
    const handleImportExcel = (e) => {
        const file = e.target.files[0]; // Lấy file đầu tiên người dùng chọn
        if (!file) return;

        // Hiện hộp thoại xác nhận cho chắc
        if (!window.confirm(`Bạn có chắc muốn import danh sách sinh viên từ file ${file.name} không?`)) {
            e.target.value = null; // Reset ô input file
            return;
        }

        const token = localStorage.getItem('token');

        // --- QUAN TRỌNG: Tạo FormData để chứa file gửi đi ---
        const formDataExcel = new FormData();
        formDataExcel.append('file', file); // Chữ 'file' này phải khớp với request->validate bên Laravel

        fetch('https://xaydungpmweb-nhom7.onrender.com/api/users/import', {
            method: 'POST',
            headers: {
                // LƯU Ý: Không được đặt Content-Type là json ở đây, trình duyệt sẽ tự xử lý boundaries cho file
                'Authorization': `Bearer ${token}`
            },
            body: formDataExcel // Gửi FormData đi
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message); // Hiện thông báo của Laravel (Thành công hoặc Lỗi)
                e.target.value = null; // Reset ô input file
                fetchUsers(); // Tải lại bảng để thấy sinh viên mới import
            })
            .catch(error => {
                console.error("Lỗi khi import:", error);
                alert("Đã xảy ra lỗi không xác định khi import file.");
                e.target.value = null;
            });
    };
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container mt-4" style={{ maxWidth: "100%" }}>
            <div className=" mb-4">
                <h2>Quản lý Sinh viên</h2>

            </div>

            <div className="card shadow" >
                <div className="card-body">
                    {/* Thanh công cụ: Tìm kiếm & Thêm mới */}
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <input type="text" className="form-control" placeholder="Tìm theo tên, email, SĐT..."
                                onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        {/* --- KHU VỰC NÚT IMPORT VÀ Ô CHỌN FILE ẨN --- */}
                        <div className="col-md-6 text-end">
                            {/* Ô input file bị ẩn (d-none) để phục vụ cho nút Import Excel */}
                            <input type="file" id="importFile" className="d-none" accept=".xlsx, .xls, .csv"
                                onChange={handleImportExcel} />

                            {/* Nút Import Excel thật (màu xanh lá): khi bấm vào nó sẽ kích hoạt nút chọn file ẩn ở trên */}
                            <button className="btn btn-success me-2" onClick={() => document.getElementById('importFile').click()}>
                                Import Excel
                            </button>

                            {/* Nút Thêm sinh viên cũ giữ nguyên */}
                            <button className="btn btn-primary" onClick={() => {
                                setModalMode('add');
                                setFormData({ name: '', email: '', phone: '', class: '' });
                                setShowModal(true);
                            }}>+ Thêm Sinh viên</button>
                        </div>
                    </div>
                    {showModal && (
                        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className={`modal-header ${modalMode === 'edit' ? 'bg-warning' : 'bg-primary'} text-white`}>
                                        {/* Đổi tiêu đề động dựa trên chế độ add/edit */}
                                        <h5 className="modal-title">
                                            {modalMode === 'edit' ? 'Sửa Thông Tin Sinh Viên' : 'Thêm Sinh Viên Mới'}
                                        </h5>
                                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                                    </div>

                                    {/* Gắn hàm handleSubmit hợp nhất vào form */}
                                    <form onSubmit={handleSubmit}>
                                        <div className="modal-body">
                                            {/* ... các ô input bên trong giữ nguyên ... */}
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Họ và Tên <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" name="name"
                                                    value={formData.name} onChange={handleInputChange} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Email <span className="text-danger">*</span></label>
                                                <input type="email" className="form-control" name="email"
                                                    value={formData.email} onChange={handleInputChange} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Lớp học</label>
                                                <input type="text" className="form-control" name="class"
                                                    value={formData.class} onChange={handleInputChange} placeholder="VD: 12A1, CNTT1..." />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Số điện thoại</label>
                                                <input type="text" className="form-control" name="phone"
                                                    value={formData.phone} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                            {/* Đổi chữ trên nút bấm động */}
                                            <button type="submit" className={`btn ${modalMode === 'edit' ? 'btn-warning' : 'btn-success'}`}>
                                                {modalMode === 'edit' ? 'Cập Nhật' : 'Lưu Sinh Viên'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Bảng dữ liệu */}
                    <table className="table table-bordered table-hover align-middle">
                        <thead className="table-dark text-center">
                            <tr>
                                <th>ID</th>
                                <th>Họ và Tên</th>
                                <th>Email</th>
                                <th>Lớp học</th>
                                <th>Số điện thoại</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="text-center">{user.id}</td>
                                    <td className="fw-bold">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td className="text-center">{user.class || 'N/A'}</td>
                                    <td>{user.phone || 'N/A'}</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(user)}>Sửa</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    );
}
