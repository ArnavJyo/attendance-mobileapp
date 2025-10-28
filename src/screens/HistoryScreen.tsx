import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { attendanceAPI, AttendanceRecord } from '../services/api';

interface HistoryScreenProps {
  navigation: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await attendanceAPI.getRecords(page, 20);
      setRecords(response.records || []);
      setHasMore(response.pagination?.has_next || false);
    } catch (error: any) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    try {
      const response = await attendanceAPI.getRecords(1, 20);
      setRecords(response.records || []);
      setHasMore(response.pagination?.has_next || false);
    } catch (error) {
      console.error('Error refreshing records:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const response = await attendanceAPI.getRecords(nextPage, 20);
      setRecords([...records, ...(response.records || [])]);
      setHasMore(response.pagination?.has_next || false);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more records:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTirednessColor = (score: number) => {
    if (score <= 0.3) return '#4CAF50'; // Green
    if (score <= 0.7) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const renderRecord = (record: AttendanceRecord) => (
    <View key={record.id} style={styles.record}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {formatDate(record.check_in_time)}
        </Text>
        <View
          style={[
            styles.tirednessBadge,
            { backgroundColor: getTirednessColor(record.tiredness_score) },
          ]}
        >
          <Text style={styles.tirednessText}>
            {(record.tiredness_score * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.recordBody}>
        <Text style={styles.recordLabel}>Check In</Text>
        <Text style={styles.recordValue}>
          {formatDate(record.check_in_time)}
        </Text>

        {record.check_out_time && (
          <>
            <Text style={[styles.recordLabel, { marginTop: 8 }]}>Check Out</Text>
            <Text style={styles.recordValue}>
              {formatDate(record.check_out_time)}
            </Text>
          </>
        )}

        {record.latitude && record.longitude && (
          <>
            <Text style={[styles.recordLabel, { marginTop: 8 }]}>Location</Text>
            <Text style={styles.recordValue}>
              {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
            </Text>
          </>
        )}
      </View>
    </View>
  );

  if (loading && records.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScroll={(e) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const paddingToBottom = 20;
        if (
          layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom
        ) {
          loadMore();
        }
      }}
      scrollEventThrottle={400}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>
          {records.length} {records.length === 1 ? 'record' : 'records'}
        </Text>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attendance records yet</Text>
          <Text style={styles.emptySubtext}>
            Start marking your attendance to see history here
          </Text>
        </View>
      ) : (
        <View style={styles.recordsContainer}>
          {records.map(renderRecord)}
          {hasMore && (
            <View style={styles.loadMoreContainer}>
              {loading && <ActivityIndicator size="small" color="#007AFF" />}
            </View>
          )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  recordsContainer: {
    padding: 16,
  },
  record: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  tirednessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tirednessText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  recordBody: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 14,
    color: '#333',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default HistoryScreen;

