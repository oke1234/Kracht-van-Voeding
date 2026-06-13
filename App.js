import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./pages/HomeScreen";
import AddScreen from "./pages/AddScreen";
import SettingsScreen from "./pages/SettingsScreen";

export default function App() {
  const [pills, setPills] = useState([]);
  const [screen, setScreen] = useState("home"); // 👈 switch

  // LOAD
  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem("PILLS");
      if (data) setPills(JSON.parse(data));
    };
    load();
  }, []);

  // SAVE
  useEffect(() => {
    AsyncStorage.setItem("PILLS", JSON.stringify(pills));
  }, [pills]);

  return (
    <View style={{ flex: 1,  paddingTop: 40 }}>
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
        <SettingsScreen />
      )}

      {/* FLOATING BOTTOM NAV */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          alignSelf: "center",
          flexDirection: "row",
          backgroundColor: "white",
          paddingHorizontal: 30,
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
            name={screen === "settings" ? "settings" : "settings-outline"}
            size={28}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}