import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { useCallback, useState } from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePlanner } from '@/context/planner-context';
import {
  formatLongDate,
  todayKey,
} from '@/utils/date-utils';

type TaskType =
  | 'Fixed'
  | 'Flexible'
  | 'Someday';

const TIME_OPTIONS = Array.from(
  { length: 48 },
  (_, index) => {
    const totalMinutes =
      index * 30;

    const hour24 = Math.floor(
      totalMinutes / 60
    );

    const minutes =
      totalMinutes % 60;

    const period =
      hour24 >= 12 ? 'PM' : 'AM';

    const hour12 =
      hour24 % 12 === 0
        ? 12
        : hour24 % 12;

    const formattedMinutes =
      minutes.toString().padStart(2, '0');

    return (
      hour12 +
      ':' +
      formattedMinutes +
      ' ' +
      period
    );
  }
);


function normalizeDuration(value: string): number {
  const normalized = value.trim().toLowerCase();
  const hours = normalized.match(/(\d+(?:\.\d+)?)\s*hours?/);
  const minutes = normalized.match(/(\d+)\s*mins?/);
  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

export default function AddTaskScreen() {
  const { addTask, updateTask, getTask, isTimeAvailable, getTimeConflicts } =
    usePlanner();

  const { taskId } =
    useLocalSearchParams<{
      taskId?: string;
    }>();

  const isEditing = Boolean(taskId);

  const [taskType, setTaskType] =
    useState<TaskType>('Flexible');

  const [taskName, setTaskName] =
    useState('');

  const [duration, setDuration] =
    useState('1 hour');

  const [customDuration, setCustomDuration] =
    useState('');

  const [priority, setPriority] =
    useState('Medium');

  const [deadline, setDeadline] =
    useState('This week');

  const [preferredTime, setPreferredTime] =
    useState('Anytime');

  const [startTime, setStartTime] =
    useState('9:00 AM');

  const [endTime, setEndTime] =
    useState('10:00 AM');

  const [recurrence, setRecurrence] =
    useState('Never');

  const [notes, setNotes] =
    useState('');

  const [timePickerVisible, setTimePickerVisible] =
    useState(false);

  const [conflictMessages, setConflictMessages] =
    useState<string[] | null>(null);

  const [timePickerMode, setTimePickerMode] =
    useState<'start' | 'end'>('start');

  /*
   * Reset or load the form every time the
   * Add Task screen becomes active.
   */
  useFocusEffect(
    useCallback(() => {
      const existingTask =
        taskId ? getTask(taskId) : undefined;

      if (existingTask) {
        setTaskType(
          existingTask.type as TaskType
        );

        setTaskName(
          existingTask.name
        );

        const knownDurations = [
          '30 min',
          '45 min',
          '1 hour',
          '2 hours',
        ];

        if (
          knownDurations.includes(
            existingTask.duration
          )
        ) {
          setDuration(
            existingTask.duration
          );

          setCustomDuration('');
        } else {
          setDuration('Custom');

          setCustomDuration(
            existingTask.duration
          );
        }

        setPriority(
          existingTask.priority === 'Someday'
            ? 'Medium'
            : existingTask.priority
        );

        setDeadline(
          existingTask.deadline || 'This week'
        );

        setPreferredTime(
          existingTask.preferredTime || 'Anytime'
        );

        setStartTime(
          existingTask.startTime || '9:00 AM'
        );

        setEndTime(
          existingTask.endTime || '10:00 AM'
        );

        setRecurrence(
          existingTask.recurrence || 'Never'
        );

        setNotes(
          existingTask.notes || ''
        );
      } else {
        setTaskType('Flexible');
        setTaskName('');
        setDuration('1 hour');
        setCustomDuration('');
        setPriority('Medium');
        setDeadline('This week');
        setPreferredTime('Anytime');
        setStartTime('9:00 AM');
        setEndTime('10:00 AM');
        setRecurrence('Never');
        setNotes('');
      }

      setTimePickerVisible(false);
    }, [taskId, getTask])
  );

  const isCustomDuration =
    duration === 'Custom';

  const finalDuration =
    isCustomDuration
      ? customDuration
      : duration;

  const openTimePicker = (
    mode: 'start' | 'end'
  ) => {
    setTimePickerMode(mode);
    setTimePickerVisible(true);
  };

  const selectTime = (time: string) => {
    if (timePickerMode === 'start') {
      setStartTime(time);
    } else {
      setEndTime(time);
    }

    setTimePickerVisible(false);
  };

  const selectedTime =
    timePickerMode === 'start'
      ? startTime
      : endTime;

  const handleSave = () => {
    if (!taskName.trim()) {
      return;
    }

    if (
      taskType === 'Flexible' &&
      isCustomDuration &&
      !customDuration.trim()
    ) {
      return;
    }

    const existingTask =
      taskId ? getTask(taskId) : undefined;

    const proposedTask = {
      id: existingTask?.id ?? 'new-task-check',
      name: taskName.trim(),
      type: taskType,
      priority: taskType === 'Someday' ? 'Someday' : priority,
      duration: taskType === 'Someday' ? 'Flexible' : finalDuration,
      deadline: taskType === 'Someday' ? '' : deadline,
      preferredTime: taskType === 'Someday' ? '' : preferredTime,
      scheduledDate: taskType === 'Fixed'
        ? (existingTask?.scheduledDate || formatLongDate(todayKey()))
        : taskType === 'Someday' ? '' : (existingTask?.scheduledDate || ''),
      startTime: taskType === 'Fixed' ? startTime : taskType === 'Someday' ? '' : (existingTask?.startTime || ''),
      endTime: taskType === 'Fixed' ? endTime : taskType === 'Someday' ? '' : (existingTask?.endTime || ''),
      notes,
      recurrence: taskType === 'Someday' ? 'Never' : recurrence,
    };

    const timeConflicts = getTimeConflicts(proposedTask);
    if (timeConflicts.length > 0 || !isTimeAvailable(proposedTask)) {
      setConflictMessages(
        timeConflicts.length > 0
          ? timeConflicts
          : ['The selected start and end times are invalid. Please check the start and end times.']
      );
      return;
    }

    /*
     * EDIT EXISTING TASK
     */
    if (existingTask) {
      const updatedTask = {
        ...existingTask,

        name: taskName.trim(),

        type: taskType,

        priority:
          taskType === 'Someday'
            ? 'Someday'
            : priority,

        duration:
          taskType === 'Someday'
            ? 'Flexible'
            : finalDuration,

        deadline:
          taskType === 'Someday'
            ? ''
            : deadline,

        preferredTime:
          taskType === 'Someday'
            ? ''
            : preferredTime,

        /*
         * Preserve an existing scheduled time
         * for Flexible/Someday tasks.
         *
         * Fixed tasks use the selected time.
         */
        scheduledDate:
          taskType === 'Fixed'
            ? (existingTask.scheduledDate || formatLongDate(todayKey()))
            : taskType === 'Someday'
              ? ''
              : existingTask.scheduledDate,

        startTime:
          taskType === 'Fixed'
            ? startTime
            : taskType === 'Someday'
              ? ''
              : existingTask.startTime,

        endTime:
          taskType === 'Fixed'
            ? endTime
            : taskType === 'Someday'
              ? ''
              : existingTask.endTime,

        notes,

        recurrence:
          taskType === 'Someday'
            ? 'Never'
            : recurrence,
      };

      const scheduledFlexibleDurationChanged =
        existingTask.type === 'Flexible' &&
        taskType === 'Flexible' &&
        Boolean(existingTask.scheduledDate && existingTask.startTime && existingTask.endTime) &&
        normalizeDuration(existingTask.duration) !== normalizeDuration(finalDuration);

      if (scheduledFlexibleDurationChanged) {
        // Clear the old slot before opening suggestions so the task cannot
        // appear to occupy 30 minutes while claiming to need 45 minutes.
        updateTask({
          ...updatedTask,
          scheduledDate: '',
          startTime: '',
          endTime: '',
        });
        router.replace({
          pathname: '/suggest-new-time',
          params: { taskId: existingTask.id },
        });
        return;
      }

      updateTask(updatedTask);

      router.replace({
        pathname: '/task-details',
        params: {
          taskId: existingTask.id,
        },
      });

      return;
    }

    /*
     * CREATE NEW TASK
     */
    const newTask = addTask({
      name: taskName.trim(),

      type: taskType,

      priority:
        taskType === 'Someday'
          ? 'Someday'
          : priority,

      duration:
        taskType === 'Someday'
          ? 'Flexible'
          : finalDuration,

      deadline:
        taskType === 'Someday'
          ? ''
          : deadline,

      preferredTime:
        taskType === 'Someday'
          ? ''
          : preferredTime,

      /*
       * Fixed tasks belong to today.
       *
       * Store the current date dynamically rather
       * than relying on the old test date.
       */
      scheduledDate:
        taskType === 'Fixed'
          ? formatLongDate(todayKey())
          : '',

      startTime:
        taskType === 'Fixed'
          ? startTime
          : '',

      endTime:
        taskType === 'Fixed'
          ? endTime
          : '',

      notes,

      recurrence:
        taskType === 'Someday'
          ? 'Never'
          : recurrence,
    });

    if (taskType === 'Flexible') {
      router.push({
        pathname: '/suggest-new-time',
        params: {
          taskId: newTask.id,
        },
      });

      return;
    }

    router.replace('/');
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backText}>
            ‹ Today
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing
              ? 'Edit task'
              : 'Add a task'}
          </Text>

        </View>

        <Text style={styles.label}>
          TASK TYPE
        </Text>

        <View style={styles.typeSelector}>
          {(
            [
              'Fixed',
              'Flexible',
              'Someday',
            ] as TaskType[]
          ).map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typeOption,
                taskType === type &&
                  styles.typeOptionSelected,
              ]}
              onPress={() =>
                setTaskType(type)
              }
            >
              <Text
                style={[
                  styles.typeText,
                  taskType === type &&
                    styles.typeTextSelected,
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>
          TASK NAME
        </Text>

        <TextInput
          value={taskName}
          onChangeText={setTaskName}
          placeholder="What do you need to do?"
          placeholderTextColor="#AAA49D"
          style={styles.input}
        />

        {taskType === 'Flexible' && (
          <>
            <Text style={styles.label}>
              HOW LONG?
            </Text>

            <View style={styles.choiceRow}>
              {[
                '30 min',
                '45 min',
                '1 hour',
                '2 hours',
                'Custom',
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.choice,
                    duration === option &&
                      styles.choiceSelected,
                  ]}
                  onPress={() =>
                    setDuration(option)
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      duration === option &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isCustomDuration && (
              <TextInput
                value={customDuration}
                onChangeText={
                  setCustomDuration
                }
                placeholder="e.g. 1 hour 30 min"
                placeholderTextColor="#AAA49D"
                style={[
                  styles.input,
                  styles.customInput,
                ]}
              />
            )}

            <Text style={styles.label}>
              PRIORITY
            </Text>

            <View style={styles.choiceRow}>
              {[
                'High',
                'Medium',
                'Low',
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.choice,
                    priority === option &&
                      styles.choiceSelected,
                  ]}
                  onPress={() =>
                    setPriority(option)
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      priority === option &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              DEADLINE
            </Text>

            <View style={styles.choiceRow}>
              {[
                'Today',
                'Tomorrow',
                'This week',
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.choice,
                    deadline === option &&
                      styles.choiceSelected,
                  ]}
                  onPress={() =>
                    setDeadline(option)
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      deadline === option &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              PREFERRED TIME
            </Text>

            <View style={styles.choiceRow}>
              {[
                'Anytime',
                'Morning',
                'Afternoon',
                'Evening',
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.choice,
                    preferredTime === option &&
                      styles.choiceSelected,
                  ]}
                  onPress={() =>
                    setPreferredTime(option)
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      preferredTime === option &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              REPEAT
            </Text>

            <View style={styles.choiceRow}>
              {[
                'Never',
                'Daily',
                'Weekdays',
                'Weekly',
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.choice,
                    recurrence === option &&
                      styles.choiceSelected,
                  ]}
                  onPress={() =>
                    setRecurrence(option)
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      recurrence === option &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {taskType === 'Fixed' && (
          <>
            <Text style={styles.label}>
              START TIME
            </Text>

            <Pressable
              style={styles.timeInput}
              onPress={() =>
                openTimePicker('start')
              }
            >
              <Text style={styles.timeText}>
                {startTime}
              </Text>

              <Text style={styles.timeArrow}>
                ›
              </Text>
            </Pressable>

            <Text style={styles.label}>
              END TIME
            </Text>

            <Pressable
              style={styles.timeInput}
              onPress={() =>
                openTimePicker('end')
              }
            >
              <Text style={styles.timeText}>
                {endTime}
              </Text>

              <Text style={styles.timeArrow}>
                ›
              </Text>
            </Pressable>

            <Text style={styles.label}>
              REPEAT
            </Text>

            <View style={styles.choiceRow}>
              {[
                'Never',
                'Daily',
                'Weekdays',
                'Weekly',
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.choice,
                    recurrence === option &&
                      styles.choiceSelected,
                  ]}
                  onPress={() =>
                    setRecurrence(option)
                  }
                >
                  <Text
                    style={[
                      styles.choiceText,
                      recurrence === option &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                Protected time
              </Text>

              <Text style={styles.infoText}>
                Fixed tasks are protected and won't be automatically moved.
              </Text>
            </View>
          </>
        )}

        {taskType === 'Someday' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              Save for later
            </Text>

            <Text style={styles.infoText}>
              Someday tasks won't be scheduled automatically. You can decide when to work on them later.
            </Text>
          </View>
        )}

        <Text style={styles.label}>
          NOTES
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else to remember?"
          placeholderTextColor="#AAA49D"
          style={[
            styles.input,
            styles.notesInput,
          ]}
          multiline
        />

        <Pressable
          style={[
            styles.saveButton,
            !taskName.trim() &&
              styles.saveButtonDisabled,
            taskType === 'Flexible' &&
              isCustomDuration &&
              !customDuration.trim() &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={
            !taskName.trim() ||
            (
              taskType === 'Flexible' &&
              isCustomDuration &&
              !customDuration.trim()
            )
          }
        >
          <Text style={styles.saveText}>
            {isEditing
              ? 'Save changes'
              : taskType === 'Flexible'
                ? 'Find time for this task'
                : taskType === 'Someday'
                  ? 'Save to Someday'
                  : 'Save fixed task'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={Boolean(conflictMessages)}
        transparent
        animationType="fade"
        onRequestClose={() => setConflictMessages(null)}
      >
        <View style={styles.conflictOverlay}>
          <View style={styles.conflictCard}>
            <View style={styles.conflictIcon}>
              <Text style={styles.conflictIconText}>!</Text>
            </View>
            <Text style={styles.conflictTitle}>
              {conflictMessages?.[0]?.startsWith('Invalid time range') ? 'Invalid time range' : 'Scheduling conflict'}
            </Text>
            <Text style={styles.conflictDescription}>
              {conflictMessages?.[0]?.startsWith('Invalid time range')
                ? 'The end time must be later than the start time, or the task must clearly cross midnight. Please review the selected times.'
                : "This task can't be scheduled because it overlaps with an existing commitment. Your task details have been kept. Choose a different time or change the recurrence."}
            </Text>
            <ScrollView style={styles.conflictList}>
              {(conflictMessages || []).map((conflict, index) => (
                <View key={`${conflict}-${index}`} style={styles.conflictItem}>
                  <Text style={styles.conflictBullet}>•</Text>
                  <Text style={styles.conflictItemText}>{conflict}</Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={styles.conflictButton}
              onPress={() => setConflictMessages(null)}
            >
              <Text style={styles.conflictButtonText}>Review task time</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={timePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setTimePickerVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setTimePickerVisible(false)
          }
        >
          <Pressable
            style={styles.timePicker}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View style={styles.timePickerHeader}>
              <View>
                <Text style={styles.timePickerTitle}>
                  {timePickerMode === 'start'
                    ? 'Start time'
                    : 'End time'}
                </Text>

                <Text style={styles.timePickerSubtitle}>
                  Choose a time
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setTimePickerVisible(false)
                }
                style={styles.doneButton}
              >
                <Text style={styles.doneText}>
                  Done
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.timeList}
              contentContainerStyle={
                styles.timeListContent
              }
              showsVerticalScrollIndicator={false}
            >
              {TIME_OPTIONS.map((time) => {
                const isSelected =
                  time === selectedTime;

                return (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeOption,
                      isSelected &&
                        styles.timeOptionSelected,
                    ]}
                    onPress={() =>
                      selectTime(time)
                    }
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        isSelected &&
                          styles.timeOptionTextSelected,
                      ]}
                    >
                      {time}
                    </Text>

                    {isSelected && (
                      <Text style={styles.checkmark}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },

  backText: {
    fontSize: 15,
    color: '#77716B',
  },

  header: {
    marginTop: 28,
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#292827',
  },

  label: {
    marginTop: 22,
    marginBottom: 9,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8B857E',
  },

  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#EEEAE5',
    borderRadius: 14,
    padding: 4,
  },

  typeOption: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },

  typeOptionSelected: {
    backgroundColor: '#FFFFFF',
  },

  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B857E',
  },

  typeTextSelected: {
    color: '#34312E',
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E0DBD5',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#34312E',
  },

  customInput: {
    marginTop: 10,
  },

  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  choice: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DBD5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  choiceSelected: {
    backgroundColor: '#E4EEE9',
    borderColor: '#B8CBC2',
  },

  choiceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#77716B',
  },

  choiceTextSelected: {
    color: '#526A5E',
  },

  timeInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#E0DBD5',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 15,
    color: '#34312E',
  },

  timeArrow: {
    fontSize: 25,
    lineHeight: 25,
    color: '#9A948D',
  },

  conflictOverlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 40, 39, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  conflictCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '82%',
    backgroundColor: '#FAF9F7',
    borderRadius: 22,
    padding: 24,
  },

  conflictIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6E3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  conflictIconText: {
    color: '#B95E52',
    fontSize: 23,
    fontWeight: '700',
  },

  conflictTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#292827',
  },

  conflictDescription: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: '#77716B',
  },

  conflictList: {
    marginTop: 15,
    flexGrow: 0,
  },

  conflictItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 7,
    borderRadius: 11,
    backgroundColor: '#F3EAE7',
  },

  conflictBullet: {
    marginRight: 8,
    fontSize: 15,
    color: '#B95E52',
  },

  conflictItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#514944',
  },

  conflictButton: {
    minHeight: 48,
    marginTop: 17,
    borderRadius: 13,
    backgroundColor: '#647D70',
    alignItems: 'center',
    justifyContent: 'center',
  },

  conflictButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 40, 39, 0.28)',
    justifyContent: 'flex-end',
  },

  timePicker: {
    maxHeight: '75%',
    backgroundColor: '#FAF9F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  timePickerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#292827',
  },

  timePickerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#88837D',
  },

  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: '#E4EEE9',
  },

  doneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#526A5E',
  },

  timeList: {
    maxHeight: 430,
  },

  timeListContent: {
    paddingBottom: 10,
  },

  timeOption: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeOptionSelected: {
    backgroundColor: '#E4EEE9',
  },

  timeOptionText: {
    fontSize: 15,
    color: '#55504B',
  },

  timeOptionTextSelected: {
    fontWeight: '600',
    color: '#526A5E',
  },

  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#526A5E',
  },

  infoCard: {
    marginTop: 22,
    padding: 18,
    backgroundColor: '#E4EEE9',
    borderRadius: 14,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#526A5E',
  },

  infoText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: '#6F7D76',
  },

  notesInput: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  saveButton: {
    minHeight: 54,
    marginTop: 30,
    borderRadius: 14,
    backgroundColor: '#647D70',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButtonDisabled: {
    backgroundColor: '#C9C4BE',
  },

  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});