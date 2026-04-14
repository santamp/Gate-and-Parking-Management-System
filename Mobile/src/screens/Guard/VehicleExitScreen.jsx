import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput
} from 'react-native';
import { Search, LogOut, ArrowRight, ArrowRightLeft } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';

const VehicleExitScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [insideVehicles, setInsideVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInsideVehicles = async () => {
    try {
      setLoading(true);
      const data = await gateService.getVehicleLogs({ status: 'approved,inside' });
      // Fetch calculation for each vehicle to show amount in the list
      const enriched = await Promise.all(data.data.map(async (v) => {
          try {
              const calc = await gateService.getExitCalculation(v._id);
              return { 
                  ...v, 
                  amount: calc.data.billAmount,
                  durationStr: `${Math.floor(calc.data.durationMinutes / 60)}h ${calc.data.durationMinutes % 60}m`,
                  calcData: calc.data
              };
          } catch (e) {
              return { ...v, amount: 0, durationStr: 'N/A' };
          }
      }));
      setInsideVehicles(enriched);
    } catch (error) {
      console.error('Error fetching inside vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInsideVehicles();
  }, []);

  const filtered = insideVehicles.filter(v => v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleProcessExit = async (vehicle) => {
    if (vehicle.amount > 0) {
      navigation.navigate('PaymentCollection', { 
          vehicle: { 
              logId: vehicle._id,
              plate: vehicle.vehicleNumber, 
              amount: vehicle.amount,
              calcData: vehicle.calcData
          } 
      });
    } else {
      try {
          setLoading(true);
          await gateService.registerVehicleExit(vehicle._id);
          fetchInsideVehicles();
      } catch (error) {
          alert(error.message || 'Exit failed');
      } finally {
          setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.searchBar, SHADOWS.small]}>
          <Search color={COLORS.gray400} size={20} />
          <TextInput 
            style={styles.searchInput}
            placeholder="ENTER PLATE NO..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Vehicles Inside ({filtered.length})</Text>
        
        <View style={styles.list}>
          {filtered.map(v => (
            <View key={v._id} style={[styles.card, SHADOWS.small]}>
              <View style={styles.cardHeader}>
                 <View>
                   <Text style={styles.plateText}>{v.vehicleNumber}</Text>
                   <Text style={styles.occupierText}>{v.occupierMappedId?.name || 'Gate Access'}</Text>
                 </View>
                 <ArrowRightLeft color={COLORS.gray100} size={40} />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>ENTRY TIME</Text>
                  <Text style={styles.statValue}>{new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>{v.durationStr}</Text>
                </View>
              </View>

              <TouchableOpacity 
                disabled={loading}
                style={[
                  styles.exitButton,
                  v.amount > 0 ? { backgroundColor: COLORS.warning } : { backgroundColor: COLORS.gray900 }
                ]}
                onPress={() => handleProcessExit(v)}
              >
                {v.amount > 0 ? (
                  <>
                    <Text style={styles.exitButtonText}>Collect ₹{v.amount} & Exit</Text>
                    <ArrowRight color={COLORS.white} size={20} />
                  </>
                ) : (
                  <>
                    <Text style={styles.exitButtonText}>Process Free Exit</Text>
                    <LogOut color={COLORS.white} size={20} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matching vehicles found inside</Text>
          </View>
        )}
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
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  searchInput: {
    flex: 1,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    fontWeight: '900',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
    paddingLeft: 4,
  },
  list: {
    gap: SPACING.lg,
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  plateText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gray900,
    letterSpacing: 1,
  },
  occupierText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray800,
    marginTop: 2,
  },
  exitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    gap: SPACING.sm,
  },
  exitButtonText: {
    ...TYPOGRAPHY.button,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    fontWeight: '600',
  },
});

export default VehicleExitScreen;
