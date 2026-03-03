import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import { debounce } from "@mui/material/utils";
import { CircularProgress } from "@mui/material";
import type { SearchResult } from "../../graphql/types";
import type { Interaction } from "../../graphql/types";
import { useSearchResults } from "../../hooks/useSearchResults";
import { identityRoute, interactionRoute } from "../../routes/routes";
import { useWorkspacePath } from "../../hooks/useWorkspacePath";

type GlobalSearchAppBarProps = {
  isMobile: boolean;
}

const GlobalSearchAppBar: React.FC<GlobalSearchAppBarProps> = ({ isMobile }) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState<SearchResult | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [queryString, setQueryString] = useState("");
  const workspacePath = useWorkspacePath();

  const { results, loading, error, hasMore, fetchNextPage } =
    useSearchResults(queryString);

  const debounceQuery = useMemo(
    () =>
      debounce((_event, newInputValue) => {
        setQueryString(newInputValue);
      }, 500),
    [],
  );

  const handleSearchChange = (
    _event: React.SyntheticEvent,
    newValue: SearchResult | null,
  ) => {
    setSearchValue(newValue);
    if (newValue && newValue.id) {
      const navRoute =
        newValue.__typename === "Identity"
          ? identityRoute(newValue.id)
          : interactionRoute(newValue.id, "overview");
      navigate(workspacePath(navRoute));
      setSearchValue(null);
      setInputValue("");
    }
  };

  const handleClose = () => {
    setSearchValue(null);
    setInputValue("");
  };

  const handleScroll = (event: React.UIEvent<HTMLUListElement>) => {
    const listboxNode = event.currentTarget;
    const isAtBottom =
      listboxNode.scrollTop + listboxNode.clientHeight >=
      listboxNode.scrollHeight - 5;

    if (isAtBottom && hasMore && !loading) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if '/' is pressed and not currently focused in another input
      if (event.key === "/" && document.activeElement !== inputRef.current) {
        event.preventDefault(); // Prevent '/' from being typed initially
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setQueryString("");
        setInputValue("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* Adding this for screen readers - since can't read circular progress UI */}
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: "0",
        }}
      >
        {loading
          ? "Searching..."
          : hasMore
            ? `${results.length} results loaded. Scroll for more.`
            : `${results.length} results loaded.`}
        {error && `An error has occurred.`}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ml: "auto",
          mr: "auto",
        }}
      >
        <SearchIcon sx={{ mr: 1, color: "#6b7280" }} />
        <Autocomplete
          disablePortal
          blurOnSelect
          clearOnEscape
          fullWidth
          id="global-search"
          loading={loading}
          value={searchValue}
          onClose={handleClose}
          options={results || []}
          groupBy={(option) =>
            option.__typename === "Identity" ? "Identities" : "Interactions"
          }
          ListboxProps={{
            onScroll: handleScroll,
            style: { maxHeight: "400px" },
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
            // Mobile: transition into mobile search route early
            if (isMobile) {
              navigate(
                workspacePath(`/search?q=${encodeURIComponent(newInputValue)}`),
                {
                  replace: true,
                  state: { from: location },
                },
              );
              return; // don’t debounce here on mobile — the route owns search
            }
            debounceQuery(event, newInputValue);
          }}
          filterOptions={(x) => x}
          getOptionLabel={(option) =>
            option.__typename === "Identity"
              ? option.name
              : (option as Interaction).title
          }
          getOptionKey={(option) => option.id}
          sx={{
            backgroundColor: "white",
            borderRadius: 1,
          }}
          onChange={handleSearchChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Global Search. Press / to focus."
              size="small"
              variant="outlined"
              aria-busy={loading}
              inputRef={inputRef}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <Box component="li" key={key} {...optionProps}>
                {option.__typename === "Identity"
                  ? option.name
                  : (option as Interaction).title}
              </Box>
            );
          }}
        />
      </Box>
    </>
  );
};

export default GlobalSearchAppBar;
