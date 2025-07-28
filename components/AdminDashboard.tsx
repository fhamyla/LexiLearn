import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getPendingTeachers, getAllUsers } from '../firebase';

interface Teacher {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: string;
  status?: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: string;
  status?: string;
}

const AdminDashboard: React.FC = () => {
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teachers, users] = await Promise.all([
        getPendingTeachers(),
        getAllUsers(),
      ]);
      setPendingTeachers(teachers as Teacher[]);
      setAllUsers(users as User[]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeacher = async (teacherId: string) => {
    // TODO: Implement approve teacher logic
    Alert.alert('Success', 'Teacher approved successfully');
    loadData(); // Reload data
  };

  const handleRejectTeacher = async (teacherId: string) => {
    // TODO: Implement reject teacher logic
    Alert.alert('Success', 'Teacher rejected');
    loadData(); // Reload data
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approve Moderators/Teachers</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : pendingTeachers.length === 0 ? (
          <Text style={styles.emptyText}>No pending teachers</Text>
        ) : (
          pendingTeachers.map((teacher) => (
            <View key={teacher.id} style={styles.teacherCard}>
              <Text style={styles.teacherName}>{teacher.firstName} {teacher.lastName}</Text>
              <Text style={styles.teacherEmail}>{teacher.email}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveTeacher(teacher.id)}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectTeacher(teacher.id)}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Accounts ({allUsers.length})</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : allUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          allUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userType}>{user.userType}</Text>
              <Text style={styles.userStatus}>Status: {user.status}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Children's Learning Progress</Text>
        <Text style={styles.comingSoon}>Learning tracking features coming soon...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#4F8EF7',
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  teacherCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  teacherEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  userType: {
    fontSize: 14,
    color: '#4F8EF7',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  userStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  comingSoon: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default AdminDashboard; 