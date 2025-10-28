import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { attendanceAPI } from '../services/api';

interface CameraScreenProps {
  route: any;
  navigation: any;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ route, navigation }) => {
  const { checkIn, onComplete } = route.params;
  const [uploading, setUploading] = useState(false);

  const getCurrentLocation = async () => {
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (Platform.OS === 'android') {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
          .then(() => {
            Geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                console.log('Location error:', error);
                resolve({ latitude: 0, longitude: 0 });
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
          })
          .catch(() => {
            resolve({ latitude: 0, longitude: 0 });
          });
      } else {
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.log('Location error:', error);
            resolve({ latitude: 0, longitude: 0 });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    });
  };

  const takePicture = async () => {
    if (uploading) return;

    setUploading(true);
    
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          setUploading(false);
          return;
        }

        if (response.errorMessage) {
          console.error('Camera Error:', response.errorMessage);
          Alert.alert('Error', 'Failed to take photo');
          setUploading(false);
          return;
        }

        if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          uploadImage(imageUri);
        }
      }
    );
  };

  const uploadImage = async (imageUri: string | undefined) => {
    if (!imageUri) {
      Alert.alert('Error', 'No image selected');
      setUploading(false);
      return;
    }

    try {
      // Get current location
      const location = await getCurrentLocation();
      console.log('Current location:', location);

      if (checkIn) {
        // Send location for check-in
        await attendanceAPI.checkIn(imageUri, location.latitude, location.longitude);
      } else {
        // Check-out requires location
        await attendanceAPI.checkOut(imageUri, location.latitude, location.longitude);
      }
      
      Alert.alert(
        'Success',
        `${checkIn ? 'Check-in' : 'Check-out'} successful!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Call the callback to refresh the home screen
              if (onComplete) {
                onComplete();
              }
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to mark attendance'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>
        {checkIn ? 'Check In' : 'Check Out'}
      </Text>
      <Text style={styles.instructionText}>
        Tap the button below to take a photo
      </Text>

      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraPlaceholderText}>📸</Text>
        <Text style={styles.cameraPlaceholderSubtext}>
          {checkIn ? 'Check In' : 'Check Out'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={takePicture}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Take Photo</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
  },
  cameraPlaceholder: {
    height: 400,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 30,
  },
  cameraPlaceholderText: {
    fontSize: 80,
    marginBottom: 16,
  },
  cameraPlaceholderSubtext: {
    fontSize: 18,
    color: '#999',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CameraScreen;

