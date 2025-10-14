import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { CheckIcon, XIcon } from 'lucide-react-native';
interface FocusAreaModalProps {
  availableCategories: string[];
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  onSave: () => void;
  onClose: () => void;
}
const FocusAreaModal: React.FC<FocusAreaModalProps> = ({ availableCategories, selectedCategories, toggleCategory, onSave, onClose }) => {
  return (
    <Modal transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Choose Focus Areas</Text>
            <TouchableOpacity onPress={onClose}><XIcon size={20} color="#6B7280" /></TouchableOpacity>
          </View>
          <Text style={{ color: '#4B5563', marginBottom: 12 }}>Select the learning areas you want to focus on with your child.</Text>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {availableCategories.map(cat => {
              const isSelected = selectedCategories.includes(cat.toLowerCase());
              return (
                <TouchableOpacity key={cat} onPress={() => toggleCategory(cat)}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    borderWidth: 2, borderColor: isSelected ? '#2563EB' : '#E5E7EB',
                    backgroundColor: isSelected ? '#DBEAFE' : '#fff', padding: 12, borderRadius: 12, margin: 4
                  }}>
                  <Text style={{ color: isSelected ? '#2563EB' : '#374151', fontWeight: '500' }}>{cat}</Text>
                  {isSelected && <CheckIcon size={18} color="#2563EB" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 }}>
              <Text style={{ color: '#374151', fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={{ padding: 10, backgroundColor: '#2563EB', borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '500' }}>Save Focus Areas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
export default FocusAreaModal;
