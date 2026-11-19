import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { loadPlannerTasks, savePlannerTasks } from '@/utils/planner-storage';

import {
  formatLongDate,
  keyToDate,
  normalizeDateKey,
  dateToKey,
  todayKey,
} from '@/utils/date-utils';

export type Task = {
  id: string;
  name: string;
  type: string;
  priority: string;
  duration: string;
  deadline: string;
  preferredTime: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  recurrence: string;
  // View-only occurrence segment metadata; never persisted on the source task.
  displayStartMinutes?: number;
  displayEndMinutes?: number;
  displayTimeLabel?: string;
  occurrenceKey?: string;
};

type NewTask = Omit<Task, 'id'>;

type PlannerContextType = {
  tasks: Task[];
  scheduledTasks: Task[];
  isReady: boolean;
  addTask: (task: NewTask) => Task;
  updateTask: (task: Task) => void;
  scheduleTask: (
    task: Task,
    scheduledDate?: string
  ) => boolean;
  isTimeAvailable: (task: Task) => boolean;
  getTimeConflicts: (task: Task) => string[];
  deleteTask: (taskId: string) => void;
  getTask: (id: string) => Task | undefined;
  getTasksForDate: (date: string) => Task[];
};

const PlannerContext =
  createContext<PlannerContextType | undefined>(
    undefined
  );

export function PlannerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasLoadedTasks, setHasLoadedTasks] = useState(false);

  // Restore tasks before enabling writes so an initial empty state
  // can never overwrite a previously saved planner.
  useEffect(() => {
    let isMounted = true;

    loadPlannerTasks()
      .then((storedTasks) => {
        if (!isMounted || !storedTasks) return;
        const parsed = JSON.parse(storedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed as Task[]);
        }
      })
      .catch((error) => {
        console.warn('Unable to restore planner tasks:', error);
      })
      .finally(() => {
        if (isMounted) setHasLoadedTasks(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedTasks) return;
    savePlannerTasks(JSON.stringify(tasks)).catch((error) => {
      console.warn('Unable to save planner tasks:', error);
    });
  }, [tasks, hasLoadedTasks]);

  /*
   * A task is considered scheduled only when it has
   * a date and both a start and end time.
   */
  const scheduledTasks = tasks.filter(
    (task) =>
      task.scheduledDate !== '' &&
      task.startTime !== '' &&
      task.endTime !== ''
  );

  /*
   * Keep dates stored in a consistent display format
   * while allowing the app to understand both:
   *
   * 2026-10-08
   * Thursday, October 8
   *
   * This also lets older tasks created during testing
   * continue to work.
   */
  const normalizeTaskDate = (
    value: string
  ): string => {
    if (!value) {
      return '';
    }

    const key = normalizeDateKey(value);

    if (!key) {
      return value;
    }

    return formatLongDate(key);
  };

  const addTask = (task: NewTask): Task => {
    const newTask: Task = {
      ...task,
      scheduledDate:
        normalizeTaskDate(
          task.scheduledDate
        ),
      id: Date.now().toString(),
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);

    return newTask;
  };

  const updateTask = (task: Task) => {
    const normalizedTask: Task = {
      ...task,
      scheduledDate:
        normalizeTaskDate(
          task.scheduledDate
        ),
    };

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === normalizedTask.id
          ? normalizedTask
          : currentTask
      )
    );
  };

  const getTimeConflicts = (task: Task): string[] => {
    if (!task.scheduledDate || !task.startTime || !task.endTime) return [];

    const proposedDateKey = normalizeDateKey(task.scheduledDate);
    const proposedStart = parseTime(task.startTime);
    const proposedEndRaw = parseTime(task.endTime);

    if (!proposedDateKey || proposedStart === undefined || proposedEndRaw === undefined) {
      return ['Invalid time range: please check the selected start and end times.'];
    }

    // An end time earlier than the start time means the task crosses midnight.
    const proposedEnd = proposedEndRaw <= proposedStart
      ? proposedEndRaw + 1440
      : proposedEndRaw;

    const proposedIsRecurringFixed =
      task.type === 'Fixed' && Boolean(task.recurrence) && task.recurrence !== 'Never';

    // A one-off task cannot be newly scheduled into elapsed time today.
    // Recurring Fixed tasks are intentionally exempt: their future occurrences
    // remain valid even when today's occurrence time has already passed.
    // Unchanged existing tasks can still be edited (e.g. rename or notes).
    if (proposedDateKey === todayKey() && !proposedIsRecurringFixed) {
      const now = new Date();
      const currentMinute = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0);
      const existingVersion = tasks.find((item) => item.id === task.id);
      const isUnchangedExistingSlot = Boolean(
        existingVersion &&
        normalizeDateKey(existingVersion.scheduledDate) === proposedDateKey &&
        existingVersion.startTime === task.startTime &&
        existingVersion.endTime === task.endTime
      );

      if (proposedStart < currentMinute && !isUnchangedExistingSlot) {
        return ['This time has already passed today. Choose a time later than now.'];
      }
    }

    const conflicts: string[] = [];
    tasks.forEach((existingTask) => {
      if (existingTask.id === task.id) return;

      const existingDateKey = normalizeDateKey(existingTask.scheduledDate);
      if (!existingDateKey || !existingTask.startTime || !existingTask.endTime) return;

      const existingStart = parseTime(existingTask.startTime);
      const existingEndRaw = parseTime(existingTask.endTime);
      if (existingStart === undefined || existingEndRaw === undefined) return;
      const existingEnd = existingEndRaw <= existingStart
        ? existingEndRaw + 1440
        : existingEndRaw;

      const existingIsRecurringFixed =
        existingTask.type === 'Fixed' && Boolean(existingTask.recurrence) && existingTask.recurrence !== 'Never';

      // Compare a full recurrence cycle once both repeating tasks have started.
      const firstCheckDate = proposedIsRecurringFixed
        ? (existingDateKey > proposedDateKey ? existingDateKey : proposedDateKey)
        : proposedDateKey;
      const checkCount = proposedIsRecurringFixed ? 14 : 1;

      for (let index = 0; index < checkCount; index += 1) {
        const proposedOccurrenceDate = dateToKey(dateKeyToDate(firstCheckDate, index));
        const proposedApplies = proposedIsRecurringFixed
          ? shouldShowFixedTaskOnDate(task, proposedOccurrenceDate)
          : proposedOccurrenceDate === proposedDateKey;
        if (!proposedApplies) continue;

        // An overnight task can overlap a commitment anchored on the following
        // date, while an overnight existing task can begin on the previous date.
        for (const existingOffset of [-1, 0, 1]) {
          const existingOccurrenceDate = dateToKey(
            dateKeyToDate(proposedOccurrenceDate, existingOffset)
          );
          const existingApplies = existingTask.type === 'Fixed'
            ? shouldShowFixedTaskOnDate(existingTask, existingOccurrenceDate)
            : existingDateKey === existingOccurrenceDate;
          if (!existingApplies) continue;

          const proposedAbsoluteStart = proposedStart;
          const proposedAbsoluteEnd = proposedEnd;
          const existingAbsoluteStart = existingOffset * 1440 + existingStart;
          const existingAbsoluteEnd = existingOffset * 1440 + existingEnd;

          if (proposedAbsoluteStart < existingAbsoluteEnd && proposedAbsoluteEnd > existingAbsoluteStart) {
            const description = `${existingTask.name} on ${formatLongDate(existingOccurrenceDate)} (${existingTask.startTime}–${existingTask.endTime})`;
            if (!conflicts.includes(description)) conflicts.push(description);
          }
        }
      }
    });

    return conflicts;
  };

  const isTimeAvailable = (task: Task): boolean => {
    return getTimeConflicts(task).length === 0;
  };

  const scheduleTask = (
    task: Task,
    scheduledDate?: string
  ): boolean => {
    const dateToUse =
      scheduledDate ??
      task.scheduledDate ??
      '';

    const updatedTask: Task = {
      ...task,
      scheduledDate:
        normalizeTaskDate(dateToUse),
    };

    if (!isTimeAvailable(updatedTask)) return false;

    setTasks((currentTasks) => {
      const exists = currentTasks.some(
        (currentTask) =>
          currentTask.id === updatedTask.id
      );

      if (exists) {
        return currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id
            ? updatedTask
            : currentTask
        );
      }

      return [
        ...currentTasks,
        updatedTask,
      ];
    });
    return true;
  };

  const deleteTask = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== taskId
      )
    );
  };

  const getTask = (id: string) => {
    return tasks.find(
      (task) => task.id === id
    );
  };

  /*
   * Returns all scheduled tasks that belong to
   * the requested calendar date.
   *
   * The screens can pass either:
   *
   * 2026-10-08
   *
   * or:
   *
   * Thursday, October 8
   *
   * and the context handles both.
   */
  const getTasksForDate = (
    date: string
  ): Task[] => {
    const requestedKey = normalizeDateKey(date);
    if (!requestedKey) return [];

    const previousKey = dateToKey(dateKeyToDate(requestedKey, -1));
    const results: Task[] = [];

    scheduledTasks.forEach((task) => {
      const taskDateKey = normalizeDateKey(task.scheduledDate);
      if (!taskDateKey) return;

      const start = parseTime(task.startTime);
      const rawEnd = parseTime(task.endTime);
      if (start === undefined || rawEnd === undefined) return;

      const crossesMidnight = rawEnd <= start;
      const end = crossesMidnight ? rawEnd + 1440 : rawEnd;
      const appliesOn = (dateKey: string) => task.type === 'Fixed'
        ? shouldShowFixedTaskOnDate(task, dateKey)
        : taskDateKey === dateKey;

      // Segment beginning on the requested date.
      if (appliesOn(requestedKey)) {
        results.push({
          ...task,
          scheduledDate: formatLongDate(requestedKey),
          displayStartMinutes: start,
          displayEndMinutes: Math.min(end, 1440),
          displayTimeLabel: `${task.startTime}–${task.endTime}`,
          occurrenceKey: `${task.id}-${requestedKey}-start`,
        });
      }

      // If yesterday's occurrence crosses midnight, show its remaining
      // portion at the top of this date as a continuation segment.
      if (crossesMidnight && appliesOn(previousKey) && rawEnd > 0) {
        results.push({
          ...task,
          scheduledDate: formatLongDate(requestedKey),
          displayStartMinutes: 0,
          displayEndMinutes: rawEnd,
          displayTimeLabel: `Continues · until ${task.endTime}`,
          occurrenceKey: `${task.id}-${previousKey}-continuation`,
        });
      }
    });

    return results;
  };

  return (
    <PlannerContext.Provider
      value={{
        tasks,
        scheduledTasks,
        isReady: hasLoadedTasks,
        addTask,
        updateTask,
        scheduleTask,
        isTimeAvailable,
        getTimeConflicts,
        deleteTask,
        getTask,
        getTasksForDate,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

function dateKeyToDate(dateKey: string, daysToAdd: number): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

/*
 * Fixed-task recurrence.
 *
 * The original scheduled date determines the weekday
 * for Weekly recurrence.
 */
function shouldShowFixedTaskOnDate(
  task: Task,
  dateKey: string
): boolean {
  const taskKey =
    normalizeDateKey(
      task.scheduledDate
    );

  if (!taskKey) {
    return false;
  }

  /*
   * Always show the task on its original date.
   */
  if (taskKey === dateKey) {
    return true;
  }

  if (
    !task.recurrence ||
    task.recurrence === 'Never'
  ) {
    return false;
  }

  const targetDate =
    keyToDate(taskKey);

  const currentDate =
    keyToDate(dateKey);

  // A recurrence begins on its original scheduled date; it must not appear
  // or block time on dates before that first occurrence.
  if (currentDate < targetDate) {
    return false;
  }

  const targetWeekday =
    targetDate.getDay();

  const currentWeekday =
    currentDate.getDay();

  switch (task.recurrence) {
    case 'Daily':
      return true;

    case 'Weekdays':
      return (
        currentWeekday !== 0 &&
        currentWeekday !== 6
      );

    case 'Weekly':
      return (
        targetWeekday ===
        currentWeekday
      );

    default:
      return false;
  }
}

export function usePlanner() {
  const context = useContext(
    PlannerContext
  );

  if (!context) {
    throw new Error(
      'usePlanner must be used inside PlannerProvider'
    );
  }

  return context;
}
function parseTime(value: string): number | undefined {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return undefined;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  const minute = Number(match[2]);
  if (minute < 0 || minute > 59) return undefined;
  return hour * 60 + minute;
}
