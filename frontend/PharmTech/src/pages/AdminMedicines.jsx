import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Package, 
  AlertCircle, DollarSign, Calendar, Factory,
  TrendingUp, Download, Filter, LayoutDashboard,
  Box, Users, FileText, Settings, LogOut, ChevronRight,
  Activity, ShoppingCart, TrendingDown, Clock, ShieldCheck,
  UserPlus, Mail, Phone, MapPin, Hash, IndianRupee,
  ChevronDown, RefreshCw, CheckCircle2, XCircle, FileSpreadsheet, File
} from 'lucide-react';
import { medicineAPI, billingAPI, userAPI, authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMed, setCurrentMed] = useState(null);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'medicines') {
        const medRes = await medicineAPI.getAll();
        setMedicines(medRes.data || []);
      }
      
      if (activeTab === 'dashboard' || activeTab === 'sales') {
        const billRes = await billingAPI.getAll();
        setBills(billRes.data || []);
      }

      if (activeTab === 'staff') {
        const userRes = await userAPI.getAll();
        setUsers(userRes.data || []);
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMed = async (id) => {
    if (window.confirm('Delete this medicine registry?')) {
      try {
        await medicineAPI.delete(id);
        fetchData();
      } catch (err) { alert('Operation Failed'); }
    }
  };

  const handleMedSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      if (currentMed) await medicineAPI.update(currentMed.id, data);
      else await medicineAPI.create(data);
      setIsModalOpen(false);
      fetchData();
    } catch (err) { alert('Sync Failed'); }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
        if (currentStaff) await userAPI.update(currentStaff.id, data);
        else await authAPI.register(data);
        fetchData();
        setIsModalOpen(false);
    } catch (err) { alert("Authorization Error"); }
  };

  const handleDeleteUser = async (id) => {
    if (id === user?.id) return alert("System cannot remove root user");
    if (window.confirm('Revoke access for this personnel?')) {
        try {
            await userAPI.delete(id);
            fetchData();
        } catch (e) { alert("Command Failed"); }
    }
  };

  const exportPDFHandler = (title, headers, bodyData, filename) => {
    try {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        autoTable(doc, {
            head: [headers],
            body: bodyData,
            startY: 30,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [22, 163, 74] }
        });
        doc.save(`${filename}.pdf`);
    } catch (err) { alert("PDF Generation Error"); }
  };

  const totalValue = medicines.reduce((acc, m) => acc + (Number(m.unitPrice || 0) * Number(m.stockQuantity || 0)), 0);
  const totalSalesVal = bills.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0);

  // --- Search & Filter Logic ---
  const filteredMedicines = medicines.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
    m.id?.toString().includes(search.toLowerCase())
  );

  const filteredBills = bills.filter(b => {
    const s = search.toLowerCase();
    // Use the correct 'date' field from backend entity
    const rawDate = b.date ? new Date(b.date) : null;
    const bDateStr = rawDate ? rawDate.toISOString().split('T')[0] : '';
    const bDateLocal = rawDate ? rawDate.toLocaleDateString() : '';
    
    // Calendar filter (exact date)
    if (filterDate && bDateStr !== filterDate) return false;
    
    // Text search (name, phone, id, or formatted date string)
    return (
      b.customerName?.toLowerCase().includes(s) ||
      b.customerPhone?.toLowerCase().includes(s) ||
      b.id?.toString().includes(s) ||
      b.paymentMode?.toLowerCase().includes(s) ||
      bDateLocal.includes(s)
    );
  });

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
     <div className="flex min-h-screen bg-[#F0F4F8]">
      <aside className="w-80 bg-white text-slate-500 flex flex-col border-r border-slate-100 fixed h-full z-40 p-8 shadow-sm">
        <div className="flex items-center gap-4 px-4 mb-16">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 p-2 overflow-hidden transform -rotate-3 transition-transform hover:rotate-0">
            <img src={logo} className="w-full h-full object-contain" alt="PharmTech Logo" />
          </div>
          <div>
            <h1 className="text-slate-800 font-black tracking-tight text-2xl leading-none">Pharm<span className="text-green-600">Tech</span></h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">Admin Management</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
           <SidebarLink icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
           <SidebarLink icon={Box} label="Inventory Stock" active={activeTab === 'medicines'} onClick={() => setActiveTab('medicines')} />
           <SidebarLink icon={FileText} label="Accounting Ledger" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
           <SidebarLink icon={Users} label="Staff Management" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-3xl border border-green-100">
                <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center font-black text-white text-sm">
                   {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-slate-800 text-sm font-bold truncate">{user?.username || 'Admin'}</p>
                    <p className="text-[10px] text-green-600 font-black uppercase tracking-wider">Superuser Access</p>
                </div>
            </div>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full mt-4 py-4 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-100 flex items-center justify-center gap-3 rounded-2xl text-xs font-bold uppercase transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </div>
      </aside>

      <main className="flex-1 ml-80 min-h-screen flex flex-col">
          <header className="h-24 bg-white/70 backdrop-blur-3xl border-b border-slate-200 sticky top-0 z-30 px-12 flex items-center justify-between">
              <div>
                  <h2 className="text-3xl font-black text-[#1E293B] tracking-tight">
                    {activeTab === 'dashboard' ? 'Operations Hub' : activeTab === 'medicines' ? 'Inventory Control' : activeTab === 'sales' ? 'Accounting Ledger' : 'Personnel Registry'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pharmacy Admin Terminal</p>
              </div>

              <div className="flex items-center gap-4">
                   <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        <div className="relative group flex items-center">
                            <Search className="w-4 h-4 absolute left-4 text-slate-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="pl-11 pr-4 py-2.5 bg-transparent border-none text-sm w-44 focus:w-60 transition-all outline-none font-bold"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200 mx-1" />
                        <div className="relative flex items-center bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                            <Calendar className="w-4 h-4 text-green-600 mr-2" />
                            <input 
                                type="date" 
                                className="bg-transparent text-xs font-bold outline-none text-slate-700 cursor-pointer"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                            {filterDate && (
                                <button onClick={() => setFilterDate('')} className="ml-2 text-slate-400 hover:text-rose-500 transition-colors">
                                    <XCircle className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                   </div>
                   
                   {activeTab === 'medicines' && (
                     <button onClick={() => { setCurrentMed(null); setIsModalOpen(true); }} className="bg-green-600 text-white h-12 px-6 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95"><Plus className="w-4 h-4" /> Add Product</button>
                   )}
                   {activeTab === 'staff' && (
                     <button onClick={() => { setCurrentStaff(null); setIsModalOpen(true); }} className="bg-green-600 text-white h-12 px-6 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95"><UserPlus className="w-4 h-4" /> Onboard Staff</button>
                   )}

                   <button onClick={fetchData} className="p-3 bg-white text-slate-400 hover:text-green-500 transition-all rounded-xl border border-slate-200 shadow-sm"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
              </div>
          </header>

          <section className="p-12 flex-1 overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Data Source...</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    {activeTab === 'dashboard' && <DashboardModule meds={filteredMedicines} bills={filteredBills} totalValue={totalValue} totalSales={totalSalesVal} />}
                    {activeTab === 'medicines' && (
                        <MedicinesModule 
                            data={filteredMedicines} 
                            onEdit={(m) => { setCurrentMed(m); setIsModalOpen(true); }} 
                            onDelete={handleDeleteMed} 
                            onExportPDF={() => exportPDFHandler(
                                'Pharmacy Inventory Report', 
                                ['ID', 'Name', 'Manufacturer', 'Price (INR)', 'Stock Qty'], 
                                filteredMedicines.map(m => [m.id, m.name, m.manufacturer, m.unitPrice?.toFixed(2), m.stockQuantity]), 
                                'Inventory_Report'
                            )} 
                        />
                    )}
                    {activeTab === 'sales' && (
                        <SalesModule 
                            bills={filteredBills} 
                            onExportPDF={() => exportPDFHandler(
                                'Sales Revenue Ledger', 
                                ['Bill #', 'Customer Name', 'Date', 'Amount (INR)', 'Payment'], 
                                filteredBills.map(b => [b.id, b.customerName, b.date ? new Date(b.date).toLocaleDateString() : 'N/A', b.totalAmount?.toFixed(2), b.paymentMode]), 
                                'Sales_Report'
                            )} 
                        />
                    )}
                    {activeTab === 'staff' && <StaffModule users={filteredUsers} onDelete={handleDeleteUser} onEdit={(u) => { setCurrentStaff(u); setIsModalOpen(true); }} />}
                </motion.div>
              )}
          </section>
      </main>

      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-white w-full max-w-xl rounded-[40px] p-10 relative z-10 shadow-2xl overflow-hidden">
                      {activeTab === 'medicines' && (
                          <form onSubmit={handleMedSubmit} className="space-y-6">
                              <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Box className="text-green-600" /> {currentMed ? 'Update Medicine' : 'New Medicine'}</h3>
                              <div className="grid grid-cols-1 gap-5">
                                  <FormGroup label="Product Name" name="name" defaultValue={currentMed?.name} required />
                                  <FormGroup label="Manufacturer" name="manufacturer" defaultValue={currentMed?.manufacturer} required />
                                  <div className="grid grid-cols-2 gap-5">
                                      <FormGroup label="Unit Price (₹)" name="unitPrice" type="number" step="0.01" defaultValue={currentMed?.unitPrice} required />
                                      <FormGroup label="Stock Quantity" name="stockQuantity" type="number" defaultValue={currentMed?.stockQuantity} required />
                                  </div>
                                  <FormGroup label="Expiration Date" name="expiryDate" type="date" defaultValue={currentMed?.expiryDate} required />
                              </div>
                              <div className="flex gap-4 pt-4">
                                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-3xl font-bold">Cancel</button>
                                  <button type="submit" className="flex-[2] h-14 bg-green-600 text-white rounded-3xl font-bold shadow-xl">Save Changes</button>
                              </div>
                          </form>
                      )}
                      {activeTab === 'staff' && (
                          <form onSubmit={handleStaffSubmit} className="space-y-6">
                              <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><UserPlus className="text-green-600" /> {currentStaff ? 'Modify' : 'Onboard'} Personnel</h3>
                              <div className="grid grid-cols-1 gap-5">
                                  <FormGroup label="System Username" name="username" defaultValue={currentStaff?.username} required />
                                  <FormGroup label={currentStaff ? "Password (leave blank to keep)" : "Password"} name="password" type="password" required={!currentStaff} />
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                                      <select name="role" defaultValue={currentStaff?.role || 'BILLER'} className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none">
                                          <option value="BILLER">Biller</option>
                                          <option value="ADMIN">Administrator</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="flex gap-4 pt-4">
                                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-3xl font-bold">Cancel</button>
                                  <button type="submit" className="flex-[2] h-14 bg-green-600 text-white rounded-3xl font-bold shadow-xl">{currentStaff ? 'Update User' : 'Authorize User'}</button>
                              </div>
                          </form>
                      )}
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

const DashboardModule = ({ meds, bills, totalValue, totalSales }) => (
    <div className="space-y-12">
        <div className="grid grid-cols-4 gap-8">
            <StatsCard icon={IndianRupee} label="Total Sales" value={`₹${totalSales.toLocaleString('en-IN')}`} color="bg-green-600" />
            <StatsCard icon={Box} label="Products" value={meds.length} color="bg-emerald-500" />
            <StatsCard icon={AlertCircle} label="Low Stock" value={meds.filter(m => m.stockQuantity < 10).length} color="bg-rose-500" />
            <StatsCard icon={TrendingUp} label="Inventory Value" value={`₹${totalValue.toLocaleString('en-IN')}`} color="bg-teal-600" />
        </div>

        <div className="grid grid-cols-3 gap-10">
             <div className="col-span-3 bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Transmission Ledger Registry</h3>
                <div className="space-y-4">
                    {bills.slice(0, 5).map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-bold text-green-600 text-xs shadow-sm">#{b.id}</div>
                                <div>
                                    <p className="font-bold text-sm">{b.customerName}</p>
                                    <p className="text-[10px] opacity-60 font-medium">{b.date ? new Date(b.date).toLocaleString() : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold tracking-tight">₹{b.totalAmount?.toFixed(2)}</p>
                                <p className="text-[8px] font-bold uppercase text-green-500 tracking-widest">{b.paymentMode}</p>
                            </div>
                        </div>
                    ))}
                    {bills.length === 0 && <div className="py-16 text-center"><p className="text-slate-400 font-black tracking-widest text-[11px] uppercase">No Match Found In Ledger</p></div>}
                </div>
             </div>
        </div>
    </div>
);

const MedicinesModule = ({ data, onEdit, onDelete, onExportPDF }) => (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Inventory Data</h4>
            <button onClick={onExportPDF} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-green-700 transition-all shadow-lg"><File className="w-3.5 h-3.5" /> Export PDF</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th className="px-10 py-8">UUID</th>
                        <th className="px-6 py-8">Formula Node</th>
                        <th className="px-6 py-8">Manufacturer</th>
                        <th className="px-6 py-8 text-center">Unit Price</th>
                        <th className="px-6 py-8 text-center">Atomic Stock</th>
                        <th className="px-10 py-8 text-right">Ops</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                    {data.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="px-10 py-6 text-slate-400 font-bold text-xs whitespace-nowrap">ID: {med.id}</td>
                            <td className="px-6 py-6 text-slate-800 font-bold tracking-tight">{med.name}</td>
                            <td className="px-6 py-6 font-medium text-slate-400 text-[10px] uppercase tracking-wide">{med.manufacturer}</td>
                            <td className="px-6 py-6 text-center font-bold text-slate-800">₹{med.unitPrice?.toFixed(2)}</td>
                            <td className="px-6 py-6 text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold ${med.stockQuantity < 10 ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-600'}`}>{med.stockQuantity}</span>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(med)} className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-green-600 hover:border-green-100 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => onDelete(med.id)} className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="6" className="py-32 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Registry Empty For Input Criteria</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

const StaffModule = ({ users, onDelete, onEdit }) => (
    <div className="grid grid-cols-3 gap-8">
        {users.map((u) => (
            <div key={u.id} className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
                <div className="w-16 h-16 rounded-[24px] bg-green-50 flex items-center justify-center font-bold text-2xl text-green-600 mb-6 group-hover:scale-105 transition-transform">{u.username?.[0]?.toUpperCase()}</div>
                <h4 className="text-xl font-bold text-slate-800 tracking-tight">{u.username}</h4>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1 mb-6">{u.role}</p>
                <div className="space-y-3 pt-6 border-t border-slate-100">
                    <button onClick={() => onEdit(u)} className="w-full h-12 bg-slate-50 hover:bg-green-600 hover:text-white text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">Edit Staff</button>
                    <button onClick={() => onDelete(u.id)} className="w-full h-12 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">Revoke Access</button>
                </div>
            </div>
        ))}
    </div>
);

const SalesModule = ({ bills, onExportPDF }) => (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
            <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Sales History</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pharmacy Revenue Log</p>
            </div>
            <button onClick={onExportPDF} className="h-14 px-8 bg-green-600 text-white rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-green-700 transition-all shadow-xl"><Download className="w-5 h-5" /> Export PDF</button>
          </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left">
                 <thead className="bg-[#F8FAFC] text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                     <tr>
                         <th className="px-10 py-8">Ledger #</th>
                         <th className="px-6 py-8">Customer Node</th>
                         <th className="px-6 py-8">Contact / Registry</th>
                         <th className="px-6 py-8 text-center">Proto</th>
                         <th className="px-10 py-8 text-right">Net Value</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                     {bills.map((b) => (
                         <tr key={b.id} className="hover:bg-slate-50/50 transition-all group">
                             <td className="px-10 py-6 text-green-600 font-black text-xs">#{b.id}</td>
                             <td className="px-6 py-6 font-black text-slate-800 tracking-tight">{b.customerName}</td>
                             <td className="px-6 py-6">
                                 <p className="text-xs font-black text-slate-900">{b.customerPhone || 'N/A'}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</p>
                             </td>
                             <td className="px-6 py-6 text-center">
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${b.paymentMode === 'CASH' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{b.paymentMode}</span>
                             </td>
                             <td className="px-10 py-6 text-right font-black text-slate-800 text-lg">₹{Number(b.totalAmount || 0).toFixed(2)}</td>
                         </tr>
                     ))}
                     {bills.length === 0 && <tr><td colSpan="5" className="py-32 text-center text-slate-400 uppercase font-black tracking-widest text-[10px]">No Matching Transmission Nodes Found</td></tr>}
                 </tbody>
             </table>
         </div>
    </div>
);

const SidebarLink = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${active ? 'bg-green-500/10 text-green-600 border-l-4 border-green-500 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-green-600'}`}>
      <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-slate-500'}`} />
      <span className="tracking-tight">{label}</span>
    </button>
);

const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl relative overflow-hidden group">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-6`}><Icon className="text-white w-7 h-7" /></div>
        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-[#1E293B] tracking-tighter">{value}</p>
    </div>
);

const FormGroup = ({ label, name, ...props }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</label>
      <input name={name} {...props} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:border-green-600 outline-none transition-all" />
    </div>
);

export default AdminMedicines;
