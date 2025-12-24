import React, { useState, useMemo, useEffect } from 'react';
import { Save, RefreshCw, Shield, Layout, Lock, Plus, Trash2, CalendarX, AlertCircle, Edit2, X, Filter, Calendar, Ban, Users, Upload, FileSpreadsheet, CheckCircle2, Download, FileJson, UploadCloud } from 'lucide-react';
import { AppSettings, AuthSettings, TeacherData, TeacherLeave, LeaveType, SettingsPanelProps, Student } from '../types';
import { CLASSES } from '../constants';
import HolidayManager from './HolidayManager';
import * as XLSX from 'xlsx';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  settings, 
  onSave, 
  authSettings, 
  onSaveAuth, 
  teacherData,
  teacherLeaves = [],
  onToggleLeave,
  onEditLeave,
  onDeleteLeave,
  calendarEvents = [],
  onUpdateCalendar,
  unavailableConstraints = {},
  onToggleConstraint,
  students = [],
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onBulkAddStudents
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'LEAVE' | 'CALENDAR' | 'SUBJECT_HOLIDAY' | 'STUDENT'>('GENERAL');
  
  // State lokal formulir
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [authData, setAuthData] = useState<AuthSettings>({
    adminPassword: authSettings.adminPassword || '',
    teacherPasswords: authSettings.teacherPasswords || {},
    classPasswords: authSettings.classPasswords || {}
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isAuthSaved, setIsAuthSaved] = useState(false);

  // SINKRONISASI: Jika data dari cloud berubah (Firebase), update state formulir
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    setAuthData({
      adminPassword: authSettings.adminPassword || '',
      teacherPasswords: authSettings.teacherPasswords || {},
      classPasswords: authSettings.classPasswords || {}
    });
  }, [authSettings]);

  // Leave Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTeacherId, setFilterTeacherId] = useState<string>('');
  const [leaveForm, setLeaveForm] = useState<{
    date: string;
    teacherId: string;
    type: LeaveType;
    description: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    teacherId: '',
    type: 'SAKIT',
    description: ''
  });

  // Calendar & Student States
  const [calDate, setCalDate] = useState('');
  const [calDesc, setCalDesc] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [studentTabMode, setStudentTabMode] = useState<'MANUAL' | 'UPLOAD'>('MANUAL');
  const [studentForm, setStudentForm] = useState<{ name: string, className: string }>({ name: '', className: CLASSES[0] });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentClassFilter, setStudentClassFilter] = useState<string>('');
  const [uploadClassTarget, setUploadClassTarget] = useState<string>(CLASSES[0]);
  const [isStudentSaved, setIsStudentSaved] = useState(false);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const setCurrentDate = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    setFormData(prev => ({ ...prev, lastUpdated: dateStr }));
    setIsSaved(false);
  };

  const handleBackupData = () => {
    const allData = {
      appSettings: formData,
      authSettings: authData,
      teacherData,
      teacherLeaves,
      calendarEvents,
      unavailableConstraints,
      students,
      backupDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Sistem_Guru_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Restore akan menimpa data saat ini. Lanjutkan?")) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if(data.appSettings) localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
        if(data.authSettings) localStorage.setItem('authSettings', JSON.stringify(data.authSettings));
        alert("Restore Berhasil! Me-refresh halaman...");
        window.location.reload();
      } catch (err) {
        alert("File backup tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAuth(authData);
    setIsAuthSaved(true);
    setTimeout(() => setIsAuthSaved(false), 3000);
  };

  const handleTeacherPasswordChange = (name: string, pass: string) => {
    setAuthData(prev => ({
      ...prev,
      teacherPasswords: {
        ...(prev.teacherPasswords || {}),
        [name]: pass
      }
    }));
    setIsAuthSaved(false);
  };

  const handleClassPasswordChange = (cls: string, pass: string) => {
    setAuthData(prev => ({
      ...prev,
      classPasswords: {
        ...(prev.classPasswords || {}),
        [cls]: pass
      }
    }));
    setIsAuthSaved(false);
  };

  const uniqueTeachers = useMemo(() => {
    return Array.from(new Set(teacherData.map(t => t.name))).sort() as string[];
  }, [teacherData]);

  const filteredLeaves = useMemo(() => {
    if (!filterTeacherId) return teacherLeaves;
    return teacherLeaves.filter(l => String(l.teacherId) === filterTeacherId);
  }, [teacherLeaves, filterTeacherId]);

  const filteredStudents = useMemo(() => {
    if (!studentClassFilter) return students;
    return students.filter(s => s.className === studentClassFilter);
  }, [students, studentClassFilter]);

  // Fix: Defined handleStudentSubmit to handle manual student addition and updates
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name) return;

    if (editingStudentId) {
      onEditStudent?.({ id: editingStudentId, ...studentForm });
      setEditingStudentId(null);
    } else {
      onAddStudent?.({ id: Date.now().toString(), ...studentForm });
    }
    setStudentForm({ name: '', className: studentForm.className });
    setIsStudentSaved(true);
    setTimeout(() => setIsStudentSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Pengaturan</h2>
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('GENERAL')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'GENERAL' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}><Layout size={18} /> Umum</button>
            <button onClick={() => setActiveTab('SECURITY')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'SECURITY' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}><Shield size={18} /> Manajemen Akun</button>
            <button onClick={() => setActiveTab('LEAVE')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'LEAVE' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}><CalendarX size={18} /> Perizinan Guru</button>
            <button onClick={() => setActiveTab('CALENDAR')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'CALENDAR' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}><Calendar size={18} /> Kalender Libur</button>
            <button onClick={() => setActiveTab('SUBJECT_HOLIDAY')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'SUBJECT_HOLIDAY' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}><Ban size={18} /> Libur Per Mapel</button>
            <button onClick={() => setActiveTab('STUDENT')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'STUDENT' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={18} /> Manajemen Siswa</button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[800px]">
          
          {/* --- GENERAL TAB --- */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Informasi Aplikasi</h2>
                <p className="text-sm text-gray-500 mt-1">Ubah header, periode akademik, dan data sekolah.</p>
              </div>
              <form onSubmit={handleGeneralSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">URL Logo Sekolah</label>
                    <input type="text" name="logoUrl" value={formData.logoUrl || ''} onChange={handleGeneralChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Kepala Sekolah</label>
                      <input type="text" name="headmaster" value={formData.headmaster || ''} onChange={handleGeneralChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">NIP Kepala Sekolah</label>
                      <input type="text" name="headmasterNip" value={formData.headmasterNip || ''} onChange={handleGeneralChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tahun Ajaran</label>
                        <input type="text" name="academicYear" value={formData.academicYear} onChange={handleGeneralChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleGeneralChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"><option value="Ganjil">Ganjil</option><option value="Genap">Genap</option></select>
                    </div>
                </div>
                <div className="pt-6 border-t flex items-center justify-end gap-4">
                  {isSaved && <span className="text-green-600 font-bold text-sm">✓ Tersimpan!</span>}
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md"><Save size={18} className="inline mr-2" /> Simpan</button>
                </div>
              </form>
              <div className="mt-8 pt-6 border-t-2">
                 <h3 className="text-lg font-bold text-gray-800 mb-2">Backup & Restore</h3>
                 <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={handleBackupData} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm"><FileJson size={20} /> Backup Data</button>
                    <div className="relative">
                       <input type="file" accept=".json" onChange={handleRestoreData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       <button className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-sm"><UploadCloud size={20} /> Restore Data</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* --- SECURITY TAB --- */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-8 animate-fade-in">
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Manajemen Akun & Keamanan</h2>
                <p className="text-sm text-gray-500 mt-1">Atur password untuk Admin dan Guru secara manual.</p>
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lock className="text-indigo-600" /> Password Admin</h3>
                  <input type="text" value={authData.adminPassword || ''} onChange={(e) => { setAuthData(prev => ({ ...prev, adminPassword: e.target.value })); setIsAuthSaved(false); }} className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" placeholder="Masukkan password admin baru..." />
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Shield className="text-emerald-600" /> Password Guru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                     {uniqueTeachers.map(teacherName => (
                       <div key={teacherName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-xs font-bold text-gray-700 truncate mr-2" title={teacherName}>{teacherName}</span>
                          <input type="text" value={authData.teacherPasswords?.[teacherName] || ''} onChange={(e) => handleTeacherPasswordChange(teacherName, e.target.value)} placeholder="guru123" className="w-32 text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-emerald-500" />
                       </div>
                     ))}
                  </div>
                </div>
                <div className="pt-6 border-t flex items-center justify-end gap-4 sticky bottom-0 bg-white pb-4">
                  {isAuthSaved && <span className="text-green-600 font-bold text-sm">✓ Berhasil Disimpan!</span>}
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md"><Save size={18} className="inline mr-2" /> Simpan Password</button>
                </div>
              </form>
            </div>
          )}

          {/* --- PERIZINAN GURU (LEAVE) --- */}
          {activeTab === 'LEAVE' && (
             <div className="space-y-6 animate-fade-in">
                <div className="border-b pb-4"><h2 className="text-xl font-bold text-gray-800">Perizinan Guru</h2></div>
                <div className="bg-gray-50 p-6 rounded-xl border"><form onSubmit={(e) => { e.preventDefault(); if(!leaveForm.teacherId) return; const t = teacherData.find(x => String(x.id) === leaveForm.teacherId); if(t) onToggleLeave && onToggleLeave({ ...leaveForm, teacherId: Number(leaveForm.teacherId), teacherName: t.name }); setLeaveForm({...leaveForm, teacherId: '', description: ''}); }} className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold mb-1">Guru</label><select value={leaveForm.teacherId} onChange={(e) => setLeaveForm({...leaveForm, teacherId: e.target.value})} className="w-full border rounded px-3 py-2 text-sm"><option value="">-- Pilih Guru --</option>{teacherData.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div><div><label className="block text-xs font-bold mb-1">Tanggal</label><input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" /></div><div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Keterangan</label><input type="text" value={leaveForm.description} onChange={(e) => setLeaveForm({...leaveForm, description: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" /></div><button type="submit" className="md:col-span-2 py-2 bg-indigo-600 text-white rounded font-bold">Tambah Izin</button></form></div>
                <div className="bg-white border rounded-xl overflow-hidden"><table className="min-w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Tanggal</th><th className="px-4 py-2 text-left">Guru</th><th className="px-4 py-2">Aksi</th></tr></thead><tbody>{teacherLeaves.map(l => <tr key={l.id} className="border-t"> <td className="px-4 py-2">{l.date}</td><td className="px-4 py-2">{l.teacherName}</td><td className="px-4 py-2 text-center"><button onClick={() => onDeleteLeave && onDeleteLeave(l.id)} className="text-red-500"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
             </div>
          )}

          {/* --- TAB LAINNYA --- */}
          {activeTab === 'CALENDAR' && (
             <div className="animate-fade-in"><h2 className="text-xl font-bold mb-4">Kalender Libur</h2><div className="bg-blue-50 p-6 rounded-xl border border-blue-200"><form onSubmit={(e) => { e.preventDefault(); onUpdateCalendar && onUpdateCalendar([...calendarEvents, {id: Date.now().toString(), date: calDate, description: calDesc}]); setCalDate(''); setCalDesc(''); }} className="flex gap-4"> <input type="date" value={calDate} onChange={(e) => setCalDate(e.target.value)} className="border p-2 rounded" required /> <input type="text" value={calDesc} onChange={(e) => setCalDesc(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Keterangan..." required /><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Tambah</button></form></div><div className="mt-4 bg-white border rounded-xl overflow-hidden"><table className="min-w-full"><thead><tr className="bg-gray-50"><th className="px-4 py-2 text-left">Tanggal</th><th className="px-4 py-2 text-left">Deskripsi</th><th className="px-4 py-2">Aksi</th></tr></thead><tbody>{calendarEvents.map(e => <tr key={e.id} className="border-t"><td className="px-4 py-2">{e.date}</td><td className="px-4 py-2">{e.description}</td><td className="px-4 py-2 text-center"><button onClick={() => onUpdateCalendar && onUpdateCalendar(calendarEvents.filter(x => x.id !== e.id))} className="text-red-500"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></div>
          )}

          {activeTab === 'SUBJECT_HOLIDAY' && (
             <HolidayManager teacherData={teacherData} constraints={unavailableConstraints} onToggle={onToggleConstraint || (() => {})} calendarEvents={calendarEvents} onUpdateCalendar={onUpdateCalendar || (() => {})} onSave={() => alert("Tersimpan!")} />
          )}

          {activeTab === 'STUDENT' && (
             <div className="animate-fade-in space-y-4">
                <h2 className="text-xl font-bold">Manajemen Siswa</h2>
                <div className="bg-gray-50 p-6 rounded-xl border">
                  <form onSubmit={handleStudentSubmit} className="flex gap-2 items-end">
                    <div className="w-32">
                      <label className="text-xs font-bold">Kelas</label>
                      <select value={studentForm.className} onChange={(e) => setStudentForm({...studentForm, className: e.target.value})} className="w-full border p-2 rounded text-sm">{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold">Nama</label>
                      <input type="text" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded font-bold">
                      {editingStudentId ? 'Update' : 'Tambah'}
                    </button>
                    {isStudentSaved && <span className="text-green-600 font-bold text-xs ml-2">✓ Tersimpan!</span>}
                  </form>
                </div>
                <div className="bg-white border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Kelas</th>
                        <th className="px-4 py-2 text-left">Nama</th>
                        <th className="px-4 py-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id} className="border-t">
                          <td className="px-4 py-2">{s.className}</td>
                          <td className="px-4 py-2">{s.name}</td>
                          <td className="px-4 py-2 text-center">
                            <button onClick={() => { setEditingStudentId(s.id); setStudentForm({ name: s.name, className: s.className }); }} className="text-blue-500 mr-2" title="Edit">
                              <Edit2 size={16}/>
                            </button>
                            <button onClick={() => onDeleteStudent && onDeleteStudent(s.id)} className="text-red-500" title="Hapus">
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;