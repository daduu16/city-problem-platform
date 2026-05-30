import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';

import { BorderRadius, Color, Shadow, Spacing, Typography } from '@/GlobalStyles';
import { useAppData } from '@/state/AppDataContext';
import { ProblemCategory, ProblemPriority } from '@/types';

const categories: ProblemCategory[] = ['Su', 'Qaz', 'İşıq', 'Yol', 'Zibil', 'Qəza', 'Təbiət hadisəsi', 'Təhlükəsizlik'];
const priorities: ProblemPriority[] = ['Aşağı', 'Orta', 'Yüksək', 'Təcili'];

const defaultRegion: Region = {
  latitude: 40.4093,
  longitude: 49.8671,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function SelectPill({
  value,
  placeholder,
  onPress,
}: {
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.select, pressed && styles.pressed]}>
      <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{value || placeholder}</Text>
      <Ionicons name="chevron-down" size={18} color={Color.neutral500} />
    </Pressable>
  );
}

export default function ReportProblemScreen() {
  const { addProblem } = useAppData();
  const autoCameraTriggeredRef = useRef(false);
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProblemCategory>('Su');
  const [priority, setPriority] = useState<ProblemPriority>('Orta');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [locationLoading, setLocationLoading] = useState(false);

  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(defaultRegion);
  const [selectedPoint, setSelectedPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && description.trim().length > 0 && address.trim().length > 0;
  }, [address, description, title]);

  const openCategoryPicker = () => {
    Alert.alert('Kateqoriya seç', '', categories.map((c) => ({ text: c, onPress: () => setCategory(c) })));
  };

  const openPriorityPicker = () => {
    Alert.alert('Prioritet seç', '', priorities.map((p) => ({ text: p, onPress: () => setPriority(p) })));
  };

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geo.length > 0) {
      const g = geo[0];
      const parts = [g.street, g.streetNumber, g.district, g.city, g.region].filter(Boolean);
      return parts.join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }, []);

  const goToCurrentLocation = useCallback(async () => {
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const point = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
    setSelectedPoint(point);
    setMapRegion({ ...point, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setSelectedAddress(await reverseGeocode(point.latitude, point.longitude));
  }, [reverseGeocode]);

  const handlePickLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İcazə tələb olunur', 'Məkanı seçmək üçün lokasiya icazəsi verin.');
        return;
      }
      await goToCurrentLocation();
      setMapVisible(true);
    } catch {
      Alert.alert('Xəta', 'Məkan alınmadı. Yenidən cəhd edin.');
    } finally {
      setLocationLoading(false);
    }
  }, [goToCurrentLocation]);

  const onMapPress = useCallback(
    async (event: MapPressEvent) => {
      const point = event.nativeEvent.coordinate;
      setSelectedPoint(point);
      setSelectedAddress(await reverseGeocode(point.latitude, point.longitude));
    },
    [reverseGeocode],
  );

  const applyLocation = () => {
    if (!selectedPoint) return;
    setAddress(selectedAddress || `${selectedPoint.latitude.toFixed(5)}, ${selectedPoint.longitude.toFixed(5)}`);
    setMapVisible(false);
  };

  const openCamera = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İcazə tələb olunur', 'Kamera üçün icazə verməyiniz lazımdır.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets.length > 0) {
        setImageUrl(result.assets[0].uri);
        Alert.alert('Hazırdır', 'Şəkil əlavə olundu.');
      }
    } catch {
      Alert.alert('Xəta', 'Kamera açıla bilmədi. Yenidən cəhd edin.');
    }
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) {
      const missing: string[] = [];
      if (!title.trim()) missing.push('problem başlığı');
      if (!description.trim()) missing.push('təsvir');
      if (!address.trim()) missing.push('ünvan');
      Alert.alert('Xəta', `Zəhmət olmasa bu sahələri doldurun: ${missing.join(', ')}`);
      return;
    }

    try {
      await addProblem({ title, category, priority, description, address, imageUrl });
      Alert.alert('Uğurlu', 'Problem göndərildi və bazaya yazıldı.');
      setTitle('');
      setDescription('');
      setAddress('');
      setImageUrl(undefined);
      setCategory('Su');
      setPriority('Orta');
      autoCameraTriggeredRef.current = false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Serverə göndərmək alınmadı.';
      Alert.alert('Xəta', message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!autoCameraTriggeredRef.current) {
        autoCameraTriggeredRef.current = true;
        openCamera();
      }
    }, [openCamera]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Problem göndər</Text>
          <Text style={styles.subtitle}>Problemi qeyd edin və göndərin</Text>

          <View style={styles.card}>
            <FieldLabel>Problem başlığı</FieldLabel>
            <TextInput value={title} onChangeText={setTitle} placeholder="Məs: Su borusu partlayıb" placeholderTextColor={Color.neutral500} style={styles.input} />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Kateqoriya</FieldLabel>
                <SelectPill value={category} placeholder="Seçin" onPress={openCategoryPicker} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Prioritet</FieldLabel>
                <SelectPill value={priority} placeholder="Seçin" onPress={openPriorityPicker} />
              </View>
            </View>

            <FieldLabel>Təsvir</FieldLabel>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Problemi ətraflı yazın..."
              placeholderTextColor={Color.neutral500}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.textarea]}
            />

            <FieldLabel>Ünvan</FieldLabel>
            <TextInput value={address} onChangeText={setAddress} placeholder="Məs: Yasamal r., ..." placeholderTextColor={Color.neutral500} style={styles.input} />

            <View style={styles.actionsRow}>
              <Pressable accessibilityRole="button" onPress={handlePickLocation} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Ionicons name="map-outline" size={18} color={Color.primary600} />
                <Text style={styles.secondaryButtonText}>{locationLoading ? 'Axtarılır...' : 'Məkanı seç'}</Text>
              </Pressable>

              <Pressable accessibilityRole="button" onPress={openCamera} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Ionicons name="camera-outline" size={18} color={Color.primary600} />
                <Text style={styles.secondaryButtonText}>Şəkil əlavə et</Text>
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" onPress={handlePickLocation} style={({ pressed }) => [styles.locationPreview, pressed && styles.pressed]}>
              <Ionicons name="location-outline" size={18} color={Color.primary600} />
              <Text style={styles.locationPreviewText} numberOfLines={2}>
                {address || 'Məkan seçilməyib'}
              </Text>
            </Pressable>

            {imageUrl ? (
              <View style={styles.imageHint}>
                <Ionicons name="checkmark-circle" size={18} color={Color.success500} />
                <Text style={styles.imageHintText}>Şəkil əlavə olundu</Text>
              </View>
            ) : (
              <View style={styles.imageHintMuted}>
                <Ionicons name="information-circle-outline" size={18} color={Color.neutral500} />
                <Text style={styles.imageHintTextMuted}>İlk addım olaraq şəkil çəkin</Text>
              </View>
            )}

            <Pressable accessibilityRole="button" onPress={handleSubmit} style={({ pressed }) => [styles.submit, !canSubmit && styles.submitDisabled, pressed && styles.pressed]}>
              <Text style={styles.submitText}>Problemi göndər</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 8) }]}>
            <Pressable onPress={() => setMapVisible(false)} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Bağla</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Məkan seçimi</Text>
            <Pressable onPress={applyLocation} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Təsdiq et</Text>
            </Pressable>
          </View>

          <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion} onRegionChangeComplete={setMapRegion} onPress={onMapPress}>
            {selectedPoint ? <Marker coordinate={selectedPoint} draggable onDragEnd={(e) => onMapPress(e as unknown as MapPressEvent)} /> : null}
          </MapView>

          <View style={styles.mapInfo}>
            <Text style={styles.mapAddress} numberOfLines={2}>
              {selectedAddress || 'Xəritədə nöqtə seçin'}
            </Text>
            <Pressable onPress={goToCurrentLocation} style={styles.currentBtn}>
              <Ionicons name="locate-outline" size={16} color={Color.white500} />
              <Text style={styles.currentBtnText}>Hazırkı məkan</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Color.white500, flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  title: { color: Color.neutral900, fontSize: 24, fontWeight: '900' },
  subtitle: { color: Color.neutral500, fontSize: Typography.body, fontWeight: '600', marginTop: 6 },
  card: {
    backgroundColor: Color.white500,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    ...Shadow.surface,
  },
  label: { color: Color.neutral800, fontSize: Typography.caption, fontWeight: '800', marginBottom: 8 },
  input: {
    backgroundColor: Color.neutral50,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    color: Color.neutral900,
    fontSize: Typography.body,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  textarea: { height: 120 },
  twoCol: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  select: {
    alignItems: 'center',
    backgroundColor: Color.neutral50,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  selectText: { color: Color.neutral900, fontSize: Typography.body, fontWeight: '700' },
  selectPlaceholder: { color: Color.neutral500, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: Color.accent100,
    borderRadius: BorderRadius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: { color: Color.primary600, fontSize: Typography.caption, fontWeight: '900' },
  locationPreview: {
    alignItems: 'center',
    backgroundColor: Color.neutral50,
    borderColor: Color.neutral200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  locationPreviewText: { color: Color.neutral800, flex: 1, fontSize: Typography.caption, fontWeight: '700' },
  imageHint: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  imageHintMuted: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  imageHintText: { color: Color.neutral800, fontSize: Typography.caption, fontWeight: '800' },
  imageHintTextMuted: { color: Color.neutral500, fontSize: Typography.caption, fontWeight: '700' },
  submit: {
    alignItems: 'center',
    backgroundColor: Color.primary500,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    marginTop: Spacing.xl,
    ...Shadow.primaryButton,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: Color.white500, fontSize: Typography.body, fontWeight: '900' },
  pressed: { opacity: 0.86 },
  modalContainer: { flex: 1, backgroundColor: Color.white500 },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: Color.neutral200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  modalBtnText: { color: Color.primary600, fontSize: Typography.caption, fontWeight: '800' },
  modalTitle: { color: Color.neutral900, fontSize: Typography.body, fontWeight: '900' },
  map: { flex: 1 },
  mapInfo: {
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  mapAddress: { color: Color.neutral800, fontSize: Typography.caption, fontWeight: '700' },
  currentBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Color.primary500,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  currentBtnText: { color: Color.white500, fontSize: Typography.caption, fontWeight: '800' },
});

