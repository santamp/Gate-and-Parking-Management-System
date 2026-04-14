import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import gateService from '../../services/gateService';
import { toast } from 'react-hot-toast';

const PendingApprovals = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast(location.state.successMessage, { id: 'pending-route-message' });
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await gateService.getVehicleLogs();
            // Show pending, approved (not yet inside), and not_my_vehicle (flagged)
            const filtered = res.data.filter(log => ['pending', 'approved', 'not_my_vehicle', 'rejected'].includes(log.status));
            setRequests(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLetIn = async (id) => {
        try {
            await gateService.updateVehicleStatus(id, { status: 'inside' });
            toast.success('Vehicle marked as Inside');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleOverride = async (id) => {
        const reason = window.prompt('Enter Override Reason:');
        if (!reason) return;

        try {
            await gateService.updateVehicleStatus(id, { 
                status: 'inside', 
                overrideReason: reason 
            });
            toast.success('Status Overridden: Vehicle inside');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to override status');
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
            {/* Header */}
            <div className="px-1">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Approvals</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Entry Status</p>
            </div>

            <div className="grid gap-3">
                {requests.length > 0 ? (
                    requests.map(req => (
                        <div key={req._id} className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col gap-3 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-black text-gray-900 text-lg uppercase">{req.vehicleNumber}</h4>
                                    <p className="text-sm text-gray-500 font-medium">
                                        To: <span className="text-gray-900">{req.occupierMappedId?.name || 'Unknown'}</span> ({req.unitName})
                                    </p>
                                </div>
                                
                                <div className="flex flex-col items-end gap-1">
                                    {req.status === 'pending' && (
                                        <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1.5 whitespace-nowrap">
                                            <Clock size={12} /> Pending
                                        </span>
                                    )}
                                    {req.status === 'approved' && (
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1.5 whitespace-nowrap">
                                            <CheckCircle size={12} /> OK
                                        </span>
                                    )}
                                    {req.status === 'rejected' && (
                                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                                            <XCircle size={14} /> Rejected
                                        </span>
                                    )}
                                    {req.status === 'not_my_vehicle' && (
                                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                                            <AlertTriangle size={14} /> Flagged
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="h-px bg-gray-100 w-full my-1"></div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-semibold">
                                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                
                                <div className="flex gap-2">
                                    {req.status === 'approved' && (
                                        <button 
                                            onClick={() => handleLetIn(req._id)}
                                            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm"
                                        >
                                            Allow Entry
                                        </button>
                                    )}
                                    {['pending', 'rejected', 'not_my_vehicle'].includes(req.status) && (
                                        <button 
                                            onClick={() => handleOverride(req._id)}
                                            className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all"
                                        >
                                            <ShieldAlert size={16} /> Override
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-500">No Pending Approvals</h3>
                        <p className="text-sm text-gray-400">All registered entries have been processed.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default PendingApprovals;
