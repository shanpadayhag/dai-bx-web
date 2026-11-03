const LAST_BOARD_ID_KEY = 'daibx:last-board-id';

const localStorageBoardViewSource = {
  findLastBoardId: () => {
    try {
      return window.localStorage.getItem(LAST_BOARD_ID_KEY);
    } catch {
      return null;
    }
  },
  saveLastBoardId: (boardId: string) => {
    try {
      window.localStorage.setItem(LAST_BOARD_ID_KEY, boardId);
    } catch {
      return;
    }
  },
};

export default localStorageBoardViewSource;
