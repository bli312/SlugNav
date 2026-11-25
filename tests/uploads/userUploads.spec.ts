import { getSupabase } from "@/lib/supabase";

import {
    listUserUploads,
    deleteUserUpload,
} from "@/lib/useruploads";

jest.mock("@/lib/supabase", () => ({
    getSupabase: jest.fn(),
}));

const mockGetSupabase = jest.mocked(getSupabase);

const userId = "user-123";

const mockList = jest.fn();
const mockRemove = jest.fn();
const mockGetSession = jest.fn();
const mockFrom = jest.fn(() => ({
    list: mockList,
    remove: mockRemove,
}));

const mockClient = {
    auth: {
        getSession: mockGetSession,
    },
    storage: {
        from: mockFrom,
    },
};

function authenticate() {
    mockGetSession.mockResolvedValue({
        data: {
            session: {
                user: { id: userId },
            },
        },
        error: null,
    });
}

beforeEach(() => {
    jest.clearAllMocks();

    mockGetSupabase.mockReturnValue(
        mockClient as unknown as ReturnType<typeof getSupabase>,
    );

    authenticate();

    mockList.mockResolvedValue({
        data: [],
        error: null,
    });

    mockRemove.mockResolvedValue({
        data: [],
        error: null,
    });
});

describe("listUserUploads", () => {
    it("lists files in the user's folder", async () => {
        mockList.mockResolvedValue({
            data: [
                {
                    id: "file-1",
                    name: "photo.png",
                    metadata: { size: 1024 },
                    created_at: "2026-11-24",
                    updated_at: "2026-11-24",
                    last_accessed_at: null,
                },
            ],
            error: null,
        });

        const result = await listUserUploads("uploads");

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            id: "file-1",
            name: "photo.png",
            path: "user-123/photo.png",
            metadata: { size: 1024 },
            createdAt: "2026-11-24",
            updatedAt: "2026-11-24",
            lastAccessedAt: null,
        });

        expect(mockFrom).toHaveBeenCalledWith("uploads");
        expect(mockList).toHaveBeenCalledWith(userId, {
            limit: 1000,
            sortBy: {
                column: "created_at",
                order: "desc",
            },
        });
    });

    it("lists files inside a subfolder", async() => {
        await listUserUploads("uploads", "photos");

        expect(mockList).toHaveBeenCalledWith(
            `${userId}/photos`,
            expect.any(Object),
        );
    });

    it("returns an empty array when no files exist", async () => {
        mockList.mockResolvedValue({
            data: null,
            error: null,
        });

        const result = await listUserUploads("uploads");

        expect(result).toEqual([]);
    });

    it("rejects session verification errors", async () => {
        mockGetSession.mockResolvedValue({
            data: { session: null },
            error: new Error("Session error"),
        });

        await expect(
            listUserUploads("uploads"),
        ).rejects.toThrow("Could not verify your session.");
    });

    it("rejects invalid folder paths", async () => {
        await expect(
            listUserUploads("uploads", "../other-user"),
        ).rejects.toThrow("You can only manage your own uploads.");
    });

    it("handles Storage listing errors.", async () => {
        mockList.mockResolvedValue({
            data: null,
            error: new Error("Storage error"),
        });

        await expect(
            listUserUploads("uploads"),
        ).rejects.toThrow("Could not load your uploads.");
    });
});

describe("deleteUserUpload", () => {
    it("deletes a file belonging to the authenticated user", async () => {
        const path = `${userId}/photo.png`;

        await expect(
            deleteUserUpload("uploads", path),
        ).resolves.toBeUndefined();

        expect(mockFrom).toHaveBeenCalledWith("uploads");
        expect(mockRemove).toHaveBeenCalledWith([path]);
    });

    it("rejects unauthenticated users", async () => {
        mockGetSession.mockResolvedValue({
            data: { session: null },
            error: null,
        });

        await expect(
            deleteUserUpload("uploads", `${userId}/photo.png`),
        ).rejects.toThrow("Sign in to manage your uploads.");
    });

    it("rejects attempts to delete another user's files", async () =>  {
        await expect(
            deleteUserUpload("uploads", "another-user/photo.png"),
        ).rejects.toThrow("You can only manage your own uploads.");
    });

    it("rejects directory traversal paths", async () => {
        await expect(
            deleteUserUpload("uploads", `${userId}/../another-user/photo.png`),
        ).rejects.toThrow("You can only manage your own uploads.");
    });

    it("handles Storage deletion errors", async () =>  {
        mockRemove.mockResolvedValue({
            data: null,
            error: new Error("Storage deletion error"),
        });

        await expect(
            deleteUserUpload("uploads", `${userId}/photo.png`),
        ).rejects.toThrow("Could not delete the upload.");
    });
});
