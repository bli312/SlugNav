import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createPopup,
  escapeHtml,
  loadPopup,
} from "../../src/components/leaflet/LeafletPopup.ts";

// loadPopup returns a JSON string literal; parse it back to the popup HTML.
const render = (title, text, image) =>
  JSON.parse(loadPopup(createPopup(title, text, image)));

test("escapes HTML special characters", () => {
  assert.equal(
    escapeHtml(`<a href="x">Tom & Jerry's</a>`),
    "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
  );
});

test("keeps normal popup content", () => {
  const html = render(
    "CSE115A Classroom",
    "Physical Sciences Building - Room 114",
    "https://example.com/room.jpg",
  );
  assert.match(html, /<b>CSE115A Classroom<br><\/b>/);
  assert.match(html, /Physical Sciences Building - Room 114<br>/);
  assert.match(html, /<img src="https:\/\/example\.com\/room\.jpg"/);
});

test("shows user-entered HTML as text instead of running it", () => {
  const html = render(
    `<img src=x onerror="alert('hacked')">`,
    "</script><script>alert('hacked')</script>",
    undefined,
  );
  assert.doesNotMatch(html, /<img|<script|<\/script/);
  assert.match(
    html,
    /&lt;img src=x onerror=&quot;alert\(&#39;hacked&#39;\)&quot;&gt;/,
  );
});

test("only allows http and https image links", () => {
  assert.doesNotMatch(render("Room", "", "javascript:alert(1)"), /<img/);
  assert.doesNotMatch(render("Room", "", "not a url"), /<img/);

  const html = render(
    "Room",
    "",
    `https://example.com/a.jpg" onerror="alert(1)`,
  );
  assert.doesNotMatch(html, /" onerror="/);
  assert.match(html, /<img src="https:\/\/example\.com\/a\.jpg&quot;/);
});
