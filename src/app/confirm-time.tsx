import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePlanner } from '@/context/planner-context';

export default function ConfirmTimeScreen() {
  const {
    taskId,
    date,
    startTime,
    endTime,
    remainingDuration,
    taskName,
    taskType,
    priority,
    duration,
  } = useLocalSearchParams<{
    taskId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    remainingDuration?: string;
    taskName?: string;
    taskType?: string;
    priority?: string;
    duration?: string;
  }>();

  const {
    getTask,
    scheduleTask,
    isTimeAvailable,
    getTimeConflicts,
  } = usePlanner();

  const existingTask =
    taskId
      ? getTask(taskId)
      : undefined;

  const name =
    existingTask?.name ??
    taskName ??
    '';

  const type =
    existingTask?.type ??
    taskType ??
    'Flexible';

  const taskPriority =
    existingTask?.priority ??
    priority ??
    'Medium';

  const taskDuration =
    remainingDuration ??
    existingTask?.duration ??
    duration ??
    '';

  const isRecovery =
    Boolean(remainingDuration);

  const isNewTask =
    !isRecovery &&
    (
      !existingTask ||
      (
        !existingTask.scheduledDate &&
        !existingTask.startTime &&
        !existingTask.endTime
      )
    );

  const handleConfirm = () => {
    const proposedTask = existingTask
      ? { ...existingTask, scheduledDate: date ?? existingTask.scheduledDate, startTime: startTime ?? '', endTime: endTime ?? '' }
      : (name ? {
          id: taskId ?? 'new-task-check', name, type, priority: taskPriority, duration: taskDuration,
          deadline: '', preferredTime: '', scheduledDate: date ?? '', startTime: startTime ?? '',
          endTime: endTime ?? '', notes: '', recurrence: 'Never',
        } : undefined);

    if (proposedTask && !isTimeAvailable(proposedTask)) {
      const conflicts = getTimeConflicts(proposedTask);
      const details = conflicts.length
        ? conflicts.slice(0, 4).map((conflict) => `• ${conflict}`).join('\n')
        : 'The selected time range is invalid.';
      Alert.alert(
        'Scheduling conflict',
        `This time is no longer available because it overlaps with:\n\n${details}\n\nPlease choose another time.`
      );
      return;
    }

    if (existingTask) {
      const saved = scheduleTask({
        ...existingTask,

        scheduledDate:
          date ??
          existingTask.scheduledDate ??
          '',

        startTime:
          startTime ?? '',

        endTime:
          endTime ?? '',

        duration:
          isRecovery
            ? taskDuration
            : existingTask.duration,
      });
      if (!saved) {
        const conflicts = getTimeConflicts({ ...existingTask, scheduledDate: date ?? existingTask.scheduledDate, startTime: startTime ?? '', endTime: endTime ?? '' });
        const details = conflicts.length
          ? conflicts.slice(0, 4).map((conflict) => `• ${conflict}`).join('\n')
          : 'The selected time range is invalid.';
        Alert.alert('Scheduling conflict', `This time overlaps with:\n\n${details}`);
        return;
      }
    } else if (name) {
      const saved = scheduleTask({
        id:
          taskId ??
          Date.now().toString(),

        name,

        type,

        priority:
          taskPriority,

        duration:
          taskDuration,

        deadline:
          '',

        preferredTime:
          '',

        scheduledDate:
          date ?? '',

        startTime:
          startTime ?? '',

        endTime:
          endTime ?? '',

        notes:
          '',

        recurrence:
          'Never',
      });
      if (!saved) {
        const conflicts = getTimeConflicts({
          id: taskId ?? 'new-task-check', name, type, priority: taskPriority,
          duration: taskDuration, deadline: '', preferredTime: '',
          scheduledDate: date ?? '', startTime: startTime ?? '', endTime: endTime ?? '',
          notes: '', recurrence: 'Never',
        });
        const details = conflicts.length
          ? conflicts.slice(0, 4).map((conflict) => `• ${conflict}`).join('\n')
          : 'The selected time range is invalid.';
        Alert.alert('Scheduling conflict', `This time overlaps with:\n\n${details}`);
        return;
      }
    }

    router.replace('/');
  };

  const pageTitle =
    isRecovery
      ? 'Review recovery'
      : isNewTask
        ? 'Review your task'
        : 'Review your change';

  const heading =
    isRecovery
      ? 'Recover this task?'
      : isNewTask
        ? 'Schedule this task?'
        : 'Move this task?';

  const sectionLabel =
    isNewTask
      ? 'SCHEDULE'
      : 'NEW SCHEDULE';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text style={styles.backText}>
          ‹ Back
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.pageTitle}>
          {pageTitle}
        </Text>
      </View>

      <View style={styles.checkCircle}>
        <Text style={styles.check}>
          ✓
        </Text>
      </View>

      <Text style={styles.readyTitle}>
        {heading}
      </Text>

      <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {type}
            </Text>
          </View>

          <Text style={styles.priority}>
            {taskPriority} priority
          </Text>
        </View>

        <Text style={styles.taskName}>
          {name || 'Task'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.label}>
            Time needed
          </Text>

          <Text style={styles.value}>
            {taskDuration || 'Not specified'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        {sectionLabel}
      </Text>

      <View style={styles.timeCard}>
        <View style={styles.arrowCircle}>
          <Text style={styles.arrow}>
            →
          </Text>
        </View>

        <View style={styles.timeContent}>
          <Text style={styles.date}>
            {date ??
              'Thursday, September 4'}
          </Text>

          <Text style={styles.time}>
            {startTime ?? '—'} – {endTime ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.changesCard}>
        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>
            Task
          </Text>

          <Text style={styles.changeValue}>
            {isRecovery
              ? 'Recovery'
              : isNewTask
                ? 'Scheduled'
                : 'Rescheduled'}
          </Text>
        </View>

        <View style={styles.changeDivider} />

        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>
            Time
          </Text>

          <Text style={styles.changeValue}>
            {startTime ?? '—'} – {endTime ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmText}>
            Confirm
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.cancelText}>
            Back
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
  },

  backText: {
    fontSize: 14,
    color: '#77716B',
  },

  header: {
    alignItems: 'center',
    marginTop: 2,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292827',
    textAlign: 'center',
  },

  checkCircle: {
    alignSelf: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E4EEE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  check: {
    fontSize: 23,
    fontWeight: '700',
    color: '#647D70',
  },

  readyTitle: {
    marginTop: 10,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    color: '#292827',
    textAlign: 'center',
  },

  taskCard: {
    marginTop: 18,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E9E5E0',
  },

  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EEE8F4',
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#756083',
  },

  priority: {
    fontSize: 14,
    color: '#77716B',
  },

  taskName: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#34312E',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEAE5',
    marginTop: 16,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },

  label: {
    fontSize: 14,
    color: '#88837D',
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F5A55',
  },

  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#928C85',
  },

  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 17,
    backgroundColor: '#E4EEE9',
    borderRadius: 17,
  },

  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D4E4DD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontSize: 23,
    color: '#647D70',
  },

  timeContent: {
    flex: 1,
  },

  date: {
    fontSize: 13,
    color: '#77716B',
  },

  time: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '700',
    color: '#34312E',
  },

  changesCard: {
    marginTop: 13,
    paddingHorizontal: 18,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E9E5E0',
  },

  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },

  changeLabel: {
    fontSize: 14,
    color: '#88837D',
  },

  changeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34312E',
  },

  changeDivider: {
    height: 1,
    backgroundColor: '#EEEAE5',
  },

  actions: {
    marginTop: 20,
    gap: 8,
  },

  confirmButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#647D70',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  cancelButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD8D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F5A55',
  },
});