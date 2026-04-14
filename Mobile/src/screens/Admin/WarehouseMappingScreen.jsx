import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  Building2, 
  Layers, 
  MapPin, 
  Plus, 
  ChevronRight,
  Info,
  Server,
  Zap,
  Globe
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import adminService from '../../services/adminService';

const BuildingCard = ({ building }) => (
  <TouchableOpacity style={[styles.buildingCard, SHADOWS.small]}>
    <View style={styles.buildingHeader}>
      <View style={styles.buildingIcon}>
        <Building2 size={24} color={COLORS.gray900} />
      </View>
      <View style={styles.buildingMeta}>
        <Text style={styles.buildingName}>{building.name}</Text>
        <Text style={styles.buildingType}>Structural Node</Text>
      </View>
      <ChevronRight size={20} color={COLORS.gray300} />
    </View>
    <View style={styles.unitGrid}>
      {building.units?.map((unit, idx) => (
        <View key={idx} style={styles.unitBadge}>
           <View style={styles.unitIndicator} />
           <Text style={styles.unitText}>{unit.unitNumber || unit.name}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.addUnitBtn}>
        <Plus size={16} color={COLORS.gray900} />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const WarehouseMappingScreen = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHierarchy = async () => {
    try {
      const data = await adminService.getHierarchy();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0]._id);
      }
    } catch (err) {
      console.error('Fetch hierarchy error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHierarchy();
  }, []);

  const currentProject = projects.find(p => p._id === selectedProjectId);

  const handleAddStructure = (type) => {
    Alert.prompt(
      `Provision ${type}`,
      `Enter name for the new ${type.toLowerCase()} entity`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Provision', 
          onPress: async (name) => {
            try {
              const body = type === 'Project' ? { name } : { name, projectId: selectedProjectId };
              await adminService.createStructure(type === 'Project' ? 'projects' : 'buildings', body);
              fetchHierarchy();
            } catch (e) {
              Alert.alert('Error', 'Structural provisioning failed');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
           <View>
             <Text style={[TYPOGRAPHY.h1, { textTransform: 'uppercase', fontStyle: 'italic' }]}>Grid Mapping</Text>
             <Text style={styles.subtitle}>Infrastructure Topology</Text>
           </View>
           <TouchableOpacity style={styles.globeBtn}>
              <Globe size={20} color={COLORS.gray900} />
           </TouchableOpacity>
        </View>

        <View style={styles.projectSelector}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectScroll}>
              <TouchableOpacity 
                onPress={() => handleAddStructure('Project')}
                style={[styles.projectBtn, { borderStyle: 'dotted' }]}
              >
                 <Plus size={16} color={COLORS.gray900} />
              </TouchableOpacity>
              {projects.map((project) => (
                <TouchableOpacity 
                   key={project._id} 
                   onPress={() => setSelectedProjectId(project._id)}
                   style={[styles.projectBtn, selectedProjectId === project._id && styles.activeProjectBtn]}
                >
                   <Text style={[styles.projectBtnText, selectedProjectId === project._id && styles.activeProjectBtnText]}>{project.name}</Text>
                </TouchableOpacity>
              ))}
           </ScrollView>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.gray900} />
            <Text style={styles.loadingText}>Synchronizing Grid Nodes...</Text>
          </View>
        ) : (
          <>
            <View style={styles.siteInfo}>
               <Server size={14} color={COLORS.gray400} />
               <Text style={styles.siteText}>{currentProject?.buildings?.length || 0} Registered Structures</Text>
            </View>

            {currentProject?.buildings?.map((building) => (
              <BuildingCard key={building._id} building={building} />
            ))}

            <TouchableOpacity 
              style={styles.addBuildingBtn}
              onPress={() => handleAddStructure('Building')}
            >
               <Plus size={24} color={COLORS.gray900} />
               <Text style={styles.addBuildingText}>Provision Structure</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
               <Zap size={18} color={COLORS.amber600} />
               <Text style={styles.infoText}>Topology updates are broadcasted to all security perimeter nodes.</Text>
            </View>
          </>
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
    padding: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  globeBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  projectSelector: {
    marginTop: SPACING.sm,
  },
  projectScroll: {
    gap: 8,
  },
  projectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  activeProjectBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  projectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray500,
  },
  activeProjectBtnText: {
    color: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.lg,
  },
  siteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  siteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  buildingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  buildingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  buildingMeta: {
    flex: 1,
  },
  buildingName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.gray900,
  },
  buildingType: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  unitIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.emerald500,
    marginRight: 6,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  addUnitBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderStyle: 'dashed',
  },
  addBuildingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.gray100,
    borderStyle: 'dashed',
    gap: 12,
  },
  addBuildingText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber50,
    padding: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.amber100,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber700,
    fontStyle: 'italic',
  },
});

export default WarehouseMappingScreen;
