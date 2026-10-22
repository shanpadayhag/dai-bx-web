import type { Metadata } from 'next';
import BoardPage from '@/features/board/pages/board-page';

export const metadata: Metadata = { title: 'Board' };

const BoardRoute = () => <BoardPage />;

export default BoardRoute;
