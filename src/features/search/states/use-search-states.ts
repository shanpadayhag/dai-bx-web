import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { SearchKind, SearchSection } from '@/features/search/entities/search-result';

const useSearchStates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [searchSections, setSearchSections] = useState<SearchSection[]>([]);
  const [expandedKind, setExpandedKind] = useState<SearchKind | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<AppError | null>(null);
  const [startingResultKey, setStartingResultKey] = useState<string | null>(null);
  const [searchRetryCount, setSearchRetryCount] = useState(0);

  return {
    searchQuery,
    setSearchQuery,
    searchedQuery,
    setSearchedQuery,
    searchSections,
    setSearchSections,
    expandedKind,
    setExpandedKind,
    activeResultIndex,
    setActiveResultIndex,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    startingResultKey,
    setStartingResultKey,
    searchRetryCount,
    setSearchRetryCount,
  };
};

export default useSearchStates;
