import { IMovieSearch } from "types";
import { IconSearch } from "components/Icons";
import Meta from "components/Meta";
import axiosClient from "configs/axiosClient";
import { PATH } from "constants/path";
import useClickOutside from "hooks/useClickOutside";
import { useDebounce } from "hooks/useDebounce";
import LayoutPrimary from "layouts/LayoutPrimary";
import MovieCard from "modules/MovieCard";
import MovieList from "modules/MovieList";
import { MovieListSkeleton } from "modules/MovieSkeleton";
import styles from "modules/SearchBox/searchBox.module.scss";
import { GetServerSidePropsContext } from "next";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import classNames from "utils/classNames";

interface WatchTogetherCreateProps {
  results: IMovieSearch[];
}

// isShow
// roomId
// hostId

const WatchTogetherCreate = ({ results }: WatchTogetherCreateProps) => {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState<IMovieSearch[]>(results);
  const [suggests, setSuggests] = useState<string[]>([]);
  const debouncedKeyword = useDebounce(keyword, 500);
  const searchResultsRef = useRef(null);
  useClickOutside(searchResultsRef, () => setSuggests([]));
  const fetchSuggestsKeyword = async () => {
    const { data } = await axiosClient(`/api/search/suggest?keyword=${keyword}`);
    setSuggests(data);
  };
  const handleChangeKeyword = async (e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/api/search", { params: { keyword } });
      setMovies(data.results);
    } catch (error) {
      console.log(error);
    } finally {
      setKeyword("");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSuggestsKeyword();
  }, [debouncedKeyword]);
  return (
    <LayoutPrimary>
      <Meta title="Watch together create - NetFilm" />
      <div className="container">
        <div className={classNames(styles.searchBox)}>
          <form className={styles.searchBar} onSubmit={handleSubmit}>
            <input
              type="text"
              value={keyword}
              className={styles.searchInput}
              placeholder="Search movie..."
              onChange={handleChangeKeyword}
            />
            <button type="submit" className={styles.searchButton}>
              <IconSearch />
            </button>
          </form>
          <ul className={classNames(styles.searchResults, "scrollbar")} ref={searchResultsRef}>
            {suggests.map((suggest) => {
              const removeTag = suggest.replaceAll("<em>", "").replaceAll("</em>", "");
              const name = encodeURIComponent(removeTag);
              return (
                <li
                  key={name}
                  dangerouslySetInnerHTML={{ __html: suggest }}
                  className={styles.suggest}
                ></li>
              );
            })}
          </ul>
        </div>
        {loading && <MovieListSkeleton count={12} />}
        {!loading && (
          <MovieList>
            {movies.map((movie) => (
              <MovieCard
                id={movie.id}
                key={movie.id}
                title={movie.name}
                domainType={movie.domainType}
                poster={movie.coverVerticalUrl}
                // href={`${PATH.togetherCreate}/${movie.id}`}
              />
            ))}
          </MovieList>
        )}
      </div>
    </LayoutPrimary>
  );
};

export const getServerSideProps = async ({ query }: GetServerSidePropsContext) => {
  const { data } = await axiosClient.get("/api/search", { params: { keyword: "batman" } });
  return {
    props: {
      results: data.results
    }
  };
};

export default WatchTogetherCreate;
