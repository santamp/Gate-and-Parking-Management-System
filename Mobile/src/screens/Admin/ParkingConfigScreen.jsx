import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  IndianRupee, 
  Clock, 
  Save, 
  RotateCcw,
  Truck,
  Car,
  Bike,
  AlertCircle,
  Tag
} from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const RateCard = ({ rate, index, onRateChange }) => {
  const typeConfigs = {
    'Truck (L)': { icon: Truck, color: COLORS.primary },
    'Truck (M)': { icon: Truck, color: COLORS.indigo600 },
    'Van / Commercial': { icon: Truck, color: COLORS.amber600 },
    'Private Car': { icon: Car, color: COLORS.emerald500 },
    'Two Wheeler': { icon: Bike, color: COLORS.slate600 }
  };

  const config = typeConfigs[rate.vehicleType] || { icon: Tag, color: COLORS.gray600 };
  const Icon = config.icon;

  return (
    <View style={[styles.rateCard, SHADOWS.small]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: config.color + '15' }]}>
          <Icon color={config.color} size={24} />
        </View>
        <Text style={styles.vehicleType}>{rate.vehicleType}</Text>
      </View>

      <View style={styles.inputsGrid}>
        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>Base</Text>
          <View style={styles.inputWrapper}>
            <IndianRupee size={10} color={COLORS.gray400} />
            <TextInput
              style={styles.textInput}
              value={String(rate.baseFee)}
              onChangeText={(v) => onRateChange(index, 'baseFee', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>Hour</Text>
          <View style={styles.inputWrapper}>
            <IndianRupee size={10} color={COLORS.gray400} />
            <TextInput
              style={styles.textInput}
              value={String(rate.hourlyRate)}
              onChangeText={(v) => onRateChange(index, 'hourlyRate', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>Day</Text>
          <View style={styles.inputWrapper}>
            <IndianRupee size={10} color={COLORS.gray400} />
            <TextInput
              style={styles.textInput}
              value={String(rate.dailyMax)}
              onChangeText={(v) => onRateChange(index, 'dailyMax', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>Week</Text>
          <View style={styles.inputWrapper}>
            <IndianRupee size={10} color={COLORS.gray400} />
            <TextInput
              style={styles.textInput}
              value={String(rate.weeklyRate || 0)}
              onChangeText={(v) => onRateChange(index, 'weeklyRate', v)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputCol}>
          <Text style={styles.inputLabel}>Month</Text>
          <View style={styles.inputWrapper}>
            <IndianRupee size={10} color={COLORS.gray400} />
            <TextInput
              style={styles.textInput}
              value={String(rate.monthlyRate || 0)}
              onChangeText={(v) => onRateChange(index, 'monthlyRate', v)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.graceRow}>
        <View style={styles.graceInfo}>
          <Clock size={14} color={COLORS.gray400} />
          <Text style={styles.graceLabel}>Grace Period</Text>
        </View>
        <View style={styles.gracePicker}>
           <Text style={styles.graceValue}>{rate.gracePeriod} MINS</Text>
        </View>
      </View>
    </View>
  );
};

const ParkingConfigScreen = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const fetchRates = async () => {
    try {
      const res = await adminService.getParkingSettings();
      if (res.success) {
        setRates(res.data);
      }
    } catch (err) {
      console.error('Fetch rates mobile error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRates();
  }, []);

  const handleRateChange = (index, field, value) => {
    const updated = [...rates];
    updated[index][field] = Number(value) || 0;
    setRates(updated);
  };

  const handleAddNew = () => {
    if (!newTypeName.trim()) {
      Alert.alert('Error', 'Please enter a classification name');
      return;
    }
    if (rates.some(r => r.vehicleType.toLowerCase() === newTypeName.toLowerCase())) {
      Alert.alert('Error', 'This classification already exists');
      return;
    }
    const newRate = {
      vehicleType: newTypeName,
      baseFee: 0,
      hourlyRate: 0,
      dailyMax: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      gracePeriod: 15
    };
    setRates([...rates, newRate]);
    setNewTypeName('');
    setShowAddModal(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await adminService.updateParkingSettings(rates);
      if (res.success) {
        fetchRates();
      }
    } catch (err) {
      console.error('Save rates mobile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing Revenue Nodes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Revenue Config</Text>
            <Text style={styles.headerSubtitle}>Configure vehicle classification tariffs</Text>
          </View>

          {rates.map((rate, idx) => (
            <RateCard 
              key={idx} 
              rate={rate} 
              index={idx} 
              onRateChange={handleRateChange} 
            />
          ))}

          <View style={styles.infoBox}>
            <AlertCircle color={COLORS.amber600} size={18} />
            <Text style={styles.infoText}>
              System Note: Rate changes are logged in the neural audit. Active parking sessions persist original rates until termination.
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={styles.addCard}
          onPress={() => setShowAddModal(true)}
        >
          <Tag size={24} color={COLORS.gray400} />
          <Text style={styles.addText}>Define New Classification</Text>
        </TouchableOpacity>

        {/* Add New Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Define Node</Text>
              <TextInput
                style={styles.modalInput}
                value={newTypeName}
                onChangeText={setNewTypeName}
                placeholder="e.g. Electric Vehicle"
                placeholderTextColor={COLORS.gray300}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddNew}
                >
                  <Text style={styles.confirmButtonText}>Append Tier</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={[styles.footer, SHADOWS.large]}>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Save color={COLORS.white} size={20} />
                <Text style={styles.saveBtnText}>Commit Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  rateCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  iconBox: {
    padding: 12,
    borderRadius: 16,
  },
  vehicleType: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  inputsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  inputCol: {
    flex: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  textInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.gray900,
    fontStyle: 'italic',
  },
  graceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray50,
    padding: 12,
    borderRadius: 16,
  },
  graceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  graceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray500,
    fontStyle: 'italic',
  },
  graceValue: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.amber600,
    textTransform: 'uppercase',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.amber50,
    padding: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.amber100,
    gap: 12,
    marginTop: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.amber900,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  saveBtn: {
    backgroundColor: COLORS.gray900,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addCard: {
    backgroundColor: COLORS.gray50,
    marginHorizontal: SPACING.xl,
    marginTop: -80,
    marginBottom: 100,
    padding: 30,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray200,
    alignItems: 'center',
    gap: 12,
  },
  addText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    borderRadius: 32,
    padding: 32,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 12,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    marginBottom: 24,
    color: COLORS.gray900,
  },
  modalInput: {
    backgroundColor: COLORS.gray50,
    height: 60,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray100,
  },
  confirmButton: {
    backgroundColor: COLORS.gray900,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
});

export default ParkingConfigScreen;
