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
  Alert
} from 'react-native';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Truck,
  Filter,
  ShieldAlert
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const ApprovalItem = ({ item, onOverride }) => (
  <View style={[styles.card, SHADOWS.small]}>
    <View style={styles.cardHeader}>
       <View style={styles.entityInfo}>
          <View style={styles.iconBox}>
             <Truck size={18} color={COLORS.white} />
          </View>
          <Text style={styles.title}>{item.vehicleNumber}</Text>
       </View>
       <View style={[styles.statusTag, { 
         backgroundColor: item.status === 'APPROVED' ? COLORS.emerald500 + '15' : 
                          (item.status === 'PENDING_APPROVAL' ? COLORS.amber600 + '15' : COLORS.rose500 + '15') 
       }]}>
          <Text style={[styles.statusText, { 
            color: item.status === 'APPROVED' ? COLORS.emerald500 : 
                   (item.status === 'PENDING_APPROVAL' ? COLORS.amber600 : COLORS.rose500) 
          }]}>{item.status.replace('_', ' ')}</Text>
       </View>
    </View>

    <View style={styles.cardBody}>
       <View style={styles.infoRow}>
          <Building2 size={12} color={COLORS.gray400} />
          <Text style={styles.infoLabel}>Node Destination:</Text>
          <Text style={styles.infoValue}>{item.occupierMappedId?.name || 'Gate Security'}</Text>
       </View>
       <View style={styles.infoRow}>
          <Clock size={12} color={COLORS.gray400} />
          <Text style={styles.infoLabel}>Signal Age:</Text>
          <Text style={[styles.infoValue, { fontStyle: 'italic', fontWeight: '900' }]}>
            {Math.floor((new Date() - new Date(item.entryTime)) / 60000)}m Elasped
          </Text>
       </View>
    </View>

    {item.status === 'PENDING_APPROVAL' && (
      <View style={styles.cardFooter}>
         <TouchableOpacity 
           style={styles.denyBtn}
           onPress={() => onOverride(item._id, 'REJECTED')}
         >
            <Text style={styles.denyBtnText}>Quick Deny</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={styles.approveBtn}
           onPress={() => onOverride(item._id, 'APPROVED')}
         >
            <Text style={styles.approveBtnText}>Approve</Text>
         </TouchableOpacity>
      </View>
    )}
  </View>
);

const ApprovalLogsScreen = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('PENDING_APPROVAL');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await adminService.getVehicleLogs({ 
        status: activeFilter,
        limit: 50 
      });
      setApprovals(data.logs);
    } catch (err) {
      console.error('Fetch approvals error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApprovals();
  }, [activeFilter]);

  const handleOverride = async (id, status) => {
    Alert.alert(
      'Security Override',
      `Execute ${status.toLowerCase()} sequence?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await adminService.overrideLogStatus(id, { 
                status, 
                overrideReason: 'Administrative Mobile Override' 
              });
              fetchApprovals();
            } catch (e) {
              Alert.alert('Error', 'Override protocol failed');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
         <View>
           <Text style={[TYPOGRAPHY.h2, { textTransform: 'uppercase', fontStyle: 'italic', fontSize: 24 }]}>Consent Registry</Text>
           <Text style={styles.subtitle}>Neural Audit History</Text>
         </View>
         <TouchableOpacity 
           style={[styles.filterBtn, activeFilter === '' && { backgroundColor: COLORS.gray900 }]}
           onPress={() => setActiveFilter(activeFilter ? '' : 'PENDING_APPROVAL')}
         >
            <Filter size={20} color={activeFilter === '' ? COLORS.white : COLORS.gray900} />
         </TouchableOpacity>
      </View>

      <FlatList 
        data={approvals}
        renderItem={({ item }) => <ApprovalItem item={item} onOverride={handleOverride} />}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={() => (
          <View style={styles.headerRow}>
            <Text style={styles.listTitle}>{activeFilter ? 'Pending Signals' : 'Global History'}</Text>
            {loading && <ActivityIndicator size="small" color={COLORS.gray900} />}
          </View>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <ShieldAlert size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>Zero pending consents identified</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontStyle: 'italic',
    marginTop: 2,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  listContent: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  entityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.gray900,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray400,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray700,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray50,
  },
  denyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    alignItems: 'center',
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  denyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
});

export default ApprovalLogsScreen;
