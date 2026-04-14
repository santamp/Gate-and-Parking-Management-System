import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, CheckCheck } from 'lucide-react-native';
import notificationService from '../services/notificationService';
import { useSocket } from '../context/SocketContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../theme/DesignSystem';

const typeLabels = {
  vehicle_entry: 'Vehicle Entry',
  vehicle_status: 'Vehicle Status',
  payment: 'Payment',
  exit: 'Exit',
  system: 'System',
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationsScreen = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 30 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev.filter((item) => item._id !== notification._id)].slice(0, 30));
      setUnreadCount((count) => count + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket]);

  const markRead = async (notification) => {
    if (notification.isRead) return;
    await notificationService.markRead(notification._id);
    setNotifications((prev) => prev.map((item) => (
      item._id === notification._id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
    )));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard, SHADOWS.small]}
      onPress={() => markRead(item)}
      activeOpacity={0.85}
    >
      <View style={[styles.dot, item.isRead ? styles.readDot : styles.unreadDot]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{typeLabels[item.type] || 'System'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Notifications</Text>
          <Text style={styles.subheading}>{unreadCount} unread updates</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllRead}>
            <CheckCheck color={COLORS.white} size={18} />
            <Text style={styles.markAllText}>Read all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={notifications.length ? styles.list : styles.emptyList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell color={COLORS.gray300} size={52} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>Gate updates will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  heading: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
  },
  subheading: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  markAllButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markAllText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  unreadCard: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#f8fbff',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 7,
  },
  unreadDot: {
    backgroundColor: COLORS.danger,
  },
  readDot: {
    backgroundColor: COLORS.gray200,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.gray900,
  },
  time: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
  },
  message: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.gray400,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
  },
});

export default NotificationsScreen;
