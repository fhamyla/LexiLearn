import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProgressBar from './ProgressBar';
interface ImprovementsBarProps { childName: string; }
const ImprovementsBar: React.FC<ImprovementsBarProps> = ({ childName }) => {
  const improvements = [
    { label: 'Reading Progress', progress: 75 },
    { label: 'Spelling Skills', progress: 15 },
    { label: 'Writing Skills', progress: 60 },
    { label: 'Social Skills', progress: 45 },
    { label: 'Math Skills', progress: 85 },
  ];
  const overallProgress = Math.round(improvements.reduce((sum, item) => sum + item.progress, 0) / improvements.length);
  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Improvements for {childName}</Text>
      {improvements.map(item => (
        <View key={item.label} style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontWeight: '500' }}>{item.label}</Text>
            <Text style={{ color: '#2563EB', fontWeight: '600' }}>{item.progress}%</Text>
          </View>
          <ProgressBar progress={item.progress} />
        </View>
      ))}
      <View style={{ marginTop: 12, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Overall Improvements</Text>
        <ProgressBar progress={overallProgress} height={12} />
        <Text style={{ textAlign: 'right', marginTop: 4, fontWeight: '500', color: '#2563EB' }}>{overallProgress}% Complete</Text>
      </View>
    </View>
  );
};
export default ImprovementsBar;
