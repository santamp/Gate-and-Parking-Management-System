import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Search, MapPin, Building, ArrowRight, Loader2 } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';

const OccupierSearchScreen = ({ navigation, route }) => {
  const { vehicleData, vehiclePhoto } = route.params || {};
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [occupiers, setOccupiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleData) {
      navigation.goBack();
      return;
    }

    const fetchOccupiers = async () => {
      try {
        setLoading(true);
        const response = await gateService.getOccupiers();
        setOccupiers(response.data);
      } catch (err) {
        setError('Failed to fetch occupiers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupiers();
  }, [vehicleData, navigation]);

  const filtered = occupiers.filter(occ => 
    occ.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (occ.unit && occ.unit.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (occ.block && occ.block.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirm = async () => {
    if (!selectedId || !vehicleData) return;

    try {
      setSubmitting(true);

      const selectedObj = occupiers.find(o => o._id === selectedId);
      if (!selectedObj) return;
      
      const formData = new FormData();
      formData.append('vehicleNumber', vehicleData.vehicleNumber);
      formData.append('vehicleType', vehicleData.vehicleType);
      formData.append('driverName', vehicleData.driverName);
      formData.append('driverPhone', vehicleData.driverPhone);
      formData.append('occupierMappedId', selectedObj.occupierUserId);
      if (selectedObj.unitId) {
        formData.append('unitId', selectedObj.unitId);
      }

      if (vehiclePhoto) {
        formData.append('vehiclePhoto', {
          uri: Platform.OS === 'android' ? vehiclePhoto.uri : vehiclePhoto.uri.replace('file://', ''),
          name: vehiclePhoto.fileName || `vehicle_${Date.now()}.jpg`,
          type: vehiclePhoto.type || 'image/jpeg',
        });
      }

      await gateService.registerVehicleEntry(formData);
      
      Alert.alert('Success', 'Vehicle entry request submitted successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Dashboard') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to register vehicle');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.searchBar, SHADOWS.small]}>
          <Search color={COLORS.gray400} size={20} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search company or unit..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            editable={!submitting}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {loading ? 'Fetching units...' : `Available Units (${filtered.length})`}
        </Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading occupiers...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(occ => (
              <TouchableOpacity 
                key={occ._id}
                style={[
                  styles.card,
                  selectedId === occ._id && styles.cardActive,
                  submitting && { opacity: 0.5 }
                ]}
                onPress={() => !submitting && setSelectedId(occ._id)}
                disabled={submitting}
              >
                <View style={styles.cardLeft}>
                  <View style={[
                    styles.iconBox,
                    { backgroundColor: selectedId === occ._id ? COLORS.primary : COLORS.gray100 }
                  ]}>
                    <Building color={selectedId === occ._id ? COLORS.white : COLORS.gray500} size={20} />
                  </View>
                  <View>
                    <Text style={[
                      styles.cardName,
                      selectedId === occ._id && { color: COLORS.primary }
                    ]}>
                      {occ.name}
                    </Text>
                    <View style={styles.cardDetail}>
                      <MapPin color={COLORS.primary} size={14} />
                      <Text style={styles.detailText}>{occ.unit || 'Unit A-1'} • {occ.block || 'Main Block'}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={[
                  styles.radio,
                  selectedId === occ._id && styles.radioActive
                ]}>
                  {selectedId === occ._id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No occupiers found</Text>
          </View>
        )}
      </ScrollView>

      {selectedId && (
        <View style={[styles.footer, SHADOWS.large]}>
          <TouchableOpacity 
            style={[styles.confirmButton, submitting && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirm Mapping</Text>
                <ArrowRight color={COLORS.white} size={20} />
              </>
            )}
          </TouchableOpacity>
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
    fontWeight: '600',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    paddingLeft: 4,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  list: {
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  cardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: SIZES.radiusLarge,
    gap: SPACING.sm,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.button,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    fontWeight: '600',
  },
});

export default OccupierSearchScreen;
