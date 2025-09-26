import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface StudentFocusPageProps {
  student: any;
  selectedCategories: string[];
}

const categoryTitleMap: Record<string, string> = {
  reading: '📚 Reading',
  writing: '✍️ Writing',
  spelling: '🔤 Spelling',
  math: '🔢 Math',
  'social skills': '🤝 Social Skills',
};

const humanizeKey = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();

const titleForCategory = (key: string) => {
  const norm = key.toLowerCase();
  return categoryTitleMap[norm] || (norm.charAt(0).toUpperCase() + norm.slice(1));
};

const getCategoryItems = (learningProgress: any, categoryKey: string) => {
  const norm = categoryKey.toLowerCase();
  // Support legacy key 'socialSkills'
  if (norm === 'social skills') {
    return learningProgress['social skills'] || learningProgress['socialSkills'] || {};
  }
  return learningProgress[norm] || learningProgress[categoryKey] || {};
};

const prettyItemName = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());

const StudentFocusPage: React.FC<StudentFocusPageProps> = ({ student, selectedCategories }) => {
  const learningProgress = (student && student.learningProgress) || {};
  const categoriesToShow = selectedCategories;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>{student?.childName || 'Student'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container} horizontal>
        {categoriesToShow.length === 0 ? (
          <Text style={styles.emptyText}>No focus areas selected.</Text>
        ) : (
          categoriesToShow.map((categoryKey) => {
            const title = titleForCategory(categoryKey);
            const items = getCategoryItems(learningProgress, categoryKey);
            const itemKeys = Object.keys(items);
            return (
              <View key={categoryKey} style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {itemKeys.length === 0 ? (
                  <Text style={styles.emptyText}>No items in this category.</Text>
                ) : (
                  itemKeys.map((itemKey) => {
                    const item = items[itemKey];
                    const progressPercent = typeof item?.progress === 'number' ? Math.max(0, Math.min(100, item.progress)) : 0;
                    const status = item?.completed ? '✅ Completed' : progressPercent > 0 ? '🔄 In Progress' : '⏳ Not Started';
                    return (
                      <View key={itemKey} style={styles.lessonItem}>
                        <Text style={styles.lessonName}>{prettyItemName(itemKey)}</Text>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.lessonStatus}>{status}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0F4F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F0F4F8',
      flexDirection: 'row',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F8EF7',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  lessonName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10,
    width: 100,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  lessonStatus: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    minWidth: 90,
    textAlign: 'right',
  },
});

export default StudentFocusPage;
