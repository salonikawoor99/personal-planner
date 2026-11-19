import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEY = '@personal-planner/tasks-v1';
const FILE_URI = `${FileSystem.documentDirectory ?? ''}personal-planner-tasks.json`;

export async function loadPlannerTasks(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  }

  if (!FileSystem.documentDirectory) return null;
  const file = await FileSystem.getInfoAsync(FILE_URI);
  if (!file.exists) return null;
  return FileSystem.readAsStringAsync(FILE_URI);
}

export async function savePlannerTasks(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, value);
    return;
  }

  if (!FileSystem.documentDirectory) return;
  await FileSystem.writeAsStringAsync(FILE_URI, value);
}
