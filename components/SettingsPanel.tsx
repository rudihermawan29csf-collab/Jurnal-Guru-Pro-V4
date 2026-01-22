
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Save, RefreshCw, Shield, Layout, Lock, Plus, Trash2, CalendarX, AlertCircle, Edit2, X, Filter, Calendar, Ban, Users, Upload, FileSpreadsheet, CheckCircle2, Download, FileJson, UploadCloud, Database, Activity, Loader2, ArrowRightLeft, Sheet } from 'lucide-react';
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
  // New props for full migration
  teachingJournals = [],
  teachingMaterials = [],
  studentGrades = [],
  homeroomRecords = [],
  attitudeRecords = [],
  teacherAgendas = []
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'LEAVE' | 'CALENDAR' | 'SUBJECT_HOLIDAY' | 'STUDENT' | 'MIGRATION'>('GENERAL');
  
  // State lokal formulir
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [authData, setAuthData] = useState<AuthSettings>({
    adminPassword: authSettings.adminPassword || '',
    teacherPasswords: authSettings.teacherPasswords || {},
    classPasswords: authSettings.classPasswords || {}
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isAuthSaved, setIsAuthSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Migration State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);

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
      // Add more data to backup
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

  // Auth Handlers & Leave Handlers (Removed for brevity, logic kept same as previous)
  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setAuthData(prev => ({ ...prev, [name]: value })); setIsAuthSaved(false); };
  const handleTeacherPassChange = (name: string, pass: string) => { setAuthData(prev => ({ ...prev, teacherPasswords: { ...prev.teacherPasswords, [name]: pass } })); setIsAuthSaved(false); };
  const handleAuthSubmit = (e: React.FormEvent) => { e.preventDefault(); onSaveAuth(authData); setIsAuthSaved(true); setTimeout(() => setIsAuthSaved(false), 3000); };
  const handleLeaveSubmit = (e: React.FormEvent) => { e.preventDefault(); const teacher = teacherData.find(t => String(t.id) === leaveForm.teacherId); if (!teacher) return; if (editingId) { onEditLeave && onEditLeave({ id: editingId, teacherId: parseInt(leaveForm.teacherId), teacherName: teacher.name, date: leaveForm.date, type: leaveForm.type, description: leaveForm.description }); setEditingId(null); } else { onToggleLeave && onToggleLeave({ teacherId: parseInt(leaveForm.teacherId), teacherName: teacher.name, date: leaveForm.date, type: leaveForm.type, description: leaveForm.description }); } setLeaveForm({ date: new Date().toISOString().split('T')[0], teacherId: '', type: 'SAKIT', description: '' }); };
  const handleStudentSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingStudentId && onEditStudent) { onEditStudent({ id: editingStudentId, ...studentForm }); setEditingStudentId(null); } else if (onAddStudent) { onAddStudent({ id: Date.now().toString(), ...studentForm }); } setStudentForm({ name: '', className: studentForm.className }); setIsStudentSaved(true); setTimeout(() => setIsStudentSaved(false), 2000); };
  const handleStudentExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !onBulkAddStudents) return; const reader = new FileReader(); reader.onload = (evt) => { try { const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const wsname = wb.SheetNames[0]; const ws = wb.Sheets[wsname]; const data = XLSX.utils.sheet_to_json(ws) as any[]; const newStudents: Student[] = []; data.forEach((row, idx) => { const name = row['Nama'] || row['NAMA'] || row['Nama Siswa']; const cls = row['Kelas'] || row['KELAS'] || uploadClassTarget; if (name) { newStudents.push({ id: Date.now().toString() + idx, name: String(name), className: String(cls) }); } }); if (newStudents.length > 0) { onBulkAddStudents(newStudents); alert(`Berhasil menambahkan ${newStudents.length} siswa.`); } else { alert("Tidak ada data siswa yang valid ditemukan."); } } catch (error) { console.error(error); alert("Gagal membaca file Excel."); } }; reader.readAsBinaryString(file); };
  
  // --- MIGRATION HANDLER (LOCAL DATA -> SHEET) ---
  const handleMigrate = async () => {
    if (!sheetApi.isConfigured()) {
        alert("URL Spreadsheet belum dikonfigurasi.");
        return;
    }
    
    if (!window.confirm("Proses ini akan mengirim data APLIKASI SAAT INI ke Spreadsheet.\n\nPastikan Anda sudah UPDATE kode Google Apps Script!\n\nLanjutkan?")) return;
    
    setIsMigrating(true);
    setMigrationLog([]);
    const logs: string[] = [];
    
    const addLog = (msg: string) => {
        logs.push(msg);
        setMigrationLog([...logs]);
    };
    
    try {
        addLog("⏳ Mempersiapkan data lokal...");
        
        // 1. Format Data Guru
        const formattedTeachers = teacherData.map((t: TeacherData) => ({
            'NO': t.no,
            'NAMA GURU': t.name,
            'PANGKAT/GOL': `${t.rank || '-'} / ${t.gol || '-'}`,
            'MATA PEL': t.subject,
            'KODE': t.code,
            'VII A': t.hoursVII?.A || 0,
            'VII B': t.hoursVII?.B || 0,
            'VII C': t.hoursVII?.C || 0,
            'VIII A': t.hoursVIII?.A || 0,
            'VIII B': t.hoursVIII?.B || 0,
            'VIII C': t.hoursVIII?.C || 0,
            'IX A': t.hoursIX?.A || 0,
            'IX B': t.hoursIX?.B || 0,
            'IX C': t.hoursIX?.C || 0,
            'TUGAS TAMBAHAN': t.additionalTask || '-',
            'JAM TAMBAHAN': t.additionalHours || 0,
            'TOTAL JAM': t.totalHours
        }));

        // 2. Format Data Siswa
        const formattedStudents = students.map((s: Student, idx: number) => ({
            'No': idx + 1,
            'Nama Siswa': s.name,
            'Kelas': s.className
        })).sort((a: any, b: any) => a.Kelas.localeCompare(b.Kelas));

        // 3. Format Data Ijin Guru
        const formattedLeaves = teacherLeaves.map((l: TeacherLeave) => ({
            'Tanggal': l.date,
            'Nama Guru': l.teacherName,
            'Jenis Ijin': l.type,
            'Keterangan': l.description || '-'
        }));

        // 4. Format Hari Libur
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

        addLog(`📤 Mengirim tabel ke Spreadsheet (${formattedTeachers.length} guru, ${formattedStudents.length} siswa)...`);
        
        await sheetApi.exportTables(payload);
        
        addLog("🎉 MIGRASI SUKSES! Silakan cek Spreadsheet Anda (Sheet: Guru, Siswa, dll).");
        
    } catch (error: any) {
        addLog(`❌ ERROR: ${error.message}`);
        console.error(error);
    } finally {
        setIsMigrating(false);
    }
  };

  // Filtered Lists
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
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 h-fit">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Layout size={18} className="text-indigo-600" />
            Menu Pengaturan
          </h3>
        </div>
        <nav className="flex flex-col p-2 space-y-1">
          <button onClick={() => setActiveTab('GENERAL')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'GENERAL' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <RefreshCw size={18} /> Umum & Data
          </button>
          <button onClick={() => setActiveTab('SECURITY')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SECURITY' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Shield size={18} /> Keamanan Akun
          </button>
          <button onClick={() => setActiveTab('LEAVE')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'LEAVE' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <CalendarX size={18} /> Ijin & Absen Guru
          </button>
          <button onClick={() => setActiveTab('SUBJECT_HOLIDAY')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'SUBJECT_HOLIDAY' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Ban size={18} /> Libur Guru/Mapel
          </button>
          <button onClick={() => setActiveTab('STUDENT')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'STUDENT' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Users size={18} /> Data Siswa
          </button>
          <button onClick={() => setActiveTab('MIGRATION')} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MIGRATION' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ArrowRightLeft size={18} /> Export / Migrasi
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* GENERAL SETTINGS */}
        {activeTab === 'GENERAL' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <RefreshCw className="text-indigo-600" /> Pengaturan Umum Aplikasi
            </h2>
            
            <form onSubmit={handleGeneralSubmit} className="space-y-6">
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
                  <input type="text" name="headmasterNip" value={formData.headmasterNip || ''} onChange={handleGeneralChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" placeholder="NIP..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Update Terakhir</label>
                  <div className="flex gap-2">
                    <input type="text" name="lastUpdated" value={formData.lastUpdated} onChange={handleGeneralChange} className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 transition-shadow" />
                    <button type="button" onClick={setCurrentDate} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">Hari Ini</button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                   <button type="button" onClick={handleBackupData} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"><Download size={16}/> Backup Data (JSON)</button>
                   <div className="relative">
                      <input type="file" accept=".json" onChange={handleRestoreData} className="hidden" id="restore-json" ref={fileInputRef} />
                      <label htmlFor="restore-json" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm cursor-pointer">
                        <Upload size={16}/> Restore Data
                      </label>
                   </div>
                </div>
                <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all shadow-md font-medium">
                  {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                  {isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECURITY SETTINGS */}
        {activeTab === 'SECURITY' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <Lock className="text-indigo-600" /> Pengaturan Keamanan Akun
            </h2>
            
            <form onSubmit={handleAuthSubmit} className="space-y-8">
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2"><Shield size={18}/> Password Admin</h3>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-red-700 mb-1">Password Baru</label>
                  <input type="text" name="adminPassword" value={authData.adminPassword} onChange={handleAuthChange} className="w-full border border-red-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 bg-white" placeholder="Biarkan kosong jika tidak ingin mengubah" />
                  <p className="text-xs text-red-500 mt-2">* Password default: <strong>007007Rh</strong></p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={18} className="text-indigo-600"/> Password Guru</h3>
                <div className="overflow-x-auto border rounded-xl shadow-sm max-h-[400px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Guru</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Password Akses</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teacherData.map(teacher => (
                        <tr key={teacher.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.name}</td>
                          <td className="px-6 py-4">
                            <input 
                              type="text" 
                              value={authData.teacherPasswords?.[teacher.name] || ''} 
                              onChange={(e) => handleTeacherPassChange(teacher.name, e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-full max-w-xs focus:ring-2 focus:ring-indigo-500"
                              placeholder="Default: guru123"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md font-medium">
                  {isAuthSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                  {isAuthSaved ? 'Tersimpan!' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STUDENT DATA SETTINGS */}
        {activeTab === 'STUDENT' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
                 <Users className="text-indigo-600" /> Data Siswa
              </h2>

              <div className="flex gap-4 mb-6 border-b border-gray-100 pb-1">
                 <button onClick={() => setStudentTabMode('MANUAL')} className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${studentTabMode === 'MANUAL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600'}`}>Input Manual</button>
                 <button onClick={() => setStudentTabMode('UPLOAD')} className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${studentTabMode === 'UPLOAD' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600'}`}>Upload Excel</button>
              </div>

              {studentTabMode === 'MANUAL' && (
                 <form onSubmit={handleStudentSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
                    <div className="flex gap-4 items-end">
                       <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-600 mb-1">Nama Siswa</label>
                          <input type="text" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" required placeholder="Nama Lengkap"/>
                       </div>
                       <div className="w-32">
                          <label className="block text-xs font-bold text-gray-600 mb-1">Kelas</label>
                          <select value={studentForm.className} onChange={(e) => setStudentForm({...studentForm, className: e.target.value})} className="w-full border rounded px-3 py-2 text-sm bg-white">
                             {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-sm">
                          {editingStudentId ? 'Update' : 'Tambah'}
                       </button>
                       {editingStudentId && <button type="button" onClick={() => {setEditingStudentId(null); setStudentForm({name: '', className: CLASSES[0]});}} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm">Batal</button>}
                    </div>
                    {isStudentSaved && <p className="text-green-600 text-xs mt-2 font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Data tersimpan!</p>}
                 </form>
              )}

              {studentTabMode === 'UPLOAD' && (
                 <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 text-center">
                    <Database size={40} className="mx-auto text-blue-400 mb-3"/>
                    <h3 className="text-blue-900 font-bold mb-2">Upload Data Siswa Massal</h3>
                    <p className="text-blue-700 text-xs mb-4">Pastikan file Excel memiliki kolom header "Nama" dan "Kelas".</p>
                    <div className="flex justify-center gap-4 items-center">
                        <select value={uploadClassTarget} onChange={(e) => setUploadClassTarget(e.target.value)} className="border border-blue-300 rounded px-3 py-2 text-sm bg-white">
                           {CLASSES.map(c => <option key={c} value={c}>Default: {c}</option>)}
                        </select>
                        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                           <Upload size={16}/> Pilih File Excel
                           <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleStudentExcelUpload} />
                        </label>
                    </div>
                 </div>
              )}

              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-700">Daftar Siswa ({filteredStudents.length})</h3>
                 <select value={studentClassFilter} onChange={(e) => setStudentClassFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-white">
                    <option value="">Semua Kelas</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>

              <div className="overflow-x-auto border rounded-xl shadow-sm max-h-[500px]">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-12">No</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Siswa</th><th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Kelas</th><th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase w-24">Aksi</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {filteredStudents.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                             <td className="px-6 py-3 text-sm text-gray-500">{idx + 1}</td>
                             <td className="px-6 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                             <td className="px-6 py-3 text-center text-xs"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-bold">{s.className}</span></td>
                             <td className="px-6 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                   <button onClick={() => {setEditingStudentId(s.id); setStudentForm({name: s.name, className: s.className}); setStudentTabMode('MANUAL'); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                                   <button onClick={() => onDeleteStudent && onDeleteStudent(s.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                       {filteredStudents.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Belum ada data siswa.</td></tr>}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* LEAVE SETTINGS */}
        {activeTab === 'LEAVE' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
              <CalendarX className="text-indigo-600" /> Manajemen Ijin & Ketidakhadiran Guru
            </h2>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Plus size={18}/> {editingId ? 'Edit Data Ijin' : 'Input Ijin Baru'}</h3>
              <form onSubmit={handleLeaveSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-blue-800 mb-1">Nama Guru</label>
                  <select 
                    value={leaveForm.teacherId} 
                    onChange={(e) => setLeaveForm({...leaveForm, teacherId: e.target.value})} 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">-- Pilih Guru --</option>
                    {teacherData.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-40">
                  <label className="block text-xs font-bold text-blue-800 mb-1">Tanggal</label>
                  <input 
                    type="date" 
                    value={leaveForm.date} 
                    onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})} 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-blue-800 mb-1">Jenis</label>
                  <select 
                    value={leaveForm.type} 
                    onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as LeaveType})} 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SAKIT">Sakit</option>
                    <option value="IZIN">Izin</option>
                    <option value="DINAS_LUAR">Dinas Luar</option>
                  </select>
                </div>
                <div className="flex-[2] w-full">
                  <label className="block text-xs font-bold text-blue-800 mb-1">Keterangan</label>
                  <input 
                    type="text" 
                    value={leaveForm.description} 
                    onChange={(e) => setLeaveForm({...leaveForm, description: e.target.value})} 
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Alasan..."
                  />
                </div>
                <div className="flex gap-2">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingId(null); setLeaveForm({ date: new Date().toISOString().split('T')[0], teacherId: '', type: 'SAKIT', description: '' }); }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      Batal
                    </button>
                  )}
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-colors whitespace-nowrap">
                    {editingId ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Riwayat Ketidakhadiran</h3>
              <select 
                value={filterTeacherId} 
                onChange={(e) => setFilterTeacherId(e.target.value)} 
                className="border rounded-lg px-3 py-1 text-sm bg-gray-50"
              >
                <option value="">Semua Guru</option>
                {teacherData.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto border rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Guru</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Jenis</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Keterangan</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaves && filteredLeaves.length > 0 ? (
                    filteredLeaves.map(leave => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{leave.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{leave.teacherName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            leave.type === 'SAKIT' ? 'bg-orange-100 text-orange-700' :
                            leave.type === 'IZIN' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {leave.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{leave.description || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingId(leave.id);
                                setLeaveForm({ date: leave.date, teacherId: String(leave.teacherId), type: leave.type, description: leave.description || '' });
                              }}
                              className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                            >
                              <Edit2 size={16}/>
                            </button>
                            <button 
                              onClick={() => onDeleteLeave && onDeleteLeave(leave.id)}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">Belum ada data ketidakhadiran.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MIGRATION TAB */}
        {activeTab === 'MIGRATION' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
               <ArrowRightLeft className="text-indigo-600" /> Migrasi Data ke Google Spreadsheet
             </h2>

             <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-6">
                 <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2"><Sheet size={20}/> Apa ini?</h3>
                 <p className="text-sm text-green-800 mb-4">
                    Fitur ini akan menyalin seluruh data yang tersimpan di Browser (Local Storage) Anda saat ini ke dalam Google Spreadsheet. Data akan otomatis dipisah per Sheet.
                 </p>
                 <div className="text-sm bg-white p-4 rounded-lg border border-green-100 text-gray-700 space-y-2">
                    <p className="font-bold">Prasyarat:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                       <li>Anda sudah membuat Google Sheet baru.</li>
                       <li>Anda sudah men-deploy <strong>Google Apps Script</strong> yang baru.</li>
                       <li>URL Default sudah diset di kode atau <code>.env</code>.</li>
                    </ol>
                 </div>
             </div>

             <div className="text-center py-8">
                 {isMigrating ? (
                     <div className="space-y-4">
                         <Loader2 size={48} className="text-indigo-600 animate-spin mx-auto"/>
                         <p className="font-bold text-indigo-700">Sedang Mengirim Data...</p>
                         <p className="text-xs text-gray-500">Jangan tutup halaman ini.</p>
                     </div>
                 ) : (
                     <button 
                        onClick={handleMigrate}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-indigo-700 transform transition-all active:scale-95 flex items-center gap-3 mx-auto"
                     >
                        <UploadCloud size={24}/> Mulai Migrasi (Data Lokal ke Sheet)
                     </button>
                 )}
             </div>

             {/* Log Console */}
             <div className="mt-8 bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 h-64 overflow-y-auto shadow-inner border border-gray-700">
                 <p className="text-gray-500 mb-2 border-b border-gray-700 pb-2">Console Log Migrasi...</p>
                 {migrationLog.length === 0 ? (
                     <p className="text-gray-600 italic">Menunggu proses dimulai...</p>
                 ) : (
                     migrationLog.map((log, idx) => (
                         <div key={idx} className="mb-1">{log}</div>
                     ))
                 )}
             </div>
          </div>
        )}

        {/* SUBJECT HOLIDAY / MAPEL LIBUR */}
        {activeTab === 'SUBJECT_HOLIDAY' && (
           <HolidayManager 
              teacherData={teacherData}
              constraints={unavailableConstraints}
              onToggle={onToggleConstraint || (() => {})}
              calendarEvents={calendarEvents}
              onUpdateCalendar={onUpdateCalendar || (() => {})}
              onSave={() => alert("Pengaturan libur disimpan otomatis ke sesi lokal.")}
           />
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
