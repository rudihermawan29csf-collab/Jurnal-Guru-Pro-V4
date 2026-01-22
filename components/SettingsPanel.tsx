import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Save, RefreshCw, Shield, Layout, Lock, Plus, Trash2, CalendarX, AlertCircle, Edit2, X, Filter, Calendar, Ban, Users, Upload, FileSpreadsheet, CheckCircle2, Download, FileJson, UploadCloud, Database, Activity, Loader2, ArrowRightLeft, Sheet, Globe, Link } from 'lucide-react';
import { AppSettings, AuthSettings, TeacherData, TeacherLeave, LeaveType, SettingsPanelProps, Student } from '../types';
import { CLASSES } from '../constants';
import HolidayManager from './HolidayManager';
import * as XLSX from 'xlsx';
import { sheetApi } from '../services/sheetApi';

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
  onBulkAddStudents,
  onRestore,
  teachingJournals = [],
  teachingMaterials = [],
  studentGrades = [],
  homeroomRecords = [],
  attitudeRecords = [],
  teacherAgendas = []
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'LEAVE' | 'CALENDAR' | 'SUBJECT_HOLIDAY' | 'STUDENT' | 'MIGRATION'>('GENERAL');
  
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [authData, setAuthData] = useState<AuthSettings>({
    adminPassword: authSettings.adminPassword || '',
    teacherPasswords: authSettings.teacherPasswords || {},
    classPasswords: authSettings.classPasswords || {}
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isAuthSaved, setIsAuthSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cloud Config State
  const [cloudUrl, setCloudUrl] = useState(sheetApi.getBaseUrl());
  // const [isCloudSaved, setIsCloudSaved] = useState(false); // Unused

  // Migration State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

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
    
    // Save Cloud URL
    if (cloudUrl !== sheetApi.getBaseUrl()) {
        sheetApi.setBaseUrl(cloudUrl);
        alert("URL Cloud diperbarui. Silakan refresh halaman untuk menghubungkan ulang.");
    }

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
      teachingJournals,
      teachingMaterials,
      studentGrades,
      homeroomRecords,
      attitudeRecords,
      teacherAgendas,
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
    
    if (!window.confirm("Restore akan menimpa data saat ini. Lanjutkan?")) {
        if(fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (onRestore) {
            onRestore(json);
            alert("Data berhasil dipulihkan!");
        } else {
            alert("Fitur Restore belum diimplementasikan di App parent.");
        }
      } catch (err) {
        console.error("Invalid JSON", err);
        alert("File backup tidak valid.");
      }
      if(fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setAuthData(prev => ({ ...prev, [name]: value })); setIsAuthSaved(false); };
  const handleTeacherPassChange = (name: string, pass: string) => { setAuthData(prev => ({ ...prev, teacherPasswords: { ...prev.teacherPasswords, [name]: pass } })); setIsAuthSaved(false); };
  const handleAuthSubmit = (e: React.FormEvent) => { e.preventDefault(); onSaveAuth(authData); setIsAuthSaved(true); setTimeout(() => setIsAuthSaved(false), 3000); };
  const handleLeaveSubmit = (e: React.FormEvent) => { e.preventDefault(); const teacher = teacherData.find(t => String(t.id) === leaveForm.teacherId); if (!teacher) return; if (editingId) { onEditLeave && onEditLeave({ id: editingId, teacherId: parseInt(leaveForm.teacherId), teacherName: teacher.name, date: leaveForm.date, type: leaveForm.type, description: leaveForm.description }); setEditingId(null); } else { onToggleLeave && onToggleLeave({ id: Date.now().toString(), teacherId: parseInt(leaveForm.teacherId), teacherName: teacher.name, date: leaveForm.date, type: leaveForm.type, description: leaveForm.description }); } setLeaveForm({ date: new Date().toISOString().split('T')[0], teacherId: '', type: 'SAKIT', description: '' }); };
  const handleStudentSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingStudentId && onEditStudent) { onEditStudent({ id: editingStudentId, ...studentForm }); setEditingStudentId(null); } else if (onAddStudent) { onAddStudent({ id: Date.now().toString(), ...studentForm }); } setStudentForm({ name: '', className: studentForm.className }); setIsStudentSaved(true); setTimeout(() => setIsStudentSaved(false), 2000); };
  const handleStudentExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !onBulkAddStudents) return; const reader = new FileReader(); reader.onload = (evt) => { try { const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const wsname = wb.SheetNames[0]; const ws = wb.Sheets[wsname]; const data = XLSX.utils.sheet_to_json(ws) as any[]; const newStudents: Student[] = []; data.forEach((row, idx) => { const name = row['Nama'] || row['NAMA'] || row['Nama Siswa']; const cls = row['Kelas'] || row['KELAS'] || uploadClassTarget; if (name) { newStudents.push({ id: Date.now().toString() + idx, name: String(name), className: String(cls) }); } }); if (newStudents.length > 0) { onBulkAddStudents(newStudents); alert(`Berhasil menambahkan ${newStudents.length} siswa.`); } else { alert("Tidak ada data siswa yang valid ditemukan."); } } catch (error) { console.error(error); alert("Gagal membaca file Excel."); } }; reader.readAsBinaryString(file); };
  
  const handleMigrate = async () => {
    if (!sheetApi.isConfigured()) {
        alert("URL Spreadsheet belum dikonfigurasi. Silakan isi URL di tab Umum.");
        return;
    }
    
    if (!window.confirm("Proses ini akan mengirim data APLIKASI SAAT INI ke Spreadsheet sebagai tabel.\n\nLanjutkan?")) return;
    
    setIsMigrating(true);
    setMigrationLog([]);
    const logs: string[] = [];
    
    const addLog = (msg: string) => {
        logs.push(msg);
        setMigrationLog([...logs]);
    };
    
    try {
        addLog("⏳ Mempersiapkan data lokal...");
        
        const formattedTeachers = teacherData.map((t: TeacherData) => ({
            'NO': t.no,
            'NAMA GURU': t.name,
            'PANGKAT/GOL': `${t.rank || '-'} / ${t.gol || '-'}`,
            'MATA PEL': t.subject,
            'KODE': t.code,
            'VII A': t.hoursVII?.A || 0, 'VII B': t.hoursVII?.B || 0, 'VII C': t.hoursVII?.C || 0,
            'VIII A': t.hoursVIII?.A || 0, 'VIII B': t.hoursVIII?.B || 0, 'VIII C': t.hoursVIII?.C || 0,
            'IX A': t.hoursIX?.A || 0, 'IX B': t.hoursIX?.B || 0, 'IX C': t.hoursIX?.C || 0,
            'TUGAS TAMBAHAN': t.additionalTask || '-',
            'JAM TAMBAHAN': t.additionalHours || 0,
            'TOTAL JAM': t.totalHours
        }));

        const formattedStudents = students.map((s: Student, idx: number) => ({
            'No': idx + 1,
            'Nama Siswa': s.name,
            'Kelas': s.className
        })).sort((a: any, b: any) => a.Kelas.localeCompare(b.Kelas));

        const formattedLeaves = teacherLeaves.map((l: TeacherLeave) => ({
            'Tanggal': l.date,
            'Nama Guru': l.teacherName,
            'Jenis Ijin': l.type,
            'Keterangan': l.description || '-'
        }));

        const formattedCalendar = calendarEvents.map((c: any) => ({
            'Tanggal': c.date,
            'Keterangan': c.description
        }));

        const payload = {
            'Guru': formattedTeachers,
            'Siswa': formattedStudents,
            'Ijin Guru': formattedLeaves,
            'Kalender': formattedCalendar
        };

        addLog(`📤 Mengirim data ke: ${sheetApi.getBaseUrl()}`);
        addLog(`📊 Data Guru: ${formattedTeachers.length} baris`);
        addLog(`🎓 Data Siswa: ${formattedStudents.length} baris`);
        
        await sheetApi.exportTables(payload);
        
        addLog("🎉 MIGRASI SUKSES! Data telah tersimpan di Google Spreadsheet.");
        
    } catch (error: any) {
        addLog(`❌ ERROR: ${error.message}`);
        addLog("Pastikan script URL benar dan deployment mengizinkan akses 'Anyone'.");
        console.error(error);
    } finally {
        setIsMigrating(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    if (!filterTeacherId) return teacherLeaves;
    return teacherLeaves?.filter(l => String(l.teacherId) === filterTeacherId);
  }, [teacherLeaves, filterTeacherId]);

  const filteredStudents = useMemo(() => {
    if (!studentClassFilter) return students;
    return students.filter(s => s.className === studentClassFilter);
  }, [students, studentClassFilter]);

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
      <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 h-fit">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Layout size={18} className="text-indigo-600" />
            Menu Pengaturan
          </h3>
        </div>
        <nav className="flex flex-col p-2 space-y-1">
          <button onClick={() => setActiveTab('GENERAL')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'GENERAL' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><RefreshCw size={18} /> Umum & Cloud</button>
          <button onClick={() => setActiveTab('SECURITY')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SECURITY' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><Shield size={18} /> Keamanan Akun</button>
          <button onClick={() => setActiveTab('LEAVE')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'LEAVE' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><CalendarX size={18} /> Ijin & Absen Guru</button>
          <button onClick={() => setActiveTab('SUBJECT_HOLIDAY')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SUBJECT_HOLIDAY' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><Ban size={18} /> Libur Guru/Mapel</button>
          <button onClick={() => setActiveTab('STUDENT')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'STUDENT' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><Users size={18} /> Data Siswa</button>
          <button onClick={() => setActiveTab('MIGRATION')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MIGRATION' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowRightLeft size={18} /> Export / Migrasi</button>
        </nav>
      </div>

      <div className="flex-1">
        {activeTab === 'GENERAL' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <Globe className="text-indigo-600" /> Koneksi Cloud & Umum
            </h2>
            
            <form onSubmit={handleGeneralSubmit} className="space-y-6">
              
              {/* Cloud Settings */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                 <label className="block text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                    <Link size={16}/> URL Google Apps Script (Backend Cloud)
                 </label>
                 <input 
                    type="text" 
                    value={cloudUrl} 
                    onChange={(e) => setCloudUrl(e.target.value)} 
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-mono text-blue-900 bg-white" 
                    placeholder="https://script.google.com/macros/s/..." 
                 />
                 <p className="text-xs text-blue-600 mt-2">
                    Masukkan URL Deployment Web App dari Google Apps Script untuk mengaktifkan fitur Online & Sinkronisasi Data.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                  <input type="text" name="academicYear" value={formData.academicYear} onChange={handleGeneralChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="Contoh: 2024/2025" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleGeneralChange} className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 transition-shadow">
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo Sekolah</label>
                  <div className="flex gap-4 items-center">
                    <input type="text" name="logoUrl" value={formData.logoUrl} onChange={handleGeneralChange} className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="https://..." />
                    {formData.logoUrl && <img src={formData.logoUrl} alt="Preview" className="h-10 w-10 object-contain border rounded bg-gray-50" />}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kepala Sekolah</label>
                  <input type="text" name="headmaster" value={formData.headmaster || ''} onChange={handleGeneralChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="Nama Lengkap & Gelar" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIP Kepala Sekolah</label>
                  <input type="text" name="headmasterNip" value={formData.headmasterNip || ''} onChange={handleGeneralChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="NIP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Tanda Tangan</label>
                  <div className="flex gap-2">
                    <input type="text" name="lastUpdated" value={formData.lastUpdated} onChange={handleGeneralChange} className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="DD MMMM YYYY" />
                    <button type="button" onClick={setCurrentDate} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-bold whitespace-nowrap">Hari Ini</button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button type="submit" className={`px-6 py-2.5 rounded-lg text-white font-bold transition-all shadow-md flex items-center gap-2 ${isSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {isSaved ? <><CheckCircle2 size={18} /> Tersimpan!</> : <><Save size={18} /> Simpan Pengaturan</>}
                </button>
              </div>
            </form>

            <div className="mt-10 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Backup & Restore Data Lokal</h4>
                <div className="flex gap-4">
                    <button onClick={handleBackupData} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                        <Download size={16} /> Backup JSON
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors cursor-pointer">
                        <Upload size={16} /> Restore JSON
                        <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
                    </label>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <Lock className="text-indigo-600" /> Keamanan Akun
            </h2>
            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-bold text-orange-800 mb-2">Password Administrator</h4>
                <input type="text" name="adminPassword" value={authData.adminPassword} onChange={handleAuthChange} className="w-full border rounded-lg px-3 py-2 font-mono text-sm bg-white" placeholder="Default: 007007Rh" />
                <p className="text-xs text-orange-600 mt-1">Password ini digunakan untuk masuk sebagai Admin / Kurikulum.</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-4">Password Guru (Login)</h4>
                <div className="max-h-[400px] overflow-y-auto border rounded-xl bg-gray-50 p-2 space-y-2 custom-scrollbar">
                  {teacherData.map(teacher => (
                    <div key={teacher.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                      <span className="text-sm font-medium text-gray-700">{teacher.name}</span>
                      <input 
                        type="text" 
                        value={authData.teacherPasswords[teacher.name] || ''} 
                        onChange={(e) => handleTeacherPassChange(teacher.name, e.target.value)}
                        placeholder="Default: guru123"
                        className="border rounded px-2 py-1 text-xs w-40 font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button type="submit" className={`px-6 py-2.5 rounded-lg text-white font-bold transition-all shadow-md flex items-center gap-2 ${isAuthSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {isAuthSaved ? <><CheckCircle2 size={18} /> Tersimpan!</> : <><Save size={18} /> Simpan Password</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'LEAVE' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <CalendarX className="text-indigo-600" /> Kelola Izin & Absensi Guru
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 h-fit">
                <h3 className="font-bold text-gray-800 mb-4">{editingId ? 'Edit Izin' : 'Input Izin Baru'}</h3>
                <form onSubmit={handleLeaveSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
                    <input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})} className="w-full border rounded px-3 py-2 text-sm bg-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nama Guru</label>
                    <select value={leaveForm.teacherId} onChange={(e) => setLeaveForm({...leaveForm, teacherId: e.target.value})} className="w-full border rounded px-3 py-2 text-sm bg-white" required>
                      <option value="">-- Pilih Guru --</option>
                      {teacherData.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Jenis Izin</label>
                    <select value={leaveForm.type} onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as LeaveType})} className="w-full border rounded px-3 py-2 text-sm bg-white" required>
                      <option value="SAKIT">Sakit</option>
                      <option value="IZIN">Izin Pribadi</option>
                      <option value="DINAS_LUAR">Dinas Luar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Keterangan</label>
                    <textarea value={leaveForm.description} onChange={(e) => setLeaveForm({...leaveForm, description: e.target.value})} className="w-full border rounded px-3 py-2 text-sm bg-white" rows={3} placeholder="Contoh: Mengikuti MGMP" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingId && (
                      <button type="button" onClick={() => { setEditingId(null); setLeaveForm({ date: new Date().toISOString().split('T')[0], teacherId: '', type: 'SAKIT', description: '' }); }} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold">Batal</button>
                    )}
                    <button type="submit" className="flex-[2] py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">Simpan</button>
                  </div>
                </form>
              </div>
              
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Riwayat Izin</h3>
                  <select value={filterTeacherId} onChange={(e) => setFilterTeacherId(e.target.value)} className="border rounded px-2 py-1 text-xs">
                    <option value="">Semua Guru</option>
                    {teacherData.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Tanggal</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Nama Guru</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-600">Tipe</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Keterangan</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLeaves.map(leave => (
                        <tr key={leave.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500">{leave.date}</td>
                          <td className="px-4 py-2 font-medium text-gray-800">{leave.teacherName}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              leave.type === 'SAKIT' ? 'bg-blue-100 text-blue-700' :
                              leave.type === 'IZIN' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                            }`}>{leave.type}</span>
                          </td>
                          <td className="px-4 py-2 text-gray-600 truncate max-w-xs">{leave.description}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => {
                                setEditingId(leave.id);
                                setLeaveForm({ date: leave.date, teacherId: String(leave.teacherId), type: leave.type, description: leave.description || '' });
                              }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                              <button onClick={() => onDeleteLeave && onDeleteLeave(leave.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredLeaves.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Belum ada data izin.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SUBJECT_HOLIDAY' && (
          <HolidayManager 
            teacherData={teacherData} 
            constraints={unavailableConstraints} 
            onToggle={onToggleConstraint || (() => {})} 
            calendarEvents={calendarEvents}
            onUpdateCalendar={onUpdateCalendar || (() => {})}
          />
        )}

        {activeTab === 'STUDENT' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <Users className="text-indigo-600" /> Data Siswa
            </h2>
            
            <div className="flex gap-4 mb-6 border-b border-gray-200 pb-1">
               <button onClick={() => setStudentTabMode('MANUAL')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${studentTabMode === 'MANUAL' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Input Manual</button>
               <button onClick={() => setStudentTabMode('UPLOAD')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${studentTabMode === 'UPLOAD' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Upload Excel</button>
            </div>

            {studentTabMode === 'MANUAL' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-200 h-fit">
                   <h3 className="font-bold text-gray-800 mb-4">{editingStudentId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
                   <form onSubmit={handleStudentSubmit} className="space-y-3">
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Nama Lengkap</label><input type="text" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value.toUpperCase()})} className="w-full border rounded px-3 py-2 text-sm bg-white" required placeholder="Nama Siswa" /></div>
                      <div><label className="block text-xs font-bold text-gray-600 mb-1">Kelas</label><select value={studentForm.className} onChange={(e) => setStudentForm({...studentForm, className: e.target.value})} className="w-full border rounded px-3 py-2 text-sm bg-white">{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                      <div className="flex gap-2 pt-2">
                        {editingStudentId && <button type="button" onClick={() => {setEditingStudentId(null); setStudentForm({name:'', className: CLASSES[0]})}} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold">Batal</button>}
                        <button type="submit" className="flex-[2] py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">{isStudentSaved ? 'Tersimpan!' : 'Simpan'}</button>
                      </div>
                   </form>
                </div>
                <div className="lg:col-span-2">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2 items-center">
                         <h3 className="font-bold text-gray-800">Daftar Siswa</h3>
                         <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{filteredStudents.length} Siswa</span>
                      </div>
                      <select value={studentClassFilter} onChange={(e) => setStudentClassFilter(e.target.value)} className="border rounded px-2 py-1 text-xs"><option value="">Semua Kelas</option>{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                   </div>
                   <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                         <thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-3 text-left font-bold text-gray-600 w-12">No</th><th className="px-4 py-3 text-left font-bold text-gray-600">Nama Siswa</th><th className="px-4 py-3 text-center font-bold text-gray-600 w-24">Kelas</th><th className="px-4 py-3 text-center font-bold text-gray-600 w-20">Aksi</th></tr></thead>
                         <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map((s, idx) => (
                               <tr key={s.id} className="hover:bg-gray-50"><td className="px-4 py-2 text-gray-500 text-center">{idx + 1}</td><td className="px-4 py-2 font-medium text-gray-800">{s.name}</td><td className="px-4 py-2 text-center"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{s.className}</span></td><td className="px-4 py-2 text-center"><div className="flex justify-center gap-1"><button onClick={() => {setEditingStudentId(s.id); setStudentForm({name: s.name, className: s.className})}} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button><button onClick={() => onDeleteStudent && onDeleteStudent(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button></div></td></tr>
                            ))}
                            {filteredStudents.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">Belum ada data siswa.</td></tr>}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {studentTabMode === 'UPLOAD' && (
               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <FileSpreadsheet size={48} className="text-emerald-500 mb-4" />
                  <h3 className="text-lg font-bold text-emerald-900 mb-2">Upload Data Siswa dari Excel</h3>
                  <p className="text-sm text-emerald-700 max-w-md mb-6">Pastikan file Excel memiliki kolom <strong>No</strong>, <strong>Nama Siswa</strong>, dan <strong>Kelas</strong> (opsional jika memilih target kelas di bawah).</p>
                  
                  <div className="flex gap-4 items-center mb-6">
                     <label className="text-sm font-bold text-emerald-800">Target Kelas (Default):</label>
                     <select value={uploadClassTarget} onChange={(e) => setUploadClassTarget(e.target.value)} className="border border-emerald-300 rounded px-3 py-2 text-sm">{CLASSES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>

                  <label className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-lg">
                     <UploadCloud size={20} /> Pilih File Excel (.xlsx)
                     <input type="file" onChange={handleStudentExcelUpload} accept=".xlsx, .xls" className="hidden" />
                  </label>
               </div>
            )}
          </div>
        )}

        {activeTab === 'MIGRATION' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
                    <ArrowRightLeft className="text-indigo-600" /> Export & Migrasi Data
                </h2>

                <div className="space-y-6">
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                        <div className="flex items-start gap-4">
                            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                                <Sheet size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-yellow-800 mb-2">Migrasi ke Google Spreadsheet</h3>
                                <p className="text-sm text-yellow-800 mb-4 leading-relaxed">
                                    Fitur ini akan mengirimkan seluruh data aplikasi (Guru, Siswa, Ijin, Kalender) ke Google Spreadsheet yang telah dikonfigurasi. 
                                    Pastikan Anda telah mengisi <strong>URL Google Apps Script</strong> di tab "Umum & Cloud".
                                </p>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleMigrate}
                                        disabled={isMigrating}
                                        className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg font-bold text-sm hover:bg-yellow-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isMigrating ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                                        {isMigrating ? 'Sedang Mengirim...' : 'Mulai Migrasi Data'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Migration Logs */}
                        {migrationLog.length > 0 && (
                            <div className="mt-6 bg-black/80 rounded-lg p-4 font-mono text-xs text-green-400 max-h-40 overflow-y-auto custom-scrollbar">
                                {migrationLog.map((log, i) => (
                                    <div key={i} className="mb-1">{log}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <Database size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-indigo-800 mb-2">Backup Lokal (JSON)</h3>
                                <p className="text-sm text-indigo-700 mb-4">
                                    Simpan data lengkap aplikasi ke dalam file JSON. File ini bisa digunakan untuk memulihkan data jika terjadi masalah.
                                </p>
                                <button onClick={handleBackupData} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                                    <Download size={18} /> Download Backup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;