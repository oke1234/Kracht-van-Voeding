import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";

import HomeScreen from "./pages/HomeScreen";
import AddScreen from "./pages/AddScreen";
import SettingsScreen from "./pages/SettingsScreen";
import {
  getReminderScheduleKey,
  initializeNotifications,
  syncScheduledItemNotifications,
} from "./services/notifications";

export default function App() {
  const [pills, setPills] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notificationWarning, setNotificationWarning] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("checking");
  const [screen, setScreen] = useState("home"); // 👈 switch

  useEffect(() => {
    let isCurrent = true;

    const installAvailableUpdate = async () => {
      if (__DEV__) {
        setUpdateStatus("ready");
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();

        if (!update.isAvailable) {
          if (isCurrent) setUpdateStatus("ready");
          return;
        }

        if (isCurrent) setUpdateStatus("installing");
        await Updates.fetchUpdateAsync();

        if (isCurrent) {
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.warn("Controleren op updates is mislukt.", error);
        if (isCurrent) setUpdateStatus("ready");
      }
    };

    installAvailableUpdate();

    return () => {
      isCurrent = false;
    };
  }, []);

  // LOAD
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem("PILLS");
        if (data) {
          const storedPills = JSON.parse(data);
          if (Array.isArray(storedPills)) setPills(storedPills);
        }
      } catch (error) {
        console.warn("Opgeslagen items konden niet worden geladen.", error);
      } finally {
        setIsHydrated(true);
      }
    };
    load();
  }, []);

  // SAVE
  useEffect(() => {
    if (!isHydrated) return;

    AsyncStorage.setItem("PILLS", JSON.stringify(pills)).catch((error) => {
      console.warn("Items konden niet worden opgeslagen.", error);
    });
  }, [isHydrated, pills]);

  const reminderScheduleKey = getReminderScheduleKey(pills);

  useEffect(() => {
    if (!isHydrated) return;

    let isCurrent = true;

    initializeNotifications()
      .then(() => syncScheduledItemNotifications(pills))
      .then(({ permissionGranted, unsupported }) => {
        if (!isCurrent) return;

        if (unsupported) {
          setNotificationWarning(null);
        } else if (!permissionGranted) {
          setNotificationWarning(
            "Meldingen staan uit. Schakel ze in via de instellingen van je telefoon om geplande herinneringen te ontvangen."
          );
        } else {
          setNotificationWarning(null);
        }
      })
      .catch((error) => {
        console.warn("Geplande herinneringen konden niet worden ingesteld.", error);
        if (isCurrent) {
          setNotificationWarning(
            "Geplande herinneringen konden niet worden ingesteld. Probeer de app opnieuw te openen."
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isHydrated, reminderScheduleKey]);

  if (updateStatus !== "ready") {
    return (
      <View style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        padding: 24,
      }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "600", textAlign: "center" }}>
          {updateStatus === "installing"
            ? "Nieuwe update installeren..."
            : "Controleren op updates..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1,  paddingTop: 40 }}>
      {notificationWarning && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#FFF3CD",
          }}
        >
          <Text style={{ color: "#664D03", fontSize: 13 }}>
            {notificationWarning}
          </Text>
        </View>
      )}

      {/* SCREENS */}
      {screen === "home" ? (
        <HomeScreen pills={pills} setPills={setPills} />
      ) : screen === "add" ? (
        <AddScreen
          pills={pills}
          setPills={setPills}
          setScreen={setScreen}
        />
      ) : (
        <SettingsScreen pills={pills} setPills={setPills} />
      )}

      {/* FLOATING BOTTOM NAV */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          alignSelf: "center",
          flexDirection: "row",
          backgroundColor: "white",
          paddingHorizontal: 25,
          paddingVertical: 15,
          borderRadius: 999,
          elevation: 8, // Android shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => setScreen("home")}
          style={{ marginHorizontal: 20 }}
        >
          <Ionicons
            name={screen === "home" ? "home" : "home-outline"}
            size={28}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen("add")}
          style={{ marginHorizontal: 20 }}
        >
          <Ionicons
            name={screen === "add" ? "add-circle" : "add-circle-outline"}
            size={28}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen("settings")}
          style={{ marginHorizontal: 20 }}
        >
          <Ionicons
            name={screen === "settings" ? "nutrition" : "nutrition-outline"}
            size={28}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
