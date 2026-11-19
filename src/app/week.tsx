import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  useState,
} from 'react';

import {
  usePlanner,
  type Task,
} from '@/context/planner-context';

import {
  addDays,
  formatLongDate,
  formatWeekRange,
  getWeekDates,
  keyToDate,
  startOfWeek,
  todayKey,
} from '@/utils/date-utils';

export default function WeekScreen() {
  const {
    getTasksForDate,
  } = usePlanner();

  const [weekStart, setWeekStart] =
    useState(
      startOfWeek(
        todayKey()
      )
    );

  const dates =
    getWeekDates(
      weekStart
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
    >
      <View
        style={styles.header}
      >
        <View
          style={styles.headerTop}
        >
          <View>
            <Text
              style={styles.title}
            >
              Week
            </Text>

            <Text
              style={styles.subtitle}
            >
              {formatWeekRange(
                weekStart
              )}
            </Text>
          </View>

          <View
            style={styles.navigation}
          >
            <Pressable
              style={
                styles.navButton
              }
              onPress={() =>
                setWeekStart(
                  addDays(
                    weekStart,
                    -7
                  )
                )
              }
            >
              <Text
                style={
                  styles.navText
                }
              >
                ‹
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.navButton
              }
              onPress={() =>
                setWeekStart(
                  addDays(
                    weekStart,
                    7
                  )
                )
              }
            >
              <Text
                style={
                  styles.navText
                }
              >
                ›
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={styles.days}
      >
        {dates.map(
          (dateKey) => {
            const tasks =
              getTasksForDate(
                dateKey
              );

            return (
              <DaySection
                key={dateKey}
                dateKey={
                  dateKey
                }
                tasks={
                  tasks
                }
              />
            );
          }
        )}
      </View>
    </ScrollView>
  );
}

function DaySection({
  dateKey,
  tasks,
}: {
  dateKey: string;
  tasks: Task[];
}) {
  const date =
    keyToDate(
      dateKey
    );

  const day =
    date.toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
      }
    );

  const sortedTasks =
    [...tasks].sort(
      (a, b) =>
        (a.displayStartMinutes ?? parseTime(a.startTime)) -
        (b.displayStartMinutes ?? parseTime(b.startTime))
    );

  return (
    <View
      style={
        styles.daySection
      }
    >
      <View
        style={
          styles.dayHeader
        }
      >
        <View>
          <Text
            style={
              styles.dayName
            }
          >
            {day}
          </Text>

          <Text
            style={
              styles.dayDate
            }
          >
            {formatLongDate(
              dateKey
            ).replace(
              `${day}, `,
              ''
            )}
          </Text>
        </View>

        <Text
          style={
            styles.taskCount
          }
        >
          {new Set(tasks.map((task) => task.id)).size}{' '}
          {new Set(tasks.map((task) => task.id)).size === 1
            ? 'task'
            : 'tasks'}
        </Text>
      </View>

      {sortedTasks.length ===
      0 ? (
        <View
          style={
            styles.emptyDay
          }
        >
          <Text
            style={
              styles.emptyText
            }
          >
            No scheduled tasks
          </Text>
        </View>
      ) : (
        sortedTasks.map(
          (task) => (
            <ScheduledTask
              key={task.occurrenceKey ?? `${task.id}-${dateKey}`}
              task={task}
            />
          )
        )
      )}
    </View>
  );
}

function parseTime(
  time: string
): number {
  const match =
    time
      .trim()
      .toUpperCase()
      .match(
        /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/
      );

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hour =
    Number(match[1]);

  const minutes =
    Number(
      match[2] ?? '0'
    );

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

function ScheduledTask({
  task,
}: {
  task: Task;
}) {
  const isFixed =
    task.type === 'Fixed';

  const isSomeday =
    task.type ===
    'Someday';

  return (
    <Pressable
      style={
        isFixed
          ? styles.taskFixed
          : isSomeday
            ? styles.taskSomeday
            : styles.taskFlexible
      }
      onPress={() =>
        router.push({
          pathname:
            '/task-details',
          params: {
            taskId:
              task.id,
          },
        })
      }
    >
      <View
        style={
          styles.taskTopRow
        }
      >
        <Text
          style={
            styles.taskName
          }
        >
          {task.name}
        </Text>

        {!isFixed &&
          !isSomeday &&
          task.priority && (
            <Text
              style={
                styles.priority
              }
            >
              {task.priority.toUpperCase()}
            </Text>
          )}
      </View>

      <Text
        style={
          styles.taskInfo
        }
      >
        {task.displayTimeLabel ?? `${task.startTime}–${task.endTime}`}
        {' · '}
        {task.type}
      </Text>

      {isFixed &&
        task.recurrence !==
          'Never' && (
          <Text
            style={
              styles.recurrence
            }
          >
            ↻{' '}
            {task.recurrence}
          </Text>
        )}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FAF9F7',
    },

    contentContainer: {
      paddingBottom: 40,
    },

    header: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
    },

    headerTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    title: {
      fontSize: 30,
      fontWeight: '700',
      color: '#292827',
    },

    subtitle: {
      marginTop: 4,
      fontSize: 15,
      color: '#88837D',
    },

    navigation: {
      flexDirection:
        'row',
      gap: 8,
    },

    navButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        '#F0EEEA',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    navText: {
      fontSize: 26,
      lineHeight: 28,
      color: '#69645F',
    },

    days: {
      paddingHorizontal: 16,
    },

    daySection: {
      marginBottom: 18,
    },

    dayHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 8,
      marginBottom: 8,
    },

    dayName: {
      fontSize: 17,
      fontWeight: '700',
      color: '#34312E',
    },

    dayDate: {
      marginTop: 2,
      fontSize: 12,
      color: '#96918B',
    },

    taskCount: {
      fontSize: 12,
      color: '#96918B',
    },

    emptyDay: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor:
        '#F1EFEC',
    },

    emptyText: {
      fontSize: 13,
      color: '#AAA49D',
    },

    taskFixed: {
      marginBottom: 7,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor:
        '#F3E1DF',
    },

    taskFlexible: {
      marginBottom: 7,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor:
        '#E4EEE9',
    },

    taskSomeday: {
      marginBottom: 7,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor:
        '#EEE8F2',
    },

    taskTopRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    taskName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: '#34312E',
    },

    taskInfo: {
      marginTop: 5,
      fontSize: 12,
      color: '#77716B',
    },

    recurrence: {
      marginTop: 3,
      fontSize: 11,
      color: '#B05B57',
    },

    priority: {
      marginLeft: 10,
      fontSize: 10,
      fontWeight: '700',
      color: '#647D70',
      letterSpacing: 0.5,
    },
  });