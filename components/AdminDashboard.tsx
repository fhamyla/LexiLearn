import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const AdminDashboard: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approve Moderators/Teachers</Text>
        {/* TODO: List and approve pending moderator/teacher accounts */}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Accounts</Text>
        {/* TODO: List all user accounts */}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Children's Learning Progress</Text>
        {/* TODO: Show and track learning progress of children */}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#4F8EF7',
    textAlign: 'center',
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
});

export default AdminDashboard; 