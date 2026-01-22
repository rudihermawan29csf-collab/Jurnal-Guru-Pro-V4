
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TeacherTable from './components/TeacherTable';
import ScheduleTable from './components/ScheduleTable';
import GeminiAssistant from './components/GeminiAssistant';
import ClassTeacherSchedule from './components/ClassTeacherSchedule';
import LoginPage from './components/LoginPage';
import SettingsPanel from './components/SettingsPanel';
import { ViewMode, TeacherData, UserRole, AppSettings, AuthSettings, CalendarEvent, TeacherLeave, TeachingMaterial, TeachingJournal, Student, GradeRecord, HomeroomRecord, AttitudeRecord, TeacherAgenda } from './types';
import { TEACHER_DATA as INITIAL_DATA, INITIAL_STUDENTS, DEFAULT_SCHEDULE_MAP } from './constants';
import { Table as TableIcon, Search, Calendar, Ban, CalendarClock, Settings, Menu, LogOut, ChevronDown, BookOpen, Users, GraduationCap, ClipboardList, User, Cloud, CloudOff, RefreshCw, AlertCircle, Heart, FileText, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { firebaseApi } from './services/firebaseService';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<string>(''); 

  // --- SYNC STATE ---
  const [isCloudConfigured, setIsCloudConfigured] = useState(firebaseApi.isConfigured());
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // New state to prevent overwrite on load

  // --- DATA STATES ---
  const [appSettings, setAppSettings] = useState<AppSettings>({
    academicYear: '2025/2026',
    semester: 'Genap',
    lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    logoUrl: 'https://iili.io/fGvdYoQ.png',
    headmaster: 'Didik Sulistyo, M.M.Pd',
    headmasterNip: '196605181989011002'
  });
  const [authSettings, setAuthSettings] = useState<AuthSettings>({ adminPassword: '', teacherPasswords: {}, classPasswords: {} });
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TABLE);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState<TeacherData[]>(INITIAL_DATA);
  const [scheduleMap, setScheduleMap] = useState<Record<string, string>>(DEFAULT_SCHEDULE_MAP);
  const [unavailableConstraints, setUnavailableConstraints] = useState<Record<string, string[]>>({});
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<TeacherLeave[]>([]);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachingMaterials, setTeachingMaterials] = useState<TeachingMaterial[]>([]);
  const [teachingJournals, setTeachingJournals] = useState<TeachingJournal[]>([]);
  const [studentGrades, setStudentGrades] = useState<GradeRecord[]>([]);
  const [homeroomRecords, setHomeroomRecords] = useState<HomeroomRecord[]>([]);
  const [attitudeRecords, setAttitudeRecords] = useState<AttitudeRecord[]>([]);
  const [teacherAgendas, setTeacherAgendas] = useState<TeacherAgenda[]>([]);

  // UI STATES
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // --- REAL-TIME SYNC LISTENER ---
  useEffect(() => {
    if (firebaseApi.isConfigured()) {
      const unsubscribe = firebaseApi.subscribe((cloudData) => {
        // Mark data as loaded immediately to allow saving (if needed)
        // But more importantly, to know we have connected.
        setIsDataLoaded(true);

        if (!cloudData) return;
        
        console.log("🔥 Data Cloud Updated!");
        if (cloudData.appSettings) setAppSettings(cloudData.appSettings);
        if (cloudData.authSettings) setAuthSettings(cloudData.authSettings);
        if (cloudData.teacherData) setTeachers(cloudData.teacherData);
        if (cloudData.scheduleMap) setScheduleMap(cloudData.scheduleMap);
        if (cloudData.unavailableConstraints) setUnavailableConstraints(cloudData.unavailableConstraints);
        if (cloudData.calendarEvents) setCalendarEvents(cloudData.calendarEvents);
        if (cloudData.teacherLeaves) setTeacherLeaves(cloudData.teacherLeaves);
        if (cloudData.students) setStudents(cloudData.students);
        if (cloudData.teachingMaterials) setTeachingMaterials(cloudData.teachingMaterials);
        if (cloudData.teachingJournals) setTeachingJournals(cloudData.teachingJournals);
        if (cloudData.studentGrades) setStudentGrades(cloudData.studentGrades);
        if (cloudData.homeroomRecords) setHomeroomRecords(cloudData.homeroomRecords);
        if (cloudData.attitudeRecords) setAttitudeRecords(cloudData.attitudeRecords);
        if (cloudData.teacherAgendas) setTeacherAgendas(cloudData.teacherAgendas);
      });
      return () => unsubscribe();
    }
  }, []);

  // --- PERSISTENCE HANDLERS (Save only from Admin or Current User Change) ---
  const saveToCloud = useCallback(async (key: string, value: any) => {
    if (isInitialMount.current) return;
    if (!isCloudConfigured) return;
    // CRITICAL: Prevent saving if we haven't loaded data from cloud yet.
    // This stops empty local state from overwriting cloud data on startup.
    if (!isDataLoaded) {
        console.warn("Skipping save: Cloud data not yet loaded.");
        return;
    }
    
    setIsSaving(true);
    try {
      await firebaseApi.save(key, value);
      setTimeout(() => setIsSaving(false), 500);
    } catch (err) {
      console.error("Sync error:", err);
      setSyncError("Penyimpanan Gagal");
      setIsSaving(false);
    }
  }, [isCloudConfigured, isDataLoaded]);

  useEffect(() => { 
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    // Debounce Save to Cloud
    const timer = setTimeout(() => {
        if (userRole === 'ADMIN' || userRole === 'TEACHER') { // Hanya login user yang boleh tulis
            saveToCloud('appSettings', appSettings);
            saveToCloud('authSettings', authSettings);
            saveToCloud('teacherData', teachers);
            saveToCloud('scheduleMap', scheduleMap);
            saveToCloud('unavailableConstraints', unavailableConstraints);
            saveToCloud('calendarEvents', calendarEvents);
            saveToCloud('teacherLeaves', teacherLeaves);
            saveToCloud('students', students);
            saveToCloud('teachingMaterials', teachingMaterials);
            saveToCloud('teachingJournals', teachingJournals);
            saveToCloud('studentGrades', studentGrades);
            saveToCloud('homeroomRecords', homeroomRecords);
            saveToCloud('attitudeRecords', attitudeRecords);
            saveToCloud('teacherAgendas', teacherAgendas);
        }
    }, 1000);
    return () => clearTimeout(timer);
  }, [appSettings, authSettings, teachers, scheduleMap, unavailableConstraints, calendarEvents, teacherLeaves, students, teachingMaterials, teachingJournals, studentGrades, homeroomRecords, attitudeRecords, teacherAgendas, userRole, saveToCloud]);

  // --- HANDLERS ---
  const handleLogin = (role: UserRole, username?: string) => {
    setUserRole(role);
    if (username) setCurrentUser(username);
    setViewMode(role === 'ADMIN' ? ViewMode.TABLE : ViewMode.CLASS_SCHEDULE);
  };

  const handleLogout = () => { setUserRole(null); setCurrentUser(''); setIsMenuOpen(false); };

  if (!userRole) return <LoginPage onLogin={handleLogin} authSettings={authSettings} teacherData={teachers} />;

  const navOptions = [
    ...(userRole === 'ADMIN' ? [
        { mode: ViewMode.TABLE, label: 'Data Tugas Guru', icon: <TableIcon size={18} /> },
        { mode: ViewMode.SCHEDULE, label: 'Edit Jadwal', icon: <Calendar size={18} /> },
        { mode: ViewMode.CLASS_SCHEDULE, label: 'Lihat Jadwal Kelas', icon: <CalendarClock size={18} /> },
        { mode: ViewMode.TEACHER_SCHEDULE, label: 'Lihat Jadwal Guru', icon: <User size={18} /> },
        { mode: ViewMode.JOURNAL, label: 'Jurnal (Admin)', icon: <BookOpen size={18} /> },
        { mode: ViewMode.SETTINGS, label: 'Pengaturan', icon: <Settings size={18} /> },
    ] : []),
    ...(userRole === 'TEACHER' ? [
        { mode: ViewMode.CLASS_SCHEDULE, label: 'Jadwal Kelas', icon: <Calendar size={18} /> },
        { mode: ViewMode.TEACHER_SCHEDULE, label: 'Jadwal Guru', icon: <User size={18} /> },
        { mode: ViewMode.JOURNAL, label: 'Jurnal Mengajar', icon: <BookOpen size={18} /> },
        { mode: ViewMode.AGENDA, label: 'Agenda Kegiatan', icon: <FileText size={18} /> },
        { mode: ViewMode.ATTITUDE, label: 'Penilaian Sikap', icon: <Heart size={18} /> },
        { mode: ViewMode.MONITORING, label: 'Absensi', icon: <Users size={18} /> },
        { mode: ViewMode.GRADES, label: 'Nilai Siswa', icon: <GraduationCap size={18} /> },
        { mode: ViewMode.HOMEROOM, label: 'Catatan Wali Kelas', icon: <ClipboardList size={18} /> },
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4">
              <img src={appSettings.logoUrl} alt="Logo" className="h-20 w-auto object-contain min-w-[60px]" />
              <div>
                <h1 className="text-lg font-extrabold text-gray-900 leading-none">Sistem Pembagian Tugas</h1>
                <h2 className="text-base font-bold text-indigo-700 leading-tight mt-1">SMPN 3 Pacet</h2>
                <div className="flex flex-col mt-1">
                   <p className="text-[10px] text-gray-500 font-bold uppercase">TA {appSettings.academicYear} • {appSettings.semester}</p>
                   {isCloudConfigured ? (
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${syncError ? 'text-red-500' : 'text-orange-500'}`}>
                           <Zap size={10} fill="currentColor" />
                           <span>Firebase Real-time: ON</span>
                        </div>
                        {isSaving && (
                           <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-500 animate-pulse">
                              <Loader2 size={10} className="animate-spin" />
                              <span>Sync...</span>
                           </div>
                        )}
                      </div>
                   ) : (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-bold"><CloudOff size={10} /><span>Cloud Not Configured</span></div>
                   )}
                </div>
              </div>
            </div>
            
            <div className="relative" ref={menuRef}>
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all shadow-sm group">
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-bold text-gray-800">Navigasi</p>
                    <p className="text-[10px] text-gray-500 capitalize">{userRole === 'ADMIN' ? 'Admin' : currentUser}</p>
                  </div>
                  <div className="bg-indigo-600 text-white p-2 rounded-lg"><Menu size={20} /></div>
               </button>

               {isMenuOpen && (
                 <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-2 space-y-1">
                       {navOptions.map((opt, idx) => (
                         <button key={idx} onClick={() => { setViewMode(opt.mode); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-bold rounded-lg transition-colors ${viewMode === opt.mode ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                           {opt.icon} {opt.label}
                         </button>
                       ))}
                    </div>
                    <div className="p-2 border-t border-gray-100 bg-red-50">
                       <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 rounded-lg"><LogOut size={18} /> Keluar</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {viewMode === ViewMode.TABLE && userRole === 'ADMIN' && <TeacherTable data={teachers} searchTerm={searchTerm} onAdd={t => setTeachers([...teachers, t])} onEdit={t => setTeachers(teachers.map(x => x.id === t.id ? t : x))} onDelete={id => setTeachers(teachers.filter(x => x.id !== id))} appSettings={appSettings} />}
          {viewMode === ViewMode.SCHEDULE && userRole === 'ADMIN' && <ScheduleTable teacherData={teachers} unavailableConstraints={unavailableConstraints} scheduleMap={scheduleMap} setScheduleMap={setScheduleMap} onSave={() => {}} />}
          {(viewMode === ViewMode.CLASS_SCHEDULE || viewMode === ViewMode.TEACHER_SCHEDULE || viewMode === ViewMode.JOURNAL || viewMode === ViewMode.MONITORING || viewMode === ViewMode.GRADES || viewMode === ViewMode.HOMEROOM || viewMode === ViewMode.ATTITUDE || viewMode === ViewMode.AGENDA) && (
             <ClassTeacherSchedule 
                teacherData={teachers} 
                scheduleMap={scheduleMap} 
                currentUser={currentUser} 
                role={userRole} 
                appSettings={appSettings} 
                students={students} 
                teachingMaterials={teachingMaterials} 
                onAddMaterial={m => setTeachingMaterials([...teachingMaterials, m])} 
                onEditMaterial={m => setTeachingMaterials(teachingMaterials.map(x => x.id === m.id ? m : x))} 
                onDeleteMaterial={id => setTeachingMaterials(teachingMaterials.filter(x => x.id !== id))} 
                teachingJournals={teachingJournals} 
                onAddJournal={j => setTeachingJournals([...teachingJournals, j])} 
                onEditJournal={j => setTeachingJournals(teachingJournals.map(x => x.id === j.id ? j : x))} 
                onDeleteJournal={id => setTeachingJournals(teachingJournals.filter(x => x.id !== id))} 
                studentGrades={studentGrades} 
                onUpdateGrade={g => setStudentGrades(prev => prev.find(x => x.id === g.id) ? prev.map(x => x.id === g.id ? g : x) : [...prev, g])} 
                homeroomRecords={homeroomRecords} 
                onAddHomeroomRecord={r => setHomeroomRecords([...homeroomRecords, r])} 
                onEditHomeroomRecord={r => setHomeroomRecords(homeroomRecords.map(x => x.id === r.id ? r : x))} 
                onDeleteHomeroomRecord={id => setHomeroomRecords(homeroomRecords.filter(x => x.id !== id))} 
                attitudeRecords={attitudeRecords}
                onAddAttitudeRecord={r => setAttitudeRecords([...attitudeRecords, r])}
                onEditAttitudeRecord={r => setAttitudeRecords(attitudeRecords.map(x => x.id === r.id ? r : x))}
                onDeleteAttitudeRecord={id => setAttitudeRecords(attitudeRecords.filter(x => x.id !== id))}
                teacherAgendas={teacherAgendas}
                onAddAgenda={a => setTeacherAgendas([...teacherAgendas, a])}
                onEditAgenda={a => setTeacherAgendas(teacherAgendas.map(x => x.id === a.id ? a : x))}
                onDeleteAgenda={id => setTeacherAgendas(teacherAgendas.filter(x => x.id !== id))}
                initialTab={viewMode === ViewMode.JOURNAL ? 'JOURNAL' : viewMode === ViewMode.MONITORING ? 'MONITORING' : viewMode === ViewMode.GRADES ? 'GRADES' : viewMode === ViewMode.HOMEROOM ? 'HOMEROOM' : viewMode === ViewMode.ATTITUDE ? 'ATTITUDE' : viewMode === ViewMode.TEACHER_SCHEDULE ? 'TEACHER' : viewMode === ViewMode.AGENDA ? 'AGENDA' : 'CLASS'} 
             />
          )}
          {viewMode === ViewMode.SETTINGS && userRole === 'ADMIN' && <SettingsPanel settings={appSettings} onSave={setAppSettings} authSettings={authSettings} onSaveAuth={setAuthSettings} teacherData={teachers} teacherLeaves={teacherLeaves} onToggleLeave={l => setTeacherLeaves([...teacherLeaves, {...l, id: Date.now().toString()}])} onEditLeave={l => setTeacherLeaves(teacherLeaves.map(x => x.id === l.id ? l : x))} onDeleteLeave={id => setTeacherLeaves(teacherLeaves.filter(x => x.id !== id))} calendarEvents={calendarEvents} onUpdateCalendar={setCalendarEvents} unavailableConstraints={unavailableConstraints} onToggleConstraint={(c, d) => setUnavailableConstraints(prev => ({ ...prev, [c]: (prev[c] || []).includes(d) ? prev[c].filter(x => x !== d) : [...(prev[c] || []), d] }))} students={students} onAddStudent={s => setStudents([...students, s])} onEditStudent={s => setStudents(students.map(x => x.id === s.id ? s : x))} onDeleteStudent={id => setStudents(students.filter(x => x.id !== id))} onBulkAddStudents={s => setStudents([...students, ...s])} />}
        </div>
      </main>

      {userRole === 'ADMIN' && <GeminiAssistant teacherData={teachers} />}
    </div>
  );
};

export default App;
