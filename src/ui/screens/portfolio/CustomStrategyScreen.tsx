import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, Card, Button } from '../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../../theme';
import { usePortfolio, CustomStrategy } from '../../../contexts/PortfolioContext';
import { generateId } from '../../../utils/format';

const ASSET_CLASSES = [
  '미국주식', '나스닥', '선진국주식', '신흥국주식', '한국주식',
  '미국채권', '장기채', '중기채', '단기채',
  '금', '원자재', '리츠',
  '소형가치주', '미국배당', '미국가치', '하이일드', '투자등급채',
  '현금',
];

export function CustomStrategyScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { saveCustomStrategy } = usePortfolio();
  const [name, setName] = useState('');
  const [allocations, setAllocations] = useState<{ assetClass: string; weight: string }[]>([
    { assetClass: '미국주식', weight: '60' },
    { assetClass: '미국채권', weight: '40' },
  ]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const totalWeight = allocations.reduce((sum, a) => sum + (parseFloat(a.weight) || 0), 0);
  const usedClasses = allocations.map((a) => a.assetClass);

  const addRow = () => {
    const unused = ASSET_CLASSES.find((ac) => !usedClasses.includes(ac));
    if (unused) setAllocations([...allocations, { assetClass: unused, weight: '0' }]);
  };

  const removeRow = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const openPicker = (index: number) => {
    setPickerIndex(index);
    setPickerVisible(true);
  };

  const selectAssetClass = (assetClass: string) => {
    if (pickerIndex !== null) {
      const updated = [...allocations];
      updated[pickerIndex] = { ...updated[pickerIndex], assetClass };
      setAllocations(updated);
    }
    setPickerVisible(false);
    setPickerIndex(null);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('오류', '전략 이름을 입력하세요.'); return; }
    if (Math.abs(totalWeight - 100) > 0.1) { Alert.alert('오류', '비중 합계가 100%여야 합니다.'); return; }

    const strategy: CustomStrategy = {
      id: generateId(),
      name: name.trim(),
      allocations: allocations
        .filter((a) => parseFloat(a.weight) > 0)
        .map((a) => ({ assetClass: a.assetClass, weight: parseFloat(a.weight) })),
      createdAt: new Date().toISOString(),
    };
    await saveCustomStrategy(strategy);
    navigation.goBack();
  };

  // Available options: current selection + unused classes
  const availableForPicker = ASSET_CLASSES.filter(
    (ac) => pickerIndex !== null && (ac === allocations[pickerIndex]?.assetClass || !usedClasses.includes(ac)),
  );

  return (
    <ScreenWrapper>
      <Text style={[typography.h2, { color: theme.text, marginTop: 8 }]}>커스텀 전략 만들기</Text>

      <View style={styles.section}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>전략 이름</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          value={name}
          onChangeText={setName}
          placeholder="예: 내 올웨더 변형"
          placeholderTextColor={theme.textTertiary}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.captionBold, { color: theme.textSecondary }]}>자산 배분</Text>
          <Text style={[typography.captionBold, { color: Math.abs(totalWeight - 100) < 0.1 ? theme.success : theme.danger }]}>
            합계: {totalWeight.toFixed(1)}%
          </Text>
        </View>

        {allocations.map((a, i) => (
          <Card key={i}>
            <View style={styles.allocRow}>
              <Pressable
                style={[styles.assetSelect, { backgroundColor: theme.surfaceVariant, flex: 1 }]}
                onPress={() => openPicker(i)}
              >
                <View style={styles.assetSelectInner}>
                  <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{a.assetClass}</Text>
                  <Text style={[typography.caption, { color: theme.textTertiary }]}>▼</Text>
                </View>
              </Pressable>
              <TextInput
                style={[styles.weightInput, { backgroundColor: theme.surfaceVariant, color: theme.text }]}
                value={a.weight}
                onChangeText={(t) => {
                  const updated = [...allocations];
                  updated[i] = { ...a, weight: t };
                  setAllocations(updated);
                }}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={[typography.body, { color: theme.textSecondary }]}>%</Text>
              {allocations.length > 1 && (
                <Pressable onPress={() => removeRow(i)} style={styles.removeBtn}>
                  <Text style={[typography.bodyBold, { color: theme.danger }]}>✕</Text>
                </Pressable>
              )}
            </View>
          </Card>
        ))}

        <Button title="+ 자산군 추가" onPress={addRow} variant="ghost" size="small" />
      </View>

      <Button title="저장" onPress={handleSave} size="large" style={{ marginTop: 16, marginBottom: 24 }} />

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[typography.bodyBold, { color: theme.text, marginBottom: 12 }]}>자산군 선택</Text>
            <FlatList
              data={availableForPicker}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = pickerIndex !== null && allocations[pickerIndex]?.assetClass === item;
                return (
                  <Pressable
                    style={[styles.pickerItem, isSelected && { backgroundColor: theme.primaryLight ?? theme.surfaceVariant }]}
                    onPress={() => selectAssetClass(item)}
                  >
                    <Text style={[typography.body, { color: isSelected ? theme.primary : theme.text }]}>{item}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8, fontSize: 16 },
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assetSelect: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  assetSelectInner: { flexDirection: 'row', alignItems: 'center' },
  weightInput: { width: 64, textAlign: 'center', paddingVertical: 10, borderRadius: 8, fontSize: 16, fontWeight: '600' },
  removeBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '60%', borderRadius: 16, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 8 },
});
