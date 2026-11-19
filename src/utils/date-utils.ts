export function dateToKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');
  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return dateToKey(new Date());
}

export function keyToDate(
  key: string
): Date {
  const [year, month, day] =
    key.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

export function addDays(
  key: string,
  amount: number
): string {
  const date = keyToDate(key);

  date.setDate(
    date.getDate() + amount
  );

  return dateToKey(date);
}

export function addMonths(
  key: string,
  amount: number
): string {
  const date = keyToDate(key);

  date.setDate(1);

  date.setMonth(
    date.getMonth() + amount
  );

  return dateToKey(date);
}

export function startOfWeek(
  key: string
): string {
  const date = keyToDate(key);

  const day = date.getDay();

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() +
      mondayOffset
  );

  return dateToKey(date);
}

export function formatLongDate(
  key: string
): string {
  return keyToDate(
    key
  ).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }
  );
}

export function formatMonthTitle(
  key: string
): string {
  return keyToDate(
    key
  ).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    }
  );
}

export function formatWeekRange(
  startKey: string
): string {
  const endKey =
    addDays(startKey, 6);

  const start =
    keyToDate(startKey);

  const end =
    keyToDate(endKey);

  const startMonth =
    start.toLocaleDateString(
      'en-US',
      {
        month: 'long',
      }
    );

  const endMonth =
    end.toLocaleDateString(
      'en-US',
      {
        month: 'long',
      }
    );

  const startDay =
    start.getDate();

  const endDay =
    end.getDate();

  const year =
    end.getFullYear();

  if (
    startMonth === endMonth
  ) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

export function getWeekDates(
  startKey: string
): string[] {
  return Array.from(
    { length: 7 },
    (_, index) =>
      addDays(
        startKey,
        index
      )
  );
}

export function getMonthGrid(
  monthKey: string
): string[] {
  const firstDay =
    keyToDate(monthKey);

  firstDay.setDate(1);

  const firstWeekday =
    firstDay.getDay();

  const mondayOffset =
    firstWeekday === 0
      ? -6
      : 1 - firstWeekday;

  firstDay.setDate(
    firstDay.getDate() +
      mondayOffset
  );

  const startKey =
    dateToKey(firstDay);

  return Array.from(
    { length: 42 },
    (_, index) =>
      addDays(
        startKey,
        index
      )
  );
}

export function sameMonth(
  aKey: string,
  bKey: string
): boolean {
  const a =
    keyToDate(aKey);

  const b =
    keyToDate(bKey);

  return (
    a.getFullYear() ===
      b.getFullYear() &&
    a.getMonth() ===
      b.getMonth()
  );
}

/*
 * Supports both the new YYYY-MM-DD
 * format and the old display-string
 * format used by our earlier prototype.
 */
export function normalizeDateKey(
  value: string
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  const match =
    value.match(
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?/
    );

  if (!match) {
    return undefined;
  }

  const year = Number(
    match[3] ??
      new Date().getFullYear()
  );

  const parsed =
    new Date(
      `${match[1]} ${match[2]}, ${year} 12:00:00`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return undefined;
  }

  return dateToKey(parsed);
}

export function displayDateFromValue(
  value: string
): string {
  const key =
    normalizeDateKey(value);

  return key
    ? formatLongDate(key)
    : value;
}