import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export interface PointsToastContextType {
  showPointsToast: (points: number, message: string) => void;
  hidePointsToast: () => void;
}

export const PointsToastContext = createContext<PointsToastContextType>({
  showPointsToast: () => {},
  hidePointsToast: () => {},
});

export function usePointsToast(): PointsToastContextType {
  return useContext(PointsToastContext);
}

export interface PointsToastProps {
  children?: React.ReactNode;
  autoDismissMs?: number;
}

export function PointsToastProvider({
  children,
  autoDismissMs = 3000,
}: PointsToastProps) {
  const [toast, setToast] = useState<{
    points: number;
    message: string;
  } | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hidePointsToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [opacity, translateY]);

  const showPointsToast = useCallback(
    (points: number, message: string) => {
      if (points <= 0) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ points, message });
      opacity.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hidePointsToast();
      }, autoDismissMs);
    },
    [autoDismissMs, hidePointsToast, opacity, translateY],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <PointsToastContext.Provider value={{ showPointsToast, hidePointsToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Earned ${toast.points} points. ${toast.message}. Tap to dismiss.`}
            onPress={hidePointsToast}
            style={styles.toastCard}
          >
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeIcon}>🏆</Text>
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.pointsText}>+{toast.points} Points!</Text>
              <Text style={styles.messageText} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </Animated.View>
      )}
    </PointsToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#174B35",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#2E7D32",
    maxWidth: 500,
    width: "100%",
  },
  badgeContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeIcon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  pointsText: {
    color: "#FFD700",
    fontWeight: "800",
    fontSize: 16,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  closeIcon: {
    color: "#E8F5E9",
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
});
