import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export type PickedMediaAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type MediaPickKind = 'image' | 'video';

const PERMISSION_TITLE = 'İcazə tələb olunur';

function libraryOptions(kind: MediaPickKind): ImagePicker.ImagePickerOptions {
  return {
    allowsEditing: kind === 'image',
    quality: 0.8,
    mediaTypes: kind === 'image' ? ['images'] : ['videos'],
  };
}

function toPickedAsset(asset: ImagePicker.ImagePickerAsset): PickedMediaAsset {
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
  };
}

/**
 * iOS 14+ uses PHPicker — no photo-library permission prompt before opening the picker.
 * Android still needs READ_MEDIA_IMAGES / READ_EXTERNAL_STORAGE.
 */
async function ensureMediaLibraryAccess(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  if (existing.status === ImagePicker.PermissionStatus.DENIED && !existing.canAskAgain) {
    Alert.alert(PERMISSION_TITLE, 'Qalereyaya giriş üçün Tənzimləmələr bölməsindən icazə verin.');
    return false;
  }

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!requested.granted) {
    Alert.alert(PERMISSION_TITLE, 'Qalereyaya giriş üçün icazə verməyiniz lazımdır.');
    return false;
  }

  return true;
}

async function ensureCameraAccess(): Promise<boolean> {
  const existing = await ImagePicker.getCameraPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  if (existing.status === ImagePicker.PermissionStatus.DENIED && !existing.canAskAgain) {
    Alert.alert(PERMISSION_TITLE, 'Kamera üçün Tənzimləmələr bölməsindən icazə verin.');
    return false;
  }

  const requested = await ImagePicker.requestCameraPermissionsAsync();
  if (!requested.granted) {
    Alert.alert(PERMISSION_TITLE, 'Kamera üçün icazə verməyiniz lazımdır.');
    return false;
  }

  return true;
}

/** Pick image or video from the system gallery / photo picker. */
export async function pickFromLibrary(kind: MediaPickKind): Promise<PickedMediaAsset | null> {
  try {
    const allowed = await ensureMediaLibraryAccess();
    if (!allowed) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync(libraryOptions(kind));
    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    return toPickedAsset(result.assets[0]);
  } catch {
    Alert.alert('Xəta', 'Media seçilə bilmədi. Yenidən cəhd edin.');
    return null;
  }
}

/** Capture image or video with the camera; falls back to gallery for images when camera is unavailable (e.g. simulator). */
export async function captureWithCamera(kind: MediaPickKind): Promise<PickedMediaAsset | null> {
  try {
    const allowed = await ensureCameraAccess();
    if (!allowed) {
      return null;
    }

    const result = await ImagePicker.launchCameraAsync(libraryOptions(kind));
    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    return toPickedAsset(result.assets[0]);
  } catch {
    if (kind === 'image') {
      return pickFromLibrary('image');
    }
    Alert.alert('Xəta', 'Kamera mövcud deyil. Video üçün real cihazdan istifadə edin.');
    return null;
  }
}

/** Resolve / proof photo: gallery works in simulator without a separate camera permission flow. */
export function pickProofImage(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert('Sübut əlavə et', 'Şəkil mənbəsini seçin', [
      {
        text: 'Qalereya',
        onPress: () => {
          void pickFromLibrary('image').then((asset) => resolve(asset?.uri ?? null));
        },
      },
      {
        text: 'Kamera',
        onPress: () => {
          void captureWithCamera('image').then((asset) => resolve(asset?.uri ?? null));
        },
      },
      { text: 'Ləğv et', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

export function presentMediaSourcePicker(
  onSelected: (asset: PickedMediaAsset, kind: MediaPickKind) => void,
): void {
  Alert.alert('Media əlavə et', 'Şəkil və ya video seçin', [
    {
      text: 'Şəkil (qalereya)',
      onPress: () => {
        void pickFromLibrary('image').then((asset) => {
          if (asset) onSelected(asset, 'image');
        });
      },
    },
    {
      text: 'Video (qalereya)',
      onPress: () => {
        void pickFromLibrary('video').then((asset) => {
          if (asset) onSelected(asset, 'video');
        });
      },
    },
    {
      text: 'Şəkil (kamera)',
      onPress: () => {
        void captureWithCamera('image').then((asset) => {
          if (asset) onSelected(asset, 'image');
        });
      },
    },
    {
      text: 'Video (kamera)',
      onPress: () => {
        void captureWithCamera('video').then((asset) => {
          if (asset) onSelected(asset, 'video');
        });
      },
    },
    { text: 'Ləğv et', style: 'cancel' },
  ]);
}
