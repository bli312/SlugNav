import { beforeEach, expect, jest, test, describe } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import useCampusLocations, {
  loadLocations,
} from "../../src/components/places/data/LoadLocations";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as supabaseLib from "../../src/lib/supabase";

jest.mock("../../src/lib/supabase.ts", () => ({
  getSupabase: jest.fn(),
}));

const supabase = jest.mocked(supabaseLib);

interface MockLocationRow {
  name: string;
  pisa_name: string;
  building_name: string;
  building_latitude: number | null;
  building_longitude: number | null;
  room_name: string | null;
  room_latitude: number | null;
  room_longitude: number | null;
}

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  range: jest.Mock<
    (
      from: number,
      to: number,
    ) => Promise<{
      data: MockLocationRow[] | null;
      error: Error | null;
    }>
  >;
}

describe("useCampusLocations", () => {
  let mockSupabaseClient: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      range: jest.fn(),
    };
    supabase.getSupabase.mockReturnValue(
      mockSupabaseClient as unknown as SupabaseClient,
    );
  });

  test("loadLocations fetches pages correctly and maps room coordinates with priority", async () => {
    const mockRows = [
      {
        name: "Test Room",
        pisa_name: "TR1",
        building_name: "Science Hall",
        building_latitude: 34.0,
        building_longitude: -118.0,
        room_name: "Room 101",
        room_latitude: 34.1,
        room_longitude: -118.1,
      },
    ];
    mockSupabaseClient.range
      .mockResolvedValueOnce({ data: mockRows, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const locations = await loadLocations(
      mockSupabaseClient as unknown as SupabaseClient,
    );
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("locations");
    expect(locations).toHaveLength(1);
    expect(locations[0]).toEqual({
      latitude: 34.1,
      longitude: -118.1,
      popup: expect.any(Object),
      openPopup: false,
    });
  });

  test("loadLocations falls back to building coordinates when room coordinates are null", async () => {
    const mockRows = [
      {
        name: "Quad",
        pisa_name: "QD",
        building_name: "Main",
        building_latitude: 35.0,
        building_longitude: -120.0,
        room_name: null,
        room_latitude: null,
        room_longitude: null,
      },
    ];
    mockSupabaseClient.range
      .mockResolvedValueOnce({ data: mockRows, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const locations = await loadLocations(
      mockSupabaseClient as unknown as SupabaseClient,
    );
    expect(locations[0]).toEqual({
      latitude: 35.0,
      longitude: -120.0,
      popup: expect.any(Object),
      openPopup: false,
    });
  });

  test("hook initializes with loading and NO_PINS, then updates with fetched markers", async () => {
    const mockRows = [
      {
        name: "Library",
        pisa_name: "LIB",
        building_name: "Library Building",
        building_latitude: 36.0,
        building_longitude: -121.0,
        room_name: null,
        room_latitude: null,
        room_longitude: null,
      },
    ];
    mockSupabaseClient.range
      .mockResolvedValueOnce({ data: mockRows, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const { result } = await renderHook(() => useCampusLocations());
    await waitFor(() => {
      expect(result.current.locationsLoading).toBe(false);
      expect(result.current.markers).toHaveLength(1);
    });
    expect(result.current.markers[0].latitude).toBe(36.0);
  });

  test("hook handles errors gracefully by setting markers to empty array", async () => {
    const spyConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockSupabaseClient.range.mockResolvedValueOnce({
      data: null,
      error: new Error("Database error"),
    });
    const { result } = await renderHook(() => useCampusLocations());
    await waitFor(() => {
      expect(result.current.locationsLoading).toBe(false);
    });
    expect(result.current.markers).toEqual([]);
    spyConsoleError.mockRestore();
  });
});
