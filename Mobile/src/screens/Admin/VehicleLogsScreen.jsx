import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';
import { useSocket } from '../../context/SocketContext';

const LogItem = ({ log }) => (
  <TouchableOpacity style={[styles.logCard, SHADOWS.small]}>
    <View style={styles.logHeader}>
       <View style={styles.vehicleInfo}>
          <View style={styles.iconBox}>
             <Truck size={20} color={COLORS.gray900} />
          </View>
          <View>
             <Text style={styles.vehicleId}>{log.vehicleNumber}</Text>
             <Text style={styles.logId}>{log.vehicleType} • {log.driverName || 'No Driver Info'}</Text>
          </View>
       </View>
       <View style={[styles.statusBadge, { 
         backgroundColor: log.status === 'IN_GATE' ? COLORS.emerald500 + '15' : 
                          log.status === 'PENDING_APPROVAL' ? COLORS.amber600 + '15' : COLORS.gray100 
       }]}>
          <Text style={[styles.statusText, { 
            color: log.status === 'IN_GATE' ? COLORS.emerald500 : 
                   log.status === 'PENDING_APPROVAL' ? COLORS.amber600 : COLORS.gray500 
          }]}>{log.status.replace('_', ' ')}</Text>
       </View>
    </View>

    <View style={styles.logDetails}>
       <View style={styles.detailItem}>
          <MapPin size={12} color={COLORS.gray400} />
          <Text style={styles.detailText}>{log.occupierMappedId?.name || 'Gate Access'}</Text>
       </View>
       <View style={styles.divider} />
       <View style={styles.timeRow}>
          <View style={styles.timeItem}>
             <ArrowDownRight size={10} color={COLORS.emerald500} />
             <Text style={styles.timeLabel}>Entry:</Text>
             <Text style={styles.timeValue}>{new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.timeItem}>
             <ArrowUpRight size={10} color={COLORS.rose500} />
             <Text style={styles.timeLabel}>Exit:</Text>
             <Text style={styles.timeValue}>{log.exitTime ? new Date(log.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>
          </View>
       </View>
    </View>
  </TouchableOpacity>
);

const VehicleLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const socket = useSocket();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getVehicleLogs({ 
        search: searchQuery, 
        status: statusFilter,
        limit: 50
      });
      setLogs(data.logs);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!socket) return;

    const refreshLogs = () => {
      fetchLogs();
    };

    socket.on('new_vehicle_log', refreshLogs);
    socket.on('log_updated', refreshLogs);

    return () => {
      socket.off('new_vehicle_log', refreshLogs);
      socket.off('log_updated', refreshLogs);
    };
  }, [socket, fetchLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, [fetchLogs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
         <View style={styles.searchBox}>
            <Search size={18} color={COLORS.gray900} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search Vehicle ID..."
              placeholderTextColor={COLORS.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchLogs}
            />
         </View>
         <TouchableOpacity 
           style={[styles.filterBtn, statusFilter && { backgroundColor: COLORS.gray900 }]}
           onPress={() => setStatusFilter(statusFilter ? '' : 'IN_GATE')}
         >
            <Filter size={20} color={statusFilter ? COLORS.white : COLORS.gray900} />
         </TouchableOpacity>
      </View>

      <FlatList 
        data={logs}
        renderItem={({ item }) => <LogItem log={item} />}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.listTitle}>Registry Nodes</Text>
            {loading && <ActivityIndicator size="small" color={COLORS.gray900} />}
          </View>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <AlertCircle size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>Zero activity nodes discovered</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  topBar: {
    flexDirection: 'row',
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.gray900,
    fontSize: 13,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  listContent: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.lg,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  listTitle: {
    ...TYPOGRAPHY.h3,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    fontSize: 14,
    color: COLORS.gray400,
  },
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.gray900,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  vehicleId: {
    ...TYPOGRAPHY.h4,
    color: COLORS.gray900,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  logId: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  logDetails: {
    backgroundColor: COLORS.gray50,
    borderRadius: 20,
    padding: SPACING.lg,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray900,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.gray900,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});

export default VehicleLogsScreen;
