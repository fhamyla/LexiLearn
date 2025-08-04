import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getAllUsers } from '../firebase';

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  childName?: string;
  childAge?: number;
  severity?: string;
  progress?: number;
}

interface LearningContent {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  status: 'active' | 'inactive';
}

const ModeratorDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [learningContent, setLearningContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load real data from Firebase
      const users = await getAllUsers();
      
      // Filter for guardian users and map to Student interface
      const students: Student[] = users
        .filter(user => user.userType === 'guardian')
        .map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          childName: user.childName,
          childAge: user.childAge,
          severity: user.severity,
          progress: 75, // TODO: Calculate from actual progress data
        }));

      const mockContent: LearningContent[] = [
        {
          id: '1',
          title: 'Basic Phonics',
          category: 'Reading',
          difficulty: 'Beginner',
          status: 'active',
        },
        {
          id: '2',
          title: 'Number Recognition',
          category: 'Math',
          difficulty: 'Beginner',
          status: 'active',
        },
        {
          id: '3',
          title: 'Social Skills',
          category: 'Social',
          difficulty: 'Intermediate',
          status: 'inactive',
        },
      ];

      setStudents(students);
      setLearningContent(mockContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('handleLogout called in ModeratorDashboard');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('Logout confirmed, calling onLogout');
            onLogout?.();
          },
        },
      ]
    );
  };

  const handleActivateContent = (contentId: string) => {
    // TODO: Implement activate content logic
    Alert.alert('Success', 'Content activated successfully');
    loadData(); // Reload data
  };

  const handleDeactivateContent = (contentId: string) => {
    // TODO: Implement deactivate content logic
    Alert.alert('Success', 'Content deactivated successfully');
    loadData(); // Reload data
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moderator Dashboard</Text>
        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Progress ({students.length})</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : students.length === 0 ? (
          <Text style={styles.emptyText}>No students found</Text>
        ) : (
          students.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
              <Text style={styles.childInfo}>Child: {student.childName} (Age: {student.childAge})</Text>
              <Text style={styles.severityInfo}>Severity: {student.severity}</Text>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Progress: {student.progress}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${student.progress}%` }]} />
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Content Management</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : learningContent.length === 0 ? (
          <Text style={styles.emptyText}>No content found</Text>
        ) : (
          learningContent.map((content) => (
            <View key={content.id} style={styles.contentCard}>
              <Text style={styles.contentTitle}>{content.title}</Text>
              <Text style={styles.contentCategory}>{content.category} - {content.difficulty}</Text>
              <Text style={[styles.contentStatus, content.status === 'active' ? styles.activeStatus : styles.inactiveStatus]}>
                Status: {content.status}
              </Text>
              <View style={styles.actionButtons}>
                {content.status === 'inactive' ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activateButton]}
                    onPress={() => handleActivateContent(content.id)}
                  >
                    <Text style={styles.actionButtonText}>Activate</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deactivateButton]}
                    onPress={() => handleDeactivateContent(content.id)}
                  >
                    <Text style={styles.actionButtonText}>Deactivate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Create New Content</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Message Parents</Text>
          </TouchableOpacity>
        </View>
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
  studentCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  childInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  severityInfo: {
    fontSize: 14,
    color: '#4F8EF7',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  contentCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contentCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  contentStatus: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  activeStatus: {
    color: '#28a745',
  },
  inactiveStatus: {
    color: '#dc3545',
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
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#4F8EF7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ModeratorDashboard; 