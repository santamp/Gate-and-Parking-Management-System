import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { PlusCircle, Clock, CheckCircle, LogOut, Map as MapIcon } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';
import { useSocket } from '../../context/SocketContext';

const DashboardScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socket = useSocket();

  const fetchLogs = async () => {
    try {
      const response = await gateService.getVehicleLogs();
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewLog = (newLog) => {
      setLogs((prev) => [newLog, ...prev.filter((log) => log._id !== newLog._id)]);
    };

    const handleLogUpdated = (updatedLog) => {
      setLogs((prev) =>
        prev.map((log) => (log._id === updatedLog._id ? { ...log, ...updatedLog } : log))
      );
    };

    socket.on('new_vehicle_log', handleNewLog);
    socket.on('log_updated', handleLogUpdated);

    return () => {
      socket.off('new_vehicle_log', handleNewLog);
      socket.off('log_updated', handleLogUpdated);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const activeSessions = logs.filter(l => ['inside', 'approved', 'pending'].includes(l.status)).length;
  const pendingCount = logs.filter(l => l.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        
        <View style={styles.welcomeSection}>
          <Text style={TYPOGRAPHY.h2}>Gate Post 1 🛡️</Text>
          <Text style={styles.welcomeSubtitle}>Hello, Guard! {activeSessions} active sessions.</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: COLORS.primary }, SHADOWS.medium]}
            onPress={() => navigation.navigate('VehicleEntry')}
          >
            <View style={styles.actionIconContainer}>
              <PlusCircle color={COLORS.white} size={24} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>New Entry</Text>
              <Text style={styles.actionSubtitle}>REGISTER VEHICLE</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: COLORS.warning }, SHADOWS.medium]}
            onPress={() => navigation.navigate('SiteMap')}
          >
            <View style={styles.actionIconContainer}>
              <MapIcon color={COLORS.white} size={24} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Site Map</Text>
              <Text style={styles.actionSubtitle}>EXPLORE UNITS</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.menuCard, SHADOWS.small]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('PendingApprovals')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#fff7ed' }]}>
                <Clock color="#ea580c" size={20} />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Pending Approvals</Text>
                <Text style={styles.menuItemSubtitle}>{pendingCount} units awaiting</Text>
              </View>
            </View>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.exitButton, SHADOWS.small]} 
          onPress={() => navigation.navigate('VehicleExit')}
        >
          <LogOut color={COLORS.white} size={20} />
          <Text style={styles.exitButtonText}>EXIT & BILL PROCESSING</Text>
        </TouchableOpacity>

        <View style={styles.trafficSection}>
          <Text style={[TYPOGRAPHY.h3, { marginBottom: SPACING.md }]}>Live Traffic</Text>
          
          <View style={styles.queue}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : logs.length === 0 ? (
              <View style={styles.emptyQueue}>
                <Text style={styles.emptyText}>ZERO TRAFFIC DETECTED</Text>
              </View>
            ) : logs.slice(0, 5).map(log => (
              <View key={log._id} style={[styles.trafficCard, SHADOWS.small, log.status === 'exited' && { opacity: 0.6 }]}>
                <View style={styles.trafficCardLeft}>
                  <View style={[styles.trafficIcon, { 
                    backgroundColor: log.status === 'pending' ? '#fff7ed' : 
                                  log.status === 'rejected' ? '#fef2f2' : '#ecfdf5' 
                  }]}>
                    {log.status === 'pending' ? (
                      <Clock color="#ea580c" size={20} />
                    ) : (
                      <CheckCircle color={log.status === 'rejected' ? COLORS.danger : '#059669'} size={20} />
                    )}
                  </View>
                  <View>
                    <Text style={[TYPOGRAPHY.h3, { fontSize: 16 }]}>{log.vehicleNumber}</Text>
                    <Text style={styles.trafficDetail}>
                      {log.occupierMappedId?.name?.toUpperCase()} • UNIT {log.unitName?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusTag, { 
                  backgroundColor: log.status === 'pending' ? '#fff7ed' : 
                                  log.status === 'rejected' ? '#fef2f2' : '#ecfdf5' 
                }]}>
                  <Text style={[styles.statusText, { 
                    color: log.status === 'pending' ? '#ea580c' : 
                           log.status === 'rejected' ? COLORS.danger : '#059669' 
                  }]}>
                    {log.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
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
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  welcomeSubtitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.gray500,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    height: 160,
    borderRadius: SIZES.radiusLarge,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  actionIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontSize: 20,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.gray800,
    fontSize: 14,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  exitButton: {
    backgroundColor: COLORS.gray900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: SIZES.radiusLarge,
    gap: 12,
    marginBottom: SPACING.lg,
  },
  exitButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 12,
    letterSpacing: 1,
  },
  trafficSection: {
    marginTop: SPACING.sm,
  },
  queue: {
    gap: SPACING.sm,
  },
  emptyQueue: {
    padding: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.gray100,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray300,
    letterSpacing: 2,
  },
  trafficCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trafficCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  trafficIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trafficDetail: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray500,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default DashboardScreen;
