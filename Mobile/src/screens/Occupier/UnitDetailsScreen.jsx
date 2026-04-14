import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Image
} from 'react-native';
import { User, MapPin, Phone, Mail, CreditCard, ChevronRight, Settings, LogOut } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';

const UnitDetailsScreen = ({ navigation }) => {
  const members = [
    { name: 'Sarah Wilson', role: 'Primary Occupier', phone: '+1 234 567 890' },
    { name: 'Michael Wilson', role: 'Resident', phone: '+1 234 567 891' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, SHADOWS.medium]}>
             <User size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.unitName}>Unit A-102</Text>
          <View style={styles.locationTag}>
            <MapPin size={14} color={COLORS.gray500} />
            <Text style={styles.locationText}>Building A, Floor 1 • Warehouse Dist.</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unit Members</Text>
            {members.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <TouchableOpacity style={styles.contactBtn}>
                  <Phone size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                 <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
                   <Mail size={18} color={COLORS.primary} />
                 </View>
                 <Text style={styles.menuText}>Billing Address</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray300} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                 <View style={[styles.menuIcon, { backgroundColor: '#def7ec' }]}>
                   <CreditCard size={18} color={COLORS.success} />
                 </View>
                 <Text style={styles.menuText}>Payment Methods</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray300} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                 <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
                   <Settings size={18} color={COLORS.warning} />
                 </View>
                 <Text style={styles.menuText}>Notification Settings</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray300} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={() => navigation.replace('Login')}
          >
            <LogOut size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>Version 1.0.2 (Build 44)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.gray50,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  unitName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.gray900,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
    color: COLORS.gray600,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  memberRole: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 2,
    fontWeight: '600',
  },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    marginTop: SPACING.xl,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.gray400,
    fontSize: 12,
    marginTop: SPACING.xl,
    fontWeight: '600',
  },
});

export default UnitDetailsScreen;
