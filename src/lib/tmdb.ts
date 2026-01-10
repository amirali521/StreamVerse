
import { generateHeroSummary } from "@/ai/flows/generate-hero-summary";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

if (!TMDB_API_KEY) {
  console.warn("TMDB_API_KEY is not set. TMDB features will be disabled.");
}

interface SearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
}

export async function searchContent(query: string, type: 'movie' | 'tv' | 'multi'): Promise<SearchResult[]> {
  if (!TMDB_API_KEY) return [];

  const searchType = type === 'movie' || type === 'tv' ? type : 'multi';
  const url = `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return data.results.map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      release_date: item.release_date || item.first_air_date,
      poster_path: item.poster_path,
      media_type: item.media_type || type, // Use provided type if media_type is missing
    }));

  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
}

export async function getTMDBDetails(id: number, type: 'movie' | 'tv'): Promise<any> {
    if (!TMDB_API_KEY) return null;
    
    const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,images,videos`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Use poster_path for bannerImageUrl (cards) - this is the portrait image
        const bannerPath = data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : '';
        // Use backdrop_path for posterImageUrl (hero/player) - this is the landscape image
        const posterPath = data.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${data.backdrop_path}` : bannerPath; // fallback to banner

        const trailer = data.videos?.results?.find(
          (video: any) => video.site === 'YouTube' && video.type === 'Trailer'
        );
        
        const releaseDate = data.release_date || data.first_air_date;
        const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;

        return {
            title: data.title || data.name,
            description: data.overview,
            releaseYear: releaseYear,
            imdbRating: data.vote_average ? (data.vote_average / 2 * 10 / 5).toFixed(1) : 0, // Convert to 10-point scale
            categories: data.genres?.map((g: any) => g.name) || [],
            bannerImageUrl: bannerPath,
            posterImageUrl: posterPath,
            trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
        };
    } catch (error) {
        console.error("Error getting TMDB details:", error);
        return null;
    }
}

export async function getTMDBImages(id: number, type: 'movie' | 'tv'): Promise<{ posters: any[], backdrops: any[], logos: any[] }> {
    if (!TMDB_API_KEY) return { posters: [], backdrops: [], logos: [] };

    const url = `${TMDB_BASE_URL}/${type}/${id}/images?api_key=${TMDB_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            posters: data.posters || [],
            backdrops: data.backdrops || [],
            logos: data.logos || []
        };
    } catch (error) {
        console.error("Error getting TMDB images:", error);
        return { posters: [], backdrops: [], logos: [] };
    }
}


export async function getUpcomingMovies(): Promise<any[]> {
    if (!TMDB_API_KEY) return [];

    const url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Get details for each upcoming movie to fetch trailers and generate summaries
        const moviesWithDetails = await Promise.all(
            data.results.slice(0, 5).map(async (movie: any) => {
                const details = await getTMDBDetails(movie.id, 'movie');
                const summary = await generateHeroSummary({
                    title: movie.title,
                    description: movie.overview,
                });
                return {
                    ...movie,
                    ...details,
                    aiSummary: summary.cinematicDescription,
                };
            })
        );
        return moviesWithDetails;

    } catch (error) {
        console.error("Error fetching upcoming movies:", error);
        return [];
    }
}
