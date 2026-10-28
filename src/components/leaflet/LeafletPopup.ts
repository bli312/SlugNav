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

export function loadPopup(popup: LeafletPopup): string {
  const popupHTML = `
    <div>
      <b>${popup.title ? `${popup.title}<br>` : "UNKNOWN CLASSROOM"}</b>
      ${popup.text ? `${popup.text}<br>` : ``}
      ${
        popup.image
          ? `<img src="${popup.image}" style="max-width: 200px;" />`
          : ``
      }
    </div>
  `;
  return JSON.stringify(popupHTML);
}
