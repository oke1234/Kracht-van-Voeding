import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function AddScreen({ pills, setPills, setScreen }) {
  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");

  const [isScheduled, setIsScheduled] = useState(true);

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [days, setDays] = useState([]);

  const [todoType, setTodoType] = useState("none");

  const [weekNumber, setWeekNumber] = useState("");
  const [monthNumber, setMonthNumber] = useState("");
  const [dateValue, setDateValue] = useState("");

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const toggleDay = (day) => {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const addItem = () => {
    if (!name.trim() || !category) return;

    let newItem = {
      id: Date.now().toString(),
      name,
      category,
      completedDates: [],
    };

    if (isScheduled) {
      newItem = {
        ...newItem,
        type: "scheduled",
        time: `${hour}:${minute}`,
        days,
      };
    } else {
      newItem = {
        ...newItem,
        type: "todo",
        todoType,
        weekNumber: todoType === "week" ? weekNumber : null,
        monthNumber: todoType === "month" ? monthNumber : null,
        dueDate: todoType === "date" ? dateValue : null,
      };
    }

    setPills([...pills, newItem]);
    setScreen("home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>

      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        Nieuw item
      </Text>

      {/* CATEGORY ROW */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {["voeding", "supplement", "overig"].map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={{
              flex: 1,
              marginHorizontal: 4,
              padding: 12,
              backgroundColor: category === c ? "#4CAF50" : "#eee",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "600" }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* NAME */}
      <Text style={{ marginTop: 20, marginBottom: 6, color: "#666", fontWeight: "600" }}>Naam</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Bijv. Vitamine D"
        placeholderTextColor="#aaa"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 12,
          marginBottom: 20,
          backgroundColor: "#FAFAFA",
        }}
      />

      {/* SWITCH */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <Text style={{ marginRight: 10 }}>Schema</Text>
        <Switch value={isScheduled} onValueChange={setIsScheduled} />
      </View>

      {/* SCHEDULED */}
      {isScheduled && (
        <View>
          <Text style={{ marginBottom: 6, color: "#666", fontWeight: "600" }}>Tijd</Text>

          <View style={{
            flexDirection: "row",
            marginBottom: 18,
            backgroundColor: "#FAFAFA",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 6,
          }}>
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

          <Text style={{ marginBottom: 8, color: "#666", fontWeight: "600" }}>Dagen</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
            {weekDays.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDay(d)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  margin: 4,
                  backgroundColor: days.includes(d) ? "#4CAF50" : "#EAEAEA",
                }}
              >
                <Text style={{ color: days.includes(d) ? "white" : "#333", fontWeight: "600" }}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* TODO */}
      {!isScheduled && (
        <View>
          <Text style={{ marginBottom: 8, color: "#666", fontWeight: "600" }}>Planning</Text>

          {["none", "week", "month", "date"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTodoType(t)}
              style={{
                padding: 12,
                marginBottom: 8,
                backgroundColor: todoType === t ? "#4CAF50" : "#eee",
                borderRadius: 10,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}

          {todoType === "week" && (
            <TextInput
              value={weekNumber}
              onChangeText={setWeekNumber}
              placeholder="Welke week? (bv 12)"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10, marginTop: 10, backgroundColor: "#FAFAFA" }}
            />
          )}

          {todoType === "month" && (
            <TextInput
              value={monthNumber}
              onChangeText={setMonthNumber}
              placeholder="Welke maand? (1-12)"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10, marginTop: 10, backgroundColor: "#FAFAFA" }}
            />
          )}

          {todoType === "date" && (
            <TextInput
              value={dateValue}
              onChangeText={setDateValue}
              placeholder="Datum (bv 2026-06-23)"
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10, marginTop: 10, backgroundColor: "#FAFAFA" }}
            />
          )}
        </View>
      )}

      {/* SAVE */}
      <TouchableOpacity
        onPress={addItem}
        style={{
          marginTop: 30,
          backgroundColor: "#111",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          Opslaan
        </Text>
      </TouchableOpacity>
    </View>
  );
}