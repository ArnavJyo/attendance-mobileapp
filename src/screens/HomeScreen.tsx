import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, AttendanceRecord } from '../services/api';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastRecord, setLastRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await attendanceAPI.getRecords(1, 1);
      if (response.records && response.records.length > 0) {
        const latest = response.records[0];
        setIsCheckedIn(latest.is_checked_in);
        setLastRecord(latest);
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = () => {
    navigation.navigate('Camera', { 
      checkIn: !isCheckedIn,
      onComplete: checkStatus 
    });
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>
          Status: {isCheckedIn ? 'Checked In' : 'Checked Out'}
        </Text>
        {lastRecord && (
          <Text style={styles.statusTime}>
            {isCheckedIn 
              ? `Last Check-in: ${new Date(lastRecord.check_in_time).toLocaleString()}`
              : `Last Check-out: ${lastRecord.check_out_time ? new Date(lastRecord.check_out_time).toLocaleString() : 'N/A'}`
            }
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleMarkAttendance}
      >
        <Text style={styles.buttonText}>
          {isCheckedIn ? 'Check Out' : 'Check In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={handleViewHistory}
      >
        <Text style={styles.buttonText}>View Attendance History</Text>
      </TouchableOpacity>

      {lastRecord && lastRecord.tiredness_score !== null && (
        <View style={styles.tirednessCard}>
          <Text style={styles.tirednessLabel}>Last Tiredness Score</Text>
          <Text style={styles.tirednessScore}>
            {(lastRecord.tiredness_score * 100).toFixed(0)}%
          </Text>
          <Text style={styles.tirednessNote}>
            {lastRecord.tiredness_score <= 0.3 
              ? 'Low tiredness' 
              : lastRecord.tiredness_score <= 0.7 
              ? 'Medium tiredness' 
              : 'High tiredness'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutText: {
    fontSize: 14,
    color: '#007AFF',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusTime: {
    fontSize: 14,
    color: '#666',
  },
  tirednessCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  tirednessLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tirednessScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  tirednessNote: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default HomeScreen;

