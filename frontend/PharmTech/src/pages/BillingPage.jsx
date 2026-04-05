import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Search, Plus, Trash2, Camera, 
  Upload, FileText, CheckCircle, AlertCircle, 
  ChevronRight, Package, LogOut, User, Printer,
  Sparkles, Loader2, X, Info, Phone, CreditCard, Download, Calendar
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { medicineAPI, billingAPI, ocrAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const BillingPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [search, setSearch] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [scanResults, setScanResults] = useState(null);
  const fileInputRef = useRef();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
    const timer = setInterval(() => setCurrentDate(new Date().toLocaleDateString('en-GB')), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await medicineAPI.getAll();
      setMedicines(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; 
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleOcrUpload = async (e) => {
    if (ocrLoading) return; // Prevent double-scans if already working
    const file = e.target.files[0];
    if (!file) return;
    
    setOcrLoading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      
      const response = await ocrAPI.extract(formData);
      if (response.data.identifiedMedicines?.length > 0) {
        setScanResults(response.data.identifiedMedicines);
      } else {
        const text = response.data.extractedText || "No text detected";
        alert(`No matches found in stock.\n\nAI Detected: "${text}"`);
      }
    } catch (err) { 
        alert('Extraction failed. Please wait a moment and try again.'); 
    }
    finally { 
      setOcrLoading(false); 
      e.target.value = ''; // Reset input so same file can be selected again
    }
  };

  const addAllFromScan = () => {
    if (!scanResults) return;
    scanResults.forEach(m => addToBill(m));
    setScanResults(null);
  };

  const addToBill = (medicine, quantity = 1) => {
    setBillItems(prevItems => {
        const existing = prevItems.find(item => Number(item.medicine.id) === Number(medicine.id));
        if (existing) {
            return prevItems.map(item => 
                Number(item.medicine.id) === Number(medicine.id) 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
        } else {
            return [...prevItems, { medicine, quantity, price: medicine.unitPrice }];
        }
    });
  };

  const updateQuantity = (id, delta) => {
    setBillItems(billItems.map(item => {
      if (item.medicine.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.medicine.stockQuantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleManualQuantity = (id, value) => {
    const qty = parseInt(value) || 0;
    setBillItems(billItems.map(item => {
      if (item.medicine.id === id) {
        const validatedQty = Math.min(Math.max(1, qty), item.medicine.stockQuantity);
        return { ...item, quantity: validatedQty };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const calculateCGST = () => calculateSubtotal() * 0.09;
  const calculateSGST = () => calculateSubtotal() * 0.09;
  const calculateGrandTotal = () => calculateSubtotal() + calculateCGST() + calculateSGST();

  const downloadPDF = () => {
    const doc = new jsPDF();
    const subtotal = calculateSubtotal();
    const cgst = calculateCGST();
    const sgst = calculateSGST();
    const total = calculateGrandTotal();

    // -- Header Section --
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text("PHARMTECH RETAIL", 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text("Medical Square, Tech Hub, Road 01", 14, 26);
    doc.text("GSTIN: 27AAAAA0000A1Z5 | LICENSE: DL/24/0000", 14, 30);
    
    // -- Client Details --
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 36, 182, 24, 'F');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(`BILL TO: ${customerName?.toUpperCase() || 'WALK-IN CUSTOMER'}`, 20, 44);
    doc.text(`CONTACT: ${customerPhone || 'N/A'}`, 20, 49);
    doc.text(`DATE: ${currentDate}`, 150, 44, { align: 'right' });
    doc.text(`PAYMENT: ${paymentMode}`, 150, 49, { align: 'right' });

    // -- Table Section --
    autoTable(doc, {
      startY: 65,
      head: [['MEDICINE / FORMULATION', 'QTY', 'RATE', 'SUBTOTAL']],
      body: billItems.map(i => [
          i.medicine.name.toUpperCase(), 
          i.quantity, 
          `INR ${i.price.toFixed(2)}`, 
          `INR ${(i.price * i.quantity).toFixed(2)}`
      ]),
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      margin: { top: 60 }
    });

    // -- Totals Section --
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Net Value:", 140, finalY);
    doc.text(`INR ${subtotal.toFixed(2)}`, 196, finalY, { align: 'right' });
    
    doc.setTextColor(100, 116, 139);
    doc.text("CGST (9.0%):", 140, finalY + 6);
    doc.text(`INR ${cgst.toFixed(2)}`, 196, finalY + 6, { align: 'right' });
    doc.text("SGST (9.0%):", 140, finalY + 12);
    doc.text(`INR ${sgst.toFixed(2)}`, 196, finalY + 12, { align: 'right' });
    
    doc.setTextColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(140, finalY + 15, 196, finalY + 15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 140, finalY + 22);
    doc.text(`INR ${total.toFixed(2)}`, 196, finalY + 22, { align: 'right' });

    // -- Footer --
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Computer Generated Invoice - No Signature Required", 105, 280, { align: 'center' });
    doc.text("Thank you for your purchase from PharmTech!", 105, 285, { align: 'center' });

    doc.save(`PharmTech_Invoice_${Date.now()}.pdf`);
  };

  const finalizeBill = async () => {
    if (!customerName) return alert('Enter Name');
    if (billItems.length === 0) return alert('Empty Bill');
    try {
      await billingAPI.create({
        customerName, customerPhone, paymentMode,
        items: billItems.map(i => ({ medicine: { id: i.medicine.id }, quantity: i.quantity }))
      });
      alert('Billing Success!');
      downloadPDF();
      setBillItems([]);
      setCustomerName('');
      setCustomerPhone('');
      fetchMedicines();
    } catch (err) { alert('Failed'); }
  };

  const filteredMeds = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) && m.stockQuantity > 0);

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden font-sans text-slate-900">
      {/* Search Space */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center p-1.5 overflow-hidden ring-4 ring-green-50">
              <img src={logo} className="w-full h-full object-contain" alt="PharmTech Logo" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Pharm<span className="text-green-600">Tech</span></h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] -mt-0.5">Inventory Operations</p>
            </div>
          </div>

          <div className="flex-1 max-w-lg mx-12 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Medicine or Batch ID..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleOcrUpload} accept="image/*" />
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="px-4 py-2.5 bg-green-50 text-green-700 border border-green-100 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-green-100 active:scale-95 transition-all shadow-sm"
            >
                {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} 
                Scan Rx
            </button>
            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              className="p-2.5 border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm"
            >
                <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]/50 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMeds.map((med) => (
              <div 
                key={med.id} onClick={() => addToBill(med)}
                className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-green-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{med.manufacturer.substring(0, 15)}</span>
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase ${med.stockQuantity < 10 ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
                      {med.stockQuantity} in stock
                    </span>
                </div>
                <h3 className="font-bold text-slate-800 text-[13px] mb-4 flex-1 leading-snug">{med.name}</h3>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Price</span>
                      <span className="text-base font-bold text-slate-900">₹{med.unitPrice}</span>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                      <Plus className="w-4 h-4" />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="w-[440px] bg-white flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20 border-l border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Billing Details</h2>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: #{Date.now().toString().slice(-6)}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-[10px] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-green-600" /> {currentDate}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Customer</label>
                <input 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" 
                  placeholder="Name" 
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone</label>
                <input 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all" 
                  placeholder="Mobile" 
                />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {billItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                      <ShoppingCart className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Cart Empty</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="pb-2 pt-1 text-[9px] text-slate-400 uppercase font-bold">Medicine</th>
                            <th className="pb-2 pt-1 text-center text-[9px] text-slate-400 uppercase font-bold">Qty</th>
                            <th className="pb-2 pt-1 text-right text-[9px] text-slate-400 uppercase font-bold">Total</th>
                            <th className="pb-2 pt-1 text-right text-[9px] text-slate-400 uppercase font-bold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {billItems.map(item => (
                            <tr key={item.medicine.id} className="text-[13px] group hover:bg-slate-50/50 transition-all">
                                <td className="py-2.5 pr-2">
                                    <div className="font-bold text-slate-800 leading-tight">{item.medicine.name}</div>
                                    <div className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{item.medicine.manufacturer}</div>
                                </td>
                                <td className="py-2.5 px-2">
                                    <div className="flex items-center justify-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm scale-90">
                                        <button 
                                          onClick={() => updateQuantity(item.medicine.id, -1)} 
                                          className="px-2 py-1 hover:bg-slate-50 text-slate-600 transition-colors"
                                        >-</button>
                                        <input 
                                          type="number"
                                          value={item.quantity}
                                          onChange={(e) => handleManualQuantity(item.medicine.id, e.target.value)}
                                          className="w-8 text-center text-[11px] font-bold outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button 
                                          onClick={() => updateQuantity(item.medicine.id, 1)} 
                                          className="px-2 py-1 hover:bg-slate-50 text-slate-600 transition-colors"
                                        >+</button>
                                    </div>
                                </td>
                                <td className="py-2.5 px-2 text-right font-bold text-slate-800 tabular-nums">
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 pl-3 text-right">
                                    <button 
                                      onClick={() => setBillItems(billItems.filter(i => i.medicine.id !== item.medicine.id))} 
                                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 mb-4 justify-center">
                {['CASH', 'UPI', 'CARD'].map(mode => (
                    <button 
                      key={mode} 
                      onClick={() => setPaymentMode(mode)} 
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all ${paymentMode === mode ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                    >{mode}</button>
                ))}
            </div>

            <div className="space-y-2 mb-4 bg-green-50 rounded-[24px] p-5 border border-green-100 relative overflow-hidden">
                <div className="flex justify-between items-center text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{calculateSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 text-[9px] font-bold uppercase tracking-widest">
                    <span>GST (18%)</span>
                    <span>₹{(calculateCGST() + calculateSGST()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 mt-2 border-t border-green-200/50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Grand Total</span>
                      <span className="text-2xl font-bold text-slate-900 tracking-tight">₹{calculateGrandTotal().toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-green-600 p-2 rounded-xl shadow-lg ring-2 ring-green-100">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                  onClick={downloadPDF} 
                  disabled={billItems.length === 0} 
                  className="px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button 
                  onClick={finalizeBill} 
                  disabled={billItems.length === 0} 
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-200 active:scale-95 disabled:opacity-50"
                >
                    <Printer className="w-4 h-4" /> Finalize Bill & Print
                </button>
            </div>
        </div>
      </aside>

      {/* Scan Results Modal */}
      <AnimatePresence>
        {scanResults && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setScanResults(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Prescription Detected</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Verify matches from AI Scan</p>
                  </div>
                  <button onClick={() => setScanResults(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-3 mb-8">
                  {scanResults.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{med.name}</h4>
                          <p className="text-[9px] text-slate-400 font-medium">{med.manufacturer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-900">₹{med.unitPrice}</p>
                        <p className="text-[8px] text-green-600 font-black uppercase">In Stock</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setScanResults(null)}
                    className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addAllFromScan}
                    className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-100"
                  >
                    <Plus className="w-4 h-4" /> Add All Matched
                  </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-6 font-medium italic">
                  Note: Only items currently in stock are listed here.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingPage;
