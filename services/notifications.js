import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const SUPPLEMENT_REMINDER_KIND = "supplement-reminder";
const SUPPLEMENT_CHANNEL_ID = "supplement-reminders";

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
    await Notifications.setNotificationChannelAsync(SUPPLEMENT_CHANNEL_ID, {
      name: "Supplementherinneringen",
      description: "Meldingen wanneer het tijd is om een supplement te nemen.",
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

function isSupplementReminder(request) {
  return request.content.data?.kind === SUPPLEMENT_REMINDER_KIND;
}

function getScheduledSupplements(pills) {
  return pills.filter(
    (pill) =>
      pill.type === "scheduled" &&
      pill.category?.toLowerCase() === "supplement" &&
      /^\d{2}:\d{2}$/.test(pill.time || "") &&
      pill.days?.length > 0
  );
}

async function performSynchronization(pills) {
  if (Platform.OS === "web") {
    return { permissionGranted: false, scheduledCount: 0, unsupported: true };
  }

  const existingRequests = await Notifications.getAllScheduledNotificationsAsync();
  const supplementRequests = existingRequests.filter(isSupplementReminder);

  await Promise.all(
    supplementRequests.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )
  );

  const supplements = getScheduledSupplements(pills);

  if (supplements.length === 0) {
    return { permissionGranted: true, scheduledCount: 0, unsupported: false };
  }

  const permissionGranted = await ensureNotificationPermission();

  if (!permissionGranted) {
    return { permissionGranted: false, scheduledCount: 0, unsupported: false };
  }

  const newIdentifiers = [];

  try {
    for (const supplement of supplements) {
      const [hour, minute] = supplement.time.split(":").map(Number);

      for (const day of supplement.days) {
        const weekday = WEEKDAY_NUMBERS[day];
        if (!weekday) continue;

        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Tijd voor je supplement",
            body: `Neem ${supplement.name} om ${supplement.time}.`,
            sound: "default",
            data: {
              kind: SUPPLEMENT_REMINDER_KIND,
              supplementId: supplement.id,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour,
            minute,
            channelId: SUPPLEMENT_CHANNEL_ID,
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

export function getSupplementScheduleKey(pills) {
  return JSON.stringify(
    getScheduledSupplements(pills)
      .map(({ id, name, time, days }) => ({
        id,
        name,
        time,
        days: [...days].sort(),
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  );
}

export function syncSupplementNotifications(pills) {
  const synchronize = () => performSynchronization(pills);
  synchronizationQueue = synchronizationQueue.then(synchronize, synchronize);
  return synchronizationQueue;
}
