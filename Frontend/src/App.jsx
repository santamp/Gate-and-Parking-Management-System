import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MobileLayout from './layouts/MobileLayout';
import GuardDashboard from './pages/Guard/GuardDashboard';
import VehicleEntry from './pages/Guard/VehicleEntry';
import OccupierSearch from './pages/Guard/OccupierSearch';
import PendingApprovals from './pages/Guard/PendingApprovals';
import VehicleExit from './pages/Guard/VehicleExit';
import PaymentCollection from './pages/Guard/PaymentCollection';
import History from './pages/Guard/History';
import SiteMap from './pages/Guard/SiteMap';
import Profile from './pages/Guard/Profile';

import OccupierDashboard from './pages/Occupier/OccupierDashboard';
import OccupierApprovals from './pages/Occupier/OccupierApprovals';
import OccupierHistory from './pages/Occupier/OccupierHistory';
import UnitDetails from './pages/Occupier/UnitDetails';
import OccupierLayout from './layouts/OccupierLayout';

// Admin Imports
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import WarehouseMapping from './pages/Admin/WarehouseMapping';
import ParkingConfig from './pages/Admin/ParkingConfig';
import VehicleLogs from './pages/Admin/VehicleLogs';
import ApprovalLogs from './pages/Admin/ApprovalLogs';
import BillingPayments from './pages/Admin/BillingPayments';
import AuditLogs from './pages/Admin/AuditLogs';
import ProjectManagement from './pages/Admin/ProjectManagement';

import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        
        {/* Guard Routes wrapped in Mobile App Shell */}
        <Route element={<ProtectedRoute allowedRoles={['GUARD']} />}>
          <Route path="/guard" element={<MobileLayout />}>
            <Route index element={<GuardDashboard />} />
            <Route path="entry" element={<VehicleEntry />} />
            <Route path="site-map" element={<SiteMap />} />
            <Route path="occupier-search" element={<OccupierSearch />} />
            <Route path="pending" element={<PendingApprovals />} />
            <Route path="exit" element={<VehicleExit />} />
            <Route path="payment" element={<PaymentCollection />} />
            <Route path="logs" element={<History />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Occupier Routes */}
        <Route element={<ProtectedRoute allowedRoles={['OCCUPIER']} />}>
          <Route path="/occupier" element={<OccupierLayout />}>
             <Route index element={<OccupierDashboard />} />
             <Route path="approvals" element={<OccupierApprovals />} />
             <Route path="history" element={<OccupierHistory />} />
             <Route path="profile" element={<UnitDetails />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
             <Route index element={<AdminDashboard />} />
             <Route path="projects" element={<ProjectManagement />} />
             <Route path="mapping" element={<WarehouseMapping />} />
             <Route path="users" element={<UserManagement />} />
             <Route path="vehicle-logs" element={<VehicleLogs />} />
             <Route path="approval-logs" element={<ApprovalLogs />} />
             <Route path="billing" element={<BillingPayments />} />
             <Route path="revenue" element={<ParkingConfig />} />
             <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
