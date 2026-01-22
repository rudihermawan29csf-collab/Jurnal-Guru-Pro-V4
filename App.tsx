
import React, { useState, useRef, useEffect } from 'react';
import TeacherTable from './components/TeacherTable';
import ScheduleTable from './components/ScheduleTable';
import GeminiAssistant from './components/GeminiAssistant';
import ClassTeacherSchedule from './components/ClassTeacherSchedule';
import LoginPage from './components/LoginPage';
import SettingsPanel from './components/SettingsPanel';
import { ViewMode, TeacherData, UserRole, AppSettings, AuthSettings, CalendarEvent, TeacherLeave, TeachingMaterial, TeachingJournal, Student, GradeRecord, HomeroomRecord, AttitudeRecord, TeacherAgenda } from './types';
import { TEACHER_DATA as INITIAL_DATA, INITIAL_STUDENTS, DEFAULT_SCHEDULE_MAP, INITIAL_APP_SETTINGS, INITIAL_JOURNALS, INITIAL_AGENDAS, INITIAL_ATTITUDE, INITIAL_HOMEROOM, INITIAL_GRADES, INITIAL_MATERIALS, INITIAL_LEAVES } from './constants';
import { Table as TableIcon, Search, Calendar, Ban, CalendarClock, Settings, Menu, LogOut, ChevronDown, BookOpen, Users, GraduationCap, ClipboardList, User, Cloud, CloudOff, RefreshCw, AlertCircle, Heart, FileText, CheckCircle2, Loader2, Zap, Wifi, WifiOff } from 'lucide-react';
import { sheetApi } from './services/sheetApi';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<string>(''); 

  // --- DATA STATES ---
  const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
  const [authSettings, setAuthSettings] = useState<AuthSettings>({ adminPassword: '', teacherPasswords: {}, classPasswords: {} });
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TABLE);
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState<TeacherData[]>(INITIAL_DATA);
  const [scheduleMap, setScheduleMap] = useState<Record<string, string>>(DEFAULT_SCHEDULE_MAP);
  const [unavailableConstraints, setUnavailableConstraints] = useState<Record<string, string[]>>({});
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<TeacherLeave[]>(INITIAL_LEAVES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachingMaterials, setTeachingMaterials] = useState<TeachingMaterial[]>(INITIAL_MATERIALS);
  const [teachingJournals, setTeachingJournals] = useState<TeachingJournal[]>(INITIAL_JOURNALS);
  const [studentGrades, setStudentGrades] = useState<GradeRecord[]>(INITIAL_GRADES);
  const [homeroomRecords, setHomeroomRecords] = useState<HomeroomRecord[]>(INITIAL_HOMEROOM);
  const [attitudeRecords, setAttitudeRecords] = useState<AttitudeRecord[]>(INITIAL_ATTITUDE);
  const [teacherAgendas, setTeacherAgendas] = useState<TeacherAgenda[]>(INITIAL_AGENDAS);

  // CLOUD STATE
  const [cloudStatus, setCloudStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'SYNCING' | 'ERROR'>(
    sheetApi.isConfigured() ? 'CONNECTED' : 'DISCONNECTED'
  );
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // UI STATES
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadFromCloud = async () => {
      if (sheetApi.isConfigured()) {
        setIsLoadingCloud(true);
        setCloudStatus('SYNCING');
        try {
          const data = await sheetApi.fetchAll();
          if (data) {
            handleRestore(data);
            setCloudStatus('CONNECTED');
          } else {
            setCloudStatus('ERROR');
          }
        } catch (error) {
          console.error("Cloud Load Error:", error);
          setCloudStatus('ERROR');
        } finally {
          setIsLoadingCloud(false);
        }
      } else {
        setCloudStatus('DISCONNECTED');
      }
    };

    loadFromCloud();
  }, []);

  // --- SYNC HELPER ---
  const updateAndSync = (key: string, setter: React.Dispatch<React.SetStateAction<any>>, update: any) => {
    setter((prev: any) => {
      const nextValue = typeof update === 'function' ? update(prev) : update;
      
      // Fire and forget sync
      if (sheetApi.isConfigured()) {
        setCloudStatus('SYNCING');
        sheetApi.save(key, nextValue)
          .then(() => setCloudStatus('CONNECTED'))
          .catch(() => setCloudStatus('ERROR'));
      }
      
      return nextValue;
    });
  };

  // RESTORE HANDLER
  const handleRestore = (data: any) => {
      if (data.appSettings) setAppSettings(data.appSettings);
      if (data.authSettings) setAuthSettings(data.authSettings);
      if (data.teacherData) setTeachers(data.teacherData);
      if (data.scheduleMap) setScheduleMap(data.scheduleMap);
      if (data.unavailableConstraints) setUnavailableConstraints(data.unavailableConstraints);
      if (data.calendarEvents) setCalendarEvents(data.calendarEvents);
      if (data.teacherLeaves) setTeacherLeaves(data.teacherLeaves);
      if (data.students) setStudents(data.students);
      if (data.teachingMaterials) setTeachingMaterials(data.teachingMaterials);
      if (data.teachingJournals) setTeachingJournals(data.teachingJournals);
      if (data.studentGrades) setStudentGrades(data.studentGrades);
      if (data.homeroomRecords) setHomeroomRecords(data.homeroomRecords);
      if (data.attitudeRecords) setAttitudeRecords(data.attitudeRecords);
      if (data.teacherAgendas) setTeacherAgendas(data.teacherAgendas);
  };

  // --- WRAPPED SETTERS ---
  const setAppSettingsSync = (v: any) => updateAndSync('appSettings', setAppSettings, v);
  const setAuthSettingsSync = (v: any) => updateAndSync('authSettings', setAuthSettings, v);
  const setTeachersSync = (v: any) => updateAndSync('teacherData', setTeachers, v);
  const setScheduleMapSync = (v: any) => updateAndSync('scheduleMap', setScheduleMap, v);
  const setUnavailableConstraintsSync = (v: any) => updateAndSync('unavailableConstraints', setUnavailableConstraints, v);
  const setCalendarEventsSync = (v: any) => updateAndSync('calendarEvents', setCalendarEvents, v);
  const setTeacherLeavesSync = (v: any) => updateAndSync('teacherLeaves', setTeacherLeaves, v);
  const setStudentsSync = (v: any) => updateAndSync('students', setStudents, v);
  const setTeachingMaterialsSync = (v: any) => updateAndSync('teachingMaterials', setTeachingMaterials, v);
  const setTeachingJournalsSync = (v: any) => updateAndSync('teachingJournals', setTeachingJournals, v);
  const setStudentGradesSync = (v: any) => updateAndSync('studentGrades', setStudentGrades, v);
  const setHomeroomRecordsSync = (v: any) => updateAndSync('homeroomRecords', setHomeroomRecords, v);
  const setAttitudeRecordsSync = (v: any) => updateAndSync('attitudeRecords', setAttitudeRecords, v);
  const setTeacherAgendasSync = (v: any) => updateAndSync('teacherAgendas', setTeacherAgendas, v);


  // --- HANDLERS ---
  const handleLogin = (role: UserRole, username?: string) => {
    setUserRole(role);
    if (username) setCurrentUser(username);
    setViewMode(role === 'ADMIN' ? ViewMode.TABLE : ViewMode.CLASS_SCHEDULE);
  };

  const handleLogout = () => { setUserRole(null); setCurrentUser(''); setIsMenuOpen(false); };

  if (isLoadingCloud) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600">
        <Loader2 size={48} className="animate-spin mb-4"/>
        <h2 className="text-xl font-bold">Menghubungkan ke Cloud...</h2>
        <p className="text-sm text-gray-500 mt-2">Mengambil data terbaru dari server</p>
      </div>
    );
  }

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
                   <div className="flex items-center gap-2 mt-1">
                      {cloudStatus === 'CONNECTED' && <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full"><Wifi size={10} /> Online</span>}
                      {cloudStatus === 'SYNCING' && <span className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full"><RefreshCw size={10} className="animate-spin" /> Menyimpan...</span>}
                      {cloudStatus === 'DISCONNECTED' && <span className="flex items-center gap-1 text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-full"><WifiOff size={10} /> Offline (Lokal)</span>}
                      {cloudStatus === 'ERROR' && <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full"><AlertCircle size={10} /> Gagal Sync</span>}
                   </div>
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
          {viewMode === ViewMode.TABLE && userRole === 'ADMIN' && <TeacherTable data={teachers} searchTerm={searchTerm} onAdd={t => setTeachersSync([...teachers, t])} onBulkAdd={newTeachers => setTeachersSync([...teachers, ...newTeachers])} onEdit={t => setTeachersSync(teachers.map(x => x.id === t.id ? t : x))} onDelete={id => setTeachersSync(teachers.filter(x => x.id !== id))} appSettings={appSettings} />}
          {viewMode === ViewMode.SCHEDULE && userRole === 'ADMIN' && <ScheduleTable teacherData={teachers} unavailableConstraints={unavailableConstraints} scheduleMap={scheduleMap} setScheduleMap={setScheduleMapSync} onSave={() => {}} />}
          {(viewMode === ViewMode.CLASS_SCHEDULE || viewMode === ViewMode.TEACHER_SCHEDULE || viewMode === ViewMode.JOURNAL || viewMode === ViewMode.MONITORING || viewMode === ViewMode.GRADES || viewMode === ViewMode.HOMEROOM || viewMode === ViewMode.ATTITUDE || viewMode === ViewMode.AGENDA) && (
             <ClassTeacherSchedule 
                teacherData={teachers} 
                scheduleMap={scheduleMap} 
                currentUser={currentUser} 
                role={userRole} 
                appSettings={appSettings} 
                students={students} 
                teachingMaterials={teachingMaterials} 
                onAddMaterial={m => setTeachingMaterialsSync([...teachingMaterials, m])} 
                onEditMaterial={m => setTeachingMaterialsSync(teachingMaterials.map(x => x.id === m.id ? m : x))} 
                onDeleteMaterial={id => setTeachingMaterialsSync(teachingMaterials.filter(x => x.id !== id))} 
                teachingJournals={teachingJournals} 
                onAddJournal={j => setTeachingJournalsSync([...teachingJournals, j])} 
                onEditJournal={j => setTeachingJournalsSync(teachingJournals.map(x => x.id === j.id ? j : x))} 
                onDeleteJournal={id => setTeachingJournalsSync(teachingJournals.filter(x => x.id !== id))} 
                studentGrades={studentGrades} 
                onUpdateGrade={g => setStudentGradesSync((prev: GradeRecord[]) => prev.find(x => x.id === g.id) ? prev.map(x => x.id === g.id ? g : x) : [...prev, g])} 
                homeroomRecords={homeroomRecords} 
                onAddHomeroomRecord={r => setHomeroomRecordsSync([...homeroomRecords, r])} 
                onEditHomeroomRecord={r => setHomeroomRecordsSync(homeroomRecords.map(x => x.id === r.id ? r : x))} 
                onDeleteHomeroomRecord={id => setHomeroomRecordsSync(homeroomRecords.filter(x => x.id !== id))} 
                attitudeRecords={attitudeRecords}
                onAddAttitudeRecord={r => setAttitudeRecordsSync([...attitudeRecords, r])}
                onEditAttitudeRecord={r => setAttitudeRecordsSync(attitudeRecords.map(x => x.id === r.id ? r : x))}
                onDeleteAttitudeRecord={id => setAttitudeRecordsSync(attitudeRecords.filter(x => x.id !== id))}
                teacherAgendas={teacherAgendas}
                onAddAgenda={a => setTeacherAgendasSync([...teacherAgendas, a])}
                onEditAgenda={a => setTeacherAgendasSync(teacherAgendas.map(x => x.id === a.id ? a : x))}
                onDeleteAgenda={id => setTeacherAgendasSync(teacherAgendas.filter(x => x.id !== id))}
                initialTab={viewMode === ViewMode.JOURNAL ? 'JOURNAL' : viewMode === ViewMode.MONITORING ? 'MONITORING' : viewMode === ViewMode.GRADES ? 'GRADES' : viewMode === ViewMode.HOMEROOM ? 'HOMEROOM' : viewMode === ViewMode.ATTITUDE ? 'ATTITUDE' : viewMode === ViewMode.TEACHER_SCHEDULE ? 'TEACHER' : viewMode === ViewMode.AGENDA ? 'AGENDA' : 'CLASS'} 
             />
          )}
          {viewMode === ViewMode.SETTINGS && userRole === 'ADMIN' && (
            <SettingsPanel 
                settings={appSettings} 
                onSave={setAppSettingsSync} 
                authSettings={authSettings} 
                onSaveAuth={setAuthSettingsSync} 
                teacherData={teachers} 
                teacherLeaves={teacherLeaves} 
                onToggleLeave={l => setTeacherLeavesSync([...teacherLeaves, {...l, id: Date.now().toString()}])} 
                onEditLeave={l => setTeacherLeavesSync(teacherLeaves.map(x => x.id === l.id ? l : x))} 
                onDeleteLeave={id => setTeacherLeavesSync(teacherLeaves.filter(x => x.id !== id))} 
                calendarEvents={calendarEvents} 
                onUpdateCalendar={setCalendarEventsSync} 
                unavailableConstraints={unavailableConstraints} 
                onToggleConstraint={(c, d) => setUnavailableConstraintsSync((prev: any) => ({ ...prev, [c]: (prev[c] || []).includes(d) ? prev[c].filter((x: any) => x !== d) : [...(prev[c] || []), d] }))} 
                students={students} 
                onAddStudent={s => setStudentsSync([...students, s])} 
                onEditStudent={s => setStudentsSync(students.map(x => x.id === s.id ? s : x))} 
                onDeleteStudent={id => setStudentsSync(students.filter(x => x.id !== id))} 
                onBulkAddStudents={s => setStudentsSync([...students, ...s])} 
                onRestore={handleRestore}
                // Passing Full Data for Export
                teachingMaterials={teachingMaterials}
                teachingJournals={teachingJournals}
                studentGrades={studentGrades}
                homeroomRecords={homeroomRecords}
                attitudeRecords={attitudeRecords}
                teacherAgendas={teacherAgendas}
            />
          )}
        </div>
      </main>

      {userRole === 'ADMIN' && <GeminiAssistant teacherData={teachers} />}
    </div>
  );
};

export default App;
