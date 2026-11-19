import { useState } from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  usePlanner,
  type Task,
} from '@/context/planner-context';

import {
  todayKey,
} from '@/utils/date-utils';

export default function FreeSlotScreen() {
  const {
    startTime,
    endTime,
  } = useLocalSearchParams<{
    startTime: string;
    endTime: string;
  }>();

  const {
    tasks,
  } = usePlanner();

  const [
    showAll,
    setShowAll,
  ] = useState(false);

  const slotMinutes =
    getDurationMinutes(
      startTime ?? '',
      endTime ?? ''
    );
  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0);
  const selectedSlotStart = parseTime(startTime ?? '');
  const slotIsInPast = selectedSlotStart !== undefined && selectedSlotStart < currentMinute;

  /*
   * Pending Flexible tasks:
   *
   * A Flexible task is pending when it
   * has not yet been assigned a time.
   */
  const pendingFlexibleTasks =
    tasks.filter(
      (task) =>
        task.type === 'Flexible' &&
        !task.scheduledDate &&
        !task.startTime &&
        !task.endTime
    );

  /*
   * Pending Someday tasks:
   *
   * Someday tasks intentionally do not
   * occupy the calendar until the user
   * chooses to schedule them.
   */
  const pendingSomedayTasks =
    tasks.filter(
      (task) =>
        task.type === 'Someday' &&
        !task.scheduledDate &&
        !task.startTime &&
        !task.endTime
    );

  /*
   * Only recommend tasks that fit the
   * currently selected free slot.
   */
  const fittingFlexibleTasks =
    pendingFlexibleTasks.filter(
      (task) =>
        !slotIsInPast &&
        getTaskDurationMinutes(task) <=
        slotMinutes
    );

  const fittingSomedayTasks =
    pendingSomedayTasks.filter(
      (task) =>
        !slotIsInPast &&
        getTaskDurationMinutes(task) <=
        slotMinutes
    );

  /*
   * MVP recommendation logic:
   *
   * One High
   * One Medium
   * One Low
   * One Someday
   */
  const highTask =
    fittingFlexibleTasks.find(
      (task) =>
        task.priority === 'High'
    );

  const mediumTask =
    fittingFlexibleTasks.find(
      (task) =>
        task.priority === 'Medium'
    );

  const lowTask =
    fittingFlexibleTasks.find(
      (task) =>
        task.priority === 'Low'
    );

  const somedayTask =
    fittingSomedayTasks[0];

  /*
   * Selecting a task from the Free Slot
   * screen should use the EXISTING task.
   *
   * This is important:
   * we pass taskId rather than taskName,
   * so confirmation schedules the actual
   * task instead of creating a duplicate.
   */
  const selectTask = (
    task: Task
  ) => {
    const taskEndMinutes = parseTime(startTime ?? '')! + getTaskDurationMinutes(task);
    router.push({
      pathname: '/confirm-time',
      params: {
        taskId: task.id,
        date: todayKey(),
        startTime:
          startTime ?? '',
        endTime:
          formatTime(taskEndMinutes),
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
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
          style={styles.backButton}
        >
          <Text style={styles.back}>
            ‹ Today
          </Text>
        </Pressable>

        <Text style={styles.title}>
          What could fit here?
        </Text>

        <Text style={styles.subtitle}>
          {startTime} – {endTime}
        </Text>
      </View>

      {/* HIGH */}
      <Text style={styles.sectionLabel}>
        HIGH
      </Text>

      {highTask ? (
        <TaskCard
          task={highTask}
          onPress={() =>
            selectTask(highTask)
          }
        />
      ) : (
        <EmptyRecommendation
          text="No high-priority task fits this time."
        />
      )}

      {/* MEDIUM */}
      <Text style={styles.sectionLabel}>
        MEDIUM
      </Text>

      {mediumTask ? (
        <TaskCard
          task={mediumTask}
          onPress={() =>
            selectTask(mediumTask)
          }
        />
      ) : (
        <EmptyRecommendation
          text="No medium-priority task fits this time."
        />
      )}

      {/* LOW */}
      <Text style={styles.sectionLabel}>
        LOW
      </Text>

      {lowTask ? (
        <TaskCard
          task={lowTask}
          onPress={() =>
            selectTask(lowTask)
          }
        />
      ) : (
        <EmptyRecommendation
          text="No low-priority task fits this time."
        />
      )}

      {/* SOMEDAY */}
      <Text style={styles.sectionLabel}>
        SOMEDAY
      </Text>

      {somedayTask ? (
        <TaskCard
          task={somedayTask}
          onPress={() =>
            selectTask(somedayTask)
          }
        />
      ) : (
        <EmptyRecommendation
          text="No Someday task fits this time."
        />
      )}

      {/* ALL FLEXIBLE TASKS */}
      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            setShowAll(
              (current) => !current
            )
          }
        >
          <Text
            style={styles.secondaryText}
          >
            {showAll
              ? 'Hide flexible tasks'
              : 'See all flexible tasks'}
          </Text>
        </Pressable>

        {showAll && (
          <View
            style={
              styles.allTasksSection
            }
          >
            {pendingFlexibleTasks.length ===
            0 ? (
              <View
                style={
                  styles.emptyAllCard
                }
              >
                <Text
                  style={
                    styles.emptyAllTitle
                  }
                >
                  No pending flexible tasks
                </Text>

                <Text
                  style={
                    styles.emptyAllText
                  }
                >
                  All of your Flexible
                  tasks are currently
                  scheduled.
                </Text>
              </View>
            ) : (
              pendingFlexibleTasks.map(
                (task) => {
                  const taskDuration =
                    getTaskDurationMinutes(
                      task
                    );

                  const fits =
                    taskDuration <=
                    slotMinutes;

                  return (
                    <Pressable
                      key={task.id}
                      style={({ pressed }) => [
                        styles.allTaskCard,
                        pressed &&
                          styles.taskCardPressed,
                        !fits &&
                          styles.allTaskCardDisabled,
                      ]}
                      disabled={!fits}
                      onPress={() =>
                        selectTask(task)
                      }
                    >
                      <View
                        style={
                          styles.allTaskContent
                        }
                      >
                        <Text
                          style={
                            styles.taskName
                          }
                        >
                          {task.name}
                        </Text>

                        <Text
                          style={
                            styles.taskInfo
                          }
                        >
                          {task.duration}
                          {' · '}
                          {task.priority}
                        </Text>

                        {!fits && (
                          <Text
                            style={
                              styles.notFitText
                            }
                          >
                            Longer than this
                            free slot
                          </Text>
                        )}
                      </View>

                      {fits && (
                        <Text
                          style={
                            styles.arrow
                          }
                        >
                          ›
                        </Text>
                      )}
                    </Pressable>
                  );
                }
              )
            )}
          </View>
        )}

        <Pressable
          style={styles.freeButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.freeButtonText
            }
          >
            Leave this time free
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function TaskCard({
  task,
  onPress,
}: {
  task: Task;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.taskCard,
        pressed &&
          styles.taskCardPressed,
      ]}
      onPress={onPress}
    >
      <View>
        <Text style={styles.taskName}>
          {task.name}
        </Text>

        <Text style={styles.taskInfo}>
          {getDisplayDuration(task)}
          {' · '}
          {task.priority}

          {task.deadline
            ? ` · Due ${task.deadline.toLowerCase()}`
            : ''}
        </Text>
      </View>

      <Text style={styles.arrow}>
        ›
      </Text>
    </Pressable>
  );
}

function EmptyRecommendation({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

/*
 * Converts a task's stored duration
 * into minutes.
 *
 * Someday tasks created by the earlier
 * version of Add Task were stored with
 * duration = "Flexible".
 *
 * Until we add a dedicated Someday
 * duration field to Add Task, those
 * existing Someday tasks are treated as
 * 30-minute tasks.
 */
function getTaskDurationMinutes(
  task: Task
): number {
  if (
    task.type === 'Someday' &&
    task.duration === 'Flexible'
  ) {
    return 30;
  }

  return parseDuration(
    task.duration
  );
}

function getDisplayDuration(
  task: Task
): string {
  if (
    task.type === 'Someday' &&
    task.duration === 'Flexible'
  ) {
    return '30 min';
  }

  return task.duration;
}

function parseDuration(
  duration: string
): number {
  const normalized =
    duration
      .trim()
      .toLowerCase();

  let totalMinutes = 0;

  const hourMatch =
    normalized.match(
      /(\d+(?:\.\d+)?)\s*hours?/
    );

  const minuteMatch =
    normalized.match(
      /(\d+)\s*mins?/
    );

  if (hourMatch) {
    totalMinutes +=
      Number(hourMatch[1]) * 60;
  }

  if (minuteMatch) {
    totalMinutes +=
      Number(minuteMatch[1]);
  }

  if (
    totalMinutes === 0 &&
    normalized === '1 hour'
  ) {
    return 60;
  }

  return totalMinutes > 0
    ? totalMinutes
    : 60;
}

function formatTime(totalMinutes: number): string {
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getDurationMinutes(
  startTime: string,
  endTime: string
): number {
  const start =
    parseTime(startTime);

  const end =
    parseTime(endTime);

  if (
    start === undefined ||
    end === undefined
  ) {
    return 0;
  }

  return Math.max(
    end - start,
    0
  );
}

function parseTime(
  time: string
): number | undefined {
  const match =
    time
      .trim()
      .toUpperCase()
      .match(
        /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/
      );

  if (!match) {
    return undefined;
  }

  let hour =
    Number(match[1]);

  const minutes =
    Number(match[2] ?? '0');

  const period =
    match[3];

  if (
    period === 'AM' &&
    hour === 12
  ) {
    hour = 0;
  }

  if (
    period === 'PM' &&
    hour !== 12
  ) {
    hour += 12;
  }

  return (
    hour * 60 +
    minutes
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FAF9F7',
    },

    content: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },

    header: {
      paddingTop: 28,
      paddingBottom: 24,
    },

    backButton: {
      alignSelf:
        'flex-start',
      paddingVertical: 4,
      marginBottom: 28,
    },

    back: {
      fontSize: 15,
      color: '#77716B',
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#292827',
    },

    subtitle: {
      marginTop: 6,
      fontSize: 15,
      color: '#88837D',
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: '#8B857E',
      marginTop: 14,
      marginBottom: 8,
    },

    taskCard: {
      minHeight: 72,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 15,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      borderWidth: 1,
      borderColor:
        '#E9E5E0',
    },

    taskCardPressed: {
      backgroundColor:
        '#F1EFEC',
    },

    taskName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#34312E',
    },

    taskInfo: {
      marginTop: 5,
      fontSize: 13,
      color: '#88837D',
    },

    arrow: {
      fontSize: 25,
      color: '#AAA49D',
      marginLeft: 12,
    },

    emptyCard: {
      minHeight: 56,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor:
        '#F1EFEC',
      justifyContent:
        'center',
    },

    emptyText: {
      fontSize: 13,
      color: '#96918B',
    },

    actions: {
      marginTop: 32,
      gap: 12,
    },

    secondaryButton: {
      minHeight: 52,
      borderRadius: 14,
      justifyContent:
        'center',
      alignItems:
        'center',
      borderWidth: 1,
      borderColor:
        '#DDD8D2',
    },

    secondaryText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#5F5A55',
    },

    allTasksSection: {
      gap: 8,
    },

    allTaskCard: {
      minHeight: 68,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      borderWidth: 1,
      borderColor:
        '#E9E5E0',
    },

    allTaskCardDisabled: {
      opacity: 0.55,
    },

    allTaskContent: {
      flex: 1,
    },

    notFitText: {
      marginTop: 4,
      fontSize: 11,
      color: '#A08B82',
    },

    emptyAllCard: {
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderRadius: 14,
      backgroundColor:
        '#F1EFEC',
    },

    emptyAllTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#5F5A55',
    },

    emptyAllText: {
      marginTop: 5,
      fontSize: 13,
      lineHeight: 18,
      color: '#96918B',
    },

    freeButton: {
      minHeight: 52,
      borderRadius: 14,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#E9E5DF',
    },

    freeButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#5F5A55',
    },
  });