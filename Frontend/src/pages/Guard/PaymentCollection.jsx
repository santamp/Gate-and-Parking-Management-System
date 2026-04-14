import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import gateService from '../../services/gateService';

const PaymentCollection = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { vehicle } = location.state || {};

    const [method, setMethod] = useState('UPI'); // UPI or Cash
    const [loading, setLoading] = useState(false);
    const [transactionId, setTransactionId] = useState('');

    const handlePayment = async () => {
        try {
            setLoading(true);
            
            // 1. Process payment
            await gateService.processPayment({
                logId: vehicle.logId,
                paymentMethod: method === 'UPI' ? 'UPI' : 'CASH',
                transactionId: method === 'UPI' ? transactionId : null,
                amount: vehicle.amount,
                totalHours: vehicle.calcData.totalHours,
                durationMinutes: vehicle.calcData.durationMinutes,
                appliedRates: vehicle.calcData.appliedRates,
                exitTime: vehicle.calcData.exitTime
            });

            // 2. Finalize Exit
            await gateService.registerVehicleExit(vehicle.logId);

            alert(`Payment of ₹${vehicle.amount} successful. Vehicle can exit.`);
            navigate('/guard');
        } catch (error) {
            alert(error.message || 'Payment processing failed');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mt-2 px-1">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Payment</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Vehicle: {vehicle.plate}</p>
      </div>

      {/* Amount Display */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm relative overflow-hidden">
         <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Amount</span>
         <h1 className="text-4xl font-black text-gray-900 relative z-10">₹{vehicle.amount}</h1>
      </div>

      {/* Payment Method Toggle */}
      <div className="bg-gray-100 p-1.5 rounded-2xl flex">
          <button 
            onClick={() => setMethod('UPI')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${method === 'UPI' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <QrCode size={18} /> UPI / QR
          </button>
          <button 
            onClick={() => setMethod('Cash')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${method === 'Cash' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <Banknote size={18} /> Cash
          </button>
      </div>

      {/* Dynamic Content based on method */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[200px] flex flex-col items-center justify-center text-center">
          {method === 'UPI' ? (
              <div className="animate-in fade-in">
                  <div className="w-40 h-40 bg-gray-100 rounded-2xl mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden group">
                      <QrCode size={60} className="text-gray-300" />
                      <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <p className="font-bold text-gray-800 mt-4 text-sm">Scan with any UPI App</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Google Pay, PhonePe, Paytm</p>

                  <div className="mt-6 w-full max-w-xs mx-auto text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Transaction ID</label>
                      <input 
                        type="text" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter TxID after scan"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-gray-900 outline-none transition-all uppercase text-center"
                      />
                  </div>
              </div>
          ) : (
             <div className="animate-in fade-in text-center">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex flex-col items-center justify-center mx-auto mb-3">
                      <Banknote size={40} />
                  </div>
                  <p className="font-bold text-gray-800 mt-2">Collect Exact Cash</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Ensure correct change is provided.</p>
             </div>
          )}
      </div>

      {/* Action */}
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-gray-900 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-sm active:bg-black transition-all disabled:opacity-50"
      >
        {loading ? (
           <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
             <>
               <CheckCircle2 size={18} /> Paid & Exit
             </>
        )}
      </button>

    </div>
  );
};

export default PaymentCollection;
