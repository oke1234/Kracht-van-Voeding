import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function AddScreen({ pills, setPills, setScreen }) {
  const [name, setName] = useState("");
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [everyOtherDay, setEveryOtherDay] = useState(false);

  const addPill = () => {
    const time = `${hour}:${minute}`;
    if (!name.trim()) return;

    const newPill = {
      id: Date.now().toString(),
      name,
      time,
      everyOtherDay,
      taken: false,
      startDate: new Date().toISOString(),
    };

    setPills([...pills, newPill]);
    setScreen("home");
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#ffffff" }}>
      
      {/* TITLE */}
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, paddingTop: 15 }}>
        Add Pill
      </Text>

      {/* CARD */}
      <View
        style={{
          backgroundColor: "white",
          padding: 16,
          borderRadius: 18,

          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {/* NAME */}
        <Text style={{ marginBottom: 6, color: "#555" }}>Name</Text>
        <TextInput
          placeholder="e.g. Vitamin D"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: "#E5E5E5",
            borderRadius: 12,
            padding: 12,
            marginBottom: 15,
          }}
        />

        {/* TIME */}
        <Text style={{ marginBottom: 6, color: "#555" }}>Time</Text>

        <View style={{ flexDirection: "row", marginBottom: 15 }}>
          <View style={{ flex: 1 }}>
            <Picker selectedValue={hour} onValueChange={setHour}>
              {Array.from({ length: 24 }, (_, i) => {
                const v = i.toString().padStart(2, "0");
                return <Picker.Item key={v} label={v} value={v} />;
              })}
            </Picker>
          </View>

          <View style={{ flex: 1 }}>
            <Picker selectedValue={minute} onValueChange={setMinute}>
              {Array.from({ length: 60 }, (_, i) => {
                const v = i.toString().padStart(2, "0");
                return <Picker.Item key={v} label={v} value={v} />;
              })}
            </Picker>
          </View>
        </View>

        {/* TOGGLE */}
        <TouchableOpacity
          onPress={() => setEveryOtherDay(!everyOtherDay)}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: everyOtherDay ? "#4CAF50" : "#EAEAEA",
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: everyOtherDay ? "white" : "#333",
              fontWeight: "600",
            }}
          >
            Every other day: {everyOtherDay ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          onPress={addPill}
          style={{
            backgroundColor: "#111",
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Save Pill
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}