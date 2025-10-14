import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProgressBar from './ProgressBar';

interface LearningJourneyProps {
  childName: string;
  learningProgress: {
    [category: string]: {
      [lesson: string]: { progress: number; completed: boolean };
    };
  };
}

const LearningJourney: React.FC<LearningJourneyProps> = ({
  childName,
  learningProgress = {} // <-- default empty object
}) => {
  const formatLessonName = (name: string): string => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getCategoryIcon = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('read')) return '📚';
    if (lowerCategory.includes('math')) return '🔢';
    if (lowerCategory.includes('social')) return '🤝';
    if (lowerCategory.includes('spell')) return '🔤';
    if (lowerCategory.includes('writ')) return '✍️';
    return '📝';
  };

  const getLessonStatus = (progress: number): { icon: string; text: string; color: string } => {
    if (progress === 100) return { icon: '✅', text: 'Completed', color: 'text-green-600' };
    if (progress > 0) return { icon: '🔄', text: 'In Progress', color: 'text-blue-600' };
    return { icon: '⏳', text: 'Not Started', color: 'text-gray-500' };
  };

  const calculateOverallProgress = (): number => {
    let totalLessons = 0;
    let totalProgress = 0;
    Object.values(learningProgress || {}).forEach(category => {
      Object.values(category || {}).forEach(lesson => {
        totalLessons++;
        totalProgress += lesson.progress;
      });
    });
    return totalLessons > 0 ? Math.round(totalProgress / totalLessons) : 0;
  };

  const overallProgress = calculateOverallProgress();

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
        Learning Journey for {childName}
      </Text>

      {Object.entries(learningProgress || {}).map(([category, lessons]) => (
        <View key={category} style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#2563EB', marginBottom: 6 }}>
            {getCategoryIcon(category)} {category}
          </Text>

          <View style={{ backgroundColor: '#F3F4F6', borderRadius: 10, padding: 10 }}>
            {Object.entries(lessons || {}).map(([lesson, { progress }]) => {
              const status = getLessonStatus(progress);
              return (
                <View key={lesson} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontWeight: '500', color: '#1F2937' }}>{formatLessonName(lesson)}</Text>
                    <Text>{status.icon} {status.text}</Text>
                  </View>
                  <ProgressBar progress={progress} />
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View style={{ marginTop: 15, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 5 }}>Overall Progress</Text>
        <ProgressBar progress={overallProgress} height={12} />
        <Text style={{ textAlign: 'right', marginTop: 5, fontWeight: '500', color: '#2563EB' }}>
          {overallProgress}% Complete
        </Text>
      </View>
    </View>
  );
};


export default LearningJourney;

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1F2937' },
  categoryTitle: { fontSize: 16, fontWeight: '500', color: '#2563EB', marginBottom: 8 },
  card: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  lessonCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lessonName: { fontWeight: '500', color: '#1F2937' },
  status: { fontWeight: '600' },
  overallCard: { marginTop: 16, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 },
  overallTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1F2937' },
  overallValue: { textAlign: 'right', marginTop: 4, fontWeight: '500', color: '#2563EB' },
});
