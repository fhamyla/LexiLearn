import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

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

export default function WritingScreen() {
  const [screen, setScreen] = useState(Dimensions.get("window"));

  useEffect(() => {
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockLandscape();

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreen(window);
    });

    return () => subscription?.remove();
  }, []);

  return (
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

          {/* Push grid a bit lower */}
          <View style={[styles.gridContainer, { marginTop: 80 }]}>
            {Array.from({ length: item.end - item.start + 1 }, (_, i) => {
              const level = item.start + i;
              const image = levelImages[level];
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    { width: screen.width * 0.10, height: screen.width * 0.10 },
                  ]}
                >
                  <Image source={image} style={styles.levelImage} resizeMode="cover" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  levelButton: {
    margin: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  levelImage: {
    width: "100%",
    height: "100%",
  },
});
