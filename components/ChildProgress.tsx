import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
interface ChildProgressProps {
  childProgress: {
    childName: string;
    childAge: number;
    severity: string;
    overallProgress: number;
    lastActivity: string;
    currentStreak: number;
  };
}
const ChildProgress: React.FC<ChildProgressProps> = ({ childProgress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Child Progress</Text>
      <View style={styles.progressBox}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.childName}>{childProgress.childName}</Text>
            <Text style={styles.childDetails}>
              Age: {childProgress.childAge} | Severity: <Text style={{ textTransform: 'capitalize' }}>{childProgress.severity}</Text>
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current Streak</Text>
              <Text style={styles.statValue}>{childProgress.currentStreak} days</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Last Activity</Text>
              <Text style={styles.statValue}>{childProgress.lastActivity}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{childProgress.overallProgress}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${childProgress.overallProgress}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
};
export default ChildProgress;

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  heading: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  progressBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  childName: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  childDetails: { color: '#4B5563', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
  bottomRow: { marginTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontWeight: '500', color: '#374151' },
  progressPercent: { fontWeight: '600', color: '#2563EB' },
  progressBarBackground: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 6 },
});
