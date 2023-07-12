import { useEffect, useState } from "react";

const KEY = "2c1b3e14";

const useMovies = query => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        );

        if (!res?.ok)
          throw new Error("Something went wrong while fetching movie!");

        const data = await res.json();

        if (data.Response === "False") throw new Error("Movie not found!");
        setMovies(data.Search);
        setIsLoading(false);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (query.length < 3) {
      setMovies([]);
      setError("");
      return;
    }

    // closeMovieHandler();
    fetchData();
    return () => {
      controller.abort();
    };
  }, [query]);

  return { movies, isLoading, error };
};

export default useMovies;
