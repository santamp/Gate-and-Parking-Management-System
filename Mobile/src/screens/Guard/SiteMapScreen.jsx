import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Building2, Layers, ArrowLeft, Search, Info, MapPin } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const SiteMapScreen = ({ navigation }) => {
  const [hierarchy, setHierarchy] = useState([]);
  const [activeMappings, setActiveMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hData, mData] = await Promise.all([
          adminService.getHierarchy(),
          adminService.getMappings()
        ]);
        setHierarchy(hData);
        setActiveMappings(mData);
      } catch (err) {
        console.error('Fetch site map error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getOccupierForUnit = (unitId) => {
    return activeMappings.find(m => m.unitId?._id === unitId || m.unitId === unitId);
  };

  const currentProject = hierarchy[selectedProjectIdx];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={COLORS.gray900} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>SITE EXPLORER</Text>
          <Text style={styles.headerSubtitle}>Live infrastructure mapping</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, SHADOWS.small]}>
          <Search color={COLORS.gray400} size={18} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search units..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={COLORS.gray400}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Syncing Telemetry...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Project Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectTabs}>
            {hierarchy.map((p, idx) => (
              <TouchableOpacity 
                key={p._id}
                onPress={() => setSelectedProjectIdx(idx)}
                style={[
                  styles.projectTab, 
                  selectedProjectIdx === idx && styles.projectTabActive
                ]}
              >
                <Building2 color={selectedProjectIdx === idx ? COLORS.white : COLORS.gray500} size={16} />
                <Text style={[
                  styles.projectTabText,
                  selectedProjectIdx === idx && styles.projectTabTextActive
                ]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {currentProject?.children?.map(building => (
            <View key={building._id} style={styles.buildingSection}>
              <View style={styles.buildingHeader}>
                <View style={styles.buildingIcon}>
                  <Building2 color={COLORS.warning} size={18} />
                </View>
                <Text style={styles.buildingName}>{building.name}</Text>
              </View>

              <View style={styles.floorList}>
                {building.children?.map(floor => (
                  <View key={floor._id} style={[styles.floorCard, SHADOWS.small]}>
                    <View style={styles.floorHeader}>
                      <Layers color={COLORS.gray800} size={16} />
                      <Text style={styles.floorName}>{floor.name}</Text>
                    </View>

                    <View style={styles.unitGrid}>
                      {floor.children?.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(unit => {
                        const mapping = getOccupierForUnit(unit._id);
                        return (
                          <View 
                            key={unit._id} 
                            style={[
                              styles.unitNode,
                              mapping && styles.unitNodeActive
                            ]}
                          >
                            <View style={[styles.unitDot, { backgroundColor: mapping ? COLORS.success : COLORS.gray300 }]} />
                            <View>
                              <Text style={[styles.unitName, mapping && styles.unitNameActive]}>{unit.name}</Text>
                              {mapping && (
                                <Text style={styles.unitOccupier} numberOfLines={1}>
                                  {mapping.occupierId?.name}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.infoCard}>
             <View style={styles.infoIcon}>
               <Info color={COLORS.warning} size={20} />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={styles.infoTitle}>LIVE TELEMETRY MODE</Text>
               <Text style={styles.infoText}>
                 Green nodes indicate active occupancy. Gray nodes are currently unassigned units.
               </Text>
             </View>
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    gap: SPACING.md,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  projectTabs: {
    marginBottom: SPACING.lg,
  },
  projectTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    gap: 8,
  },
  projectTabActive: {
    backgroundColor: COLORS.gray900,
    borderColor: COLORS.gray900,
  },
  projectTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray500,
  },
  projectTabTextActive: {
    color: COLORS.white,
  },
  buildingSection: {
    marginBottom: SPACING.xl,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  buildingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.gray900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingName: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontStyle: 'italic',
  },
  floorList: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray200,
    gap: SPACING.md,
  },
  floorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.md,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  floorName: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontStyle: 'italic',
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    gap: 6,
    minWidth: 70,
  },
  unitNodeActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  unitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unitName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gray800,
  },
  unitNameActive: {
    color: '#065f46',
  },
  unitOccupier: {
    fontSize: 8,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  infoCard: {
    backgroundColor: COLORS.gray900,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.lg,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.warning,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 10,
    color: COLORS.gray400,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 14,
  },
});

export default SiteMapScreen;
