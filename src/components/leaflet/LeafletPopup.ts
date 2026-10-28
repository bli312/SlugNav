export interface LeafletPopup {
  title: string;
  text: string;
  image: string | undefined;
}

export function createPopup(
  titlePopup: string,
  textPopup: string,
  imagePopup: string | undefined,
): LeafletPopup {
  const popup: LeafletPopup = {
    title: titlePopup,
    text: textPopup,
    image: imagePopup,
  };
  return popup;
}

// Popup fields will come from users, so treat them as text, never as HTML.
// Escaping also stops a value from closing the map page's <script> tag.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only allow web images, so a link like "javascript:..." can't be used.
function isWebUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function loadPopup(popup: LeafletPopup): string {
  const popupHTML = `
    <div>
      <b>${popup.title ? `${escapeHtml(popup.title)}<br>` : "UNKNOWN CLASSROOM"}</b>
      ${popup.text ? `${escapeHtml(popup.text)}<br>` : ``}
      ${
        popup.image && isWebUrl(popup.image)
          ? `<img src="${escapeHtml(popup.image)}" style="max-width: 200px;" />`
          : ``
      }
    </div>
  `;
  return JSON.stringify(popupHTML);
}
