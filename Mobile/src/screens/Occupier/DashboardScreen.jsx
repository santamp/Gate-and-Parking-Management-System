import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Bell, Truck, Clock, ShieldCheck, ChevronRight, LayoutDashboard } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import authService from '../../services/authService';
import gateService from '../../services/gateService';
import { useSocket } from '../../context/SocketContext';

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pending: 0, today: 0, rejected: 0 });
  const [pendingLogs, setPendingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchDashboardData = async () => {
    try {
      const response = await gateService.getVehicleLogs();
      const logs = response.data || [];
      const today = new Date().toDateString();
      const pending = logs.filter(log => log.status === 'pending');
      const todayLogs = logs.filter(log => new Date(log.createdAt).toDateString() === today);
      const rejected = logs.filter(log => log.status === 'rejected' || log.status === 'not_my_vehicle');

      setStats({
        pending: pending.length,
        today: todayLogs.length,
        rejected: rejected.length,
      });
      setPendingLogs(pending.slice(0, 2));
    } catch (error) {
      console.error('Failed to fetch occupier dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      fetchDashboardData();
    };

    initializeDashboard();
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return undefined;

    socket.emit('join_unit_room', user._id);

    const refreshDashboard = () => {
      fetchDashboardData();
    };

    socket.on(`unit_${user._id}`, refreshDashboard);
    socket.on('new_vehicle_log', refreshDashboard);
    socket.on('log_updated', refreshDashboard);

    return () => {
      socket.off(`unit_${user._id}`, refreshDashboard);
      socket.off('new_vehicle_log', refreshDashboard);
      socket.off('log_updated', refreshDashboard);
    };
  }, [socket, user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Occupier'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell color={COLORS.white} size={24} />
            {stats.pending > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
              <Clock color={COLORS.primary} size={20} />
            </View>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.iconContainer, { backgroundColor: '#def7ec' }]}>
              <Truck color={COLORS.success} size={20} />
            </View>
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.iconContainer, { backgroundColor: '#fdf2f2' }]}>
              <ShieldCheck color={COLORS.danger} size={20} />
            </View>
            <Text style={styles.statValue}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={TYPOGRAPHY.h3}>Recent Approvals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Approvals')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {pendingLogs.length === 0 && !loading ? (
            <View style={[styles.requestCard, SHADOWS.small]}>
              <View style={styles.requestDetails}>
                <Text style={styles.vehicleNo}>No pending approvals</Text>
                <Text style={styles.requestTime}>New gate entries will appear here</Text>
              </View>
            </View>
          ) : pendingLogs.map((item) => (
            <View key={item._id} style={[styles.requestCard, SHADOWS.small]}>
              <View style={styles.requestIcon}>
                <Truck color={COLORS.primary} size={24} />
              </View>
              <View style={styles.requestDetails}>
                <Text style={styles.vehicleNo}>{item.vehicleNumber}</Text>
                <Text style={styles.requestTime}>{item.driverName || 'Driver'} • Awaiting your approval</Text>
              </View>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Approvals')}
              >
                <ChevronRight color={COLORS.gray400} size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={[TYPOGRAPHY.h3, { marginBottom: SPACING.md }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.quickActionCard, SHADOWS.small]}>
              <LayoutDashboard color={COLORS.primary} size={24} />
              <Text style={styles.quickActionText}>Unit Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionCard, SHADOWS.small]}>
              <ShieldCheck color={COLORS.accent} size={24} />
              <Text style={styles.quickActionText}>Pre-Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: SIZES.radiusLarge,
    borderBottomRightRadius: SIZES.radiusLarge,
  },
  greeting: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
    marginTop: -SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SPACING.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    marginTop: 2,
  },
  section: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  requestIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  requestDetails: {
    flex: 1,
  },
  vehicleNo: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  actionBtn: {
    padding: SPACING.sm,
  },
  quickActions: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
  },
});

export default DashboardScreen;
