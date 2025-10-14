
// LearningLibraryScreen.tsx
import React, { useEffect } from "react";
import { View, TouchableOpacity, Image, StyleSheet, ScrollView, Dimensions, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";

const screenWidth = Dimensions.get("window").width;

const categories = [
  { id: "reading", image: require("../../assets/Reading.png"), screen: "ReadingScreen" },
  { id: "social", image: require("../../assets/SocialSkills.png"), screen: "SocialScreen" },
  { id: "spelling", image: require("../../assets/Spelling.png"), screen: "SpellingScreen" },
  { id: "writing", image: require("../../assets/Writing.png"), screen: "WritingScreen" },
];

export default function LearningLibraryScreen() {
  const navigation = useNavigation();

  // Lock to landscape on mount, back to portrait on unmount
  useEffect(() => {
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockLandscape();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/LearningBg4.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.row}>
        {/* Teacher image on the left */}
        <Image
          source={require("../../assets/Teacher.png")}
          style={styles.teacher}
          resizeMode="contain"
        />

        {/* Categories scrollable on the right */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.card}
              onPress={() => navigation.navigate(cat.screen as never)}
            >
              <Image source={cat.image} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  teacher: {
    width: screenWidth * 0.8,   // bigger than cards
    height: screenWidth * 0.8,
    marginRight: 20,
    resizeMode: "contain",
  },
  scrollContent: {
    paddingRight: 20,
    alignItems: "center",
  },
  card: {
    width: screenWidth * 0.45,
    height: screenWidth * 0.45,
    marginRight: 25,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
