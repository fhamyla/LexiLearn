import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  PanResponder,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Canvas, Path, Skia, Circle } from "@shopify/react-native-skia";

/* -------------------------
   Keep your 60 level images
   ------------------------- */
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

// Template paths are designed in a 500x500-ish box (so we can center & scale)
const letterPaths: { [key: string]: string } = {
  A: "M100,400 L250,80 L400,400 M175,250 L325,250",
  B: "M120,100 L120,400 M120,100 Q300,160 120,220 M120,220 Q300,280 120,340",
  C: "M370,140 Q200,80 140,250 Q200,420 370,360",
  "1": "M250,80 L250,420",
  "2": "M120,200 Q300,80 360,160 Q420,240 140,420 L420,420",
  // add more as needed...
};

export default function WritingScreen() {
  // --- UI / state
  const [screen] = useState(Dimensions.get("window"));
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [accuracy, setAccuracy] = useState(0);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("green");

  // pen color + visible marker state
  const [penColor, setPenColor] = useState("#FF69B4");
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);

  // --- Skia refs and drawing state
  const pathRef = useRef(Skia.Path.Make());
  const targetPathRef = useRef<any>(null); // original template path (untransformed)
  const transformedTargetRef = useRef<any>(null); // path translated/scaled to canvas
  const tracedPoints = useRef(0);
  const [totalPoints, setTotalPoints] = useState(300); // default guard
  const lastVibration = useRef(0);
  const [, update] = useState({});

  // canvas layout (position + size) so we can convert page coords -> canvas coords
  const canvasLayoutRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // message animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // On mount: lock orientation and load progress
  useEffect(() => {
    (async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      const stored = await AsyncStorage.getItem("writingUnlockedLevel");
      if (stored) setUnlockedLevel(Number(stored));
    })();
  }, []);

  // When selectedLevel or canvas layout changes, create and center the template path
 // When selectedLevel or canvas layout changes, create and center the template path
useEffect(() => {
  if (!selectedLevel || !canvasLayoutRef.current.width) return;

  const letter =
    selectedLevel <= 26 ? String.fromCharCode(64 + selectedLevel) : String(selectedLevel - 26);
  const svg = letterPaths[letter] || "M120,120 L380,380";

  const basePath = Skia.Path.MakeFromSVGString(svg);
  if (!basePath) {
    console.warn("⚠️ Invalid SVG path for:", letter);
    return;
  }

  targetPathRef.current = basePath;

  // Compute bounds safely
  const bounds = basePath.computeTightBounds
    ? basePath.computeTightBounds()
    : { x: 0, y: 0, width: 500, height: 500 };

  const { width: canvasW, height: canvasH } = canvasLayoutRef.current;

  // Make the traced letter centered and scale it to fit the canvas
  const targetSize = Math.min(canvasW, canvasH) * 0.7;
  const scale = targetSize / Math.max(bounds.width || 1, bounds.height || 1);

  // Center position
  const tx = (canvasW - bounds.width * scale) / 2 - bounds.x * scale;
  const ty = (canvasH - bounds.height * scale) / 2 - bounds.y * scale;

  transformedTargetRef.current = { path: basePath, scale, tx, ty };

  // Handle total path points safely
  try {
    const count = basePath.countPoints ? basePath.countPoints() : 300;
    setTotalPoints(count);
  } catch {
    setTotalPoints(300);
  }

  tracedPoints.current = 0;
  setAccuracy(0);
  pathRef.current = Skia.Path.Make();
  setMarkerPos(null);
  update({});
}, [selectedLevel, canvasLayoutRef.current.width, canvasLayoutRef.current.height]);

  const showMessage = (text: string, color: string) => {
    setMessage(text);
    setMessageColor(color);
    fadeAnim.setValue(1);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1800,
      delay: 1200,
      useNativeDriver: true,
    }).start();
  };

  const saveProgress = async (level: number) => {
    try {
      await AsyncStorage.setItem("writingUnlockedLevel", level.toString());
    } catch (e) {
      // ignore
    }
  };

  // convert canvas-local coords to coords used to compare against transformed target path
  // because we used scale & tx/ty when drawing the template, we must invert those to compare properly.
  const canvasToTemplateCoords = (cx: number, cy: number) => {
    const info = transformedTargetRef.current;
    if (!info) return { x: cx, y: cy };
    const { scale, tx, ty } = info;
    const txInv = (cx - tx) / scale;
    const tyInv = (cy - ty) / scale;
    return { x: txInv, y: tyInv };
  };

  const checkTracingAccuracy = (canvasX: number, canvasY: number) => {
    const info = transformedTargetRef.current;
    if (!info || !targetPathRef.current) return;

    // map canvas coords back to base path coords
    const { x: tx, y: ty } = canvasToTemplateCoords(canvasX, canvasY);

    const tolerance = 30 / (info.scale || 1); // scale tolerance by scale so it's consistent
    let matched = false;

    try {
      const target = targetPathRef.current;
      const count = target.countPoints ? target.countPoints() : totalPoints;
      for (let i = 0; i < count; i++) {
        const p = target.getPoint(i);
        const dist = Math.hypot(p.x - tx, p.y - ty);
        if (dist < tolerance) {
          matched = true;
          tracedPoints.current++;
          break;
        }
      }
    } catch {
      // if point APIs not available, fallback: increment tracedPoints occasionally
      tracedPoints.current += 1;
      matched = true;
    }

    const acc = Math.min((tracedPoints.current / Math.max(totalPoints, 1)) * 100, 100);
    setAccuracy(acc);

    if (matched) {
      const now = Date.now();
      if (now - lastVibration.current > 120) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastVibration.current = now;
      }
    }
  };

  const handleRelease = async () => {
    if (accuracy >= 85 && selectedLevel) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showMessage("🎉 Great Job! Level Complete!", "green");

      const next = selectedLevel + 1;
      if (next > unlockedLevel) {
        setUnlockedLevel(next);
        await saveProgress(next);
      }

      setTimeout(() => {
        setSelectedLevel(null);
        pathRef.current = Skia.Path.Make();
        tracedPoints.current = 0;
        setAccuracy(0);
        setMarkerPos(null);
      }, 1600);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showMessage("😅 Try Again!", "red");

      setTimeout(() => {
        pathRef.current = Skia.Path.Make();
        tracedPoints.current = 0;
        setAccuracy(0);
        setMarkerPos(null);
        update({});
      }, 800);
    }
  };

  const handleBack = () => {
    setSelectedLevel(null);
    pathRef.current = Skia.Path.Make();
    tracedPoints.current = 0;
    setAccuracy(0);
    setMarkerPos(null);
  };

  // Convert global page coords -> canvas-local coords
  const pageToCanvas = (pageX: number, pageY: number) => {
    const off = canvasLayoutRef.current;
    return { x: pageX - off.x, y: pageY - off.y };
  };

  // pan responder uses pageX/pageY (more reliable when container is nested)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const { x, y } = pageToCanvas(pageX, pageY);
        pathRef.current.moveTo(x, y);
        setMarkerPos({ x, y });
        checkTracingAccuracy(x, y);
        update({});
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const { x, y } = pageToCanvas(pageX, pageY);
        pathRef.current.lineTo(x, y);
        setMarkerPos({ x, y });
        checkTracingAccuracy(x, y);
        update({});
      },
      onPanResponderRelease: handleRelease,
      onPanResponderTerminate: handleRelease,
    })
  ).current;

  // When canvas layout changes, store it (onLayout callback)
  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    // e.nativeEvent.layout x,y are relative to the parent; get absolute page offset by measuring? This is usually fine for simple layouts.
    // If you find offsets are wrong on some devices, measure with ref.measureInWindow and store absolute coordinates.
    canvasLayoutRef.current = { x, y, width, height };
    // trigger recalc of transformed target
    update({});
  };

  // ---- RENDER ----
  // Tracing view
  if (selectedLevel) {
    const letter =
      selectedLevel <= 26 ? String.fromCharCode(64 + selectedLevel) : String(selectedLevel - 26);
    const info = transformedTargetRef.current;

    return (
      <View style={[styles.page, { backgroundColor: "#FFF8DC" }]}>
        <Text style={styles.tracingTitle}>Trace “{letter}”</Text>

        <Text style={styles.accuracyText}>Accuracy: {accuracy.toFixed(0)}%</Text>

        {/* Color picker (always visible on tracing screen) */}
        <View style={styles.colorPicker}>
          {[
            { color: "#000000", label: "Black" },
            { color: "#FF69B4", label: "Pink" },
            { color: "#2196F3", label: "Blue" },
            { color: "#4CAF50", label: "Green" },
          ].map((c) => (
            <TouchableOpacity
              key={c.color}
              onPress={() => setPenColor(c.color)}
              style={[
                styles.colorButton,
                {
                  backgroundColor: c.color,
                  borderWidth: penColor === c.color ? 3 : 1,
                  borderColor: penColor === c.color ? "#FFD700" : "#333",
                },
              ]}
            />
          ))}
        </View>

        <View
          style={styles.canvasContainer}
          onLayout={onCanvasLayout}
          {...panResponder.panHandlers}
        >
          {/* Canvas covers whole container; template is drawn transformed */}
          <Canvas style={styles.canvas}>
            {info ? (
              // draw transformed template using Canvas transform: translate + scale
              <>
                <Path
                  path={info.path}
                  color="#DDD"
                  style="stroke"
                  strokeWidth={15 / (info.scale || 1)}
                  transform={[
                    { scaleX: info.scale, scaleY: info.scale },
                    { translateX: info.tx, translateY: info.ty },
                  ]}
                />
                <Path
                  path={pathRef.current}
                  color={penColor}
                  style="stroke"
                  strokeWidth={10}
                  strokeJoin="round"
                  strokeCap="round"
                />
                {markerPos && (
                  <Circle cx={markerPos.x} cy={markerPos.y} r={12} color={penColor} />
                )}
              </>
            ) : (
              // before layout or info ready, just draw user path and marker
              <>
                <Path path={pathRef.current} color={penColor} style="stroke" strokeWidth={10} />
                {markerPos && <Circle cx={markerPos.x} cy={markerPos.y} r={12} color={penColor} />}
              </>
            )}
          </Canvas>

          {/* Center letter overlay (helpful visual) */}
          <Text style={styles.centerLetter}>{letter}</Text>
        </View>

        {/* feedback message */}
        <Animated.Text
          style={[
            styles.feedback,
            { color: messageColor, opacity: fadeAnim },
          ]}
        >
          {message}
        </Animated.Text>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Level selection view (keeps your four difficulty groups)
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

          <View style={[styles.gridContainer, { marginTop: 80 }]}>
            {Array.from({ length: item.end - item.start + 1 }, (_, i) => {
              const level = item.start + i;
              const image = levelImages[level];
              const locked = level > unlockedLevel;
              return (
                <TouchableOpacity
                  key={level}
                  disabled={locked}
                  style={[
                    styles.levelButton,
                    { width: screen.width * 0.1, height: screen.width * 0.1 },
                    locked && { opacity: 0.3 },
                  ]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Image source={image} style={styles.levelImage} resizeMode="cover" />
                  {locked && <Text style={styles.lockedText}>🔒</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    />
  );
}

/* -------------------------
   Styles
   ------------------------- */
const styles = StyleSheet.create({
  page: { justifyContent: "center", alignItems: "center", flex: 1 },
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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  levelImage: { width: "100%", height: "100%" },
  lockedText: { position: "absolute", fontSize: 24, color: "#555" },
  tracingTitle: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FF69B4",
    marginBottom: 10,
    fontFamily: "Comic Sans MS",
  },
  canvasContainer: {
    width: Dimensions.get("window").width * 0.9,
    height: Dimensions.get("window").height * 0.7,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 5,
    borderColor: "#FFD1DC",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  canvas: { width: "100%", height: "100%", position: "absolute" },
  accuracyText: { fontSize: 24, marginTop: 8, color: "#444" },
  centerLetter: {
    position: "absolute",
    fontSize: 220,
    color: "#F0F0F0",
    fontWeight: "700",
    textAlign: "center",
  },
  feedback: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    fontSize: 32,
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#FF69B4",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  backText: { color: "#fff", fontWeight: "bold", fontSize: 24 },

  /* color picker */
  colorPicker: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
  },
});
