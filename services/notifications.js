import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const SUPPLEMENT_REMINDER_KIND = "supplement-reminder";
const SCHEDULED_ITEM_REMINDER_KIND = "scheduled-item-reminder";
const REMINDER_CHANNEL_ID = "supplement-reminders";

const WEEKDAY_NUMBERS = {
  Zo: 1,
  Ma: 2,
  Di: 3,
  Wo: 4,
  Do: 5,
  Vr: 6,
  Za: 7,
};

let synchronizationQueue = Promise.resolve();

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function hasNotificationPermission(settings) {
  if (settings.granted) return true;

  return [
    Notifications.IosAuthorizationStatus.AUTHORIZED,
    Notifications.IosAuthorizationStatus.PROVISIONAL,
    Notifications.IosAuthorizationStatus.EPHEMERAL,
  ].includes(settings.ios?.status);
}

async function ensureNotificationPermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Geplande herinneringen",
      description: "Meldingen wanneer het tijd is voor een gepland item.",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
    });
  }

  let settings = await Notifications.getPermissionsAsync();

  if (!hasNotificationPermission(settings)) {
    settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
  }

  return hasNotificationPermission(settings);
}

export async function initializeNotifications() {
  if (Platform.OS === "web") {
    return { permissionGranted: false, unsupported: true };
  }

  const permissionGranted = await ensureNotificationPermission();
  return { permissionGranted, unsupported: false };
}

export async function getNotificationDiagnostics() {
  if (Platform.OS === "web") {
    return {
      permissionGranted: false,
      scheduledCount: 0,
      unsupported: true,
    };
  }

  const settings = await Notifications.getPermissionsAsync();
  const requests = await Notifications.getAllScheduledNotificationsAsync();

  return {
    permissionGranted: hasNotificationPermission(settings),
    scheduledCount: requests.filter(isScheduledItemReminder).length,
    unsupported: false,
  };
}

function isScheduledItemReminder(request) {
  return [SUPPLEMENT_REMINDER_KIND, SCHEDULED_ITEM_REMINDER_KIND].includes(
    request.content.data?.kind
  );
}

function getScheduledItems(pills) {
  return pills.filter(
    (pill) =>
      pill.type === "scheduled" &&
      /^\d{2}:\d{2}$/.test(pill.time || "") &&
      pill.days?.length > 0
  );
}

async function performSynchronization(pills) {
  if (Platform.OS === "web") {
    return { permissionGranted: false, scheduledCount: 0, unsupported: true };
  }

  const existingRequests = await Notifications.getAllScheduledNotificationsAsync();
  const reminderRequests = existingRequests.filter(isScheduledItemReminder);

  await Promise.all(
    reminderRequests.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )
  );

  const permissionGranted = await ensureNotificationPermission();

  if (!permissionGranted) {
    return { permissionGranted: false, scheduledCount: 0, unsupported: false };
  }

  const scheduledItems = getScheduledItems(pills);

  if (scheduledItems.length === 0) {
    return { permissionGranted: true, scheduledCount: 0, unsupported: false };
  }

  const newIdentifiers = [];

  try {
    for (const item of scheduledItems) {
      const [hour, minute] = item.time.split(":").map(Number);

      for (const day of item.days) {
        const weekday = WEEKDAY_NUMBERS[day];
        if (!weekday) continue;

        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Tijd voor ${item.name}`,
            body: `Dit item staat om ${item.time} op je planning.`,
            sound: "default",
            data: {
              kind: SCHEDULED_ITEM_REMINDER_KIND,
              itemId: item.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
            channelId: REMINDER_CHANNEL_ID,
          },
        });

        newIdentifiers.push(identifier);
      }
    }
  } catch (error) {
    await Promise.all(
      newIdentifiers.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier)
      )
    );
    throw error;
  }

  return {
    permissionGranted: true,
    scheduledCount: newIdentifiers.length,
    unsupported: false,
  };
}

export function getReminderScheduleKey(pills) {
  return JSON.stringify(
    getScheduledItems(pills)
      .map(({ id, name, category, time, days }) => ({
        id,
        name,
        category,
        time,
        days: [...days].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function syncScheduledItemNotifications(pills) {
  const synchronize = () => performSynchronization(pills);
  synchronizationQueue = synchronizationQueue.then(synchronize, synchronize);
  return synchronizationQueue;
}
