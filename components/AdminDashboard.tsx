import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { getPendingTeachers, getAllUsers, getAllStudents, approveTeacher, rejectTeacher, scheduleDatabaseDeletion, auth, db } from '../firebase';
import { collection, onSnapshot, doc, setDoc } from '@firebase/firestore';

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
  createdBy?: string;
}

const AdminDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  console.log('AdminDashboard rendered, onLogout:', !!onLogout);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'guardian' | 'moderator'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'pending' | 'accounts' | 'learning' | 'improvements'>('pending');

  useEffect(() => {
    console.log('AdminDashboard mounted, onLogout prop:', !!onLogout);
    loadData();

    // Real-time updates: auto-refresh lists when Firestore users change
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setAllUsers(users as User[]);
      const pending = users.filter((u: any) => u.userType === 'teacher' && u.status === 'pending');
      setPendingTeachers(pending as Teacher[]);
    });

    // Real-time updates for students collection - Enhanced for Learning Journey and Improvements Bar
    const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const students = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setAllStudents(students);
      
      // The Learning Journey and Improvements Bar sections will automatically update
      // because they use getChildrenWithSeverityAndSearch() which depends on allStudents
    });

    return () => {
      unsubscribeUsers();
      unsubscribeStudents();
    };
  }, []);

  const loadData = async () => {
    try {
      // Load real data from Firebase
      const [teachers, users, students] = await Promise.all([
        getPendingTeachers(),
        getAllUsers(),
        getAllStudents(),
      ]);
      setPendingTeachers(teachers as Teacher[]);
      setAllUsers(users as User[]);
      setAllStudents(students);
      // Ensure all students in Firestore have spelling and writing keys in learningProgress
      try {
        for (const s of students) {
          const sid = (s as any).id;
          const lp = (s as any).learningProgress || {};
          const spelling = lp.spelling || {};
          const writing = lp.writing || {};
          try {
            await setDoc(doc(db, 'students', sid), {
              learningProgress: {
                spelling: {
                  letter_sounds: spelling.letter_sounds || { progress: 0, completed: false },
                  cvc_words: spelling.cvc_words || { progress: 0, completed: false },
                },
                writing: {
                  letter_foundation: writing.letter_foundation || { progress: 0, completed: false },
                  copying_words: writing.copying_words || { progress: 0, completed: false },
                },
              },
            }, { merge: true });
          } catch (_innerErr) {}
        }
      } catch (_ensureErr) {}
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
        // Silent success, just refresh lists
        loadData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve teacher');
    }
  };

  const handleRejectTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedUser(null);
    setDeleteEmail(teacher.email || '');
    setDeletePassword('');
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async (user: User) => {
    setSelectedUser(user);
    setSelectedTeacher(null);
    setDeleteEmail(user.email || '');
    setDeletePassword('');
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeacher && !selectedUser) {
      Alert.alert('Error', 'No user or teacher selected for deletion.');
      return;
    }

    let emailToDelete = '';
    let passwordToDelete = deletePassword;

    if (selectedTeacher) {
      emailToDelete = selectedTeacher.email || '';
    } else if (selectedUser) {
      emailToDelete = selectedUser.email || '';
    }

    // Only require email; if no password, schedule Firestore-only deletion in 60s
    if (!emailToDelete) {
      Alert.alert('Error', 'Please enter the email');
      return;
    }

    try {
      if (passwordToDelete) {
        const result = await rejectTeacher(emailToDelete, passwordToDelete);
        if (result.success) {
          Alert.alert('Success', result.message);
        } else {
          Alert.alert('Error', result.message);
          return;
        }
      } else {
        const result = await scheduleDatabaseDeletion(emailToDelete, 60000);
        if (result.success) {
          Alert.alert('Scheduled', result.message);
        } else {
          Alert.alert('Error', result.message);
          return;
        }
      }
      // Optimistically remove from local state
      setAllUsers(prev => prev.filter(u => (u.email || '') !== emailToDelete));
      setPendingTeachers(prev => prev.filter(t => (t.email || '') !== emailToDelete));

      // Close dialog and clear fields
      setShowDeleteDialog(false);
      setDeleteEmail('');
      setDeletePassword('');
      setSelectedTeacher(null);
      setSelectedUser(null);

      // Immediate refresh; real-time listener will keep lists updated
      loadData();

      // Removed auto-logout to avoid logging out admin when deleting other accounts
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteEmail('');
    setDeletePassword('');
    setSelectedTeacher(null);
    setSelectedUser(null);
  };

  const getFilteredUsers = () => {
    if (filterType === 'all') {
      return allUsers;
    } else if (filterType === 'guardian') {
      return allUsers.filter(user => user.userType === 'guardian');
    } else if (filterType === 'moderator') {
      return allUsers.filter(user => user.userType === 'teacher');
    }
    return allUsers;
  };

  const getChildrenWithSeverity = () => {
    // Get guardian students (from users collection)
    const guardianUsers = allUsers.filter(user => user.userType === 'guardian');
    
    // Get directly added students (from students collection)
    const directStudents = allStudents.map(student => ({
      id: student.id,
      firstName: 'Moderator Added', // Indicate this was added by moderator
      lastName: '',
      childName: student.childName,
      childAge: student.childAge,
      severity: student.severity,
      createdBy: student.createdBy || 'moderator'
    }));
    
    // Combine both types of students
    const allChildren = [...guardianUsers, ...directStudents];
    
    if (severityFilter === 'all') {
      return allChildren;
    }
    return allChildren.filter(child => child.severity === severityFilter);
  };

  const getFilteredUsersWithSearch = () => {
    let filtered = getFilteredUsers();
    
    if (searchQuery.trim() === '') {
      return filtered;
    }
    
    const query = searchQuery.toLowerCase();
    return filtered.filter(user => {
      const guardianName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const childName = (user.childName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return guardianName.includes(query) || 
             childName.includes(query) || 
             email.includes(query);
    });
  };

  const getChildrenWithSeverityAndSearch = () => {
    let filtered = getChildrenWithSeverity();
    
    if (searchQuery.trim() === '') {
      return filtered;
    }
    
    const query = searchQuery.toLowerCase();
    return filtered.filter(child => {
      const guardianName = `${child.firstName || ''} ${child.lastName || ''}`.toLowerCase();
      const childName = (child.childName || '').toLowerCase();
      
      return guardianName.includes(query) || childName.includes(query);
    });
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
      {showDeleteDialog && (selectedTeacher || selectedUser) && (
        <View style={styles.deleteDialog}>
          <Text style={styles.deleteDialogTitle}>Confirm Account Deletion</Text>
          <TextInput
            style={styles.deleteDialogInput}
            placeholder="Email"
            value={deleteEmail}
            onChangeText={setDeleteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {/* Password field removed: admin path uses Cloud Function if password omitted */}
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



      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by guardian, moderator, or child name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Section Filter Buttons */}
      <View style={styles.sectionFilterContainer}>
        <TouchableOpacity
          style={[styles.sectionFilterButton, sectionFilter === 'pending' && styles.sectionFilterButtonActive]}
          onPress={() => setSectionFilter('pending')}
        >
          <Text style={[styles.sectionFilterButtonText, sectionFilter === 'pending' && styles.sectionFilterButtonTextActive]}>
            Pending Approvals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionFilterButton, sectionFilter === 'accounts' && styles.sectionFilterButtonActive]}
          onPress={() => setSectionFilter('accounts')}
        >
          <Text style={[styles.sectionFilterButtonText, sectionFilter === 'accounts' && styles.sectionFilterButtonTextActive]}>
            All Accounts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Learning Journey and Improvements Bar Sections */}
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

      {sectionFilter === 'pending' && (
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
      )}

      {sectionFilter === 'accounts' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Accounts ({getFilteredUsersWithSearch().length})</Text>
          
          {/* Filter Buttons */}
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'guardian' && styles.filterButtonActive]}
              onPress={() => setFilterType('guardian')}
            >
              <Text style={[styles.filterButtonText, filterType === 'guardian' && styles.filterButtonTextActive]}>Guardian</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'moderator' && styles.filterButtonActive]}
              onPress={() => setFilterType('moderator')}
            >
              <Text style={[styles.filterButtonText, filterType === 'moderator' && styles.filterButtonTextActive]}>Moderator</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : getFilteredUsersWithSearch().length === 0 ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : (
            getFilteredUsersWithSearch().map((user) => (
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
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <Text style={styles.actionButtonText}>Delete User</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {sectionFilter === 'learning' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Learning Journey ({allStudents.length})</Text>
        
        {/* Severity Filter Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('all')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'mild' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('mild')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'mild' && styles.filterButtonTextActive]}>Mild</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'moderate' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('moderate')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'moderate' && styles.filterButtonTextActive]}>Moderate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'severe' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('severe')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'severe' && styles.filterButtonTextActive]}>Severe</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : getChildrenWithSeverityAndSearch().length === 0 ? (
          <Text style={styles.emptyText}>No children found</Text>
        ) : (
          getChildrenWithSeverityAndSearch().map((child) => (
            <View key={child.id} style={styles.childCard}>
              <Text style={styles.childName}>
                {child.createdBy === 'moderator' ? 'Moderator Added Student' : `${child.firstName} ${child.lastName}`}
              </Text>
              <Text style={styles.childInfo}>Child: {child.childName} (Age: {child.childAge})</Text>
              <Text style={styles.severityInfo}>Severity: {child.severity}</Text>
              {child.createdBy === 'moderator' && (
                <Text style={styles.moderatorAddedInfo}>Added by Moderator</Text>
              )}
              
              {/* Learning Journey per child */}
              <View style={styles.learningJourneyContainer}>
                <Text style={styles.journeyTitle}>Learning Journey for {child.childName}</Text>
                
                {/* Reading Category */}
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

                {/* Math Category */}
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

                {/* Social Skills Category */}
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

                {/* Spelling Category */}
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

                {/* Writing Category */}
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

                {/* Overall Progress */}
                <View style={styles.overallProgress}>
                  <Text style={styles.overallTitle}>Overall Progress</Text>
                  <View style={styles.overallBar}>
                    <View style={[styles.overallFill, { width: '65%' }]} />
                  </View>
                  <Text style={styles.overallPercentage}>65% Complete</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      )}

      {sectionFilter === 'improvements' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Improvements Bar ({allStudents.length})</Text>
        
        {/* Severity Filter Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('all')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'mild' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('mild')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'mild' && styles.filterButtonTextActive]}>Mild</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'moderate' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('moderate')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'moderate' && styles.filterButtonTextActive]}>Moderate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, severityFilter === 'severe' && styles.filterButtonActive]}
            onPress={() => setSeverityFilter('severe')}
          >
            <Text style={[styles.filterButtonText, severityFilter === 'severe' && styles.filterButtonTextActive]}>Severe</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : getChildrenWithSeverityAndSearch().length === 0 ? (
          <Text style={styles.emptyText}>No children found</Text>
        ) : (
          getChildrenWithSeverityAndSearch().map((child) => (
            <View key={child.id} style={styles.childCard}>
              <Text style={styles.childName}>
                {child.createdBy === 'moderator' ? 'Moderator Added Student' : `${child.firstName} ${child.lastName}`}
              </Text>
              <Text style={styles.childInfo}>Child: {child.childName} (Age: {child.childAge})</Text>
              <Text style={styles.severityInfo}>Severity: {child.severity}</Text>
              {child.createdBy === 'moderator' && (
                <Text style={styles.moderatorAddedInfo}>Added by Moderator</Text>
              )}
              
              {/* Improvements per child */}
              <View style={styles.improvementsContainer}>
                <Text style={styles.improvementTitle}>Improvements for {child.childName}</Text>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Reading Progress</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '75%' }]} />
                  </View>
                  <Text style={styles.progressText}>75%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Writing Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.progressText}>60%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Math Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '85%' }]} />
                  </View>
                  <Text style={styles.progressText}>85%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Spelling Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '15%' }]} />
                  </View>
                  <Text style={styles.progressText}>15%</Text>
                </View>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Social Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '45%' }]} />
                  </View>
                  <Text style={styles.progressText}>45%</Text>
                </View>
                
                {/* Overall Improvements */}
                <View style={styles.overallProgress}>
                  <Text style={styles.overallTitle}>Overall Improvements</Text>
                  <View style={styles.overallBar}>
                    <View style={[styles.overallFill, { width: '73%' }]} />
                  </View>
                  <Text style={styles.overallPercentage}>73% Complete</Text>
                </View>
              </View>
            </View>
          ))
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
  searchContainer: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 20,
  },
  searchInput: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
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
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 5,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: '#4F8EF7',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  improvementsContainer: {
    marginTop: 15,
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
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F8EF7',
    borderRadius: 5,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  childCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  severityInfo: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
    fontWeight: '600',
  },
  improvementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  learningJourneyContainer: {
    marginTop: 15,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
  sectionFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    width: '100%',
    maxWidth: 600,
  },
  sectionFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
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
  moderatorAddedInfo: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 4,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default AdminDashboard; 