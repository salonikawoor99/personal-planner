import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useEffect,
  useState,
} from 'react';

import { usePlanner } from '@/context/planner-context';

export default function TaskDetailsScreen() {
  const router = useRouter();

  const { taskId } =
    useLocalSearchParams<{
      taskId: string;
    }>();

  const {
    getTask,
    deleteTask,
  } = usePlanner();

  const [
    showDeleteConfirmation,
    setShowDeleteConfirmation,
  ] = useState(false);

  useEffect(() => {
    setShowDeleteConfirmation(false);
  }, [taskId]);

  const task =
    taskId
      ? getTask(taskId)
      : undefined;

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            Task not found
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isFixed =
    task.type === 'Fixed';

  const handleDelete = () => {
    if (!taskId) {
      return;
    }

    setShowDeleteConfirmation(false);
    deleteTask(taskId);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Task details
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Task */}
        <View style={styles.taskCard}>
          <View
            style={[
              styles.typeBadge,
              isFixed
                ? styles.fixedBadge
                : styles.flexibleBadge,
            ]}
          >
            <Text
              style={[
                styles.typeText,
                isFixed
                  ? styles.fixedText
                  : styles.flexibleText,
              ]}
            >
              {task.type}
            </Text>
          </View>

          <Text style={styles.taskName}>
            {task.name}
          </Text>

          {task.priority ? (
            <Text style={styles.priority}>
              {task.priority} priority
            </Text>
          ) : null}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Schedule
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Date
              </Text>

              <Text style={styles.infoValue}>
                {task.scheduledDate ||
                  'Not scheduled'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                Time
              </Text>

              <Text style={styles.infoValue}>
                {task.startTime &&
                task.endTime
                  ? `${task.startTime} – ${task.endTime}`
                  : 'Not scheduled'}
              </Text>
            </View>

            {task.duration ? (
              <>
                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Duration
                  </Text>

                  <Text style={styles.infoValue}>
                    {task.duration}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Task information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Task information
          </Text>

          <View style={styles.infoCard}>
            {task.deadline ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Deadline
                </Text>

                <Text style={styles.infoValue}>
                  {task.deadline}
                </Text>
              </View>
            ) : null}

            {task.preferredTime ? (
              <>
                {task.deadline ? (
                  <View style={styles.divider} />
                ) : null}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Preferred time
                  </Text>

                  <Text style={styles.infoValue}>
                    {task.preferredTime}
                  </Text>
                </View>
              </>
            ) : null}

            {task.recurrence ? (
              <>
                {task.deadline ||
                task.preferredTime ? (
                  <View style={styles.divider} />
                ) : null}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    Repeat
                  </Text>

                  <Text style={styles.infoValue}>
                    {task.recurrence}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Notes */}
        {task.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Notes
            </Text>

            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                {task.notes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!taskId) return;
              router.push({ pathname: '/add-task', params: { taskId } });
            }}
          >
            <Text style={styles.primaryButtonText}>
              Edit task
            </Text>
          </Pressable>

          {!isFixed ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                if (!taskId) return;
                router.push({ pathname: '/suggest-new-time', params: { taskId } });
              }}
            >
              <Text style={styles.secondaryButtonText}>
                Suggest new time
              </Text>
            </Pressable>
          ) : (
            <View style={styles.fixedNotice}>
              <Text style={styles.fixedNoticeText}>
                Fixed commitments are protected from automatic rescheduling.
              </Text>
            </View>
          )}

          <Pressable
            style={styles.recoverButton}
            onPress={() => {
              if (!taskId) {
                return;
              }

              router.push({
                pathname: '/recover-task',
                params: {
                  taskId,
                },
              });
            }}
          >
            <Text style={styles.recoverButtonText}>
              Mark as unfinished
            </Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              setShowDeleteConfirmation(true)
            }
          >
            <Text style={styles.deleteButtonText}>
              Delete task
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Delete confirmation */}
      {showDeleteConfirmation ? (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationTitle}>
              Delete task?
            </Text>

            <Text style={styles.confirmationMessage}>
              This can't be undone.
            </Text>

            <Pressable
              style={styles.confirmDeleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.confirmDeleteText}>
                Delete
              </Text>
            </Pressable>

            <Pressable
              style={styles.confirmCancelButton}
              onPress={() =>
                setShowDeleteConfirmation(false)
              }
            >
              <Text style={styles.confirmCancelText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },

  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },

  fixedBadge: {
    backgroundColor: '#E8EDEB',
  },

  flexibleBadge: {
    backgroundColor: '#EDE9F4',
  },

  typeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  fixedText: {
    color: '#52635E',
  },

  flexibleText: {
    color: '#6A5A7D',
  },

  taskName: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#30302E',
    marginBottom: 8,
  },

  priority: {
    fontSize: 15,
    color: '#777570',
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#30302E',
    marginBottom: 10,
  },

  infoCard: {
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

  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },

  notesText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#55524D',
  },

  actions: {
    gap: 12,
    marginTop: 8,
  },

  primaryButton: {
    backgroundColor: '#30302E',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#30302E',
    fontSize: 15,
    fontWeight: '700',
  },

  recoverButton: {
    backgroundColor: '#F0EEE9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },

  recoverButtonText: {
    color: '#514B43',
    fontSize: 15,
    fontWeight: '600',
  },

  fixedNotice: {
    backgroundColor: '#F0EEE9',
    borderRadius: 14,
    padding: 14,
  },

  fixedNoticeText: {
    color: '#706A62',
    fontSize: 13,
    lineHeight: 19,
  },

  deleteButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#A05F5F',
    fontSize: 14,
    fontWeight: '600',
  },

  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  confirmationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
  },

  confirmationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#30302E',
  },

  confirmationMessage: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#777570',
  },

  confirmDeleteButton: {
    marginTop: 24,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#A05F5F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  confirmCancelButton: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD9D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmCancelText: {
    color: '#30302E',
    fontSize: 15,
    fontWeight: '700',
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