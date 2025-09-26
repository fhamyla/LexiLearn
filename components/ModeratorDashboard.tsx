import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { addStudentDirectly } from '../firebase';
import { collection, onSnapshot, query, where, getDocs, doc, setDoc } from '@firebase/firestore';
import { db, auth } from '../firebase';
import StudentFocusPage from './LearningLibrary/StudentFocusPage';

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  childName?: string;
  childAge?: number;
  severity?: string;
  progress?: number;
  createdBy?: string;
  learningProgress?: any;
  focusAreas?: string[];
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
  const [severityFilter, setSeverityFilter] = useState<'all' | 'mild' | 'moderate' | 'severe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'learning' | 'improvements'>('learning');
  
  // Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAge, setNewStudentAge] = useState('');
  const [newStudentSeverity, setNewStudentSeverity] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  // Learning Library Modal State
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFocusModal, setShowFocusModal] = useState(false);
  // Removed lastFocusedStudent shortcut to enforce Student -> Focus View flow

  useEffect(() => {
    loadData();
  }, []);

  const autoBackfillDoneRef = React.useRef<boolean>(false);

  const backfillMissingOwnershipForDocs = async (docsToCheck: any[], uid: string | null, email: string | null) => {
    if (!uid && !email) return;
    let updated = 0;
    for (const d of docsToCheck) {
      const data: any = d.data ? d.data() : d; // support both docSnap and raw
      if (!data || data.createdBy !== 'moderator') continue;
      const hasUid = !!data.createdByUid;
      const hasEmail = !!data.createdByEmail;
      if (!hasUid || !hasEmail) {
        try {
          await setDoc(doc(db, 'students', d.id), {
            createdByUid: uid || data.createdByUid || null,
            createdByEmail: email || data.createdByEmail || null,
          }, { merge: true });
          updated += 1;
        } catch (_err) {}
      }
    }
    if (updated > 0 && __DEV__) {
      console.log(`Auto-backfill updated ${updated} student docs.`);
    }
  };

  const mapAndFilterForModerator = (rawStudents: any[], uid: string | null, email: string | null): Student[] => {
    const owned = rawStudents.filter((s: any) => {
      if (!s || s.createdBy !== 'moderator') return false;
      if (uid && s.createdByUid === uid) return true;
      if (email && s.createdByEmail === email) return true;
      return false;
    });
    return owned.map((student: any) => ({
        id: student.id,
        childName: student.childName,
        childAge: student.childAge,
        severity: student.severity,
        progress: student.progress || 0,
        createdBy: student.createdBy || 'moderator',
      learningProgress: student.learningProgress || {},
      focusAreas: Array.isArray(student.focusAreas) ? student.focusAreas : [],
    }));
  };

  const attachRealtime = () => {
    const baseRef = collection(db, 'students');

    const unsubscribeStudents = onSnapshot(baseRef, async (snapshot) => {
      const current = auth.currentUser;
      const curUid = current && current.uid ? current.uid : null;
      const curEmail = current && current.email ? current.email : null;

      try {
        await backfillMissingOwnershipForDocs(snapshot.docs, curUid, curEmail);
      } catch (_err) {}

      const directStudents = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      const moderatorStudents = mapAndFilterForModerator(directStudents, curUid, curEmail);
      setStudents(moderatorStudents);
    });

    return unsubscribeStudents;
    };

  const loadData = async () => {
    try {
      const current = auth.currentUser;
      const email = current && current.email ? current.email : null;
      const uid = current && current.uid ? current.uid : null;

      // Always perform backfill on load before filtering
      try {
        const baseRef = collection(db, 'students');
        const qModerators = query(baseRef, where('createdBy', '==', 'moderator'));
        const snap = await getDocs(qModerators);
        await backfillMissingOwnershipForDocs(snap.docs, uid, email);
      } catch (_err) {}

      // Initial load like Admin: read all then filter client-side
      const baseRef = collection(db, 'students');
      const snapshot = await getDocs(baseRef);
      const directStudents = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      const moderatorStudents = mapAndFilterForModerator(directStudents, uid, email);
      setStudents(moderatorStudents);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      unsubscribeRef.current = attachRealtime();

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

      setLearningContent(mockContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeRef = React.useRef<null | (() => void)>(null);

  React.useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const getStudentsWithSeverity = () => {
    if (severityFilter === 'all') {
      return students;
    }
    return students.filter(student => student.severity === severityFilter);
  };

  // Normalize categories for selection and display
  const normalizeCategory = (key: string) => {
    const lower = (key || '').toLowerCase();
    if (lower === 'socialskills' || lower === 'social skills') return 'social skills';
    if (lower === 'spelling') return 'spelling';
    if (lower === 'writing') return 'writing';
    return lower;
  };

  const orderCategories = (categories: string[]) => {
    const desiredOrder = ['reading', 'math', 'social skills', 'spelling', 'writing'];
    const set = new Set(categories.map(normalizeCategory));
    // Ensure spelling and writing are present even if not in learningProgress yet
    set.add('spelling');
    set.add('writing');
    const unique = Array.from(set);
    const priority = new Map<string, number>();
    desiredOrder.forEach((c, idx) => priority.set(c, idx));
    return unique.sort((a, b) => {
      const ai = priority.has(a) ? (priority.get(a) as number) : Number.MAX_SAFE_INTEGER;
      const bi = priority.has(b) ? (priority.get(b) as number) : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.localeCompare(b);
    });
  };

  const getStudentsWithSeverityAndSearch = () => {
    let filtered = getStudentsWithSeverity();
    
    if (searchQuery.trim() === '') {
      return filtered;
    }
    
    const queryStr = searchQuery.toLowerCase();
    return filtered.filter(student => {
      const guardianName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const childName = (student.childName || '').toLowerCase();
      
      return guardianName.includes(queryStr) || childName.includes(queryStr);
    });
  };

  const moderatorCreatedStudents = () => {
    return students.filter((s) => (s.createdBy || '').toLowerCase() === 'moderator');
  };

  const getModeratorStudentsWithSearch = () => {
    const base = moderatorCreatedStudents();
    if (searchQuery.trim() === '') return base;
    const queryStr = searchQuery.toLowerCase();
    return base.filter((student) => (student.childName || '').toLowerCase().includes(queryStr));
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

  const handleAddStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleCloseAddStudentModal = () => {
    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewStudentAge('');
    setNewStudentSeverity('');
  };

  const handleNewStudentAgeChange = (text: string) => {
    // Only allow up to 2 digits, no letters or special characters
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    setNewStudentAge(sanitized);
  };

  const handleNewStudentNameChange = (text: string) => {
    // Only allow alphabetic characters and spaces
    const nameRegex = /^[A-Za-z\s]*$/;
    if (text === '' || nameRegex.test(text)) {
      setNewStudentName(text);
    }
  };

  const handleSaveStudent = async () => {
    // Validate required fields
    if (!newStudentName.trim()) {
      Alert.alert('Error', 'Please enter the student\'s name');
      return;
    }
    if (!newStudentAge) {
      Alert.alert('Error', 'Please enter the student\'s age');
      return;
    }
    if (!newStudentSeverity) {
      Alert.alert('Error', 'Please select the severity level');
      return;
    }

    setIsAddingStudent(true);

    try {
      // Use Firebase function to add student directly
      const result = await addStudentDirectly({
        childName: newStudentName.trim(),
        childAge: parseInt(newStudentAge),
        severity: newStudentSeverity,
      });

      if (result.success) {
        // Rely on Firestore onSnapshot to reflect the new student to avoid duplicate keys
        Alert.alert('Success', 'Student added successfully!');
        handleCloseAddStudentModal();
      } else {
        Alert.alert('Error', result.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student. Please try again.');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleOpenLibrary = () => {
    // Always start from the student list when opening the library
    setSelectedStudent(null);
    setSelectedCategories([]);
    setAvailableCategories([]);
    setShowLibraryModal(true);
  };

  const handleCloseLibrary = () => {
    setShowLibraryModal(false);
    // Reset selection state when closing library
    setSelectedStudent(null);
    setSelectedCategories([]);
    setAvailableCategories([]);
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    const lp = (student && student.learningProgress) || {};
    const rawCategories = Object.keys(lp);
    const categories = rawCategories.map(normalizeCategory);
    // Ensure unique after normalization and apply ordering with spelling/writing at bottom of core three
    const ordered = orderCategories(categories);
    setAvailableCategories(ordered);
    // Preselect saved focus areas if exist (normalize), otherwise all
    const hasSaved = Array.isArray(student.focusAreas) && student.focusAreas.length > 0;
    const savedRaw = hasSaved ? student.focusAreas as string[] : ordered;
    const saved = savedRaw.map(normalizeCategory);
    setSelectedCategories(Array.from(new Set(saved)));
    // If student already has saved focus areas, immediately open focus view
    if (hasSaved) {
      setShowLibraryModal(false);
      setShowFocusModal(true);
    }
  };

  const toggleCategory = (category: string) => {
    const norm = normalizeCategory(category);
    setSelectedCategories((prev) =>
      prev.includes(norm) ? prev.filter((c) => c !== norm) : [...prev, norm]
    );
  };

  const persistFocusAreas = async (studentId: string, categories: string[]) => {
    try {
      const normalized = categories.map(normalizeCategory);
      const studentRef = doc(db, 'students', studentId);
      // Ensure spelling and writing have default lesson items in learningProgress
      const lpEnsure: any = {
        spelling: {
          letter_sounds: { progress: 0, completed: false },
          cvc_words: { progress: 0, completed: false },
        },
        writing: {
          letter_foundation: { progress: 0, completed: false },
          copying_words: { progress: 0, completed: false },
        },
      };
      await setDoc(
        studentRef,
        { 
          focusAreas: normalized,
          learningProgress: lpEnsure,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to save focus areas:', err);
      Alert.alert('Save Failed', 'Could not save focus areas. Please try again.');
    }
  };

  const openFocusView = async () => {
    if (!selectedStudent) return;
    if (selectedCategories.length === 0) {
      Alert.alert('Select Focus', 'Please choose at least one focus area.');
      return;
    }
    await persistFocusAreas(selectedStudent.id, selectedCategories);
    setShowLibraryModal(false);
    setShowFocusModal(true);
  };

  const closeFocusView = () => {
    // Close focus view and reset selection so reopening the library shows the student list
    setShowFocusModal(false);
    setSelectedStudent(null);
    setSelectedCategories([]);
    setAvailableCategories([]);
    setShowLibraryModal(false);
  };

  const backfillMyOwnership = async () => {
    try {
      const current = auth.currentUser;
      if (!current || (!current.uid && !current.email)) {
        Alert.alert('Not Signed In', 'Please sign in again and try backfill.');
        return;
      }
      const uid = current.uid || null;
      const email = current.email || null;

      // Get moderator-added students (cannot query for missing fields; filter client-side)
      const baseRef = collection(db, 'students');
      const qModerators = query(baseRef, where('createdBy', '==', 'moderator'));
      const snap = await getDocs(qModerators);
      const toUpdate = snap.docs.filter((d) => {
        const data: any = d.data();
        const hasUid = !!data.createdByUid;
        const hasEmail = !!data.createdByEmail;
        return !hasUid || !hasEmail;
      });

      let updated = 0;
      for (const docSnap of toUpdate) {
        try {
          await setDoc(doc(db, 'students', docSnap.id), {
            createdByUid: uid,
            createdByEmail: email,
          }, { merge: true });
          updated += 1;
        } catch (_err) {}
      }

      Alert.alert('Backfill Complete', `Updated ${updated} student(s).`);
      // Reload to reflect
      loadData();
    } catch (err) {
      Alert.alert('Backfill Failed', 'Could not complete backfill.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moderator Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addStudentButton} onPress={handleAddStudent}>
            <Text style={styles.addStudentButtonText}>+ Add Student</Text>
          </TouchableOpacity>
          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TouchableOpacity style={styles.bookButton} onPress={handleOpenLibrary}>
          <Text style={styles.bookButtonText}>Learning Library</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by guardian or child name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Section Filter Buttons */}
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
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Children's Learning Journey ({students.length})</Text>
        
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
        ) : getStudentsWithSeverityAndSearch().length === 0 ? (
          <Text style={styles.emptyText}>No children found</Text>
        ) : (
          getStudentsWithSeverityAndSearch().map((student) => (
            <View key={student.id} style={styles.childCard}>
              <Text style={styles.childName}>{student.firstName} {student.lastName}</Text>
              <Text style={styles.childInfo}>Child: {student.childName} (Age: {student.childAge})</Text>
              <Text style={styles.severityInfo}>Severity: {student.severity}</Text>
              
              {/* Learning Journey per child */}
              <View style={styles.learningJourneyContainer}>
                <Text style={styles.journeyTitle}>Learning Journey for {student.childName}</Text>
                
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
          <Text style={styles.sectionTitle}>Improvements Bar ({students.length})</Text>
        
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
        ) : getStudentsWithSeverityAndSearch().length === 0 ? (
          <Text style={styles.emptyText}>No children found</Text>
        ) : (
          getStudentsWithSeverityAndSearch().map((student) => (
            <View key={student.id} style={styles.childCard}>
              <Text style={styles.childName}>{student.firstName} {student.lastName}</Text>
              <Text style={styles.childInfo}>Child: {student.childName} (Age: {student.childAge})</Text>
              <Text style={styles.severityInfo}>Severity: {student.severity}</Text>
              
              {/* Improvements per child */}
              <View style={styles.improvementsContainer}>
                <Text style={styles.improvementTitle}>Improvements for {student.childName}</Text>
                <View style={styles.improvementItem}>
                  <Text style={styles.improvementLabel}>Reading Progress</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '75%' }]} />
                  </View>
                  <Text style={styles.progressText}>75%</Text>
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
                  <Text style={styles.improvementLabel}>Writing Skills</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '10%' }]} />
                  </View>
                  <Text style={styles.progressText}>10%</Text>
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

      {/* Add Student Modal */}
      <Modal
        visible={showAddStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseAddStudentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Student</Text>
            
            <Text style={styles.modalLabel}>Student Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter student's name"
              value={newStudentName}
              onChangeText={handleNewStudentNameChange}
              autoCapitalize="words"
            />
            
            <Text style={styles.modalLabel}>Age *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter age"
              value={newStudentAge}
              onChangeText={handleNewStudentAgeChange}
              keyboardType="numeric"
              maxLength={2}
            />
            
            <Text style={styles.modalLabel}>Dyslexia Severity *</Text>
            <View style={styles.modalPickerContainer}>
              <Picker
                selectedValue={newStudentSeverity}
                onValueChange={setNewStudentSeverity}
                style={styles.modalPicker}
              >
                <Picker.Item label="Select severity" value="" />
                <Picker.Item label="Mild" value="mild" />
                <Picker.Item label="Moderate" value="moderate" />
                <Picker.Item label="Severe" value="severe" />
                <Picker.Item label="Profound" value="profound" />
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={handleCloseAddStudentModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveButton, isAddingStudent && styles.modalSaveButtonDisabled]} 
                onPress={handleSaveStudent}
                disabled={isAddingStudent}
              >
                <Text style={styles.modalSaveButtonText}>
                  {isAddingStudent ? 'Adding...' : 'Add Student'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Learning Library Modal: show students created by moderators */}
      <Modal
        visible={showLibraryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseLibrary}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Learning Library</Text>
            <Text style={styles.modalLabel}>Moderator-added Students ({moderatorCreatedStudents().length})</Text>

            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : moderatorCreatedStudents().length === 0 ? (
              <Text style={styles.emptyText}>No moderator-added students</Text>
            ) : selectedStudent ? (
              <View>
                <Text style={styles.modalLabel}>Choose focus areas for {selectedStudent.childName}</Text>
                <View style={styles.sectionFilterContainer}>
                  {availableCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[styles.sectionFilterButton, selectedCategories.includes(category) && styles.sectionFilterButtonActive]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text style={[styles.sectionFilterButtonText, selectedCategories.includes(category) && styles.sectionFilterButtonTextActive]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.bookButton, { backgroundColor: '#6c757d', paddingVertical: 14, paddingHorizontal: 20 }]}
                    onPress={handleCloseLibrary}
                  >
                    <Text style={[styles.bookButtonText, { fontSize: 16 }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.bookButton, { backgroundColor: '#28a745', paddingVertical: 14, paddingHorizontal: 20 }]}
                    onPress={async () => {
                      // Save chosen focus areas and open Focus View immediately
                      await openFocusView();
                    }}
                  >
                    <Text style={[styles.bookButtonText, { fontSize: 16 }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {getModeratorStudentsWithSearch().map((student) => (
                  <TouchableOpacity key={student.id} style={styles.studentCard} onPress={() => handleSelectStudent(student)}>
                    <Text style={styles.studentName}>{student.childName} {student.childAge ? `(Age: ${student.childAge})` : ''}</Text>
                    <Text style={styles.severityInfo}>Severity: {student.severity}</Text>
                  </TouchableOpacity>
                ))}
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <TouchableOpacity 
                    style={{ paddingVertical: 10, paddingHorizontal: 32, backgroundColor: '#6c757d', borderRadius: 20 }}
                    onPress={handleCloseLibrary}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            
          </View>
        </View>
      </Modal>

      {/* Full-screen Focus View */}
      <Modal
        visible={showFocusModal}
        animationType="slide"
        transparent={false}
        supportedOrientations={["landscape"]}
        onRequestClose={closeFocusView}
      >
        <View style={{ flex: 1 }}>
          <View style={{ padding: 8, backgroundColor: '#4F8EF7', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={closeFocusView}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>

          <StudentFocusPage student={selectedStudent} selectedCategories={selectedCategories} />
          {/* Removed standalone Close Focus button to mirror parent's modal */}
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F8EF7',
    textAlign: 'center',
    flex: 1,
  },
  addStudentButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addStudentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    color: '#333',
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
  childInfo: {
    fontSize: 14,
    color: '#4F8EF7',
    marginTop: 4,
    fontStyle: 'italic',
  },
  severityInfo: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
    fontWeight: '600',
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
  improvementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
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
    flexWrap: 'wrap',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F8EF7',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    marginBottom: 4,
  },
  modalPickerContainer: {
    borderWidth: 1.5,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    marginBottom: 4,
  },
  modalPicker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.7,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
});

export default ModeratorDashboard; 