import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';

const PaymentCollectionScreen = ({ route, navigation }) => {
  const { vehicle } = route.params || {};
  const [method, setMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const handlePayment = async () => {
    try {
        setLoading(true);
        
        // 1. Process payment
        await gateService.processPayment({
            logId: vehicle.logId,
            paymentMethod: method === 'UPI' ? 'UPI' : 'CASH',
            transactionId: method === 'UPI' ? transactionId : null,
            amount: vehicle.amount,
            totalHours: vehicle.calcData.totalHours,
            durationMinutes: vehicle.calcData.durationMinutes,
            appliedRates: vehicle.calcData.appliedRates,
            exitTime: vehicle.calcData.exitTime
        });

        // 2. Finalize Exit
        await gateService.registerVehicleExit(vehicle.logId);

        alert('Payment processed and vehicle exited');
        navigation.replace('GuardMain');
    } catch (error) {
        alert(error.message || 'Payment processing failed');
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, SHADOWS.small]}>
            <CreditCard color={COLORS.warning} size={32} />
          </View>
          <Text style={TYPOGRAPHY.h2}>Process Payment</Text>
          <Text style={styles.subtitle}>VEHICLE: {vehicle.plate}</Text>
        </View>

        <View style={[styles.amountCard, SHADOWS.large]}>
          <Text style={styles.amountLabel}>TOTAL DUE</Text>
          <Text style={styles.amountValue}>₹{vehicle.amount}</Text>
          <View style={styles.cardDecoration} />
        </View>

        <View style={styles.methodToggle}>
          <TouchableOpacity 
            style={[styles.methodBtn, method === 'UPI' && styles.methodBtnActive]}
            onPress={() => setMethod('UPI')}
          >
            <QrCode color={method === 'UPI' ? COLORS.gray900 : COLORS.gray400} size={20} />
            <Text style={[styles.methodBtnText, method === 'UPI' && styles.methodBtnTextActive]}>UPI / QR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.methodBtn, method === 'Cash' && styles.methodBtnActive]}
            onPress={() => setMethod('Cash')}
          >
            <Banknote color={method === 'Cash' ? COLORS.gray900 : COLORS.gray400} size={20} />
            <Text style={[styles.methodBtnText, method === 'Cash' && styles.methodBtnTextActive]}>CASH</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.detailsCard, SHADOWS.small]}>
          {method === 'UPI' ? (
            <View style={styles.upiContent}>
               <View style={styles.qrPlaceholder}>
                  <QrCode color={COLORS.gray200} size={80} />
               </View>
               <Text style={styles.upiText}>Scan QR to pay</Text>
               <Text style={styles.upiSubtext}>Works with all UPI Apps</Text>
               
               <View style={styles.inputContainer}>
                   <Text style={styles.inputLabel}>TRANSACTION ID</Text>
                   <TextInput 
                       style={styles.textInput}
                       placeholder="Enter TxID after scan"
                       value={transactionId}
                       onChangeText={setTransactionId}
                       autoCapitalize="characters"
                   />
               </View>
            </View>
          ) : (
            <View style={styles.cashContent}>
               <View style={styles.cashIcon}>
                 <Banknote color={COLORS.success} size={40} />
               </View>
               <Text style={styles.upiText}>Collect Cash</Text>
               <Text style={styles.upiSubtext}>Ensure correct amount from driver</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.payButton, SHADOWS.medium, loading && { opacity: 0.7 }]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <CheckCircle2 color={COLORS.white} size={24} />
              <Text style={styles.payButtonText}>Mark Paid & Exit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.gray400,
    marginTop: 4,
  },
  amountCard: {
    backgroundColor: COLORS.gray900,
    padding: SPACING.xl,
    borderRadius: SIZES.radiusXL,
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: SPACING.xl,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
  amountValue: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 8,
  },
  cardDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray200,
    padding: 4,
    borderRadius: 16,
    marginTop: SPACING.xl,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  methodBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  methodBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray400,
  },
  methodBtnTextActive: {
    color: COLORS.gray900,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: SIZES.radiusLarge,
    marginTop: SPACING.lg,
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  upiContent: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray800,
    marginTop: SPACING.lg,
  },
  upiSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray400,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: COLORS.gray50,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  cashContent: {
    alignItems: 'center',
  },
  cashIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#ecfdf5',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: COLORS.gray900,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: SIZES.radiusLarge,
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  payButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 18,
  },
});

export default PaymentCollectionScreen;
