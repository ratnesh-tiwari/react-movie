import React, { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import useMovies from "./useMovies";
import useLocalStorageState from "./useLocalStorageState";
import useKey from "./useKey";

const average = arr =>
  arr?.reduce((acc, cur, i, arr) => acc + cur / arr?.length, 0);

const KEY = "2c1b3e14";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);

  const [watched, setWatched] = useLocalStorageState([], "watched");

  const selectMovieHandler = id => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  const closeMovieHandler = () => {
    setSelectedId(prev => null);
  };

  const addWatchHandler = movie => {
    setWatched(prev => [...prev, movie]);
  };

  const deleteWatchHandler = id => {
    setWatched(prev => prev.filter(movie => movie.imdbID !== id));
  };

  return (
    <>
      <Navbar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList onSelectMovie={selectMovieHandler} movies={movies} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              watched={watched}
              onAddWatched={addWatchHandler}
              onCloseMovie={closeMovieHandler}
              selectedId={selectedId}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchList onDeleteMovie={deleteWatchHandler} watched={watched} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return <p className="error">{message}</p>;
}

const Navbar = ({ children }) => {
  return <nav className="nav-bar">{children}</nav>;
};

const Logo = () => {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>Movie</h1>
    </div>
  );
};

const NumResults = ({ movies }) => {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
};

const Search = ({ query, setQuery }) => {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    setQuery("");
    inputEl.current.focus();
  });

  return (
    <input
      ref={inputEl}
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
  );
};

const Main = ({ children }) => {
  return <main className="main">{children}</main>;
};

const Box = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen(open => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
};

const MovieList = ({ onSelectMovie, movies }) => {
  return (
    <ul className="list list-movies">
      {movies?.map(movie => (
        <Movie onSelectMovie={onSelectMovie} key={movie.imdbID} movie={movie} />
      ))}
    </ul>
  );
};

const Movie = ({ onSelectMovie, movie }) => {
  return (
    <li
      onClick={() => {
        onSelectMovie(movie.imdbID);
      }}
    >
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
};

const MovieDetails = ({ watched, onAddWatched, onCloseMovie, selectedId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [movie, setMovie] = useState({});
  const [userRating, setUserRating] = useState("");

  const isWatched = watched?.map(movie => movie.imdbID).includes(selectedId);
  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current = countRef.current + 1;
  }, [userRating]);

  const watchedUserRating = watched?.find(
    movie => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Poster: poster,
    Year: year,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre
  } = movie;

  const addHandler = () => {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDescision: countRef.current
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  };

  useKey("Escape", onCloseMovie);

  useEffect(() => {
    const getMovieDetails = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );

        if (!res?.ok)
          throw new Error("Something went wrong while fetching movie!");

        const data = await res.json();

        if (data.Response === "False") throw new Error("Movie not found!");
        setMovie(data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;

    return () => {
      document.title = "Movie";
    };
  }, [title]);

  return (
    <div className="details">
      {isLoading && <Loader />}
      {!isLoading && !error && (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    onSetRating={setUserRating}
                    maxRating={10}
                    size={23}
                  />
                  {userRating > 0 && (
                    <button onClick={addHandler} className="btn-add">
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie {watchedUserRating} <span>⭐️</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

const WatchedSummary = ({ watched }) => {
  const avgImdbRating = average(watched?.map(movie => movie.imdbRating));
  const avgUserRating = average(watched?.map(movie => movie.userRating));
  const avgRuntime = average(watched?.map(movie => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched?.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating?.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
};

const WatchList = ({ onDeleteMovie, watched }) => {
  return (
    <ul className="list">
      {watched?.map(movie => (
        <WatchedMovie
          onDeleteMovie={onDeleteMovie}
          movie={movie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
};

const WatchedMovie = ({ onDeleteMovie, movie }) => {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>

        <button
          className="btn-delete"
          onClick={() => onDeleteMovie(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
};
