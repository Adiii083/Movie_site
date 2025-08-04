import React, { use } from 'react'
import {useState,useEffect} from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import {useDebounce} from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const API_BASE_URL='https://api.themoviedb.org/3';
const API_KEY=import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS={
  method:'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}


const App=()=>{
  const[searchTerm, setSearchTerm]=useState('');
  const [errorMessage,setErrorMessage]=useState('');
  const [movieList,setMovieList]=useState([]);
  const[isLoading,setIsLoading]=useState('false');
  const[debouncedSearchTerm,setDebouncedSearchTerm]=useState('');
  const[trendingMovies,setTrendingMovies]=useState([]);

  //Debounce the search term to avoid too many API calls
  //This will wait for 500ms after the user stops typing before updating the search term
  //This is useful to reduce the number of API calls made while the user is typing
  //It helps to improve performance and reduce unnecessary API calls
  //useDebounce is a custom hook that takes a function and a delay as arguments
  //It returns a debounced version of the function that will only be called after the delay
  //In this case, it will update the debouncedSearchTerm after 500ms of inactivity
  //This way, we can avoid making too many API calls while the user is typing
  //This is especially useful for search functionality where the user is typing a query
  //and we want to wait for them to finish typing before making the API call
  //This helps to improve performance and reduce unnecessary API calls    
  useDebounce(()=>setDebouncedSearchTerm(searchTerm),500,[searchTerm])

  const fetchMovies= async(query='')=>{
    setIsLoading(true);
    setErrorMessage('');
    try{
      const endpoint=query? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response= await fetch(endpoint,API_OPTIONS);

      if(!response.ok)
      {
        throw new Error('failed to fetch movies');
      }
       const data =await  response.json();
       if(data.Response==='false')
       {
          setErrorMessage(data.error || 'Failed to fetch movies'); 
          setMovieList([]);
          return;
       }
       setMovieList(data.results || [])
       
       if(query && data.results.length > 0) {
         // If a search term is provided and movies are found, update the search count
         await updateSearchCount(query, data.results[0]);
       }

    }
    catch(error){
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.')
    }
    finally
    {
       setIsLoading(false);
    }
  }

  // Fetch trending movies when the component mounts
   const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      
    }
  }

  useEffect(()=>{
      fetchMovies(debouncedSearchTerm);
  },[debouncedSearchTerm])

  useEffect(()=>{
      loadTrendingMovies();
  },[])

  return(
    <main> 
     <div className='pattern'/>
     <div className='wrapper'>
      <header>
        <img src="./hero.png" alt="Hero Banner"></img>
      <h1> Find <span className="text-gradient">Movies</span> You will enjoy without the hassle</h1>
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/> 
     </header>

     {trendingMovies.length > 0 && (
      <section className='trending'>
        <h2>Trending Movies</h2>
        <ul>
          {trendingMovies.map((movie,index) => (
           <li key={movie.$id}>
             <p>{index + 1}</p>
             <img src={movie.poster_url} alt={movie.title}/>
           </li>
          ))}
        </ul>
      </section>
     )}
     <section className='all-movies'>
      <h2>All Movies</h2>
      

      {
         isLoading ? (<Spinner/>):
         errorMessage ? (<p className='text-red-500'>{errorMessage}</p>):
         (
            <ul>
              
              {movieList.map((movie) => (
  <MovieCard key={movie.id} movie={movie} />
))}

            </ul>
         )
      }
     </section>


     </div>
     
    </main>
  )
}

export default App
