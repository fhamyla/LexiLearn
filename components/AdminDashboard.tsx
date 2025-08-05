import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { getPendingTeachers, getAllUsers, approveTeacher, rejectTeacher } from '../firebase';

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
  childName?: string;
  childAge?: number;
  severity?: string;
}

const AdminDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  console.log('AdminDashboard rendered, onLogout:', !!onLogout);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    console.log('AdminDashboard mounted, onLogout prop:', !!onLogout);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load real data from Firebase
      const [teachers, users] = await Promise.all([
        getPendingTeachers(),
        getAllUsers(),
      ]);
      setPendingTeachers(teachers as Teacher[]);
      setAllUsers(users as User[]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      const result = await approveTeacher(teacherId);
      if (result.success) {
        Alert.alert('Success', result.message);
        loadData(); // Reload data
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve teacher');
    }
  };

  const handleRejectTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteEmail(teacher.email || '');
    setDeletePassword('');
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeacher || !deleteEmail || !deletePassword) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      const result = await rejectTeacher(deleteEmail, deletePassword);
      if (result.success) {
        Alert.alert('Success', result.message);
        setShowDeleteDialog(false);
        setDeleteEmail('');
        setDeletePassword('');
        setSelectedTeacher(null);
        loadData(); // Reload data
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete teacher account');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteEmail('');
    setDeletePassword('');
    setSelectedTeacher(null);
  };

  const handleLogout = () => {
    console.log('handleLogout called in AdminDashboard');
    console.log('onLogout prop exists:', !!onLogout);
    
    // Direct logout without confirmation for testing
    if (onLogout) {
      console.log('Calling onLogout directly');
      onLogout();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {showDeleteDialog && selectedTeacher && (
        <View style={styles.deleteDialog}>
          <Text style={styles.deleteDialogTitle}>Confirm Rejection</Text>
          <TextInput
            style={styles.deleteDialogInput}
            placeholder="Email"
            value={deleteEmail}
            onChangeText={setDeleteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.deleteDialogInput}
            placeholder="Password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
          />
          <View style={styles.deleteDialogButtons}>
            <TouchableOpacity style={styles.deleteDialogButton} onPress={handleConfirmDelete}>
              <Text style={styles.deleteDialogButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteDialogButton} onPress={handleCancelDelete}>
              <Text style={styles.deleteDialogButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approve or Delete Moderators/Teachers</Text>
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
                  onPress={() => handleRejectTeacher(teacher)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
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
              {user.userType === 'guardian' && user.childName && (
                <Text style={styles.childInfo}>
                  Child: {user.childName} (Age: {user.childAge}, Severity: {user.severity})
                </Text>
              )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F8EF7',
    textAlign: 'center',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  childInfo: {
    fontSize: 14,
    color: '#4F8EF7',
    marginTop: 4,
    fontStyle: 'italic',
  },
  comingSoon: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  deleteDialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingBottom: 350, // Added 100 more (250 + 100)
  },
  deleteDialogTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff', // Changed from '#333' to white
    marginBottom: 20, // Reverted back to 20
    textAlign: 'center',
  },
  deleteDialogInput: {
    width: '80%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 45, // Tripled from 15
    backgroundColor: '#fff',
  },
  deleteDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 10, // Reverted back to 10
  },
  deleteDialogButton: {
    backgroundColor: '#4F8EF7',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginHorizontal: 10, // Reverted back to 10
  },
  deleteDialogButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdminDashboard; 