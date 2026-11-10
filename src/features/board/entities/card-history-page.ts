import type CardMove from '@/features/board/entities/card-move';

type CardHistoryPage = {
  moves: readonly CardMove[];
  hasOlderMoves: boolean;
  isLoading: boolean;
};

export default CardHistoryPage;
