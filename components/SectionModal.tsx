import React, { useState, useMemo } from "react";
import { View, Modal, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { Section } from "@/types/Section";
import { TimePeriod } from "@/types/Tracker";
import { useSectionStore } from "@/storage/store";
import { useTheme } from "../app/Contexts/ThemeContext";

export default function SectionModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { currentTheme } = useTheme();
  const [title, setTitle] = useState("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Daily");
  const addSectionH = useSectionStore((s) => s.addSectionH);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: currentTheme["rgba(0, 0, 0, 0.8)"],
        },
        card: {
          width: 280,
          padding: 20,
          borderRadius: 10,
          backgroundColor: currentTheme.black,
          borderWidth: 1,
          borderColor: currentTheme.dimgray,
        },
        heading: {
          color: currentTheme.white,
          fontWeight: "700",
          marginBottom: 8,
        },
        input: {
          backgroundColor: currentTheme.white,
          color: currentTheme["101010"],
          marginBottom: 12,
          padding: 6,
          borderRadius: 4,
        },
        periodButton: {
          backgroundColor: currentTheme.black,
          borderColor: currentTheme.dimgray,
          borderWidth: 1,
          padding: 6,
          borderRadius: 4,
          marginBottom: 12,
        },
        periodText: {
          color: currentTheme.white,
          textAlign: "center",
        },
        createBtn: {
          backgroundColor: currentTheme.lightgreen,
          padding: 8,
          borderRadius: 4,
        },
        createTxt: {
          color: currentTheme.white,
          textAlign: "center",
        },
        cancel: {
          marginTop: 10,
        },
        cancelTxt: {
          color: currentTheme.gray,
          textAlign: "center",
        },
      }),
    [currentTheme]
  );

  const handleCreate = async () => {
    if (title.trim().length < 3) {
      console.log("Title too short");
      return;
    }
  
    try {
      console.log("Creating section with timePeriod =", timePeriod);
  
      // Get existing sections in this time period
      const existingSections = useSectionStore.getState().sectionsH.filter(
        (s) => s.timePeriod === timePeriod
      );
  
      // Find next available position
      const maxPosition = existingSections.length > 0
        ? Math.max(...existingSections.map(s => s.position))
        : -1;
      const newPosition = maxPosition + 1;
  
      const newSection = new Section(
        title.trim(),
        timePeriod,
        newPosition, // assign calculated position
        [],
        0,
        Date.now()
      );
  
      await addSectionH(newSection); // store + SQLite will now save this
  
      console.log("Created successfully!");
      setTitle("");
      onClose();
    } catch (err) {
      console.error("Section creation failed:", err);
    }
  };
  

  const cyclePeriod = () => {
    setTimePeriod(
      timePeriod === "Daily"
        ? "Weekly"
        : timePeriod === "Weekly"
        ? "Monthly"
        : "Daily"
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.heading}>Add Section</Text>

          <TextInput
            placeholder="Title"
            placeholderTextColor={currentTheme.gray}
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          <Pressable style={styles.periodButton} onPress={cyclePeriod}>
            <Text style={styles.periodText}>{timePeriod}</Text>
          </Pressable>

          <Pressable style={styles.createBtn} onPress={handleCreate}>
            <Text style={styles.createTxt}>Create</Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
