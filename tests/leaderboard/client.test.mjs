import assert from "node:assert/strict";
import { test } from "node:test";
import {
  awardUserPoints,
  formatPoints,
  getAnonymousSlug,
  getLeaderboard,
  getUserRank,
  updateDisplayName,
} from "../../src/components/leaderboard/leaderboard.ts";

test("US-3.2-T-1 getAnonymousSlug derives anonymous slug from userId or fallback", () => {
  assert.equal(getAnonymousSlug(""), "Anonymous Slug");
  assert.equal(
    getAnonymousSlug("00000000-0000-4000-8000-000000000001"),
    "Slug 0000",
  );
  assert.equal(
    getAnonymousSlug("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
    "Slug a1b2",
  );
});

test("US-3.2-T-1 formatPoints formats singular and plural points", () => {
  assert.equal(formatPoints(1), "1 pt");
  assert.equal(formatPoints(0), "0 pts");
  assert.equal(formatPoints(50), "50 pts");
  assert.equal(formatPoints(1500), "1,500 pts");
});

test("US-3.2-T-1 getLeaderboard calls get_leaderboard RPC and maps fields to camelCase", async () => {
  const fakeClient = {
    rpc: (name, args) => {
      assert.equal(name, "get_leaderboard");
      assert.equal(args.limit_count, 10);
      return Promise.resolve({
        data: [
          {
            rank: 1,
            user_id: "u-1",
            display_name: "Sammy",
            total_points: 150,
            contributions_count: 5,
          },
          {
            rank: 2,
            user_id: "u-2",
            display_name: null,
            total_points: 80,
            contributions_count: 2,
          },
        ],
        error: null,
      });
    },
  };

  const results = await getLeaderboard(fakeClient, 10);
  assert.equal(results.length, 2);
  assert.deepEqual(results[0], {
    rank: 1,
    userId: "u-1",
    displayName: "Sammy",
    totalPoints: 150,
    contributionsCount: 5,
  });
  // Null display name falls back to slug
  assert.equal(results[1].displayName, "Slug u2");
});

test("US-3.2-T-1 getLeaderboard falls back to leaderboard_view if RPC fails", async () => {
  const fakeClient = {
    rpc: () => Promise.resolve({ data: null, error: { message: "RPC disabled" } }),
    from: (table) => {
      assert.equal(table, "leaderboard_view");
      return {
        select: () => ({
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: [
                  {
                    rank: 1,
                    user_id: "u-1",
                    display_name: "FallbackSlug",
                    total_points: 200,
                    contributions_count: 8,
                  },
                ],
                error: null,
              }),
          }),
        }),
      };
    },
  };

  const results = await getLeaderboard(fakeClient, 20);
  assert.equal(results.length, 1);
  assert.equal(results[0].displayName, "FallbackSlug");
  assert.equal(results[0].totalPoints, 200);
});

test("US-3.2-T-1 getLeaderboard throws error when both RPC and view fail", async () => {
  const fakeClient = {
    rpc: () => Promise.resolve({ data: null, error: { message: "Failed" } }),
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () =>
            Promise.resolve({ data: null, error: { message: "View error" } }),
        }),
      }),
    }),
  };

  await assert.rejects(
    getLeaderboard(fakeClient, 10),
    /Could not load leaderboard\./,
  );
});

test("US-3.2-T-1 getUserRank returns mapped user rank or default unranked status", async () => {
  const fakeClient = {
    rpc: (name, args) => {
      assert.equal(name, "get_user_rank");
      if (args.target_user_id === "user-ranked") {
        return Promise.resolve({
          data: [
            {
              rank: 3,
              user_id: "user-ranked",
              display_name: "RankedUser",
              total_points: 75,
              contributions_count: 3,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    },
  };

  const ranked = await getUserRank(fakeClient, "user-ranked");
  assert.equal(ranked.rank, 3);
  assert.equal(ranked.totalPoints, 75);

  const unranked = await getUserRank(fakeClient, "user-new");
  assert.equal(unranked.rank, null);
  assert.equal(unranked.totalPoints, 0);
  assert.equal(unranked.displayName, "Slug user");
});

test("US-3.2-T-1 getUserRank rejects empty userId", async () => {
  const fakeClient = { rpc: () => {} };
  await assert.rejects(getUserRank(fakeClient, ""), /User ID is required\./);
});

test("US-3.2-T-1 updateDisplayName validates input and upserts user_profiles", async () => {
  let upsertCalled = false;
  const fakeClient = {
    from: (table) => {
      assert.equal(table, "user_profiles");
      return {
        upsert: (payload, options) => {
          assert.equal(payload.user_id, "u-123");
          assert.equal(payload.display_name, "Banana Slug 42");
          assert.equal(options.onConflict, "user_id");
          upsertCalled = true;
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const name = await updateDisplayName(fakeClient, "u-123", "   Banana Slug 42  ");
  assert.equal(name, "Banana Slug 42");
  assert.ok(upsertCalled);

  // Blank name fails
  await assert.rejects(
    updateDisplayName(fakeClient, "u-123", "   "),
    /Display name cannot be blank\./,
  );

  // Missing userId fails
  await assert.rejects(
    updateDisplayName(fakeClient, "", "Slug"),
    /Sign in to update your display name\./,
  );

  // Name too long fails (> 32 chars)
  await assert.rejects(
    updateDisplayName(fakeClient, "u-123", "a".repeat(35)),
    /Display name must be 32 characters or fewer\./,
  );

  // Upsert error fails
  const errorClient = {
    from: () => ({
      upsert: () => Promise.resolve({ error: { message: "db error" } }),
    }),
  };
  await assert.rejects(
    updateDisplayName(errorClient, "u-123", "ValidName"),
    /Could not update display name\./,
  );
});

test("US-3.2-T-1 awardUserPoints validates parameters and inserts into user_points", async () => {
  let inserted = false;
  const fakeClient = {
    from: (table) => {
      assert.equal(table, "user_points");
      return {
        insert: (row) => {
          assert.equal(row.points, 25);
          assert.equal(row.category, "bonus");
          assert.equal(row.description, "Extra points");
          assert.equal(row.user_id, "u-1");
          inserted = true;
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  await awardUserPoints(fakeClient, {
    userId: "u-1",
    points: 25,
    category: "bonus",
    description: "Extra points",
  });
  assert.ok(inserted);

  // Invalid points <= 0
  await assert.rejects(
    awardUserPoints(fakeClient, { points: 0, category: "bonus" }),
    /Points must be greater than zero\./,
  );

  // Blank category
  await assert.rejects(
    awardUserPoints(fakeClient, { points: 10, category: "  " }),
    /Category is required\./,
  );

  // Insert error
  const failClient = {
    from: () => ({
      insert: () => Promise.resolve({ error: { message: "fail" } }),
    }),
  };
  await assert.rejects(
    awardUserPoints(failClient, { points: 10, category: "bonus" }),
    /Could not award points\./,
  );
});
