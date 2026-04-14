import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { Search, Calendar, Filter, Truck } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';

const HistoryScreen = () => {
  const [search, setSearch] = useState('');
  
  const historyData = [
    { id: '1', vehicleNo: 'DL01 AB 9988', date: 'Oct 24, 2023', time: '10:30 AM', status: 'Entered', type: 'Personal' },
    { id: '2', vehicleNo: 'MH12 QR 4545', date: 'Oct 23, 2023', time: '02:15 PM', status: 'Exited', type: 'Delivery' },
    { id: '3', vehicleNo: 'KA05 LM 1122', date: 'Oct 22, 2023', time: '09:00 AM', status: 'Entered', type: 'Guest' },
    { id: '4', vehicleNo: 'HR26 ZY 7766', date: 'Oct 21, 2023', time: '06:45 PM', status: 'Exited', type: 'Other' },
    { id: '5', vehicleNo: 'UP16 PX 3344', date: 'Oct 20, 2023', time: '11:20 AM', status: 'Entered', type: 'Service' },
  ];

  const renderItem = ({ item }) => (
    <View style={[styles.historyItem, SHADOWS.small]}>
      <View style={styles.itemHeader}>
        <View style={styles.vehicleInfo}>
          <Truck size={20} color={COLORS.gray600} />
          <Text style={styles.vehicleNo}>{item.vehicleNo}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Entered' ? COLORS.primaryLight : COLORS.gray100 }]}>
          <Text style={[styles.statusText, { color: item.status === 'Entered' ? COLORS.primary : COLORS.gray600 }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.itemFooter}>
        <View style={styles.footerDetail}>
          <Calendar size={14} color={COLORS.gray400} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.footerDetail}>
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.gray400} />
          <TextInput
            placeholder="Search by Vehicle No..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={historyData.filter(item => item.vehicleNo.toLowerCase().includes(search.toLowerCase()))}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Simple wrapper for TouchableOpacity if needed
const TouchableOpacity = ({ children, style, ...props }) => (
  <View style={style} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchBar: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  historyItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  vehicleNo: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray50,
  },
  footerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray500,
  },
});

export default HistoryScreen;
