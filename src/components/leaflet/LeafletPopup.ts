export interface LeafletPopup {
  title: string;
  text: string;
  image: string | undefined;
}

export default function createPopup(
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
