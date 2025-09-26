import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import StudentFocusPage from './LearningLibrary/StudentFocusPage';

// Normalizes category names to lowercase and unifies variations of social skills
const normalizeCategory = (input: string): string => {
  const key = (input || '').toLowerCase().trim();
  if (key === 'social' || key === 'social-skills' || key === 'socialskills') return 'social skills';
  return key;
};

// Orders categories per required priority
const orderCategories = (categories: string[]): string[] => {
  const desiredOrder = ['reading', 'math', 'social skills', 'spelling', 'writing'];
  const unique = Array.from(new Set(categories.map(normalizeCategory)));
  return unique.sort((a, b) => {
    const ai = desiredOrder.indexOf(a);
    const bi = desiredOrder.indexOf(b);
    const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (av !== bv) return av - bv;
    return a.localeCompare(b);
  });
};

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
  const [sectionFilter, setSectionFilter] = useState<'learning' | 'improvements'>('learning');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showFullFocusModal, setShowFullFocusModal] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasSavedFocusAreas, setHasSavedFocusAreas] = useState(false);
  const [parentStudent, setParentStudent] = useState<any>(null);

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
      if (!user.email) {
        Alert.alert('Error', 'User email not found');
        return;
      }
      
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

      // Find this guardian's student document and prepare focus categories
      try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('createdBy', '==', 'guardian'), where('guardianEmail', '==', user.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          const data: any = d.data();
          setStudentId(d.id);
          const lp = (data && data.learningProgress) || {};
          const raw = Object.keys(lp).map(k => normalizeCategory(k));
          const setCats = new Set<string>(raw);
          setCats.add('spelling');
          setCats.add('writing');
          const ordered = orderCategories(Array.from(setCats));
          setAvailableCategories(ordered);
          const preselected = Array.isArray(data.focusAreas) && data.focusAreas.length > 0
            ? (data.focusAreas as string[]).map(s => normalizeCategory(s))
            : ordered;
          setSelectedCategories(Array.from(new Set(preselected)));
          setHasSavedFocusAreas(Array.isArray(data.focusAreas) && data.focusAreas.length > 0);
          setParentStudent({ id: d.id, childName: data.childName || 'Student', learningProgress: lp });
        }
      } catch (_err) {}

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

  const handleOpenLibrary = () => {
    if (!studentId) {
      Alert.alert('Library', 'No child record found yet.');
      return;
    }
    if (hasSavedFocusAreas) {
      setShowFocusModal(false);
      setShowFullFocusModal(true);
    } else {
      setShowFullFocusModal(false);
      setShowFocusModal(true);
    }
  };

  const toggleCategory = (category: string) => {
    const key = normalizeCategory(category);
    setSelectedCategories(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  };

  const persistFocusAreas = async () => {
    try {
      if (!studentId) return;
      if (selectedCategories.length === 0) {
        Alert.alert('Select Focus', 'Please choose at least one focus area.');
        return;
      }
      const ref = doc(db, 'students', studentId);
      const normalized = selectedCategories.map(s => normalizeCategory(s));
      // Ensure learningProgress has spelling and writing lesson items
      await setDoc(
        ref,
        {
          focusAreas: normalized,
          learningProgress: {
            spelling: {
              letter_sounds: { progress: 0, completed: false },
              cvc_words: { progress: 0, completed: false },
            },
            writing: {
              letter_foundation: { progress: 0, completed: false },
              copying_words: { progress: 0, completed: false },
            },
          },
        },
        { merge: true }
      );
      Alert.alert('Saved', 'Focus areas updated');
      setShowFocusModal(false);
      setHasSavedFocusAreas(true);
      setShowFullFocusModal(true);
    } catch (_err) {
      Alert.alert('Save Failed', 'Could not save focus areas. Please try again.');
    }
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


      <TouchableOpacity style={styles.bookButton} onPress={handleOpenLibrary}>
        <Text style={styles.bookButtonText}>Learning Library</Text>
      </TouchableOpacity>
      
      <Modal visible={showFocusModal} animationType="slide" transparent={true} onRequestClose={() => setShowFocusModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', width: '90%', maxWidth: 600, borderRadius: 12, padding: 16 }}>
            <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>Choose Focus Areas</Text>
            <View style={styles.sectionFilterContainer}>
              {availableCategories.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.sectionFilterButton, selectedCategories.includes((cat || '').toLowerCase()) && styles.sectionFilterButtonActive]} onPress={() => toggleCategory(cat)}>
                  <Text style={[styles.sectionFilterButtonText, selectedCategories.includes((cat || '').toLowerCase()) && styles.sectionFilterButtonTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                style={[
                  styles.bookButton,
                  { backgroundColor: '#6c757d', paddingVertical: 14, paddingHorizontal: 20 }
                ]} 
                onPress={() => setShowFocusModal(false)}
              >
                <Text style={[styles.bookButtonText, { fontSize: 16 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.bookButton,
                  { backgroundColor: '#28a745', paddingVertical: 14, paddingHorizontal: 20 }
                ]} 
                onPress={persistFocusAreas}
              >
                <Text style={[styles.bookButtonText, { fontSize: 16 }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-screen Focus View (auto-open if focus areas saved) */}
      <Modal
        visible={showFullFocusModal}
        animationType="slide"
        transparent={false}
        supportedOrientations={["landscape"]}
        onRequestClose={() => setShowFullFocusModal(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={{ padding: 8, backgroundColor: '#4F8EF7', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => setShowFullFocusModal(false)}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>

          {parentStudent ? (
            <StudentFocusPage student={parentStudent} selectedCategories={selectedCategories} />
          ) : (
            <View style={{ padding: 16 }}>
              <Text>Loading...</Text>
            </View>
          )}

          {/* Removed bottom Close button to keep only top-right Close */}
        </View>
      </Modal>

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

      

      {childProgress && (
        <View style={styles.section}>
          <View style={styles.sectionFilterContainer}>
            <TouchableOpacity
              style={[styles.sectionFilterButton, sectionFilter === 'learning' && styles.sectionFilterButtonActive]}
              onPress={() => setSectionFilter('learning')}
            >
              <Text style={[styles.sectionFilterButtonText, sectionFilter === 'learning' && styles.sectionFilterButtonTextActive]}>
                Learning Journey
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionFilterButton, sectionFilter === 'improvements' && styles.sectionFilterButtonActive]}
              onPress={() => setSectionFilter('improvements')}
            >
              <Text style={[styles.sectionFilterButtonText, sectionFilter === 'improvements' && styles.sectionFilterButtonTextActive]}>
                Improvements Bar
              </Text>
            </TouchableOpacity>
          </View>

          {sectionFilter === 'learning' && (
            <View>
              <Text style={styles.sectionTitle}>Learning Journey for {childProgress.childName}</Text>

              <View style={styles.learningJourneyContainer}>
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>📚 Reading</Text>
                  <View style={styles.lessonProgress}>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Basic Phonics</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '100%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>✅ Completed</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Sight Words</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '75%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>🔄 In Progress</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Reading Comprehension</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '25%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>🔢 Math</Text>
                  <View style={styles.lessonProgress}>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Number Recognition</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '100%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>✅ Completed</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Basic Addition</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '60%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>🔄 In Progress</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Subtraction</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>🤝 Social Skills</Text>
                  <View style={styles.lessonProgress}>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Eye Contact</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '80%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>🔄 In Progress</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Turn Taking</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '45%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>🔄 In Progress</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Emotion Recognition</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>🔤 Spelling</Text>
                  <View style={styles.lessonProgress}>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Letter Sounds</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '20%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>CVC Words</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>✍️ Writing</Text>
                  <View style={styles.lessonProgress}>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Letter Formation</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '10%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                    <View style={styles.lessonItem}>
                      <Text style={styles.lessonName}>Copying Words</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '0%' }]} />
                      </View>
                      <Text style={styles.lessonStatus}>⏳ Not Started</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.overallProgress}>
                  <Text style={styles.overallTitle}>Overall Progress</Text>
                  <View style={styles.overallBar}>
                    <View style={[styles.overallFill, { width: '65%' }]} />
                  </View>
                  <Text style={styles.overallPercentage}>65% Complete</Text>
                </View>
              </View>
            </View>
          )}

          {sectionFilter === 'improvements' && (
            <View>
              <Text style={styles.sectionTitle}>Improvements for {childProgress.childName}</Text>
              <View style={styles.improvementsContainer}>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Reading Progress</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '75%' }]} />
                  </View>
                  <Text style={styles.progressText}>75%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Spelling Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '15%' }]} />
                  </View>
                  <Text style={styles.progressText}>15%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Writing Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.progressText}>60%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Social Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '45%' }]} />
                  </View>
                  <Text style={styles.progressText}>45%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Math Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '85%' }]} />
                  </View>
                  <Text style={styles.progressText}>85%</Text>
                </View>

                <View style={styles.overallProgress}>
                  <Text style={styles.overallTitle}>Overall Improvements</Text>
                  <View style={styles.overallBar}>
                    <View style={[styles.overallFill, { width: '73%' }]} />
                  </View>
                  <Text style={styles.overallPercentage}>73% Complete</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
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
    fontSize: 16,
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
  bookButton: {
    backgroundColor: '#4F8EF7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
    width: '100%',
  },
  sectionFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    margin: 4,
  },
  sectionFilterButtonActive: {
    backgroundColor: '#4F8EF7',
    borderColor: '#4F8EF7',
  },
  sectionFilterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  sectionFilterButtonTextActive: {
    color: '#fff',
  },
  learningJourneyContainer: {
    marginTop: 15,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F8EF7',
    marginBottom: 10,
  },
  lessonProgress: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lessonName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  lessonStatus: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  overallProgress: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  overallBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  overallFill: {
    height: '100%',
    backgroundColor: '#4F8EF7',
    borderRadius: 5,
  },
  overallPercentage: {
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  improvementsContainer: {
    marginTop: 16,
  },
  improvementItem: {
    marginBottom: 15,
  },
  improvementLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  improvementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default UserDashboard; 