
import React, { useState, useRef, useCallback } from 'react';
import TeacherTable from './components/TeacherTable';
import ScheduleTable from './components/ScheduleTable';
import GeminiAssistant from './components/GeminiAssistant';
import ClassTeacherSchedule from './components/ClassTeacherSchedule';
import LoginPage from './components/LoginPage';
import SettingsPanel from './components/SettingsPanel';
import { ViewMode, TeacherData, UserRole, AppSettings, AuthSettings, CalendarEvent, TeacherLeave, TeachingMaterial, TeachingJournal, Student, GradeRecord, HomeroomRecord, AttitudeRecord, TeacherAgenda } from './types';
import { TEACHER_DATA as INITIAL_DATA, INITIAL_STUDENTS, DEFAULT_SCHEDULE_MAP, INITIAL_APP_SETTINGS, INITIAL_JOURNALS, INITIAL_AGENDAS, INITIAL_ATTITUDE, INITIAL_HOMEROOM, INITIAL_GRADES, INITIAL_MATERIALS, INITIAL_LEAVES } from './constants';
import { Table as TableIcon, Search, Calendar, Ban, CalendarClock, Settings, Menu, LogOut, ChevronDown, BookOpen, Users, GraduationCap, ClipboardList, User, Cloud, CloudOff, RefreshCw, AlertCircle, Heart, FileText, CheckCircle2, Loader2, Zap } from 'lucide-react';

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

  // UI STATES
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
                   <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 font-bold"><Zap size={10} fill="currentColor" /><span>App Ready (Local Mode)</span></div>
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
          {viewMode === ViewMode.TABLE && userRole === 'ADMIN' && <TeacherTable data={teachers} searchTerm={searchTerm} onAdd={t => setTeachers([...teachers, t])} onBulkAdd={newTeachers => setTeachers([...teachers, ...newTeachers])} onEdit={t => setTeachers(teachers.map(x => x.id === t.id ? t : x))} onDelete={id => setTeachers(teachers.filter(x => x.id !== id))} appSettings={appSettings} />}
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
          {viewMode === ViewMode.SETTINGS && userRole === 'ADMIN' && (
            <SettingsPanel 
                settings={appSettings} 
                onSave={setAppSettings} 
                authSettings={authSettings} 
                onSaveAuth={setAuthSettings} 
                teacherData={teachers} 
                teacherLeaves={teacherLeaves} 
                onToggleLeave={l => setTeacherLeaves([...teacherLeaves, {...l, id: Date.now().toString()}])} 
                onEditLeave={l => setTeacherLeaves(teacherLeaves.map(x => x.id === l.id ? l : x))} 
                onDeleteLeave={id => setTeacherLeaves(teacherLeaves.filter(x => x.id !== id))} 
                calendarEvents={calendarEvents} 
                onUpdateCalendar={setCalendarEvents} 
                unavailableConstraints={unavailableConstraints} 
                onToggleConstraint={(c, d) => setUnavailableConstraints(prev => ({ ...prev, [c]: (prev[c] || []).includes(d) ? prev[c].filter(x => x !== d) : [...(prev[c] || []), d] }))} 
                students={students} 
                onAddStudent={s => setStudents([...students, s])} 
                onEditStudent={s => setStudents(students.map(x => x.id === s.id ? s : x))} 
                onDeleteStudent={id => setStudents(students.filter(x => x.id !== id))} 
                onBulkAddStudents={s => setStudents([...students, ...s])} 
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
