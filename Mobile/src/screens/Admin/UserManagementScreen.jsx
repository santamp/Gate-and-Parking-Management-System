import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  User, 
  Mail,
  ChevronRight,
  ShieldAlert,
  Key,
  Trash2
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const UserItem = ({ user, onAction }) => (
  <View style={[styles.userCard, SHADOWS.small]}>
    <View style={styles.userIcon}>
       <Text style={styles.avatarText}>{user.name?.charAt(0) || 'U'}</Text>
    </View>
    <View style={styles.userInfo}>
       <Text style={styles.userName}>{user.name}</Text>
       <View style={styles.roleRow}>
          <Shield size={12} color={user.role === 'ADMIN' ? COLORS.rose500 : COLORS.gray900} />
          <Text style={[styles.roleText, { color: user.role === 'ADMIN' ? COLORS.rose500 : COLORS.gray900 }]}>{user.role}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.statusText}>{user.role === 'GUARD' ? 'Security Node' : 'Occupancy Node'}</Text>
       </View>
    </View>
    <TouchableOpacity onPress={() => onAction(user)} style={styles.actionBtn}>
       <MoreVertical color={COLORS.gray300} size={20} />
    </TouchableOpacity>
  </View>
);

const UserManagementScreen = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const roleFilter = activeTab === 'ALL' ? '' : activeTab;
      const data = await adminService.getUsers({ role: roleFilter, search: searchQuery });
      setUsers(data.users);
    } catch (err) {
      console.error('Fetch users error:', err);
      Alert.alert('Error', 'Failed to synchronize user node');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [activeTab, searchQuery]);

  const handleAction = (user) => {
    Alert.alert(
      'Administrative Actions',
      `Manage ${user.name} (${user.role})`,
      [
        { 
          text: 'Reset Password', 
          onPress: () => {
             Alert.prompt('New Password', 'Enter new password for entity', [
               { text: 'Cancel', style: 'cancel' },
               { text: 'Reset', onPress: async (pwd) => {
                 try {
                   await adminService.resetPassword(user._id, pwd);
                   Alert.alert('Success', 'Node authenticated with new credentials');
                 } catch (e) {
                   Alert.alert('Error', 'Failed to update credentials');
                 }
               }}
             ]);
          }
        },
        { 
          text: 'Decommission User', 
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Confirm', 'Remove this entity from neural network?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Confirm', onPress: async () => {
                try {
                  await adminService.deleteUser(user._id);
                  fetchUsers();
                } catch (e) {
                  Alert.alert('Error', 'Decommission sequence failed');
                }
              }}
            ]);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color={COLORS.gray900} size={18} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search Entity ID / Name..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchUsers}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={fetchUsers}>
          <ActivityIndicator animating={loading} size="small" color={COLORS.gray900} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          {['ALL', 'GUARD', 'OCCUPIER', 'ADMIN'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList 
        data={users}
        renderItem={({ item }) => <UserItem user={item} onAction={handleAction} />}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <ShieldAlert size={48} color={COLORS.gray200} />
              <Text style={styles.emptyText}>Zero matching nodes identified</Text>
            </View>
          )
        }
      />

      <TouchableOpacity style={[styles.fab, SHADOWS.large]}>
        <UserPlus color={COLORS.white} size={24} />
      </TouchableOpacity>
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
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.md,
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    fontSize: 13,
    color: COLORS.gray900,
    fontStyle: 'italic',
  },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  tabContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeTabText: {
    color: COLORS.gray900,
  },
  listContent: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.md,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  userIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.gray900,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    fontStyle: 'italic',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.gray900,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  dot: {
    marginHorizontal: 8,
    color: COLORS.gray200,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  actionBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.gray900,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.gray900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});

export default UserManagementScreen;
