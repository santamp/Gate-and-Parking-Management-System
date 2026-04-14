import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Truck, ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import authService from '../../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Incomplete Credentials', 'Please provide an authorized identifier and security PIN.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email, password);
      
      // Automatic navigation based on backend role
      if (user.role === 'ADMIN') {
        navigation.replace('AdminMain');
      } else if (user.role === 'GUARD') {
        navigation.replace('GuardMain');
      } else if (user.role === 'OCCUPIER') {
        navigation.replace('OccupierMain');
      } else {
        Alert.alert('Unauthorized Access', 'Your node role is not provisioned for mobile access.');
      }
    } catch (err) {
      Alert.alert('Protocol Error', err || 'Authentication sequence aborted by server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, SHADOWS.large]}>
            <Truck color={COLORS.white} size={42} />
          </View>
          <Text style={TYPOGRAPHY.h1}>GateSync</Text>
          <Text style={styles.subtitle}>Smart Logistics Management</Text>
        </View>

        <View style={[styles.card, SHADOWS.medium]}>
          <View style={styles.cardHeader}>
             <ShieldCheck color={COLORS.primary} size={24} />
             <Text style={styles.cardTitle}>Authorized Access</Text>
          </View>
          
          <Text style={styles.cardLabel}>Initiate secure authentication sequence to enter the site portal.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Mail color={COLORS.gray400} size={20} />
              </View>
              <TextInput 
                style={styles.input}
                placeholder="Enterprise Identifier"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Lock color={COLORS.gray400} size={20} />
              </View>
              <TextInput 
                style={styles.input}
                placeholder="Security Sequence (PIN)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, SHADOWS.small]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Authorize Portal Access</Text>
                  <ArrowRight color={COLORS.white} size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Grid Control Solutions</Text>
          <Text style={styles.footerText}>Secure Enterprise Infrastructure Node</Text>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    transform: [{ rotate: '6deg' }],
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXL,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.gray900,
  },
  cardLabel: {
    textAlign: 'center',
    color: COLORS.gray400,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  inputIcon: {
    paddingLeft: SPACING.md,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: SIZES.radiusMedium,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  loginButtonText: {
    ...TYPOGRAPHY.button,
  },
  footer: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.md,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  roleBtnTextActive: {
    color: COLORS.primary,
  },
});

export default LoginScreen;
