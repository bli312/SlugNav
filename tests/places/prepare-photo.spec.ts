import { beforeEach, expect, jest, test } from "@jest/globals";
import { ImageManipulator } from "expo-image-manipulator";

import { preparePhoto } from "../../src/components/places/preparePhoto";

// A fake image manipulator that records each step. The re-saved JPEG is the
// bytes 1, 2, 3 (base64 "AQID"), so tests can tell it apart from the original.
const mockSteps: Array<{ step: string; value: unknown }> = [];
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: jest.fn((uri: string) => {
      mockSteps.push({ step: "open", value: uri });
      const context = {
        resize: (size: unknown) => {
          mockSteps.push({ step: "resize", value: size });
          return context;
        },
        renderAsync: async () => ({
          saveAsync: async (options: unknown) => {
            mockSteps.push({ step: "save", value: options });
            return { uri: "file:///resaved.jpg", base64: "AQID" };
          },
        }),
      };
      return context;
    }),
  },
}));

beforeEach(() => {
  mockSteps.length = 0;
  jest.mocked(ImageManipulator.manipulate).mockClear();
});

test("US-3.1-T-2 preparePhoto shrinks a photo wider than 1600 px and re-saves it as a JPEG at 0.8 quality", async () => {
  const photo = await preparePhoto("file:///original.heic", 4032);
  expect(mockSteps).toEqual([
    { step: "open", value: "file:///original.heic" },
    { step: "resize", value: { width: 1600, height: null } },
    {
      step: "save",
      value: { format: "jpeg", compress: 0.8, base64: true },
    },
  ]);
  expect(photo.contentType).toBe("image/jpeg");
  expect([...new Uint8Array(photo.data)]).toEqual([1, 2, 3]);
});

test("US-3.1-T-2 preparePhoto keeps a photo 1600 px wide or narrower at its size", async () => {
  await preparePhoto("file:///small.jpg", 1600);
  await preparePhoto("file:///unknown-width.jpg", 0);
  expect(mockSteps.filter((item) => item.step === "resize")).toEqual([]);
  expect(mockSteps.filter((item) => item.step === "save")).toHaveLength(2);
});
