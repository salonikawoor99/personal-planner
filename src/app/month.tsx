import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useState,
} from 'react';

import {
  usePlanner,
  type Task,
} from '@/context/planner-context';

import {
  addMonths,
  formatMonthTitle,
  getMonthGrid,
  keyToDate,
  sameMonth,
  todayKey,
} from '@/utils/date-utils';

const WEEKDAYS = [
  'M',
  'T',
  'W',
  'T',
  'F',
  'S',
  'S',
];

const DAY_MINUTES = 24 * 60;

export default function MonthScreen() {
  const {
    getTasksForDate,
  } = usePlanner();
  const { height: windowHeight } = useWindowDimensions();
  // Keep the complete six-week calendar visible without scrolling.
  // The available height varies across Android devices and screen sizes.
  const dayCellHeight = Math.max(42, Math.min(88, (windowHeight - 330) / 6));

  const [monthKey, setMonthKey] =
    useState(
      todayKey()
    );

  const dates =
    getMonthGrid(
      monthKey
    );

  const totalFreeHours =
    dates.reduce(
      (total, dateKey) => {
        if (
          !sameMonth(
            dateKey,
            monthKey
          )
        ) {
          return total;
        }

        const tasks =
          getTasksForDate(
            dateKey
          );

        const occupiedMinutes =
          getOccupiedMinutes(
            tasks
          );

        return (
          total +
          Math.max(
            0,
            DAY_MINUTES -
              occupiedMinutes
          ) /
            60
        );
      },
      0
    );

  return (
    <View style={styles.container}>
      <View
        style={styles.header}
      >
        <View>
          <Text
            style={styles.title}
          >
            Month
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            {formatMonthTitle(
              monthKey
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
              setMonthKey(
                addMonths(
                  monthKey,
                  -1
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
              setMonthKey(
                addMonths(
                  monthKey,
                  1
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

      <View
        style={
          styles.summaryCard
        }
      >
        <View>
          <Text
            style={
              styles.summaryEyebrow
            }
          >
            This month
          </Text>

          <Text
            style={
              styles.summaryLabel
            }
          >
            Total free time
          </Text>
        </View>

        <Text
          style={
            styles.summaryValue
          }
        >
          {formatHours(
            totalFreeHours
          )}
        </Text>
      </View>

      <View
        style={styles.calendar}
      >
        <View
          style={
            styles.weekdayRow
          }
        >
          {WEEKDAYS.map(
            (day, index) => (
              <View
                key={`${day}-${index}`}
                style={
                  styles.weekdayCell
                }
              >
                <Text
                  style={
                    styles.weekdayText
                  }
                >
                  {day}
                </Text>
              </View>
            )
          )}
        </View>

        <View
          style={
            styles.calendarGrid
          }
        >
          {dates.map(
            (dateKey) => {
              const inMonth =
                sameMonth(
                  dateKey,
                  monthKey
                );

              const tasks =
                inMonth
                  ? getTasksForDate(
                      dateKey
                    )
                  : [];

              return (
                <CalendarDayCell
                  key={dateKey}
                  dateKey={
                    dateKey
                  }
                  tasks={
                    tasks
                  }
                  inMonth={
                    inMonth
                  }
                  cellHeight={dayCellHeight}
                />
              );
            }
          )}
        </View>
      </View>

      <View
        style={styles.legend}
      >
        <LegendItem
          color="#D45C59"
          label="Fixed"
        />

        <LegendItem
          color="#7D9E8E"
          label="Flexible"
        />

        <LegendItem
          color="#8D789D"
          label="Someday"
        />

        <LegendItem
          color="#D2CEC8"
          label="Free"
        />
      </View>
    </View>
  );
}

function CalendarDayCell({
  dateKey,
  tasks,
  inMonth,
  cellHeight,
}: {
  dateKey: string;
  tasks: Task[];
  inMonth: boolean;
  cellHeight: number;
}) {
  const date =
    keyToDate(
      dateKey
    );

  const day =
    date.getDate();

  const hasFixed =
    tasks.some(
      (task) =>
        task.type ===
        'Fixed'
    );

  const hasFlexible =
    tasks.some(
      (task) =>
        task.type ===
        'Flexible'
    );

  const hasSomeday =
    tasks.some(
      (task) =>
        task.type ===
        'Someday'
    );

  const occupiedMinutes =
    getOccupiedMinutes(
      tasks
    );

  const freeHours =
    Math.max(
      0,
      DAY_MINUTES -
        occupiedMinutes
    ) / 60;

  return (
    <View
      style={[
        styles.dayCell,
        { height: cellHeight },
        !inMonth &&
          styles.outsideMonthCell,
      ]}
    >
      <Text
        style={[
          styles.dayNumber,
          !inMonth &&
            styles.outsideMonthText,
        ]}
      >
        {day}
      </Text>

      {inMonth ? (
        <>
          <View
            style={
              styles.dotArea
            }
          >
            {hasFixed && (
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      '#D45C59',
                  },
                ]}
              />
            )}

            {hasFlexible && (
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      '#7D9E8E',
                  },
                ]}
              />
            )}

            {hasSomeday && (
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      '#8D789D',
                  },
                ]}
              />
            )}

            {!hasFixed &&
              !hasFlexible &&
              !hasSomeday && (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        '#D2CEC8',
                    },
                  ]}
                />
              )}
          </View>

          <Text
            style={
              styles.freeHours
            }
          >
            {formatHours(
              freeHours
            )}
          </Text>
        </>
      ) : null}
    </View>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <View
      style={
        styles.legendItem
      }
    >
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={
          styles.legendText
        }
      >
        {label}
      </Text>
    </View>
  );
}

function getOccupiedMinutes(
  tasks: Task[]
): number {
  const ranges =
    tasks
      .map((task) => {
        const start =
          task.displayStartMinutes ?? parseTime(task.startTime);

        const end =
          task.displayEndMinutes ?? parseTime(task.endTime);

        if (
          start ===
            undefined ||
          end === undefined ||
          end <= start
        ) {
          return null;
        }

        return {
          start,
          end,
        };
      })
      .filter(
        (
          range
        ): range is {
          start: number;
          end: number;
        } =>
          range !== null
      )
      .sort(
        (a, b) =>
          a.start -
          b.start
      );

  if (
    ranges.length === 0
  ) {
    return 0;
  }

  let total = 0;

  let currentStart =
    ranges[0].start;

  let currentEnd =
    ranges[0].end;

  for (
    let index = 1;
    index <
      ranges.length;
    index++
  ) {
    const range =
      ranges[index];

    if (
      range.start <=
      currentEnd
    ) {
      currentEnd =
        Math.max(
          currentEnd,
          range.end
        );
    } else {
      total +=
        currentEnd -
        currentStart;

      currentStart =
        range.start;

      currentEnd =
        range.end;
    }
  }

  total +=
    currentEnd -
    currentStart;

  return total;
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

function formatHours(
  hours: number
): string {
  if (
    Number.isInteger(hours)
  ) {
    return `${hours}h`;
  }

  return `${hours.toFixed(1)}h`;
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FAF9F7',
    },

    header: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 12,
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

    summaryCard: {
      marginHorizontal: 24,
      marginBottom: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 18,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E8E4DF',
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    summaryEyebrow: {
      fontSize: 13,
      color: '#77716B',
    },

    summaryLabel: {
      marginTop: 3,
      fontSize: 14,
      color: '#77716B',
    },

    summaryValue: {
      fontSize: 26,
      fontWeight: '700',
      color: '#34312E',
    },

    calendar: {
      marginHorizontal: 16,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E8E4DF',
      borderRadius: 18,
      overflow: 'hidden',
    },

    weekdayRow: {
      flexDirection:
        'row',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E8E4DF',
    },

    weekdayCell: {
      flex: 1,
      height: 32,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    weekdayText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#96918B',
    },

    calendarGrid: {
      flexDirection:
        'row',
      flexWrap: 'wrap',
    },

    dayCell: {
      width: '14.2857%',
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor:
        '#EDE9E4',
      paddingTop: 6,
      alignItems:
        'center',
    },

    outsideMonthCell: {
      backgroundColor:
        '#FBFAF8',
    },

    dayNumber: {
      alignSelf:
        'flex-start',
      marginLeft: 10,
      fontSize: 14,
      fontWeight: '600',
      color: '#34312E',
    },

    outsideMonthText: {
      color: '#C7C2BC',
    },

    dotArea: {
      height: 24,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 5,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    freeHours: {
      fontSize: 12,
      color: '#96918B',
    },

    legend: {
      paddingHorizontal: 24,
      paddingTop: 10,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
    },

    legendItem: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },

    legendText: {
      fontSize: 12,
      color: '#77716B',
    },
  });