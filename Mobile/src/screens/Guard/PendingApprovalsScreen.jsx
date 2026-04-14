import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Clock, CheckCircle, XCircle, ShieldAlert, AlertTriangle } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';
import { useSocket } from '../../context/SocketContext';

const PendingApprovalsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refreshRequests = () => {
      fetchRequests();
    };

    socket.on('new_vehicle_log', refreshRequests);
    socket.on('log_updated', refreshRequests);

    return () => {
      socket.off('new_vehicle_log', refreshRequests);
      socket.off('log_updated', refreshRequests);
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const res = await gateService.getVehicleLogs();
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
      Alert.alert('Success', 'Vehicle marked as Inside');
      fetchRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleOverride = (id) => {
    Alert.prompt(
      'Override Entry',
      'Enter reason for overriding occupier approval:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Override', 
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Reason is required for override');
              return;
            }
            try {
              await gateService.updateVehicleStatus(id, { 
                status: 'inside', 
                overrideReason: reason 
              });
              Alert.alert('Success', 'Status Overridden: Vehicle inside');
              fetchRequests();
            } catch (error) {
              Alert.alert('Error', 'Failed to override status');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, SHADOWS.small]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.plateText}>{item.vehicleNumber}</Text>
          <Text style={styles.occupierText}>{item.occupierMappedId?.name || 'Unknown'}</Text>
          <Text style={styles.unitText}>{item.unitName} • {item.blockName}</Text>
        </View>

        <View style={styles.badgeContainer}>
          {item.status === 'pending' && (
            <View style={[styles.badge, { backgroundColor: '#fff7ed' }]}>
              <Clock color="#ea580c" size={14} />
              <Text style={[styles.badgeText, { color: '#ea580c' }]}>Pending</Text>
            </View>
          )}
          {item.status === 'approved' && (
            <View style={[styles.badge, { backgroundColor: '#ecfdf5' }]}>
              <CheckCircle color="#059669" size={14} />
              <Text style={[styles.badgeText, { color: '#059669' }]}>Approved</Text>
            </View>
          )}
          {item.status === 'rejected' && (
            <View style={[styles.badge, { backgroundColor: '#fef2f2' }]}>
              <XCircle color="#dc2626" size={14} />
              <Text style={[styles.badgeText, { color: '#dc2626' }]}>Rejected</Text>
            </View>
          )}
          {item.status === 'not_my_vehicle' && (
            <View style={[styles.badge, { backgroundColor: '#fff7ed' }]}>
              <AlertTriangle color="#ea580c" size={14} />
              <Text style={[styles.badgeText, { color: '#ea580c' }]}>Flagged</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        
        <View style={styles.actionContainer}>
          {item.status === 'approved' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.success }]}
              onPress={() => handleLetIn(item._id)}
            >
              <Text style={styles.actionButtonText}>Let In</Text>
            </TouchableOpacity>
          )}
          {['pending', 'rejected', 'not_my_vehicle'].includes(item.status) && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.dangerLight }]}
              onPress={() => handleOverride(item._id)}
            >
              <ShieldAlert color={COLORS.danger} size={16} style={{ marginRight: 4 }} />
              <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Override</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.h2}>Entry Requests</Text>
        <Text style={styles.subtitle}>Real-time approval tracking</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle color={COLORS.gray300} size={64} style={{ marginBottom: 16 }} />
              <Text style={TYPOGRAPHY.h3}>No Pending Requests</Text>
              <Text style={styles.emptyText}>All vehicles have been processed.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    marginBottom: SPACING.lg,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.gray500,
    marginTop: 4,
  },
  list: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plateText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.gray900,
    letterSpacing: 0.5,
  },
  occupierText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray500,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray50,
    marginVertical: SPACING.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray400,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  unitText: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    marginTop: 4,
  },
});

export default PendingApprovalsScreen;
