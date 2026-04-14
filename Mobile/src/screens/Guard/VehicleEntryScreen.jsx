import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Camera, Car, User, Phone, ArrowRight, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SPACING, SIZES, SHADOWS, TYPOGRAPHY } from '../../theme/DesignSystem';
import gateService from '../../services/gateService';

const VehicleEntryScreen = ({ navigation }) => {
  const [photo, setPhoto] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    vehicleType: ''
  });

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const response = await gateService.getVehicleSettings();
        if (response.success && response.data.length > 0) {
          setVehicleTypes(response.data);
          setFormData(prev => ({ ...prev, vehicleType: response.data[0].vehicleType }));
        }
      } catch (error) {
        console.error('Failed to fetch vehicle types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleTypes();
  }, []);

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.7,
    };

    Alert.alert(
      'Vehicle Photo',
      'Select a source',
      [
        {
          text: 'Camera',
          onPress: () => launchCamera(options, handleResponse),
        },
        {
          text: 'Library',
          onPress: () => launchImageLibrary(options, handleResponse),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleResponse = (response) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage);
      return;
    }
    if (response.assets && response.assets.length > 0) {
      setPhoto(response.assets[0]);
    }
  };

  const removePhoto = () => setPhoto(null);

  const handleSubmit = () => {
    if (!formData.vehicleNumber || !formData.driverName || !formData.driverPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Navigate with data
    navigation.navigate('OccupierSearch', {
      vehicleData: formData,
      vehiclePhoto: photo
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={TYPOGRAPHY.h2}>Identify Vehicle</Text>
            <Text style={styles.subtitle}>Capture vehicle & driver details</Text>
          </View>

          {/* Photo Section */}
          <TouchableOpacity
            style={[
              styles.photoBlock,
              SHADOWS.small,
              photo && styles.photoBlockFilled
            ]}
            onPress={photo ? null : handlePickImage}
          >
            {photo ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={removePhoto}
                >
                  <X color={COLORS.white} size={16} />
                </TouchableOpacity>
                <View style={styles.photoStatus}>
                  <Text style={styles.photoStatusText}>PHOTO CAPTURED</Text>
                </View>
              </View>
            ) : (
              <>
                <Camera color={COLORS.gray400} size={40} />
                <Text style={styles.photoText}>Tap to capture photo</Text>
                <Text style={styles.photoHint}>Recommended for security</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Vehicle Number</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Car color={COLORS.gray400} size={20} />
                </View>
                <TextInput
                  style={[styles.input, { textTransform: 'uppercase', fontWeight: '900' }]}
                  placeholder="e.g. MH 12 AB 1234"
                  value={formData.vehicleNumber}
                  onChangeText={(val) => setFormData({ ...formData, vehicleNumber: val })}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Driver Name</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User color={COLORS.gray400} size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Driver's Full Name"
                  value={formData.driverName}
                  onChangeText={(val) => setFormData({ ...formData, driverName: val })}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Driver Phone</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Phone color={COLORS.gray400} size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="+91"
                  keyboardType="phone-pad"
                  value={formData.driverPhone}
                  onChangeText={(val) => setFormData({ ...formData, driverPhone: val })}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.typeGrid}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : vehicleTypes.length > 0 ? (
                  vehicleTypes.map(type => (
                    <TouchableOpacity
                      key={type._id}
                      style={[
                        styles.typeButton,
                        formData.vehicleType === type.vehicleType && styles.typeButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, vehicleType: type.vehicleType })}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        formData.vehicleType === type.vehicleType && styles.typeButtonTextActive
                      ]}>
                        {type.vehicleType}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No types configured</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, SHADOWS.medium]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Continue to Mapping</Text>
              <ArrowRight color={COLORS.white} size={20} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    fontWeight: '600',
    marginTop: 4,
  },
  photoBlock: {
    height: 180,
    backgroundColor: COLORS.gray50,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  photoBlockFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.primary,
    backgroundColor: 'black',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.error,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoStatus: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  photoStatusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  photoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    marginTop: 8,
    fontWeight: '700',
  },
  photoHint: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  form: {
    gap: SPACING.lg,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    borderWidth: 1.5,
    borderColor: COLORS.gray100,
  },
  inputIcon: {
    paddingLeft: SPACING.md,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.color900,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  typeButtonTextActive: {
    color: COLORS.primary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: SIZES.radiusLarge,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  submitButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 18,
  },
});

export default VehicleEntryScreen;
