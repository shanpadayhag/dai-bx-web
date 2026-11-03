import type { Metadata } from 'next';
import BoardPage from '@/features/board/pages/board-page';

export const metadata: Metadata = { title: 'Board' };

type BoardRouteProps = {
  searchParams: Promise<{ board?: string; preview?: string }>;
};

const BoardRoute = async ({ searchParams }: BoardRouteProps) => {
  const { board, preview } = await searchParams;
  return <BoardPage boardId={board} hasNoBoards={preview === 'no-boards'} />;
};

export default BoardRoute;
