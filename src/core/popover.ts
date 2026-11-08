const showPopover = (popoverId: string) => {
  const popoverElement = document.getElementById(popoverId);
  if (popoverElement === null || typeof popoverElement.showPopover !== 'function') return;
  if (!popoverElement.matches(':popover-open')) popoverElement.showPopover();
};

const hidePopover = (popoverId: string) => {
  const popoverElement = document.getElementById(popoverId);
  if (popoverElement === null || typeof popoverElement.hidePopover !== 'function') return;
  try {
    popoverElement.hidePopover();
  } catch {
    return;
  }
};

export { showPopover };
export default hidePopover;
