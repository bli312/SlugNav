import assert from "node:assert/strict";
import { test } from "node:test";
import {
  castVote,
  deleteComment,
  deleteVote,
  getPlaceFeedback,
  getUserSubmissions,
  placeVoteDefinitions,
  postComment,
  reportReasons,
  submitReport,
} from "../../src/components/places/feedback.ts";

test("predefined vote definitions cover all place types", () => {
  assert.ok(placeVoteDefinitions.classroom.length >= 2);
  assert.ok(placeVoteDefinitions.bathroom.length >= 2);
  assert.ok(placeVoteDefinitions.water_fountain.length >= 2);
  assert.ok(Object.keys(reportReasons).includes("inaccurate"));
});

test("getPlaceFeedback aggregates vote counts and current user's choice", async () => {
  const client = {
    from: (table) => {
      if (table === "place_votes") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { option_key: "outlets", choice: "many", user_id: "user-1" },
                  { option_key: "outlets", choice: "many", user_id: "user-2" },
                  { option_key: "outlets", choice: "few", user_id: "user-3" },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "place_comments") {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 1,
                      place_id: 10,
                      user_id: "user-1",
                      content: "Near window",
                      created_at: "2026-11-04T00:00:00Z",
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "place_reports") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { id: 99 }, error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
  };

  const feedback = await getPlaceFeedback(client, 10, "user-1");
  assert.equal(feedback.votes.outlets.counts.many, 2);
  assert.equal(feedback.votes.outlets.counts.few, 1);
  assert.equal(feedback.votes.outlets.total, 3);
  assert.equal(feedback.votes.outlets.userChoice, "many");
  assert.equal(feedback.comments.length, 1);
  assert.equal(feedback.comments[0].content, "Near window");
  assert.equal(feedback.hasReported, true);
});

test("castVote upserts with onConflict", async () => {
  let sent;
  let options;
  const client = {
    from: () => ({
      upsert: (payload, opts) => {
        sent = payload;
        options = opts;
        return Promise.resolve({ error: null });
      },
    }),
  };

  await castVote(client, 5, "outlets", "many");
  assert.equal(sent.place_id, 5);
  assert.equal(sent.option_key, "outlets");
  assert.equal(sent.choice, "many");
  assert.equal(options.onConflict, "place_id,user_id,option_key");
});

test("postComment validates text and inserts comment", async () => {
  const dummyClient = { from: () => assert.fail("Should not reach DB") };
  await assert.rejects(postComment(dummyClient, 1, "   "), /cannot be empty/);
  await assert.rejects(
    postComment(dummyClient, 1, "a".repeat(501)),
    /500 characters or fewer/,
  );

  let inserted;
  const client = {
    from: () => ({
      insert: (payload) => {
        inserted = payload;
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: 1,
                  place_id: 1,
                  user_id: "user-1",
                  content: "Test comment",
                  created_at: "now",
                },
                error: null,
              }),
          }),
        };
      },
    }),
  };

  const comment = await postComment(client, 1, "  Test comment  ");
  assert.equal(inserted.content, "Test comment");
  assert.equal(comment.content, "Test comment");
});

test("deleteComment deletes by comment id", async () => {
  let deletedId;
  const client = {
    from: () => ({
      delete: () => ({
        eq: (col, val) => {
          assert.equal(col, "id");
          deletedId = val;
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };

  await deleteComment(client, 42);
  assert.equal(deletedId, 42);
});

test("submitReport validates reasons and details length", async () => {
  const dummyClient = { from: () => assert.fail("Should not reach DB") };
  await assert.rejects(
    submitReport(dummyClient, 1, "invalid"),
    /Invalid report reason/,
  );
  await assert.rejects(
    submitReport(dummyClient, 1, "inaccurate", "a".repeat(501)),
    /500 characters or fewer/,
  );

  let inserted;
  const client = {
    from: () => ({
      insert: (payload) => {
        inserted = payload;
        return Promise.resolve({ error: null });
      },
    }),
  };

  await submitReport(client, 1, "inaccurate", "Moved to room 102");
  assert.equal(inserted.reason, "inaccurate");
  assert.equal(inserted.details, "Moved to room 102");
});

test("deleteVote deletes by place_id and option_key", async () => {
  const criteria = {};
  const client = {
    from: () => ({
      delete: () => ({
        eq: (col1, val1) => ({
          eq: (col2, val2) => {
            criteria[col1] = val1;
            criteria[col2] = val2;
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }),
  };

  await deleteVote(client, 7, "like");
  assert.equal(criteria.place_id, 7);
  assert.equal(criteria.option_key, "like");
});

test("getUserSubmissions fetches votes, comments and reports with joined places", async () => {
  const client = {
    from: (table) => {
      if (table === "place_votes") {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 1,
                      place_id: 10,
                      option_key: "like",
                      choice: "liked",
                      updated_at: "2026-11-04T00:00:00Z",
                      places: { id: 10, name: "Baskin 101", type: "classroom" },
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "place_comments") {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 2,
                      place_id: 10,
                      content: "Quiet spot",
                      created_at: "2026-11-04T00:00:00Z",
                      places: [{ id: 10, name: "Baskin 101", type: "classroom" }],
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "place_reports") {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 3,
                      place_id: 20,
                      reason: "closed",
                      details: "Out of order",
                      created_at: "2026-11-04T00:00:00Z",
                      places: null,
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
  };

  const res = await getUserSubmissions(client, "user-1");
  assert.equal(res.votes.length, 1);
  assert.equal(res.votes[0].placeName, "Baskin 101");
  assert.equal(res.votes[0].optionKey, "like");

  assert.equal(res.comments.length, 1);
  assert.equal(res.comments[0].content, "Quiet spot");

  assert.equal(res.reports.length, 1);
  assert.equal(res.reports[0].placeName, "Place #20");
  assert.equal(res.reports[0].reason, "closed");
});
