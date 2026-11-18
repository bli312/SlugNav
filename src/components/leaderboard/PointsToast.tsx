import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export interface PointsToastData {
  points: number;
  message: string;
}

export interface PointsToastContextType {
  showPointsToast: (points: number, message: string) => void;
  hidePointsToast: () => void;
  toast: PointsToastData | null;
  registerModal: () => () => void;
  hasActiveModal: boolean;
}

export const PointsToastContext = createContext<PointsToastContextType>({
  showPointsToast: () => {},
  hidePointsToast: () => {},
  toast: null,
  registerModal: () => () => {},
  hasActiveModal: false,
});

export function usePointsToast(): PointsToastContextType {
  return useContext(PointsToastContext);
}

export interface PointsToastProps {
  children?: React.ReactNode;
  autoDismissMs?: number;
}

export function PointsToastView() {
  const { toast, hidePointsToast } = usePointsToast();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (toast) {
      opacity.setValue(0);
      scale.setValue(0.5);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast, opacity, scale]);

  if (!toast) return null;

  return (
    <View style={styles.toastOverlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toastContainer,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Earned ${toast.points} points. ${toast.message}. Tap to dismiss.`}
          onPress={hidePointsToast}
          style={styles.toastCard}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.badgeIcon}>🎉</Text>
          </View>
          <Text style={styles.pointsText}>+{toast.points} Points!</Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {toast.message}
          </Text>
          <Text style={styles.dismissHint}>Tap to dismiss</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function PointsToastProvider({
  children,
  autoDismissMs = 3000,
}: PointsToastProps) {
  const [toast, setToast] = useState<PointsToastData | null>(null);
  const [modalCount, setModalCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hidePointsToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showPointsToast = useCallback(
    (points: number, message: string) => {
      if (points <= 0) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ points, message });

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, autoDismissMs);
    },
    [autoDismissMs],
  );

  const registerModal = useCallback(() => {
    setModalCount((c) => c + 1);
    return () => setModalCount((c) => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <PointsToastContext.Provider
      value={{
        showPointsToast,
        hidePointsToast,
        toast,
        registerModal,
        hasActiveModal: modalCount > 0,
      }}
    >
      {children}
      {modalCount === 0 && <PointsToastView />}
    </PointsToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  toastContainer: {
    width: "85%",
    maxWidth: 360,
    alignItems: "center",
  },
  toastCard: {
    width: "100%",
    backgroundColor: "#174B35",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#FFD700",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  badgeIcon: {
    fontSize: 32,
  },
  pointsText: {
    color: "#FFD700",
    fontWeight: "900",
    fontSize: 32,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 22,
  },
  dismissHint: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12,
    marginTop: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
