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
import { Search, LogIn, LogOut, Filter } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';

const HistoryScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const historyLogs = [
    { id: 1, plate: 'MH 14 CC 5521', type: 'OUT', time: 'Today, 02:30 PM', occupier: 'Flipkart' },
    { id: 2, plate: 'TS 09 XY 5544', type: 'IN', time: 'Today, 01:15 PM', occupier: 'Delhivery' },
    { id: 3, plate: 'KA 01 MR 8490', type: 'OUT', time: 'Today, 11:45 AM', occupier: 'Amazon Logistics' },
    { id: 4, plate: 'MH 12 AB 1234', type: 'IN', time: 'Yesterday, 09:00 AM', occupier: 'BlueDart' },
  ];

  const filtered = historyLogs.filter(log => 
    log.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.occupier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
           <View style={[styles.searchBar, SHADOWS.small]}>
             <Search color={COLORS.gray400} size={18} />
             <TextInput 
               style={styles.searchInput}
               placeholder="Search logs..."
               value={searchTerm}
               onChangeText={setSearchTerm}
             />
           </View>
           <TouchableOpacity style={[styles.filterBtn, SHADOWS.small]}>
              <Filter color={COLORS.gray600} size={20} />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {filtered.map(log => (
            <TouchableOpacity key={log.id} style={[styles.card, SHADOWS.small]}>
              <View style={styles.cardLeft}>
                <View style={[
                  styles.iconBox,
                  log.type === 'IN' ? { backgroundColor: COLORS.primaryLight } : { backgroundColor: COLORS.gray100 }
                ]}>
                  {log.type === 'IN' ? <LogIn color={COLORS.primary} size={20} /> : <LogOut color={COLORS.gray600} size={20} />}
                </View>
                <View>
                  <Text style={styles.plateText}>{log.plate}</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.occupierText}>{log.occupier}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.timeText}>{log.time}</Text>
                  </View>
                </View>
              </View>
              <View style={[
                styles.typeTag,
                log.type === 'IN' ? { backgroundColor: COLORS.primaryLight } : { backgroundColor: COLORS.gray100 }
              ]}>
                <Text style={[
                  styles.typeTagText,
                  log.type === 'IN' ? { color: COLORS.primary } : { color: COLORS.gray700 }
                ]}>
                  {log.type}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activity match found</Text>
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
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  searchInput: {
    flex: 1,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  list: {
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateText: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  occupierText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gray300,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
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

export default HistoryScreen;
