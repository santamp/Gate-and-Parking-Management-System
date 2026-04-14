import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  BarChart, 
  TrendingUp, 
  Calendar, 
  Download, 
  ChevronRight,
  PieChart,
  Activity,
  IndianRupee,
  ShieldCheck,
  Zap,
  Cpu
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const ReportCard = ({ title, subtitle, value, icon: Icon, color, loading }) => (
  <TouchableOpacity style={[styles.reportCard, SHADOWS.small]}>
    <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
       <Icon color={color} size={24} />
    </View>
    <View style={styles.cardInfo}>
       <Text style={styles.cardTitle}>{title}</Text>
       <Text style={styles.cardSub}>{subtitle}</Text>
    </View>
    {loading ? (
       <ActivityIndicator size="small" color={COLORS.gray200} />
    ) : (
       <Text style={[styles.cardValue, { color }]}>{value}</Text>
    )}
  </TouchableOpacity>
);

const ReportsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReportData = async () => {
    try {
      const stats = await adminService.getStats();
      setData(stats);
    } catch (err) {
      console.error('Fetch report stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportData();
  }, []);

  const handleExport = () => {
    Alert.alert(
      'Protocol Initiated',
      'System is compiling neural audit history into a unified ledger archive.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate Archive', 
          onPress: () => Alert.alert('Processing', 'Global log export sequence in progress...') 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <View>
           <Text style={[TYPOGRAPHY.h1, { textTransform: 'uppercase', fontStyle: 'italic' }]}>Neural Audit</Text>
           <Text style={styles.subtitle}>System Financial Topology</Text>
         </View>
         <TouchableOpacity style={styles.dateBtn}>
            <Calendar color={COLORS.gray900} size={18} />
            <Text style={styles.dateText}>Live Sync</Text>
         </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analytical Nodes</Text>
            <ReportCard 
               title="Revenue Today" 
               subtitle="Live collected gateway fees" 
               value={`₹${data?.finance?.revenueToday ?? '0'}`}
               icon={DollarSign} 
               color={COLORS.emerald500} 
               loading={loading}
            />
            <ReportCard 
               title="Security Density" 
               subtitle="Vehicles currently in perimeter" 
               value={data?.vehicles?.inside ?? '0'}
               icon={TrendingUp} 
               color={COLORS.indigo600} 
               loading={loading}
            />
            <ReportCard 
               title="Active Users" 
               subtitle="Nodes authenticated this cycle" 
               value={data?.users?.total ?? '0'}
               icon={Cpu} 
               color={COLORS.amber600} 
               loading={loading}
            />
            <ReportCard 
               title="Grid Units" 
               subtitle="Provisioned infrastructure nodes" 
               value={data?.infrastructure?.units ?? '0'}
               icon={Zap} 
               color={COLORS.gray900} 
               loading={loading}
            />
         </View>

         <View style={[styles.proCard, { backgroundColor: COLORS.gray900 }, SHADOWS.medium]}>
            <View style={styles.proInfo}>
               <Text style={[styles.proTitle, { textTransform: 'uppercase', fontStyle: 'italic' }]}>Ledger Archive</Text>
               <Text style={styles.proSub}>Compile global system activity into a secure transmission packet.</Text>
            </View>
            <TouchableOpacity style={styles.downloadBtn} onPress={handleExport}>
               <Download color={COLORS.white} size={20} />
               <Text style={styles.downloadText}>Export</Text>
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
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray900,
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.xl,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    color: COLORS.gray400,
    marginBottom: 4,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.gray900,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  cardSub: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gray400,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  proCard: {
    padding: SPACING.xl,
    paddingVertical: SPACING.xxl,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  proInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  proTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  proSub: {
    color: COLORS.white,
    opacity: 0.6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 16,
  },
  downloadBtn: {
    backgroundColor: COLORS.emerald500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

export default ReportsScreen;
