import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Truck, Check, X, Info, Clock } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';
import authService from '../../services/authService';
import { useSocket } from '../../context/SocketContext';

const ApprovalsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    let unitRoomEvent;

    const refreshRequests = () => {
      fetchRequests();
    };

    const joinRoom = async () => {
      const user = await authService.getCurrentUser();
      if (!user?._id) return;

      socket.emit('join_unit_room', user._id);
      unitRoomEvent = `unit_${user._id}`;
      socket.on(unitRoomEvent, refreshRequests);
    };

    joinRoom();
    socket.on('log_updated', refreshRequests);

    return () => {
      if (unitRoomEvent) {
        socket.off(unitRoomEvent, refreshRequests);
      }
      socket.off('log_updated', refreshRequests);
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await gateService.getVehicleLogs({ status: 'pending' });
      setRequests(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (id, action) => {
    const titles = {
      approve: 'Approve Entry',
      reject: 'Reject Entry',
      notMine: 'Not My Vehicle'
    };

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      notMine: 'not_my_vehicle'
    };
    
    Alert.alert(
      titles[action],
      `Are you sure you want to ${action === 'notMine' ? 'flag this as Not Your Vehicle' : action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await gateService.updateVehicleStatus(id, { status: statusMap[action] });
              setRequests(prev => prev.filter(r => r._id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to update vehicle status');
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.medium]}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <View style={styles.iconCircle}>
            <Truck color={COLORS.primary} size={24} />
          </View>
          <View>
            <Text style={styles.vehicleNo}>{item.vehicleNumber}</Text>
            <Text style={styles.vehicleType}>{item.vehicleType} • {item.driverName || 'No Driver'}</Text>
          </View>
        </View>
        <View style={styles.timeTag}>
          <Clock size={12} color={COLORS.gray400} />
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleAction(item._id, 'approve')}
        >
          <Check color={COLORS.white} size={20} />
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleAction(item._id, 'reject')}
        >
          <X color={COLORS.danger} size={20} />
          <Text style={[styles.btnText, { color: COLORS.danger }]}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.infoBtn]}
          onPress={() => handleAction(item._id, 'notMine')}
        >
          <Info color={COLORS.gray500} size={20} />
          <Text style={[styles.btnText, { color: COLORS.gray500 }]}>Not Mine</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching requests...</Text>
        </View>
      ) : requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.headerTitle}>Pending Approvals ({requests.length})</Text>
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Check color={COLORS.success} size={64} style={{ marginBottom: 16 }} />
          <Text style={TYPOGRAPHY.h2}>All Caught Up!</Text>
          <Text style={styles.emptySubtext}>No pending approval requests for your unit.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  list: {
    padding: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.lg,
    color: COLORS.gray600,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleNo: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  vehicleType: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
    flex: 1.5,
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  infoBtn: {
    backgroundColor: COLORS.gray100,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.gray500,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.gray500,
  },
});

export default ApprovalsScreen;
