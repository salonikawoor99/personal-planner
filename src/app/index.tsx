import { router } from 'expo-router';

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
  formatLongDate,
  todayKey,
} from '@/utils/date-utils';

const START_HOUR = 0;
const END_HOUR = 24;
const SLOT_HEIGHT = 40;

const TOTAL_SLOTS =
  (END_HOUR - START_HOUR) * 2;

const TIME_SLOTS = Array.from(
  {
    length: TOTAL_SLOTS,
  },
  (_, index) => {
    const totalMinutes =
      START_HOUR * 60 +
      index * 30;

    const hour24 =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    const period =
      hour24 >= 12
        ? 'PM'
        : 'AM';

    const hour12 =
      hour24 % 12 === 0
        ? 12
        : hour24 % 12;

    const formattedMinutes =
      minutes
        .toString()
        .padStart(2, '0');

    const start =
      `${hour12}:${formattedMinutes} ${period}`;

    const endTotalMinutes =
      totalMinutes + 30;

    const endHour24 =
      Math.floor(
        endTotalMinutes / 60
      );

    const endMinutes =
      endTotalMinutes % 60;

    const endPeriod =
      endHour24 >= 12
        ? 'PM'
        : 'AM';

    const endHour12 =
      endHour24 % 12 === 0
        ? 12
        : endHour24 % 12;

    const formattedEndMinutes =
      endMinutes
        .toString()
        .padStart(2, '0');

    const end =
      `${endHour12}:${formattedEndMinutes} ${endPeriod}`;

    return {
      label:
        minutes === 0
          ? `${hour12} ${period}`
          : '',
      start,
      end,
      totalMinutes,
    };
  }
);

type TaskLayout = {
  task: Task;
  start: number;
  end: number;
  columnIndex: number;
  columnCount: number;
};

export default function TodayScreen() {
  const {
    getTasksForDate,
    isReady,
  } = usePlanner();

  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Personal Planner</Text>
          <Text style={styles.date}>Loading your tasks…</Text>
        </View>
      </View>
    );
  }

  const today =
    todayKey();

  const todayTasks =
    getTasksForDate(
      today
    );

  const taskLayouts =
    buildTaskLayouts(
      todayTasks
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
          style={styles.headerRow}
        >
          <View>
            <Text
              style={styles.title}
            >
              Today
            </Text>

            <Text
              style={styles.date}
            >
              {formatLongDate(
                today
              )}
            </Text>
          </View>

          <Pressable
            style={
              styles.addButton
            }
            onPress={() =>
              router.push(
                '/add-task'
              )
            }
          >
            <Text
              style={
                styles.addButtonText
              }
            >
              + Add task
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={styles.timeline}
      >
        <View
          style={[
            styles.timelineGrid,
            {
              height:
                TOTAL_SLOTS *
                SLOT_HEIGHT,
            },
          ]}
        >
          {TIME_SLOTS.map(
            ({
              label,
              start,
              end,
              totalMinutes,
            }) => {
              const isOccupied =
                isTimeCoveredByTask(
                  todayTasks,
                  totalMinutes
                );
              const now = new Date();
              const currentMinute = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0);
              const isPastSlot = totalMinutes < currentMinute;

              return (
                <View
                  key={start}
                  style={[
                    styles.gridRow,
                    {
                      top:
                        totalMinutes /
                        30 *
                        SLOT_HEIGHT,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.time
                    }
                  >
                    {label}
                  </Text>

                  <View
                    style={
                      styles.slot
                    }
                  >
                    {!isOccupied && !isPastSlot && (
                      <FreeSlotButton
                        startTime={start}
                        endTime={getFreeWindowEnd(todayTasks, totalMinutes)}
                      />
                    )}
                  </View>
                </View>
              );
            }
          )}

          <View
            pointerEvents="box-none"
            style={
              styles.tasksLayer
            }
          >
            {taskLayouts.map(
              ({
                task,
                start,
                end,
                columnIndex,
                columnCount,
              }) => {
                const top =
                  (start / 30) *
                  SLOT_HEIGHT;

                const durationMinutes =
                  end - start;

                const height =
                  (durationMinutes /
                    30) *
                    SLOT_HEIGHT -
                  8;

                const widthPercent =
                  100 /
                  columnCount;

                const leftPercent =
                  columnIndex *
                  widthPercent;

                return (
                  <View
                    key={task.occurrenceKey ?? task.id}
                    style={[
                      styles.taskPosition,
                      {
                        top,
                        height:
                          Math.max(
                            height,
                            SLOT_HEIGHT -
                              8
                          ),
                        left:
                          `${leftPercent}%`,
                        width:
                          `${widthPercent}%`,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.taskColumnPadding
                      }
                    >
                      <ScheduledTask
                        task={task}
                      />
                    </View>
                  </View>
                );
              }
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function buildTaskLayouts(
  tasks: Task[]
): TaskLayout[] {
  const validTasks =
    tasks
      .map((task) => {
        const start =
          task.displayStartMinutes ?? parseTime(task.startTime);

        const end =
          task.displayEndMinutes ?? parseTime(task.endTime);

        if (
          start === undefined ||
          end === undefined ||
          end <= start
        ) {
          return null;
        }

        return {
          task,
          start,
          end,
        };
      })
      .filter(
        (
          item
        ): item is {
          task: Task;
          start: number;
          end: number;
        } =>
          item !== null
      )
      .sort((a, b) => {
        if (
          a.start !==
          b.start
        ) {
          return (
            a.start -
            b.start
          );
        }

        return (
          a.end -
          b.end
        );
      });

  const groups: {
    task: Task;
    start: number;
    end: number;
  }[][] = [];

  let currentGroup:
    {
      task: Task;
      start: number;
      end: number;
    }[] = [];

  let currentGroupEnd =
    -1;

  validTasks.forEach(
    (item) => {
      if (
        currentGroup.length ===
        0
      ) {
        currentGroup = [
          item,
        ];

        currentGroupEnd =
          item.end;

        return;
      }

      if (
        item.start <
        currentGroupEnd
      ) {
        currentGroup.push(
          item
        );

        currentGroupEnd =
          Math.max(
            currentGroupEnd,
            item.end
          );
      } else {
        groups.push(
          currentGroup
        );

        currentGroup = [
          item,
        ];

        currentGroupEnd =
          item.end;
      }
    }
  );

  if (
    currentGroup.length >
    0
  ) {
    groups.push(
      currentGroup
    );
  }

  const layouts: TaskLayout[] =
    [];

  groups.forEach(
    (group) => {
      const columnEndTimes:
        number[] = [];

      const provisional =
        group.map(
          (item) => {
            let columnIndex =
              columnEndTimes.findIndex(
                (
                  columnEnd
                ) =>
                  item.start >=
                  columnEnd
              );

            if (
              columnIndex ===
              -1
            ) {
              columnIndex =
                columnEndTimes.length;

              columnEndTimes.push(
                item.end
              );
            } else {
              columnEndTimes[
                columnIndex
              ] =
                item.end;
            }

            return {
              ...item,
              columnIndex,
            };
          }
        );

      const columnCount =
        columnEndTimes.length;

      provisional.forEach(
        (item) => {
          layouts.push({
            ...item,
            columnCount,
          });
        }
      );
    }
  );

  return layouts;
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

function isTimeCoveredByTask(
  tasks: Task[],
  slotMinutes: number
): boolean {
  return tasks.some(
    (task) => {
      const start =
        task.displayStartMinutes ?? parseTime(task.startTime);

      const end =
        task.displayEndMinutes ?? parseTime(task.endTime);

      if (
        start ===
          undefined ||
        end === undefined
      ) {
        return false;
      }

      return (
        slotMinutes >=
          start &&
        slotMinutes <
          end
      );
    }
  );
}

function getFreeWindowEnd(tasks: Task[], startMinutes: number): string {
  const dayLimit = startMinutes < 18 * 60 ? 18 * 60 : 24 * 60;
  const nextTaskStart = tasks
    .map((task) => task.displayStartMinutes ?? parseTime(task.startTime))
    .filter((time): time is number => time !== undefined && time > startMinutes)
    .sort((a, b) => a - b)[0];
  const endMinutes = Math.min(nextTaskStart ?? dayLimit, dayLimit);
  return formatTimelineTime(endMinutes > startMinutes ? endMinutes : Math.min(startMinutes + 30, 24 * 60));
}

function formatTimelineTime(totalMinutes: number): string {
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function FreeSlotButton({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}) {
  return (
    <Pressable
      style={
        styles.freeSlot
      }
      onPress={() =>
        router.push({
          pathname:
            '/free-slot',
          params: {
            startTime,
            endTime,
          },
        })
      }
    >
      <Text
        style={styles.plus}
      >
        +
      </Text>

      <Text
        style={
          styles.freeText
        }
      >
        Free time
      </Text>
    </Pressable>
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
          numberOfLines={2}
        >
          {task.name}
        </Text>

        {!isFixed &&
          !isSomeday &&
          task.priority !==
            '' && (
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
        numberOfLines={2}
      >
        {task.type} ·{' '}
        {task.displayTimeLabel ?? `${task.startTime}–${task.endTime}`}
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

    headerRow: {
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

    date: {
      marginTop: 4,
      fontSize: 15,
      color: '#88837D',
    },

    addButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor:
        '#E4EEE9',
    },

    addButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#526A5E',
    },

    timeline: {
      paddingHorizontal: 16,
    },

    timelineGrid: {
      position: 'relative',
      width: '100%',
    },

    gridRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      height:
        SLOT_HEIGHT,
      flexDirection:
        'row',
    },

    time: {
      width: 58,
      paddingTop: 7,
      fontSize: 13,
      color: '#96918B',
    },

    slot: {
      flex: 1,
      borderTopWidth: 1,
      borderTopColor:
        '#E8E5E1',
      paddingVertical: 4,
    },

    freeSlot: {
      flex: 1,
      minHeight: 32,
      justifyContent:
        'center',
      paddingLeft: 16,
    },

    plus: {
      fontSize: 18,
      color: '#A5A09A',
    },

    freeText: {
      fontSize: 12,
      color: '#AAA49D',
    },

    tasksLayer: {
      position:
        'absolute',
      top: 0,
      bottom: 0,
      left: 58,
      right: 0,
    },

    taskPosition: {
      position:
        'absolute',
      paddingVertical: 4,
    },

    taskColumnPadding: {
      flex: 1,
      paddingHorizontal: 2,
    },

    taskFixed: {
      flex: 1,
      height: '100%',
      justifyContent:
        'center',
      paddingHorizontal: 12,
      backgroundColor:
        '#F3E1DF',
      borderRadius: 12,
    },

    taskFlexible: {
      flex: 1,
      height: '100%',
      justifyContent:
        'center',
      paddingHorizontal: 12,
      backgroundColor:
        '#E4EEE9',
      borderRadius: 12,
    },

    taskSomeday: {
      flex: 1,
      height: '100%',
      justifyContent:
        'center',
      paddingHorizontal: 12,
      backgroundColor:
        '#EEE8F2',
      borderRadius: 12,
    },

    taskTopRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
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
      marginLeft: 8,
      fontSize: 10,
      fontWeight: '700',
      color: '#647D70',
      letterSpacing: 0.5,
    },
  });