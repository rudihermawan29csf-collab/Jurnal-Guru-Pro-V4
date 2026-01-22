
import React, { useState, useRef, useEffect } from 'react';
import { TeacherData, ClassHours, AppSettings } from '../types';
import { Download, Plus, Edit2, Trash2, X, Save, FileSpreadsheet, FileText, ChevronDown, Upload, ClipboardPaste, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface TeacherTableProps {
  data: TeacherData[];
  searchTerm: string;
  onAdd: (teacher: TeacherData) => void;
  onBulkAdd?: (teachers: TeacherData[]) => void;
  onEdit: (teacher: TeacherData) => void;
  onDelete: (id: number) => void;
  appSettings: AppSettings;
}

const EmptyClassHours: ClassHours = { A: 0, B: 0, C: 0 };

const TeacherTable: React.FC<TeacherTableProps> = ({ data, searchTerm, onAdd, onBulkAdd, onEdit, onDelete, appSettings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null);
  
  // Paste/Bulk Input State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [parsedTeachers, setParsedTeachers] = useState<TeacherData[]>([]);
  
  // Download Dropdown State
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State
  const [formData, setFormData] = useState<Partial<TeacherData>>({
    no: '', name: '', nip: '', rank: '', gol: '', subject: '', code: '',
    hoursVII: { ...EmptyClassHours },
    hoursVIII: { ...EmptyClassHours },
    hoursIX: { ...EmptyClassHours },
    additionalTask: '', additionalHours: 0, totalHours: 0
  });

  const filteredData = data.filter(t => 
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.additionalTask || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PASTE PARSING LOGIC ---
  const handleProcessPaste = () => {
    if (!pasteContent.trim()) return;

    const rows = pasteContent.trim().split('\n');
    const newTeachers: TeacherData[] = [];

    rows.forEach((row, idx) => {
        // Try to split by tab first (Excel copy), then by multiple spaces
        let cols = row.split('\t');
        if (cols.length < 2) {
            cols = row.split(/ {2,}/); // Split by 2 or more spaces
        }
        
        // Skip header if it looks like one
        if (cols[0]?.toLowerCase().includes('no') && cols[1]?.toLowerCase().includes('nama')) return;

        // Basic mapping assumption: NO | NAMA | PANGKAT/GOL | MAPEL | ...
        // Adjust indices based on common formats
        const no = cols[0]?.trim() || String(data.length + idx + 1);
        const name = cols[1]?.trim() || 'Tanpa Nama';
        
        // Handle Rank/Gol (often merged or separate)
        let rank = '-';
        let gol = '-';
        const rankGolCol = cols[2]?.trim() || '';
        if (rankGolCol.includes('/')) {
            const parts = rankGolCol.split('/');
            rank = parts[0].trim();
            gol = parts.slice(1).join('/').trim();
        } else {
            rank = rankGolCol;
        }

        const subject = cols[3]?.trim() || '-';
        
        // Generate Code
        const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        const subjCode = subject.substring(0, 3).toUpperCase();
        const code = `${subjCode}-${initials}${Math.floor(Math.random() * 100)}`;

        newTeachers.push({
            id: Date.now() + idx + Math.random(),
            no,
            name,
            nip: '-', // Default
            rank,
            gol,
            subject,
            code,
            hoursVII: { A: 0, B: 0, C: 0 },
            hoursVIII: { A: 0, B: 0, C: 0 },
            hoursIX: { A: 0, B: 0, C: 0 },
            additionalTask: '-',
            additionalHours: 0,
            totalHours: 0
        });
    });

    setParsedTeachers(newTeachers);
  };

  const handleSavePaste = () => {
    if (onBulkAdd && parsedTeachers.length > 0) {
        onBulkAdd(parsedTeachers);
        setIsPasteModalOpen(false);
        setPasteContent('');
        setParsedTeachers([]);
        alert(`Berhasil menambahkan ${parsedTeachers.length} data guru.`);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape, millimeters, A4
    
    // Header
    doc.setFontSize(16);
    doc.text('Sistem Pembagian Tugas - SMPN 3 Pacet', 14, 15);
    doc.setFontSize(10);
    doc.text(`Semester ${appSettings.semester} Tahun Ajaran ${appSettings.academicYear}`, 14, 21);

    const tableColumn = [
      "No", "Nama Guru", "Pangkat/Gol", "Mata Pelajaran", "Kode", 
      "VII A", "VII B", "VII C", 
      "VIII A", "VIII B", "VIII C", 
      "IX A", "IX B", "IX C", 
      "Tugas Tambahan", "Jam Tamb", "Total"
    ];

    const tableRows = filteredData.map(row => [
      row.no || '',
      row.name || '',
      `${row.rank || '-'} / ${row.gol || '-'}`,
      row.subject || '',
      row.code || '',
      row.hoursVII?.A ?? '', row.hoursVII?.B ?? '', row.hoursVII?.C ?? '',
      row.hoursVIII?.A ?? '', row.hoursVIII?.B ?? '', row.hoursVIII?.C ?? '',
      row.hoursIX?.A ?? '', row.hoursIX?.B ?? '', row.hoursIX?.C ?? '',
      (!row.additionalTask || row.additionalTask === '-') ? '' : row.additionalTask,
      row.additionalHours || '',
      row.totalHours || 0
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [30, 41, 59] }, // Slate-800
      columnStyles: {
        0: { cellWidth: 8 }, // No
        1: { cellWidth: 35 }, // Nama
        2: { cellWidth: 20 }, // Pangkat
        3: { cellWidth: 20 }, // Mapel
        4: { cellWidth: 12 }, // Kode
        // Classes are auto
        14: { cellWidth: 25 }, // Tugas Tambahan
        15: { cellWidth: 8 },
        16: { cellWidth: 8 }
      }
    });

    // --- Signature Block ---
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Check if enough space for signature (need approx 40mm)
    if (finalY + 40 > pageHeight) {
        doc.addPage();
        finalY = 20;
    }

    const rightMargin = pageWidth - 60; 
    const dateStr = appSettings.lastUpdated || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(10);
    // Location and Date
    doc.text(`Mojokerto, ${dateStr}`, rightMargin, finalY, { align: 'center' });
    
    // Title
    doc.text('Kepala SMPN 3 Pacet', rightMargin, finalY + 5, { align: 'center' });
    
    // Space for signature
    
    // Name
    doc.text(appSettings.headmaster || '.........................', rightMargin, finalY + 30, { align: 'center' });
    
    // NIP
    doc.text(`NIP. ${appSettings.headmasterNip || '................'}`, rightMargin, finalY + 35, { align: 'center' });

    doc.save('Pembagian_Tugas_Guru_SMPN3Pacet.pdf');
    setIsDownloadMenuOpen(false);
  };

  const handleDownloadExcel = () => {
    // Flatten data for Excel
    const excelData = filteredData.map(row => ({
      "NO": row.no || '',
      "NAMA GURU": row.name || '',
      "NIP": row.nip || '',
      "PANGKAT/GOL": `${row.rank || '-'} / ${row.gol || '-'}`,
      "MATA PEL": row.subject || '',
      "KODE": row.code || '',
      "VII A": row.hoursVII?.A || 0,
      "VII B": row.hoursVII?.B || 0,
      "VII C": row.hoursVII?.C || 0,
      "VIII A": row.hoursVIII?.A || 0,
      "VIII B": row.hoursVIII?.B || 0,
      "VIII C": row.hoursVIII?.C || 0,
      "IX A": row.hoursIX?.A || 0,
      "IX B": row.hoursIX?.B || 0,
      "IX C": row.hoursIX?.C || 0,
      "TUGAS TAMBAHAN": row.additionalTask || '',
      "JAM TAMBAHAN": row.additionalHours || 0,
      "TOTAL JAM": row.totalHours || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pembagian Tugas");
    
    // Auto-width columns
    const max_width = excelData.reduce((w, r) => Math.max(w, r["NAMA GURU"].length), 10);
    worksheet["!cols"] = [
      { wch: 5 }, // No
      { wch: max_width }, // Nama
      { wch: 20 }, // NIP
      { wch: 15 }, // Pangkat/Gol
      { wch: 20 }, // Mapel
      { wch: 10 }, // Kode
      // Classes
      { wch: 5 }, { wch: 5 }, { wch: 5 },
      { wch: 5 }, { wch: 5 }, { wch: 5 },
      { wch: 5 }, { wch: 5 }, { wch: 5 },
      { wch: 25 }, // Tugas Tamb
      { wch: 10 }, // Jam
      { wch: 8 }, // Total
    ];

    XLSX.writeFile(workbook, "Pembagian_Tugas_Guru_SMPN3Pacet.xlsx");
    setIsDownloadMenuOpen(false);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newTeachers: TeacherData[] = data.map((row, index) => {
            // Mapping flexible headers
            const no = row['No'] || row['NO'] || String(index + 1);
            const name = row['Nama Guru'] || row['NAMA GURU'] || row['Nama'] || row['NAMA'] || 'Guru Baru';
            const subject = row['Mata Pelajaran'] || row['MATA PELAJARAN'] || row['MATA PEL'] || row['Mapel'] || '-';
            
            // Handle Pangkat/Gol which might be merged or separate
            let rank = row['Pangkat'] || row['PANGKAT'] || '-';
            let gol = row['Gol'] || row['Golongan'] || row['GOL'] || '-';
            
            const mergedPangkatGol = row['Pangkat/Gol'] || row['PANGKAT/GOL'] || row['Pangkat / Gol'] || '';
            if (mergedPangkatGol) {
                const parts = mergedPangkatGol.split('/');
                if (parts.length > 1) {
                    rank = parts[0].trim();
                    gol = parts.slice(1).join('/').trim();
                } else {
                    rank = mergedPangkatGol;
                }
            }

            // Generate Code
            const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
            const subjCode = subject.substring(0, 3).toUpperCase();
            const code = `${subjCode}-${initials}${Math.floor(Math.random() * 100)}`;

            return {
                id: Date.now() + index,
                no: String(no),
                name: String(name),
                nip: row['NIP'] || '-',
                rank: String(rank),
                gol: String(gol),
                subject: String(subject),
                code: row['Kode'] || row['KODE'] || code,
                hoursVII: { A: row['VII A']||0, B: row['VII B']||0, C: row['VII C']||0 },
                hoursVIII: { A: row['VIII A']||0, B: row['VIII B']||0, C: row['VIII C']||0 },
                hoursIX: { A: row['IX A']||0, B: row['IX B']||0, C: row['IX C']||0 },
                additionalTask: row['Tugas Tambahan'] || row['TUGAS TAMBAHAN'] || '-',
                additionalHours: Number(row['Jam Tamb'] || row['Jam Tambahan'] || 0),
                totalHours: 0 
            };
        });
        
        // Recalculate totals
        newTeachers.forEach(t => {
            let sum = 0;
            Object.values(t.hoursVII).forEach(v => sum += Number(v));
            Object.values(t.hoursVIII).forEach(v => sum += Number(v));
            Object.values(t.hoursIX).forEach(v => sum += Number(v));
            sum += t.additionalHours;
            t.totalHours = sum;
        });

        if (onBulkAdd) {
            onBulkAdd(newTeachers);
            alert(`Berhasil mengimpor ${newTeachers.length} data guru!`);
        } else {
            alert("Fitur bulk add belum diimplementasikan di App parent.");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error("Import Error:", error);
        alert("Gagal mengimpor file. Pastikan format Excel valid.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      no: String(data.length + 1),
      name: '', nip: '-', rank: '-', gol: '-', subject: '', code: '',
      hoursVII: { A: 0, B: 0, C: 0 },
      hoursVIII: { A: 0, B: 0, C: 0 },
      hoursIX: { A: 0, B: 0, C: 0 },
      additionalTask: '-', additionalHours: 0, totalHours: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: TeacherData) => {
    setEditingTeacher(teacher);
    setFormData(JSON.parse(JSON.stringify(teacher))); // Deep copy
    setIsModalOpen(true);
  };

  const calculateTotal = (data: Partial<TeacherData>) => {
    let sum = 0;
    ['hoursVII', 'hoursVIII', 'hoursIX'].forEach(key => {
      const hours = data[key as keyof TeacherData] as ClassHours | undefined;
      if (hours) {
        Object.values(hours).forEach(v => sum += Number(v) || 0);
      }
    });
    sum += Number(data.additionalHours) || 0;
    return sum;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return { ...updated, totalHours: calculateTotal(updated) };
    });
  };

  const handleHoursChange = (grade: 'hoursVII' | 'hoursVIII' | 'hoursIX', cls: string, value: string) => {
    setFormData(prev => {
      const currentGradeHours = prev[grade] || { A: 0, B: 0, C: 0 };
      const updatedHours = { ...currentGradeHours, [cls]: Number(value) };
      const updated = { ...prev, [grade]: updatedHours };
      return { ...updated, totalHours: calculateTotal(updated) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      onEdit({ ...editingTeacher, ...formData } as TeacherData);
    } else {
      onAdd({ ...formData, id: Date.now() } as TeacherData);
    }
    setIsModalOpen(false);
  };

  const renderCell = (hours: number | undefined) => (
    <td className={`px-2 py-3 text-center text-xs font-medium border-r border-gray-200 ${hours ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-400'}`}>
      {hours || '-'}
    </td>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Tabel Data Pembagian Tugas</h3>
        <div className="flex gap-2 relative">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          
          <button 
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ClipboardPaste size={16} /> Input Teks
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Upload size={16} /> Import Excel
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Tambah Guru
          </button>
          
          {/* Download Dropdown */}
          <div className="relative" ref={downloadMenuRef}>
            <button 
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download size={16} /> Download
              <ChevronDown size={14} className={`transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDownloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-left border-b border-gray-100"
                >
                  <FileText size={16} className="text-red-500" /> Download PDF
                </button>
                <button 
                  onClick={handleDownloadExcel}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  <FileSpreadsheet size={16} className="text-green-600" /> Download Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th rowSpan={2} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider w-10 border-r border-slate-600">No</th>
                  <th rowSpan={2} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider w-48 border-r border-slate-600">
                    Nama Guru <br/> <span className="text-gray-400 font-normal">NIP</span>
                  </th>
                  <th rowSpan={2} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider w-24 border-r border-slate-600">
                    Pangkat/Gol
                  </th>
                  <th rowSpan={2} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider w-32 border-r border-slate-600">Mata Pelajaran</th>
                  <th rowSpan={2} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider w-16 border-r border-slate-600">Kode</th>
                  
                  {/* Class Headers */}
                  <th colSpan={3} className="px-1 py-1 text-center text-xs font-bold uppercase border-b border-r border-slate-600 bg-slate-700">VII</th>
                  <th colSpan={3} className="px-1 py-1 text-center text-xs font-bold uppercase border-b border-r border-slate-600 bg-slate-700">VIII</th>
                  <th colSpan={3} className="px-1 py-1 text-center text-xs font-bold uppercase border-b border-r border-slate-600 bg-slate-700">IX</th>
                  
                  <th rowSpan={2} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider w-40 border-r border-slate-600">Tugas Tambahan</th>
                  <th rowSpan={2} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider w-12 border-r border-slate-600">Jam<br/>Tb</th>
                  <th rowSpan={2} className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider w-12 border-r border-slate-600">Total</th>
                  <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-20">Aksi</th>
                </tr>
                <tr>
                  {['A','B','C'].map(c => <th key={`7${c}`} className="px-1 py-1 text-center text-[10px] font-semibold bg-slate-700 border-r border-slate-600 w-8">{c}</th>)}
                  {['A','B','C'].map(c => <th key={`8${c}`} className="px-1 py-1 text-center text-[10px] font-semibold bg-slate-700 border-r border-slate-600 w-8">{c}</th>)}
                  {['A','B','C'].map(c => <th key={`9${c}`} className="px-1 py-1 text-center text-[10px] font-semibold bg-slate-700 border-r border-slate-600 w-8">{c}</th>)}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((row) => (
                  <tr key={`${row.id}-${row.code}`} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-2 py-4 text-center text-sm text-gray-500 border-r border-gray-200">{row.no}</td>
                    <td className="px-3 py-4 text-left border-r border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                      {row.nip && row.nip !== '-' && <div className="text-xs text-gray-500 mt-0.5">{row.nip}</div>}
                    </td>
                    <td className="px-2 py-4 text-center text-xs text-gray-700 border-r border-gray-200">
                       {(row.rank && row.rank !== '-') || (row.gol && row.gol !== '-') ? (
                          <div className="inline-block bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                             {row.rank}<br/>{row.gol}
                          </div>
                       ) : '-'}
                    </td>
                    <td className="px-3 py-4 text-xs text-gray-700 border-r border-gray-200 font-medium">{row.subject}</td>
                    <td className="px-2 py-4 text-center text-xs font-mono text-gray-500 border-r border-gray-200">{row.code}</td>

                    {renderCell(row.hoursVII?.A)}
                    {renderCell(row.hoursVII?.B)}
                    {renderCell(row.hoursVII?.C)}
                    {renderCell(row.hoursVIII?.A)}
                    {renderCell(row.hoursVIII?.B)}
                    {renderCell(row.hoursVIII?.C)}
                    {renderCell(row.hoursIX?.A)}
                    {renderCell(row.hoursIX?.B)}
                    {renderCell(row.hoursIX?.C)}
                    
                    <td className="px-3 py-4 text-xs text-gray-700 border-r border-gray-200">
                       {row.additionalTask && row.additionalTask !== '-' ? (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                           {row.additionalTask}
                         </span>
                       ) : (
                         <span className="text-gray-400">-</span>
                       )}
                    </td>
                    <td className="px-2 py-4 text-center text-sm text-gray-600 border-r border-gray-200">{row.additionalHours > 0 ? row.additionalHours : '-'}</td>
                    <td className="px-2 py-4 text-center text-sm font-bold text-gray-900 bg-gray-50 border-r border-gray-200">{row.totalHours}</td>
                    
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(row)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDelete(row.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Tidak ada data yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PASTE / BULK INPUT MODAL */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ClipboardPaste size={20} className="text-blue-600"/> Import Data dari Teks / Tabel</h3>
                        <p className="text-xs text-gray-500 mt-1">Salin data dari Excel/Word dan tempel di bawah. Format: <strong>NO | NAMA | PANGKAT/GOL | MAPEL</strong></p>
                    </div>
                    <button onClick={() => setIsPasteModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-2">Tempel Data Di Sini:</label>
                        <textarea 
                            className="flex-1 w-full border border-gray-300 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder={`Contoh:\n1\tBudi Santoso\tPenata Muda / III a\tMatematika\n2\tSiti Aminah\t-\tBahasa Inggris`}
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                        ></textarea>
                        <button 
                            onClick={handleProcessPaste}
                            disabled={!pasteContent.trim()}
                            className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                        >
                            Proses Data <ArrowRight size={16}/>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-200 bg-gray-100 font-bold text-xs text-gray-600">Pratinjau Hasil Parsing ({parsedTeachers.length} Data)</div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {parsedTeachers.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">No</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">Nama</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">Mapel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {parsedTeachers.map((t, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-1.5 text-[10px] text-gray-500">{t.no}</td>
                                                <td className="px-3 py-1.5 text-[10px] font-medium text-gray-800">{t.name}</td>
                                                <td className="px-3 py-1.5 text-[10px] text-gray-600">{t.subject}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic p-4 text-center">
                                    Data hasil parsing akan muncul di sini...
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-gray-200">
                            <button 
                                onClick={handleSavePaste}
                                disabled={parsedTeachers.length === 0}
                                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={16}/> Simpan ke Tabel Utama
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-600 text-sm border-b pb-1">Informasi Dasar</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">No Urut</label>
                    <input type="text" name="no" value={formData.no} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                   </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kode Guru (Unik)</label>
                    <input type="text" name="code" value={formData.code} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm bg-gray-50 font-mono" required />
                   </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">NIP</label>
                  <input type="text" name="nip" value={formData.nip} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pangkat</label>
                    <input type="text" name="rank" value={formData.rank} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Golongan</label>
                    <input type="text" name="gol" value={formData.gol} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" required />
                </div>
              </div>

              {/* Teaching Hours */}
              <div className="space-y-4">
                <h4 className="font-semibold text-indigo-600 text-sm border-b pb-1">Pembagian Jam Mengajar</h4>
                
                {['VII', 'VIII', 'IX'].map(grade => (
                  <div key={grade} className="flex items-center gap-2">
                    <span className="w-8 text-sm font-bold text-gray-600">{grade}</span>
                    {['A', 'B', 'C'].map(cls => (
                      <div key={cls} className="flex-1">
                        <label className="block text-[10px] text-gray-500 text-center mb-0.5">{cls}</label>
                        <input 
                          type="number" 
                          min="0"
                          value={formData[`hours${grade}` as 'hoursVII']?.[cls] || 0}
                          onChange={(e) => handleHoursChange(`hours${grade}` as any, cls, e.target.value)}
                          className="w-full border rounded px-1 py-1 text-center text-sm focus:ring-1 focus:ring-indigo-500" 
                        />
                      </div>
                    ))}
                  </div>
                ))}

                <div className="pt-2 border-t border-gray-100">
                   <label className="block text-xs font-medium text-gray-700 mb-1">Tugas Tambahan</label>
                   <input type="text" name="additionalTask" value={formData.additionalTask} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Jam Tambahan</label>
                    <input type="number" name="additionalHours" value={formData.additionalHours} onChange={handleInputChange} className="w-full border rounded px-2 py-1.5 text-center text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total Jam</label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1.5 text-center text-sm font-bold text-indigo-700">
                      {formData.totalHours}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium flex items-center gap-2"
                >
                  <Save size={16} /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherTable;
