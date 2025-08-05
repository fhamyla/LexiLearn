import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ChildProgress {
  id: string;
  childName: string;
  childAge: number;
  severity: string;
  overallProgress: number;
  lastActivity: string;
  currentStreak: number;
}

interface LearningActivity {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  score?: number;
  date: string;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

const UserDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [childProgress, setChildProgress] = useState<ChildProgress | null>(null);
  const [recentActivities, setRecentActivities] = useState<LearningActivity[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('UserDashboard mounted, onLogout prop:', !!onLogout);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get current user data from Firebase
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // Get user data from Firestore
      const userRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        Alert.alert('Error', 'User data not found');
        return;
      }

      const userData = userDoc.data();
      
      // Create child progress data from user data
      const childProgress: ChildProgress = {
        id: userData.uid || '1',
        childName: userData.childName || 'Child',
        childAge: userData.childAge || 0,
        severity: userData.severity || 'mild',
        overallProgress: 75, // TODO: Calculate from actual progress data
        lastActivity: '2 hours ago', // TODO: Get from actual activity data
        currentStreak: 5, // TODO: Calculate from actual streak data
      };

      const mockActivities: LearningActivity[] = [
        {
          id: '1',
          title: 'Basic Phonics - Lesson 3',
          category: 'Reading',
          completed: true,
          score: 85,
          date: 'Today',
        },
        {
          id: '2',
          title: 'Number Recognition 1-10',
          category: 'Math',
          completed: true,
          score: 92,
          date: 'Yesterday',
        },
        {
          id: '3',
          title: 'Social Skills - Greetings',
          category: 'Social',
          completed: false,
          date: 'Tomorrow',
        },
      ];

      const mockMessages: Message[] = [
        {
          id: '1',
          from: 'Ms. Johnson',
          subject: 'Emma\'s Progress Update',
          message: 'Emma is doing great with her reading exercises!',
          date: '2 days ago',
          read: false,
        },
        {
          id: '2',
          from: 'System',
          subject: 'Weekly Report Available',
          message: 'Your weekly progress report is ready to view.',
          date: '1 week ago',
          read: true,
        },
      ];

             setChildProgress(childProgress);
       setRecentActivities(mockActivities);
       setMessages(mockMessages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('handleLogout called in UserDashboard');
    console.log('onLogout prop exists:', !!onLogout);
    
    // Direct logout without confirmation for testing
    if (onLogout) {
      console.log('Calling onLogout directly');
      onLogout();
    }
  };



  const handleStartActivity = (activityId: string) => {
    // TODO: Implement start activity logic
    Alert.alert('Success', 'Activity started successfully');
  };

  const handleViewMessage = (messageId: string) => {
    // TODO: Implement view message logic
    Alert.alert('Message', 'Message details would be shown here');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parent Dashboard</Text>
        {onLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>


      

      
      {childProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Child Progress</Text>
          <View style={styles.childCard}>
            <Text style={styles.childName}>{childProgress.childName}</Text>
            <Text style={styles.childInfo}>Age: {childProgress.childAge} | Severity: {childProgress.severity}</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Overall Progress: {childProgress.overallProgress}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${childProgress.overallProgress}%` }]} />
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>{childProgress.currentStreak} days</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Last Activity</Text>
                <Text style={styles.statValue}>{childProgress.lastActivity}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : recentActivities.length === 0 ? (
          <Text style={styles.emptyText}>No activities found</Text>
        ) : (
          recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityCategory}>{activity.category}</Text>
              <Text style={styles.activityDate}>{activity.date}</Text>
              {activity.completed ? (
                <View style={styles.completedInfo}>
                  <Text style={styles.scoreText}>Score: {activity.score}%</Text>
                  <Text style={styles.completedText}>✓ Completed</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStartActivity(activity.id)}
                >
                  <Text style={styles.startButtonText}>Start Activity</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messages ({messages.filter(m => !m.read).length} unread)</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages</Text>
        ) : (
          messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              style={[styles.messageCard, !message.read && styles.unreadMessage]}
              onPress={() => handleViewMessage(message.id)}
            >
              <Text style={styles.messageFrom}>{message.from}</Text>
              <Text style={styles.messageSubject}>{message.subject}</Text>
              <Text style={styles.messageDate}>{message.date}</Text>
              {!message.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>View Progress Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Contact Teacher</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Schedule Meeting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>Learning Resources</Text>
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
    minHeight: '100%',
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
  childCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  childInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 12,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F8EF7',
  },
  activityCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityCategory: {
    fontSize: 14,
    color: '#4F8EF7',
    marginTop: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  completedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scoreText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  completedText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#4F8EF7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  messageCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    position: 'relative',
  },
  unreadMessage: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#4F8EF7',
  },
  messageFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messageSubject: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messageDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F8EF7',
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

export default UserDashboard; 