import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { 
  TrendingUp, 
  Users, 
  Truck, 
  CreditCard, 
  ChevronRight, 
  Bell,
  Activity,
  ShieldCheck,
  Zap,
  IndianRupee
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const StatCard = ({ title, value, change, icon: Icon, color, loading }) => (
  <View style={[styles.statCard, SHADOWS.small]}>
    <View style={styles.statHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={[styles.changeText, { color: COLORS.emerald500 }]}>
        Live
      </Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={COLORS.gray200} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
    ) : (
      <Text style={styles.statValue}>{value}</Text>
    )}
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const stats = await adminService.getStats();
      setData(stats);
    } catch (err) {
      console.error('Mobile Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[TYPOGRAPHY.h1, { textTransform: 'uppercase', fontStyle: 'italic' }]}>Admin Hub</Text>
          <Text style={styles.subtitle}>Global System Oversight</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell color={COLORS.gray900} size={24} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Vehicles Inside" 
            value={data?.vehicles?.inside ?? '0'} 
            change="Live" 
            icon={Truck} 
            color={COLORS.primary} 
            loading={loading}
          />
          <StatCard 
            title="Today Revenue" 
            value={`₹${data?.finance?.revenueToday ?? '0'}`} 
            change="Live" 
            icon={CreditCard} 
            color={COLORS.emerald500} 
            loading={loading}
          />
          <StatCard 
            title="Total Units" 
            value={data?.infrastructure?.units ?? '0'} 
            change="Sync" 
            icon={Zap} 
            color={COLORS.amber600} 
            loading={loading}
          />
          <StatCard 
            title="Active Users" 
            value={data?.users?.total ?? '0'} 
            change="Active" 
            icon={Users} 
            color={COLORS.indigo600} 
            loading={loading}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textTransform: 'uppercase', fontStyle: 'italic', fontSize: 14 }]}>Command Center</Text>
          <View style={styles.actionGrid}>
            {[
              { label: 'Approvals', icon: ShieldCheck, route: 'ApprovalLogs', color: COLORS.gray900 },
              { label: 'Users', icon: Users, route: 'UserManagement', color: COLORS.gray900 },
              { label: 'Mapping', icon: Activity, route: 'WarehouseMapping', color: COLORS.gray900 },
              { label: 'Payments', icon: CreditCard, route: 'Reports', color: COLORS.gray900 },
              { label: 'Pricing', icon: IndianRupee, route: 'ParkingConfig', color: COLORS.gray900 },
            ].map((action, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.actionCard, SHADOWS.small]}
                onPress={() => navigation.navigate(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                   <action.icon color={COLORS.white} size={20} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Health */}
        <View style={[styles.healthCard, { backgroundColor: COLORS.gray900 }, SHADOWS.medium]}>
           <View style={styles.healthInfo}>
              <Text style={[styles.healthTitle, { textTransform: 'uppercase', fontStyle: 'italic' }]}>System Status: OK</Text>
              <Text style={styles.healthSub}>All security nodes operational</Text>
           </View>
           <TouchableOpacity style={styles.healthBtn}>
              <Text style={styles.healthBtnText}>Sync</Text>
           </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    backgroundColor: COLORS.emerald500,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.gray900,
    marginBottom: 4,
    fontSize: 24,
  },
  statTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '22%',
    aspectRatio: 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray900,
    textTransform: 'uppercase',
  },
  healthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingVertical: SPACING.xxl,
    borderRadius: 32,
    marginTop: SPACING.md,
  },
  healthTitle: {
    color: COLORS.white,
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  healthSub: {
    color: COLORS.white,
    opacity: 0.6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  healthBtn: {
    backgroundColor: COLORS.emerald500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  healthBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

export default AdminDashboardScreen;
