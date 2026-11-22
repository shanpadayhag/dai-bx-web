import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import AppError from '@/core/app-error';
import hidePopover, { showPopover } from '@/core/popover';
import findSearchResults, { isSearchable } from '@/features/search/actions/find-search-results';
import {
  searchResultPath,
  searchResultStartTarget,
  type SearchKind,
  type SearchResult,
} from '@/features/search/entities/search-result';
import type useSearchStates from '@/features/search/states/use-search-states';
import { useTracking } from '@/features/tracking/states/tracking-context';

export const SEARCH_PANEL_ID = 'search-panel';
export const SEARCH_INPUT_ID = 'search-input';
const SEARCH_DEBOUNCE_MILLIS = 150;

const isSearchShortcut = (keyEvent: globalThis.KeyboardEvent) =>
  (keyEvent.metaKey || keyEvent.ctrlKey) && !keyEvent.altKey && keyEvent.key.toLowerCase() === 'k';

const openAddress = (resultPath: string, pushPath: (path: string) => void) => {
  const targetPathname = resultPath.split('?')[0];
  if (window.location.pathname === targetPathname) {
    window.location.assign(resultPath);
    return;
  }
  pushPath(resultPath);
};

const useSearchEvents = (states: ReturnType<typeof useSearchStates>) => {
  const {
    searchQuery,
    setSearchQuery,
    setSearchedQuery,
    searchSections,
    setSearchSections,
    expandedKind,
    setExpandedKind,
    activeResultIndex,
    setActiveResultIndex,
    setIsSearching,
    setSearchError,
    setStartingResultKey,
    searchRetryCount,
    setSearchRetryCount,
  } = states;
  const router = useRouter();
  const { calendarTimeZone, runningSourceIds, handleStartTask, handleStartCard } = useTracking();
  const latestSearchNumberRef = useRef(0);
  const isPanelOpenRef = useRef(false);

  const shownResults = useMemo(
    () =>
      searchSections
        .filter((searchSection) => expandedKind === null || searchSection.kind === expandedKind)
        .flatMap((searchSection) => searchSection.results),
    [expandedKind, searchSections],
  );

  useEffect(() => {
    const searchNumber = latestSearchNumberRef.current + 1;
    latestSearchNumberRef.current = searchNumber;
    if (!isSearchable(searchQuery)) {
      setSearchSections([]);
      setSearchedQuery('');
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const searchTimer = window.setTimeout(() => {
      void (async () => {
        try {
          const foundSections = await findSearchResults({ query: searchQuery, expandedKind });
          if (latestSearchNumberRef.current !== searchNumber) return;
          setSearchSections(foundSections);
          setSearchedQuery(searchQuery.trim());
          setSearchError(null);
          setActiveResultIndex(0);
        } catch (searchFailure) {
          if (latestSearchNumberRef.current !== searchNumber) return;
          if (!(searchFailure instanceof AppError)) throw searchFailure;
          setSearchError(searchFailure);
        } finally {
          if (latestSearchNumberRef.current === searchNumber) setIsSearching(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MILLIS);
    return () => window.clearTimeout(searchTimer);
  }, [
    expandedKind,
    searchQuery,
    searchRetryCount,
    setActiveResultIndex,
    setIsSearching,
    setSearchError,
    setSearchSections,
    setSearchedQuery,
  ]);

  useEffect(() => {
    const toggleOnShortcut = (keyEvent: globalThis.KeyboardEvent) => {
      if (!isSearchShortcut(keyEvent)) return;
      keyEvent.preventDefault();
      if (isPanelOpenRef.current) {
        hidePopover(SEARCH_PANEL_ID);
        return;
      }
      showPopover(SEARCH_PANEL_ID);
    };
    window.addEventListener('keydown', toggleOnShortcut);
    return () => window.removeEventListener('keydown', toggleOnShortcut);
  }, []);

  const handlePanelToggle = useCallback(
    (newState: string) => {
      isPanelOpenRef.current = newState === 'open';
      if (newState === 'open') {
        document.getElementById(SEARCH_INPUT_ID)?.focus();
        return;
      }
      setSearchQuery('');
      setExpandedKind(null);
      setActiveResultIndex(0);
      setStartingResultKey(null);
    },
    [setActiveResultIndex, setExpandedKind, setSearchQuery, setStartingResultKey],
  );

  const handleChangeQuery = useCallback(
    (nextQuery: string) => {
      setSearchQuery(nextQuery);
      setActiveResultIndex(0);
    },
    [setActiveResultIndex, setSearchQuery],
  );

  const handleOpenResult = useCallback(
    (searchResult: SearchResult) => {
      hidePopover(SEARCH_PANEL_ID);
      openAddress(searchResultPath(searchResult, calendarTimeZone), (resultPath) =>
        router.push(resultPath),
      );
    },
    [calendarTimeZone, router],
  );

  const handleStartResult = useCallback(
    async (searchResult: SearchResult) => {
      const startTarget = searchResultStartTarget(searchResult, runningSourceIds);
      if (startTarget === null) return;
      setStartingResultKey(searchResult.key);
      const hasStarted =
        startTarget.sourceKind === 'task'
          ? await handleStartTask(startTarget.sourceId)
          : await handleStartCard(startTarget.sourceId);
      setStartingResultKey(null);
      if (hasStarted) hidePopover(SEARCH_PANEL_ID);
    },
    [handleStartCard, handleStartTask, runningSourceIds, setStartingResultKey],
  );

  const handleQueryKeyDown = useCallback(
    (keyEvent: KeyboardEvent<HTMLInputElement>) => {
      const resultCount = shownResults.length;
      if (keyEvent.key === 'ArrowDown' || keyEvent.key === 'ArrowUp') {
        keyEvent.preventDefault();
        if (resultCount === 0) return;
        const stepCount = keyEvent.key === 'ArrowDown' ? 1 : -1;
        setActiveResultIndex(
          (currentIndex) => (currentIndex + stepCount + resultCount) % resultCount,
        );
        return;
      }
      if (keyEvent.key !== 'Enter') return;
      const activeResult = shownResults[activeResultIndex];
      if (activeResult === undefined) return;
      keyEvent.preventDefault();
      if (keyEvent.metaKey || keyEvent.ctrlKey) {
        void handleStartResult(activeResult);
        return;
      }
      handleOpenResult(activeResult);
    },
    [activeResultIndex, handleOpenResult, handleStartResult, setActiveResultIndex, shownResults],
  );

  const handleShowAll = useCallback(
    (searchKind: SearchKind) => {
      setExpandedKind(searchKind);
      setActiveResultIndex(0);
      document.getElementById(SEARCH_INPUT_ID)?.focus();
    },
    [setActiveResultIndex, setExpandedKind],
  );

  const handleShowEveryKind = useCallback(() => {
    setExpandedKind(null);
    setActiveResultIndex(0);
    document.getElementById(SEARCH_INPUT_ID)?.focus();
  }, [setActiveResultIndex, setExpandedKind]);

  const handleRetrySearch = useCallback(
    () => setSearchRetryCount(searchRetryCount + 1),
    [searchRetryCount, setSearchRetryCount],
  );

  return {
    shownResults,
    runningSourceIds,
    calendarTimeZone,
    handlePanelToggle,
    handleChangeQuery,
    handleQueryKeyDown,
    handleOpenResult,
    handleStartResult,
    handleShowAll,
    handleShowEveryKind,
    handleRetrySearch,
    handleHoverResult: setActiveResultIndex,
  };
};

export default useSearchEvents;
