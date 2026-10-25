const hidePopover = (popoverId: string) => {
  const popoverElement = document.getElementById(popoverId);
  if (popoverElement === null || typeof popoverElement.hidePopover !== 'function') return;
  try {
    popoverElement.hidePopover();
  } catch {
    return;
  }
};

export default hidePopover;
