import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { TextInput, Modal } from "react-native";

export default function HomeScreen({ pills, setPills }) {
    const [pinVisible, setPinVisible] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState(null);
    const [pin, setPin] = React.useState("");

    const correctPin = "1234";

  const toggleTaken = (id) => {
    setPills(
      pills.map((p) =>
        p.id === id ? { ...p, taken: !p.taken } : p
      )
    );
  };

  
  const deletePill = (id) => {
    setPills(pills.filter((p) => p.id !== id));
  };

  const confirmDelete = () => {
    if (pin === correctPin) {
        deletePill(selectedId);
        setPin("");
        setPinVisible(false);
    } else {
        alert("Wrong PIN");
    }
    };
  // Split pills into Today and Tomorrow
  const todayPills = pills.filter((p) => !p.everyOtherDay);
  const tomorrowPills = pills.filter((p) => p.everyOtherDay);

  // Progress for today's pills
  const completed = todayPills.filter((p) => p.taken).length;
  const total = todayPills.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const size = 70;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = total === 0 ? 0 : completed / total;
  const strokeDashoffset =
   circumference - circumference * progress;

    const renderItem = ({ item, canToggle = true }) => (
        <View
            style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "white",
            padding: 15,
            borderRadius: 16,
            marginBottom: 12,

            // shadow (iOS)
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },

            // shadow (Android)
            elevation: 3,

            opacity: canToggle ? 1 : 0.6,
            }}
        >
            {/* status dot */}
            <View
            style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: item.taken ? "#4CAF50" : "#D0D0D0",
                marginRight: 12,
            }}
            />

            {/* text */}
            <TouchableOpacity
            style={{ flex: 1 }}
            disabled={!canToggle}
            onPress={() => toggleTaken(item.id)}
            >
            <Text
                style={{
                fontSize: 16,
                fontWeight: "600",
                color: item.taken ? "#4CAF50" : "#111",
                }}
            >
                {item.time}  ·  {item.name}
            </Text>

            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {item.taken ? "Completed" : "Pending"}
            </Text>
            </TouchableOpacity>

            {/* delete */}
            <TouchableOpacity
            disabled={!canToggle}
            onPress={() => {
                setSelectedId(item.id);
                setPinVisible(true);
            }}
            >
            <Text
                style={{
                fontSize: 18,
                color: canToggle ? "#ff4d4d" : "#ccc",
                }}
            >
                ✕
            </Text>
            </TouchableOpacity>
        </View>
    );

  return (

    
    <View style={{ flex: 1, padding: 10, paddingTop: 15 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 25,
          paddingHorizontal: 10,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>
          My Pills
        </Text>

        {/* Completion Circle */}
        <View
            style={{
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
            }}
            >
            <Svg width={size} height={size}>
                {/* Grey background ring */}
                <Circle
                stroke="#D3D3D3"
                fill="none"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                />

                {/* Green progress ring */}
                <Circle
                stroke="#4CAF50"
                fill="none"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            <View
                style={{
                position: "absolute",
                justifyContent: "center",
                alignItems: "center",
                }}
            >
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {percent}%
                </Text>
            </View>
            </View>
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
            <>
            {/* Today */}
            <Text
                style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 10,
                }}
            >
                Today
            </Text>

            {todayPills.length > 0 ? (
                todayPills.map((item) => (
                <View key={item.id}>
                    {renderItem({ item })}
                </View>
                ))
            ) : (
                <Text style={{ color: "gray", marginBottom: 20 }}>
                No pills for today.
                </Text>
            )}

            {/* Tomorrow */}
            <Text
                style={{
                fontSize: 20,
                fontWeight: "bold",
                marginTop: 15,
                marginBottom: 10,
                }}
            >
                Tomorrow
            </Text>

            {tomorrowPills.length > 0 ? (
                tomorrowPills.map((item) => (
                <View key={item.id}>
                    {renderItem({ item, canToggle: false })}
                </View>
                ))
            ) : (
                <Text style={{ color: "gray", paddingHorizontal: 10 }}>
                No pills for tomorrow.
                </Text>
            )}
            </>
        }
        keyExtractor={() => "dummy"}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 10 }}
        />

        <Modal visible={pinVisible} transparent animationType="fade">
        <View
            style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            }}
        >
            <View
            style={{
                width: "85%",
                backgroundColor: "white",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 8,
            }}
            >
            {/* Title */}
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 5 }}>
                Confirm Delete
            </Text>

            <Text style={{ fontSize: 13, color: "#666", marginBottom: 15 }}>
                Enter your PIN to remove this item
            </Text>

            {/* Input */}
            <TextInput
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                placeholder="••••"
                placeholderTextColor="#aaa"
                style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                marginBottom: 20,
                textAlign: "center",
                letterSpacing: 6,
                }}
            />

            {/* Buttons */}
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <TouchableOpacity
                onPress={() => {
                    setPinVisible(false);
                    setPin("");
                }}
                style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#eee",
                    marginRight: 8,
                    alignItems: "center",
                }}
                >
                <Text style={{ fontWeight: "600", color: "#333" }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                onPress={confirmDelete}
                style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#ff4d4d",
                    marginLeft: 8,
                    alignItems: "center",
                }}
                >
                <Text style={{ fontWeight: "600", color: "white" }}>
                    Delete
                </Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
        </Modal>
    </View>
  );
}