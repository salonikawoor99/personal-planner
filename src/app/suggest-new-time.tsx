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
  addDays,
  formatLongDate,
  startOfWeek,
  todayKey,
} from '@/utils/date-utils';

const DAY_START = 8 * 60;
// Keep suggestions aligned with the full-day timeline. The previous 6 PM
// cutoff hid valid evening slots even when Today still showed free time.
const DAY_END = 24 * 60;
const SLOT_INCREMENT = 30;

type SuggestedTime = {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export default function SuggestNewTimeScreen() {
  const {
    taskId,
    remainingDuration,
  } = useLocalSearchParams<{
    taskId: string;
    remainingDuration?: string;
  }>();

  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const {
    getTask,
    getTimeConflicts,
  } = usePlanner();

  const task =
    taskId
      ? getTask(taskId)
      : undefined;

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Task not found
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.replace('/')
            }
          >
            <Text style={styles.backText}>
              Back to Today
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /*
   * Recovery uses the remaining duration.
   * Normal scheduling uses the task duration.
   */
  const durationText =
    typeof remainingDuration === 'string' &&
    remainingDuration.trim() !== ''
      ? remainingDuration
      : task.duration;

  const durationMinutes =
    parseDuration(durationText);

  const isRecovery =
    typeof remainingDuration === 'string' &&
    remainingDuration.trim() !== '';

  // Search the whole remaining week for both rescheduling and recovery.
  // Deadlines influence the recommendation label, not whether the user is
  // allowed to recover or move a task beyond its original target date.
  const today = todayKey();
  const weekEnd = addDays(startOfWeek(today), 6);
  const deadlineKey = getDeadlineKey(task.deadline, today, weekEnd);
  const lastSearchDay = weekEnd;
  const dayCount = Math.max(
    0,
    Math.round((new Date(`${lastSearchDay}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000) + 1
  );
  const availableDays = Array.from(
    { length: dayCount },
    (_, index) => addDays(today, index)
  );

  const suggestions = getSuggestions(
    task,
    durationMinutes,
    getTimeConflicts,
    availableDays,
    deadlineKey,
    isRecovery
  );

  const visibleSuggestions = showAllSuggestions
    ? suggestions
    : suggestions.slice(0, 3);

  const selectTime = (
    date: string,
    startTime: string,
    endTime: string
  ) => {
    router.push({
      pathname: '/confirm-time',
      params: {
        taskId: task.id,
        date,
        startTime,
        endTime,
        remainingDuration:
          isRecovery
            ? durationText
            : undefined,
      },
    });
  };

  return (
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
          ‹ Back
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>
          {isRecovery
            ? 'Find a new time'
            : 'Find a time'}
        </Text>

        <Text style={styles.subtitle}>
          {isRecovery
            ? 'Here are available options across the rest of this week for the remaining work.'
            : 'Here are available options across the rest of this week. Times after your deadline are labelled.'}
        </Text>
      </View>

      <View style={styles.taskCard}>
        <Text style={styles.taskName}>
          {task.name}
        </Text>

        <View style={styles.taskDetails}>
          <Text style={styles.detail}>
            {isRecovery
              ? `Remaining: ${durationText}`
              : task.duration}
          </Text>

          <Text style={styles.dot}>
            ·
          </Text>

          <Text style={styles.detail}>
            {task.priority}
          </Text>

          {task.deadline && (
            <>
              <Text style={styles.dot}>
                ·
              </Text>

              <Text style={styles.detail}>
                Due {task.deadline.toLowerCase()}
              </Text>
            </>
          )}
        </View>

        {task.preferredTime && (
          <Text style={styles.preference}>
            Preferred: {task.preferredTime}
          </Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>
        RECOMMENDED TIMES
      </Text>

      {suggestions.length > 0 ? (
        visibleSuggestions.map(
          (suggestion) => (
            <Pressable
              key={`${suggestion.date}-${suggestion.startTime}`}
              style={styles.timeCard}
              onPress={() =>
                selectTime(
                  suggestion.date,
                  suggestion.startTime,
                  suggestion.endTime
                )
              }
            >
              <View>
                <Text style={styles.date}>
                  {suggestion.date}
                </Text>

                <Text style={styles.time}>
                  {suggestion.startTime} – {suggestion.endTime}
                </Text>

                <Text style={styles.reason}>
                  {suggestion.reason}
                </Text>
              </View>

              <Text style={styles.arrow}>
                ›
              </Text>
            </Pressable>
          )
        )
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No open time found
          </Text>

          <Text style={styles.emptyText}>
            There isn't enough uninterrupted free
            time before the end of this week
            (or your task deadline) for this task.
          </Text>
        </View>
      )}

      {suggestions.length > 3 && (
        <Pressable
          style={styles.moreButton}
          onPress={() => setShowAllSuggestions((current) => !current)}
        >
          <Text style={styles.moreText}>
            {showAllSuggestions ? 'Show fewer options' : 'See more options'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function getDeadlineKey(
  deadline: string,
  today: string,
  weekEnd: string
): string {
  switch (deadline) {
    case 'Today':
      return today;
    case 'Tomorrow':
      return addDays(today, 1);
    case 'This week':
    default:
      return weekEnd;
  }
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

function getSuggestions(
  task: Task,
  durationMinutes: number,
  getTimeConflicts: (task: Task) => string[],
  availableDays: string[],
  deadlineKey: string,
  isRecovery: boolean
): SuggestedTime[] {
  const suggestionsByDay: SuggestedTime[][] = [];
  const today = todayKey();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0);
  const nextHalfHour = Math.ceil(currentMinutes / SLOT_INCREMENT) * SLOT_INCREMENT;

  for (const dateKey of availableDays) {
    const earliestStart = dateKey === today
      ? Math.max(DAY_START, nextHalfHour)
      : DAY_START;
    const daySuggestions = getAvailableTimes(
      getTimeConflicts,
      durationMinutes,
      dateKey,
      task,
      earliestStart
    );
    if (daySuggestions.length > 0) {
      const labelledSuggestions = daySuggestions.map((suggestion) => ({
        ...suggestion,
        reason: !isRecovery && dateKey > deadlineKey
          ? `Available after your ${task.deadline.toLowerCase()} deadline`
          : suggestion.reason,
      }));
      suggestionsByDay.push(labelledSuggestions);
    }
  }

  // If the task has a nearer deadline (Today or Tomorrow), show every
  // available option up to that deadline before suggesting later dates.
  // This ensures today's free evening slots are not pushed behind future
  // days merely to diversify the recommendations.
  const finalSearchDay = availableDays[availableDays.length - 1];
  if (deadlineKey < finalSearchDay) {
    const lastOnTimeDayIndex = availableDays.indexOf(deadlineKey);
    const onTimeSuggestions = suggestionsByDay
      .slice(0, lastOnTimeDayIndex + 1)
      .flat();
    const afterDeadlineSuggestions = suggestionsByDay
      .slice(lastOnTimeDayIndex + 1)
      .flat();

    return [...onTimeSuggestions, ...afterDeadlineSuggestions].slice(0, 21);
  }

  // For tasks due this week, interleave dates so recommendations cover
  // different days instead of showing adjacent slots from one day only.
  const balancedSuggestions: SuggestedTime[] = [];
  const maxOptionsPerDay = Math.max(0, ...suggestionsByDay.map((day) => day.length));
  for (let optionIndex = 0; optionIndex < maxOptionsPerDay; optionIndex += 1) {
    for (const daySuggestions of suggestionsByDay) {
      if (daySuggestions[optionIndex]) {
        balancedSuggestions.push(daySuggestions[optionIndex]);
      }
    }
  }

  return balancedSuggestions.slice(0, 21);
}

function getAvailableTimes(
  getTimeConflicts: (task: Task) => string[],
  durationMinutes: number,
  dateKey: string,
  task: Task,
  earliestStart: number = DAY_START
): SuggestedTime[] {
  const suggestions: SuggestedTime[] = [];

  for (
    let start = Math.max(DAY_START, earliestStart);
    start + durationMinutes <= DAY_END;
    start += SLOT_INCREMENT
  ) {
    const end =
      start + durationMinutes;

    // Use the same central validator as final confirmation. This keeps
    // suggestions consistent with recurrence and overnight conflict rules.
    const proposedTask: Task = {
      ...task,
      scheduledDate: dateKey,
      startTime: formatTime(start),
      endTime: formatTime(end),
    };

    if (getTimeConflicts(proposedTask).length > 0) {
      continue;
    }

    const reason =
      getSuggestionReason(
        start,
        end,
        task
      );

    suggestions.push({
      date:
        formatLongDate(
          dateKey
        ),
      startTime:
        formatTime(start),
      endTime:
        formatTime(end),
      reason,
    });
  }

  return suggestions;
}

function getSuggestionReason(
  start: number,
  end: number,
  task: Task
): string {
  const preferred =
    task.preferredTime
      ?.toLowerCase();

  if (
    preferred &&
    preferred !== 'anytime' &&
    matchesPreferredTime(
      start,
      end,
      preferred
    )
  ) {
    return `Fits your ${preferred} preference`;
  }

  return 'Fits your available time';
}

function matchesPreferredTime(
  start: number,
  end: number,
  preferred: string
): boolean {
  const midpoint =
    (start + end) / 2;

  if (preferred === 'morning') {
    return midpoint < 12 * 60;
  }

  if (
    preferred === 'afternoon'
  ) {
    return (
      midpoint >= 12 * 60 &&
      midpoint < 17 * 60
    );
  }

  if (preferred === 'evening') {
    return midpoint >= 17 * 60;
  }

  return false;
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

function formatTime(
  totalMinutes: number
): string {
  // Normalize midnight (24:00) to 12:00 AM rather than 12:00 PM.
  const normalizedMinutes =
    ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hour24 =
    Math.floor(
      normalizedMinutes / 60
    );

  const minutes =
    normalizedMinutes % 60;

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

  return (
    hour12 +
    ':' +
    formattedMinutes +
    ' ' +
    period
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
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#292827',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#88837D',
  },

  taskCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9E5E0',
  },

  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34312E',
  },

  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },

  detail: {
    fontSize: 13,
    color: '#77716B',
  },

  dot: {
    marginHorizontal: 6,
    fontSize: 13,
    color: '#AAA49D',
  },

  preference: {
    marginTop: 8,
    fontSize: 12,
    color: '#647D70',
  },

  sectionLabel: {
    marginTop: 30,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8B857E',
  },

  timeCard: {
    minHeight: 94,
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9E5E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  date: {
    fontSize: 13,
    color: '#88837D',
  },

  time: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '600',
    color: '#34312E',
  },

  reason: {
    marginTop: 5,
    fontSize: 12,
    color: '#647D70',
  },

  arrow: {
    fontSize: 25,
    color: '#AAA49D',
  },

  moreButton: {
    minHeight: 52,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD8D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F5A55',
  },

  emptyCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9E5E0',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34312E',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: '#77716B',
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34312E',
    marginBottom: 20,
  },
});