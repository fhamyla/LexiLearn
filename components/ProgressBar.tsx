import React from 'react';
import { View, StyleSheet } from 'react-native';
interface ProgressBarProps {
  progress: number;
  height?: number;
}
const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 8 }) => {
  const getColor = () => {
    if (progress >= 80) return '#10B981'; // green
    if (progress >= 50) return '#2563EB'; // blue
    if (progress >= 25) return '#FBBF24'; // yellow
    return '#F97316'; // orange
  };
  return (
    <View style={[styles.barBackground, { height }]}>
      <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: getColor(), height }]} />
    </View>
  );
};
export default ProgressBar;

const styles = StyleSheet.create({
  barBackground: { width: '100%', backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  barFill: { borderRadius: 6 },
});
