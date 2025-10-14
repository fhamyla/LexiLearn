import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  Button,
  Alert,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Speech from "expo-speech";
import Voice from "@react-native-voice/voice";
import stringSimilarity from "string-similarity";

// 🧩 Level Images
const levelImages: { [key: number]: any } = {
  1: require("../../assets/levels/1.png"),
  2: require("../../assets/levels/2.png"),
  3: require("../../assets/levels/3.png"),
  4: require("../../assets/levels/4.png"),
  5: require("../../assets/levels/5.png"),
  6: require("../../assets/levels/6.png"),
  7: require("../../assets/levels/7.png"),
  8: require("../../assets/levels/8.png"),
  9: require("../../assets/levels/9.png"),
  10: require("../../assets/levels/10.png"),
  11: require("../../assets/levels/11.png"),
  12: require("../../assets/levels/12.png"),
  13: require("../../assets/levels/13.png"),
  14: require("../../assets/levels/14.png"),
  15: require("../../assets/levels/15.png"),
  16: require("../../assets/levels/16.png"),
  17: require("../../assets/levels/17.png"),
  18: require("../../assets/levels/18.png"),
  19: require("../../assets/levels/19.png"),
  20: require("../../assets/levels/20.png"),
  21: require("../../assets/levels/21.png"),
  22: require("../../assets/levels/22.png"),
  23: require("../../assets/levels/23.png"),
  24: require("../../assets/levels/24.png"),
  25: require("../../assets/levels/25.png"),
  26: require("../../assets/levels/26.png"),
  27: require("../../assets/levels/27.png"),
  28: require("../../assets/levels/28.png"),
  29: require("../../assets/levels/29.png"),
  30: require("../../assets/levels/30.png"),
  31: require("../../assets/levels/31.png"),
  32: require("../../assets/levels/32.png"),
  33: require("../../assets/levels/33.png"),
  34: require("../../assets/levels/34.png"),
  35: require("../../assets/levels/35.png"),
  36: require("../../assets/levels/36.png"),
  37: require("../../assets/levels/37.png"),
  38: require("../../assets/levels/38.png"),
  39: require("../../assets/levels/39.png"),
  40: require("../../assets/levels/40.png"),
  41: require("../../assets/levels/41.png"),
  42: require("../../assets/levels/42.png"),
  43: require("../../assets/levels/43.png"),
  44: require("../../assets/levels/44.png"),
  45: require("../../assets/levels/45.png"),
  46: require("../../assets/levels/46.png"),
  47: require("../../assets/levels/47.png"),
  48: require("../../assets/levels/48.png"),
  49: require("../../assets/levels/49.png"),
  50: require("../../assets/levels/50.png"),
  51: require("../../assets/levels/51.png"),
  52: require("../../assets/levels/52.png"),
  53: require("../../assets/levels/53.png"),
  54: require("../../assets/levels/54.png"),
  55: require("../../assets/levels/55.png"),
  56: require("../../assets/levels/56.png"),
  57: require("../../assets/levels/57.png"),
  58: require("../../assets/levels/58.png"),
  59: require("../../assets/levels/59.png"),
  60: require("../../assets/levels/60.png"),
};

const levelGroups = [
  { label: "Profound", start: 1, end: 15, color: "#FFD6D6" },
  { label: "Severe", start: 16, end: 30, color: "#FFF4C1" },
  { label: "Moderate", start: 31, end: 45, color: "#C8E6C9" },
  { label: "Mild", start: 46, end: 60, color: "#BBDEFB" },
];

// 🧠 Difficulty-based word progression
const wordsByDifficulty = [
  "a", "b", "cat", "dog", "sun", "apple", "banana", "chair", "happy", "school",
  "dolphin", "mountain", "rainbow", "puzzle", "elephant", "computer", "beautiful",
  "adventure", "astronaut", "electricity", "information", "microscope", "helicopter",
  "chocolate", "universe", "revolution", "responsibility", "photography", "encyclopedia",
  "imagination", "sustainability", "environment", "architecture", "mathematics", "astronomy",
  "technology", "celebration", "education", "transportation", "conversation", "biological",
  "presentation", "communication", "organization", "psychology", "conservation", "determination",
  "classification", "illustration", "civilization", "announcement", "representation", "identification",
  "investigation", "international", "responsibility", "congratulation", "differentiation", "interpretation",
  "unbelievable", "extraordinary"
];

const levelTasks: { [key: number]: string } = {};
for (let i = 0; i < 60; i++) {
  levelTasks[i + 1] = wordsByDifficulty[i] || `word${i + 1}`;
}

export default function ReadingScreen() {
  const [screen, setScreen] = useState(Dimensions.get("window"));
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showTask, setShowTask] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [phonemeMatch, setPhonemeMatch] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  // 🎙️ Initialize Voice recognition safely
  useEffect(() => {
    const init = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        console.log("Orientation lock failed:", e);
      }
    };
    init();

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreen(window);
    });

    Voice.onSpeechStart = () => console.log("Speech started");
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (event: any) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0];
        setRecognizedText(text);
        calculateAccuracy(text);
      }
    };
    Voice.onSpeechError = (err: any) => {
      console.error("Speech error:", err);
      setIsListening(false);
    };

    return () => {
      subscription?.remove();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speakTarget = () => {
    if (!selectedLevel) return;
    const text = levelTasks[selectedLevel];
    Speech.speak(text, { rate: 0.9, pitch: 1.1 });
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setRecognizedText("");
      setAccuracy(null);
      setPhonemeMatch(null);
      await Voice.start("en-US");
    } catch (e) {
      console.error("Error starting Voice:", e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error("Error stopping Voice:", e);
    }
  };

  // 🧮 Accuracy + Phoneme scoring
  const calculateAccuracy = (spoken: string) => {
    if (!selectedLevel) return;

    const target = levelTasks[selectedLevel].toLowerCase();
    const spokenText = spoken.toLowerCase();

    const textSim = stringSimilarity.compareTwoStrings(spokenText, target);
    const textPercent = Math.round(textSim * 100);

    const simplifyPhoneme = (word: string) =>
      word
        .toLowerCase()
        .replace(/ph/g, "f")
        .replace(/gh/g, "g")
        .replace(/kn/g, "n")
        .replace(/wr/g, "r")
        .replace(/wh/g, "w")
        .replace(/ck/g, "k")
        .replace(/qu/g, "kw")
        .replace(/th/g, "t")
        .replace(/ch/g, "k")
        .replace(/[aeiou]/g, "a")
        .replace(/[^a-z]/g, "");

    const targetPhoneme = simplifyPhoneme(target);
    const spokenPhoneme = simplifyPhoneme(spokenText);

    const phonemeSim = stringSimilarity.compareTwoStrings(spokenPhoneme, targetPhoneme);
    const phonemePercent = Math.round(phonemeSim * 100);
    const finalAccuracy = Math.round(textPercent * 0.7 + phonemePercent * 0.3);

    setAccuracy(finalAccuracy);
    setPhonemeMatch(phonemePercent);

    if (finalAccuracy >= 80 && phonemePercent >= 80 && !completedLevels.includes(selectedLevel)) {
      setCompletedLevels((prev) => [...prev, selectedLevel]);
      Speech.speak("Excellent job! You may proceed to the next level.");
    } else if (finalAccuracy < 80 || phonemePercent < 80) {
      Speech.speak(`Try again. The correct word is ${target}.`);
    }
  };

  const handleLevelPress = (level: number) => {
    if (level === 1 || completedLevels.includes(level - 1)) {
      setSelectedLevel(level);
      setShowTask(true);
      setRecognizedText("");
      setAccuracy(null);
      setPhonemeMatch(null);
    } else {
      Alert.alert("Locked", "Please finish the previous level first!");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={levelGroups}
        horizontal
        pagingEnabled
        snapToInterval={screen.width}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <View
            style={[
              styles.page,
              { backgroundColor: item.color, width: screen.width, height: screen.height },
            ]}
          >
            <Text style={styles.header}>{item.label} Difficulty</Text>

            <View style={[styles.gridContainer, { marginTop: 80 }]}>
              {Array.from({ length: item.end - item.start + 1 }, (_, i) => {
                const level = item.start + i;
                const image = levelImages[level];
                const unlocked = level === 1 || completedLevels.includes(level - 1);

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      { width: screen.width * 0.1, height: screen.width * 0.1 },
                      !unlocked && { opacity: 0.5 },
                    ]}
                    onPress={() => handleLevelPress(level)}
                    disabled={!unlocked}
                  >
                    <Image source={image} style={styles.levelImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      />

      {/* 🎯 Task Modal */}
      <Modal visible={showTask} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Level {selectedLevel}</Text>
            <Text style={styles.modalTask}>Say this word:</Text>
            <Text style={styles.targetWord}>
              {selectedLevel ? levelTasks[selectedLevel] : ""}
            </Text>

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <Button title="🔊 Hear It" onPress={speakTarget} />
              <View style={{ width: 15 }} />
              <Button
                title={isListening ? "🛑 Stop" : "🎤 Speak"}
                onPress={isListening ? stopListening : startListening}
              />
            </View>

            {recognizedText ? (
              <>
                <Text style={{ marginTop: 15, fontSize: 18 }}>
                  You said: <Text style={{ fontWeight: "bold" }}>{recognizedText}</Text>
                </Text>
                {accuracy !== null && (
                  <Text
                    style={{
                      fontSize: 18,
                      color: accuracy >= 80 ? "green" : "red",
                      marginTop: 10,
                    }}
                  >
                    Text Accuracy: {accuracy}%
                  </Text>
                )}
                {phonemeMatch !== null && (
                  <Text
                    style={{
                      fontSize: 18,
                      color: phonemeMatch >= 80 ? "green" : "red",
                      marginTop: 5,
                    }}
                  >
                    Phoneme Accuracy: {phonemeMatch}%
                  </Text>
                )}
              </>
            ) : null}

            {accuracy !== null && accuracy >= 80 && phonemeMatch !== null && phonemeMatch >= 80 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 20, color: "green" }}>✅ Well done!</Text>
                <Button
                  title="Next Level"
                  onPress={() => {
                    setShowTask(false);
                    setSelectedLevel(null);
                  }}
                />
              </View>
            )}

            <View style={{ marginTop: 20 }}>
              <Button title="Close" color="gray" onPress={() => setShowTask(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    position: "absolute",
    top: 30,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    height: "80%",
  },
  levelButton: { margin: 10, borderRadius: 20, overflow: "hidden" },
  levelImage: { width: "100%", height: "100%" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  modalTask: { fontSize: 20 },
  targetWord: { fontSize: 30, fontWeight: "bold", color: "#007AFF", marginTop: 10 },
});
