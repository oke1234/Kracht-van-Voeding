import React from "react";
import { View, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, padding: 20, }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 15 }}>
        Settings
      </Text>
    </View>
  );
}