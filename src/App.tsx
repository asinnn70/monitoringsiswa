/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  GraduationCap, 
  AlertCircle, 
  Search, 
  Plus, 
  ChevronRight, 
  LayoutDashboard,
  UserCheck,
  UserX,
  Clock,
  Activity,
  LogOut,
  Lock,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UserRole = 'teacher' | 'student';

type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
  student_id: number | null;
};

type Student = {
  id: number;
  name: string;
  class: string;
  parent_name: string;
  phone: string;
};

type Attendance = {
  id: number;
  student_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'sick';
};

type Grade = {
  id: number;
  student_id: number;
  subject: string;
  score: number;
  date: string;
};

type Behavior = {
  id: number;
  student_id: number;
  type: 'positive' | 'negative';
  description: string;
  date: string;
};

type StudentDetail = Student & {
  attendance: Attendance[];
  grades: Grade[];
  behavior: Behavior[];
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'my-profile'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        fetchTeacherData();
      } else if (user.role === 'student' && user.student_id) {
        fetchStudentDetail(user.student_id);
        setActiveTab('my-profile');
      }
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        setLoginError(data.message);
      }
    } catch (error) {
      setLoginError('Terjadi kesalahan saat login');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setStudentDetail(null);
    setStudents([]);
    setStats(null);
  };

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/stats')
      ]);
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/students/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStudentDetail(data);
      }
    } catch (error) {
      console.error('Error fetching student detail:', error);
    }
  };

  const handleStudentClick = (id: number) => {
    setSelectedStudentId(id);
    fetchStudentDetail(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-spin text-emerald-600">
          <Activity size={40} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-black/5"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap size={40} />
            </div>
            <h1 className="text-2xl font-bold">EduTrack Login</h1>
            <p className="text-gray-500 text-sm">Masuk untuk memantau perkembangan siswa</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Masukkan username"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Masukkan password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              Masuk Sekarang
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-black/5 text-center">
            <p className="text-xs text-gray-400">
              Gunakan akun Guru: <span className="font-mono font-bold text-gray-600">guru / guru123</span><br/>
              Gunakan akun Siswa: <span className="font-mono font-bold text-gray-600">ahmad / siswa123</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-black/5 flex flex-col">
        <div className="p-6 border-bottom border-black/5">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
            <GraduationCap size={28} />
            <span>EduTrack</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Monitoring Siswa</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {user.role === 'teacher' ? (
            <>
              <button 
                onClick={() => { setActiveTab('dashboard'); setSelectedStudentId(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Users size={20} />
                <span>Daftar Siswa</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => setActiveTab('my-profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'my-profile' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <User size={20} />
              <span>Profil Saya</span>
            </button>
          )}
        </nav>

        <div className="p-6 border-t border-black/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold truncate w-24">{user.username}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && user.role === 'teacher' && !selectedStudentId && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold tracking-tight">Ringkasan Sekolah</h1>
                <p className="text-gray-500">Selamat datang kembali, berikut adalah statistik hari ini.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Users size={24} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Siswa</span>
                  </div>
                  <p className="text-4xl font-light">{stats?.totalStudents || 0}</p>
                  <p className="text-sm text-gray-400 mt-2">Siswa terdaftar aktif</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <UserCheck size={24} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hadir Hari Ini</span>
                  </div>
                  <p className="text-4xl font-light">
                    {stats?.attendanceToday?.find((a: any) => a.status === 'present')?.count || 0}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Kehadiran tercatat</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Activity size={24} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Performa</span>
                  </div>
                  <p className="text-4xl font-light">84%</p>
                  <p className="text-sm text-gray-400 mt-2">Rata-rata nilai sekolah</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <h3 className="text-lg font-semibold mb-6">Siswa Terbaru</h3>
                  <div className="space-y-4">
                    {students.slice(0, 5).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => handleStudentClick(student.id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.class}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <h3 className="text-lg font-semibold mb-6">Aktivitas Terakhir</h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium">Absensi Kelas 10-A Selesai</p>
                        <p className="text-xs text-gray-400">10 menit yang lalu</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium">Nilai Matematika Diinput</p>
                        <p className="text-xs text-gray-400">1 jam yang lalu</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium">Catatan Perilaku Budi Pratama</p>
                        <p className="text-xs text-gray-400">3 jam yang lalu</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && user.role === 'teacher' && !selectedStudentId && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Daftar Siswa</h1>
                  <p className="text-gray-500">Kelola dan monitor data seluruh siswa.</p>
                </div>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm">
                  <Plus size={20} />
                  <span>Tambah Siswa</span>
                </button>
              </header>

              <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="p-4 border-b border-black/5 bg-gray-50/50 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari nama atau kelas..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-black/5">
                        <th className="px-6 py-4">Nama Siswa</th>
                        <th className="px-6 py-4">Kelas</th>
                        <th className="px-6 py-4">Orang Tua</th>
                        <th className="px-6 py-4">Telepon</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredStudents.map(student => (
                        <tr 
                          key={student.id} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => handleStudentClick(student.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                {student.name.charAt(0)}
                              </div>
                              <span className="font-medium">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.class}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.parent_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">{student.phone}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-gray-400 group-hover:text-emerald-600 transition-colors">
                              <ChevronRight size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {(selectedStudentId || (activeTab === 'my-profile' && user.role === 'student')) && studentDetail && (
            <motion.div 
              key="student-detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {user.role === 'teacher' && (
                <button 
                  onClick={() => setSelectedStudentId(null)}
                  className="text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                >
                  ← Kembali ke Daftar
                </button>
              )}

              <header className="flex items-end gap-6">
                <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-emerald-200">
                  {studentDetail.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold tracking-tight">{studentDetail.name}</h1>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      {studentDetail.class}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">Orang Tua: {studentDetail.parent_name} • {studentDetail.phone}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-600" />
                        Kehadiran
                      </h3>
                      {user.role === 'teacher' && (
                        <button className="text-xs text-emerald-600 font-bold uppercase hover:underline">Input</button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {studentDetail.attendance.length > 0 ? (
                        studentDetail.attendance.map(a => (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm font-medium">{new Date(a.date).toLocaleDateString('id-ID')}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              a.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                              a.status === 'absent' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {a.status === 'present' ? 'Hadir' : a.status === 'absent' ? 'Alpa' : a.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4 italic">Belum ada data kehadiran</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grades & Behavior */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold flex items-center gap-2">
                        <GraduationCap size={18} className="text-blue-600" />
                        Nilai Akademik
                      </h3>
                      {user.role === 'teacher' && (
                        <button className="text-xs text-blue-600 font-bold uppercase hover:underline">Tambah Nilai</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentDetail.grades.length > 0 ? (
                        studentDetail.grades.map(g => (
                          <div key={g.id} className="p-4 border border-black/5 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold">{g.subject}</p>
                              <p className="text-xs text-gray-400">{new Date(g.date).toLocaleDateString('id-ID')}</p>
                            </div>
                            <div className="text-2xl font-light text-blue-600">{g.score}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">Belum ada data nilai</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-600" />
                        Catatan Perilaku
                      </h3>
                      {user.role === 'teacher' && (
                        <button className="text-xs text-amber-600 font-bold uppercase hover:underline">Tambah Catatan</button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {studentDetail.behavior.length > 0 ? (
                        studentDetail.behavior.map(b => (
                          <div key={b.id} className={`p-4 rounded-xl border-l-4 ${b.type === 'positive' ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold uppercase ${b.type === 'positive' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {b.type === 'positive' ? 'Positif' : 'Negatif'}
                              </span>
                              <span className="text-[10px] text-gray-400">{new Date(b.date).toLocaleDateString('id-ID')}</span>
                            </div>
                            <p className="text-sm text-gray-700">{b.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">Belum ada catatan perilaku</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
