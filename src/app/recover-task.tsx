import { useState } from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePlanner } from '@/context/planner-context';

const DURATION_OPTIONS = [
  '30 min',
  '45 min',
  '1 hour',
  '2 hours',
];

export default function RecoverTaskScreen() {
  const { taskId } =
    useLocalSearchParams<{
      taskId: string;
    }>();

  const { getTask } =
    usePlanner();

  const task =
    taskId
      ? getTask(taskId)
      : undefined;

  const [
    selectedDuration,
    setSelectedDuration,
  ] = useState('');

  const [
    customDuration,
    setCustomDuration,
  ] = useState('');

  if (!task) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.emptyContainer}
        >
          <Text style={styles.emptyTitle}>
            Task not found
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.backButtonText}
            >
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isFixed =
    task.type === 'Fixed';

  const finalDuration =
    selectedDuration === 'Custom'
      ? customDuration.trim()
      : selectedDuration;

  const canContinue =
    !isFixed &&
    finalDuration !== '';

  const handleFindTime = () => {
    if (!canContinue || !taskId) {
      return;
    }

    router.push({
      pathname: '/suggest-new-time',
      params: {
        taskId,
        remainingDuration:
          finalDuration,
      },
    });
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.back}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Mark as unfinished
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <View style={styles.taskCard}>
          <Text
            style={styles.taskName}
          >
            {task.name}
          </Text>

          <Text
            style={styles.taskInfo}
          >
            Originally scheduled for{' '}
            {task.duration}
          </Text>
        </View>

        {isFixed ? (
          <View
            style={styles.warningCard}
          >
            <Text
              style={styles.warningTitle}
            >
              Fixed task
            </Text>

            <Text
              style={styles.warningText}
            >
              Fixed commitments are protected
              and can't be moved through the
              recovery flow.
            </Text>

            <Pressable
              style={styles.warningButton}
              onPress={() =>
                router.back()
              }
            >
              <Text
                style={
                  styles.warningButtonText
                }
              >
                Go back
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={styles.section}
            >
              <Text
                style={styles.sectionTitle}
              >
                How much time is left?
              </Text>

              <View
                style={styles.durationOptions}
              >
                {DURATION_OPTIONS.map(
                  (duration) => {
                    const isSelected =
                      selectedDuration ===
                      duration;

                    return (
                      <Pressable
                        key={duration}
                        style={[
                          styles.durationButton,
                          isSelected &&
                            styles.durationButtonSelected,
                        ]}
                        onPress={() => {
                          setSelectedDuration(
                            duration
                          );
                          setCustomDuration(
                            ''
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.durationText,
                            isSelected &&
                              styles.durationTextSelected,
                          ]}
                        >
                          {duration}
                        </Text>
                      </Pressable>
                    );
                  }
                )}

                <Pressable
                  style={[
                    styles.durationButton,
                    selectedDuration ===
                      'Custom' &&
                      styles.durationButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedDuration(
                      'Custom'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.durationText,
                      selectedDuration ===
                        'Custom' &&
                        styles.durationTextSelected,
                    ]}
                  >
                    Custom
                  </Text>
                </Pressable>
              </View>

              {selectedDuration ===
                'Custom' && (
                <View
                  style={styles.customContainer}
                >
                  <TextInput
                    style={styles.customInput}
                    value={
                      customDuration
                    }
                    onChangeText={
                      setCustomDuration
                    }
                    placeholder="e.g. 1 hour 15 min"
                    placeholderTextColor="#AAA49D"
                  />

                  <Text
                    style={
                      styles.customHint
                    }
                  >
                    Enter the amount of time
                    remaining.
                  </Text>
                </View>
              )}
            </View>

            <View
              style={styles.section}
            >
              <Text
                style={styles.sectionTitle}
              >
                Original schedule
              </Text>

              <View
                style={styles.infoCard}
              >
                <View
                  style={styles.infoRow}
                >
                  <Text
                    style={styles.infoLabel}
                  >
                    Date
                  </Text>

                  <Text
                    style={styles.infoValue}
                  >
                    {task.scheduledDate ||
                      'Not scheduled'}
                  </Text>
                </View>

                <View
                  style={styles.divider}
                />

                <View
                  style={styles.infoRow}
                >
                  <Text
                    style={styles.infoLabel}
                  >
                    Time
                  </Text>

                  <Text
                    style={styles.infoValue}
                  >
                    {task.startTime &&
                    task.endTime
                      ? `${task.startTime} – ${task.endTime}`
                      : 'Not scheduled'}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                !canContinue &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={!canContinue}
              onPress={
                handleFindTime
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Find a new time
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 24,
  },

  back: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 36,
    lineHeight: 36,
    color: '#30302E',
    fontWeight: '300',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#30302E',
  },

  headerSpacer: {
    width: 40,
  },

  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    marginBottom: 28,
  },

  taskName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#30302E',
  },

  taskInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#85827D',
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#30302E',
  },

  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },

  durationButton: {
    minWidth: 92,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD9D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  durationButtonSelected: {
    backgroundColor: '#30302E',
    borderColor: '#30302E',
  },

  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F5A55',
  },

  durationTextSelected: {
    color: '#FFFFFF',
  },

  customContainer: {
    marginTop: 14,
  },

  customInput: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD9D4',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#30302E',
  },

  customHint: {
    marginTop: 7,
    fontSize: 12,
    color: '#96918B',
  },

  infoCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  infoRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  infoLabel: {
    fontSize: 14,
    color: '#85827D',
  },

  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#30302E',
  },

  divider: {
    height: 1,
    backgroundColor: '#ECEAE6',
  },

  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#30302E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonDisabled: {
    opacity: 0.35,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  warningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E3DED7',
  },

  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#30302E',
  },

  warningText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#77716B',
  },

  warningButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F1EFEC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  warningButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5F5A55',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#30302E',
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: '#30302E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});