import { beforeEach, expect, jest, test } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";

import ClassListScreen from "../../src/components/classes/class_list/ClassListScreen";
import ManualClassForm from "../../src/components/classes/class_list/ManualClassForm";
import * as classesApi from "../../src/components/classes/class_list/GetClasses";
import type {
  ManualClassDraft,
  Class,
} from "../../src/components/classes/class_list/types.ts";

jest.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ session: { user: { id: "student" } } }),
}));
jest.mock("@/lib/supabase", () => ({ getSupabase: () => ({}) }));
jest.mock("../../src/components/classes/class_list/GetClasses");

const api = jest.mocked(classesApi);
const catalog: Class = {
  id: "1",
  ownerId: null,
  courseCode: "TEST 101",
  title: "Catalog class",
  instructor: null,
  meetings: [{ days: "Mon, Wed", time: "09:30–10:45", location: "Room 12" }],
  saved: false,
};

beforeEach(() => {
  jest.resetAllMocks();
  api.getClasses.mockResolvedValue([{ ...catalog }]);
  api.saveClass.mockResolvedValue(undefined);
  api.removeClass.mockResolvedValue(undefined);
});

test("the shared search input filters classes within the selected schedule or catalog", async () => {
  api.getClasses.mockResolvedValue([
    { ...catalog, saved: true },
    { ...catalog, id: "2", title: "Other course", courseCode: "TEST 202" },
  ]);
  const user = userEvent.setup();
  await render(<ClassListScreen />);
  await screen.findByText("Catalog class");
  expect(screen.queryByText("Other course")).not.toBeOnTheScreen();
  await user.press(screen.getByRole("tab", { name: "Browse classes" }));
  await user.type(screen.getByLabelText("Search classes"), "202");
  expect(screen.getByText("Other course")).toBeOnTheScreen();
  expect(screen.queryByText("Catalog class")).not.toBeOnTheScreen();
  await user.press(screen.getByRole("tab", { name: "My schedule" }));
  expect(screen.getByText("No matching classes.")).toBeOnTheScreen();
  await user.clear(screen.getByLabelText("Search classes"));
  expect(screen.getByText("Catalog class")).toBeOnTheScreen();
});

test("manual fields start blank and meeting days can be selected and cleared", async () => {
  const user = userEvent.setup();
  await render(
    <ManualClassForm onSave={async () => undefined} onCancel={jest.fn()} />,
  );
  for (const label of [
    "Class name",
    "Course code",
    "Instructor",
    "Start time, meeting 1",
    "End time, meeting 1",
    "Location, meeting 1",
  ]) {
    expect(screen.getByLabelText(label)).toHaveDisplayValue("");
  }
  const monday = screen.getByRole("checkbox", { name: "Mon, meeting 1" });
  expect(monday).not.toBeChecked();
  await user.press(monday);
  expect(monday).toBeChecked();
  await user.press(monday);
  expect(monday).not.toBeChecked();
});

test("a failed class load shows an error instead of an empty catalog", async () => {
  api.getClasses.mockRejectedValueOnce(new Error("Synthetic load failure"));
  const user = userEvent.setup();
  await render(<ClassListScreen />);
  await user.press(screen.getByRole("tab", { name: "Browse classes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not load classes.",
  );
  expect(screen.queryByText("No classes available yet.")).not.toBeOnTheScreen();
});

test("already-saved classes show a disabled Saved button and cannot send another save", async () => {
  api.getClasses.mockResolvedValue([{ ...catalog, saved: true }]);
  const user = userEvent.setup();
  await render(<ClassListScreen />);
  await user.press(screen.getByRole("tab", { name: "Browse classes" }));
  const saved = screen.getByRole("button", { name: "Saved" });
  expect(saved).toBeDisabled();
  await user.press(saved);
  expect(api.saveClass).not.toHaveBeenCalled();
});

test("saving a catalog class updates its button and adds its details to My schedule", async () => {
  const user = userEvent.setup();
  await render(<ClassListScreen />);
  await user.press(screen.getByRole("tab", { name: "Browse classes" }));
  await user.press(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("button", { name: "Saved" })).toBeDisabled();
  expect(api.saveClass).toHaveBeenCalledTimes(1);
  await user.press(screen.getByRole("tab", { name: "My schedule" }));
  expect(screen.getByText("Catalog class")).toBeOnTheScreen();
  expect(screen.getByText("Room 12")).toBeOnTheScreen();
  expect(screen.getByText("Mon, Wed · 09:30–10:45")).toBeOnTheScreen();
});

test("a failed catalog save shows an error and stays unsaved", async () => {
  api.saveClass.mockRejectedValue(new Error("Synthetic failure"));
  const user = userEvent.setup();
  await render(<ClassListScreen />);
  await user.press(screen.getByRole("tab", { name: "Browse classes" }));
  await user.press(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /Could not save the class/,
  );
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Saved" })).not.toBeOnTheScreen();
  await user.press(screen.getByRole("tab", { name: "My schedule" }));
  expect(screen.queryByText("Catalog class")).not.toBeOnTheScreen();
});

test.each(["catalog", "manual"])(
  "removing a %s class updates the schedule and catalog appropriately",
  async (kind: string) => {
    const item = {
      ...catalog,
      saved: true,
      ownerId: kind === "manual" ? "student" : null,
    };
    api.getClasses.mockResolvedValue([item]);
    const user = userEvent.setup();
    await render(<ClassListScreen />);
    await user.press(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByText(item.title)).not.toBeOnTheScreen();
    expect(api.removeClass).toHaveBeenCalledWith(
      expect.anything(),
      "student",
      item,
    );
    await user.press(screen.getByRole("tab", { name: "Browse classes" }));
    if (kind === "catalog") {
      expect(screen.getByText(item.title)).toBeOnTheScreen();
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    } else {
      expect(screen.queryByText(item.title)).not.toBeOnTheScreen();
    }
  },
);

test("a rejected manual save keeps all entered values and allows retry", async () => {
  const onSave = jest
    .fn<(draft: ManualClassDraft) => Promise<void>>()
    .mockRejectedValueOnce(new Error("Could not save your class."))
    .mockResolvedValue(undefined);
  const user = userEvent.setup();
  await render(<ManualClassForm onSave={onSave} onCancel={jest.fn()} />);
  await user.type(screen.getByLabelText("Class name"), "My class");
  await user.type(screen.getByLabelText("Course code"), "TEST 200");
  await user.type(screen.getByLabelText("Instructor"), "Staff");
  await user.press(screen.getByRole("checkbox", { name: "Mon, meeting 1" }));
  await user.type(screen.getByLabelText("Start time, meeting 1"), "09:00");
  await user.type(screen.getByLabelText("End time, meeting 1"), "10:00");
  await user.type(screen.getByLabelText("Location, meeting 1"), "Room 12");
  await user.press(screen.getByRole("button", { name: "Save to my schedule" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not save your class.",
  );
  for (const [label, value] of [
    ["Class name", "My class"],
    ["Course code", "TEST 200"],
    ["Instructor", "Staff"],
    ["Start time, meeting 1", "09:00"],
    ["End time, meeting 1", "10:00"],
    ["Location, meeting 1", "Room 12"],
  ]) {
    expect(screen.getByLabelText(label)).toHaveDisplayValue(value);
  }
  expect(
    screen.getByRole("checkbox", { name: "Mon, meeting 1" }),
  ).toBeChecked();
  expect(
    screen.getByRole("button", { name: "Save to my schedule" }),
  ).toBeEnabled();
  await user.press(screen.getByRole("button", { name: "Save to my schedule" }));
  expect(onSave).toHaveBeenCalledTimes(2);
  expect(onSave.mock.calls[1][0]).toEqual(onSave.mock.calls[0][0]);
});

test("creating a manual class with only its name saves it in My schedule and leaves it out of Browse", async () => {
  api.getClasses.mockResolvedValue([]);
  api.createManualClass.mockResolvedValue({
    ...catalog,
    id: "2",
    ownerId: "student",
    title: "My own class",
    courseCode: null,
    meetings: [],
    saved: true,
  });
  const user = userEvent.setup();
  await render(<ClassListScreen />);
  await user.press(screen.getByRole("button", { name: "Add a manual class" }));
  await user.type(screen.getByLabelText("Class name"), "My own class");
  await user.press(screen.getByRole("button", { name: "Save to my schedule" }));
  expect(await screen.findByText("My own class")).toBeOnTheScreen();
  expect(screen.getByRole("tab", { name: "My schedule" })).toBeSelected();
  expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
  await user.press(screen.getByRole("tab", { name: "Browse classes" }));
  expect(screen.queryByText("My own class")).not.toBeOnTheScreen();
  expect(screen.getByText("No classes available yet.")).toBeOnTheScreen();
  await user.press(screen.getByRole("tab", { name: "My schedule" }));
  expect(screen.getByText("My own class")).toBeOnTheScreen();
});
