
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

export async function searchTMDB(query: string, type: 'movie' | 'tv' | 'multi'): Promise<SearchResult[]> {
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
    
    const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,images`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Use poster_path for bannerImageUrl (cards) - this is the portrait image
        const bannerPath = data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : '';
        // Use backdrop_path for posterImageUrl (hero/player) - this is the landscape image
        const posterPath = data.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${data.backdrop_path}` : bannerPath; // fallback to banner

        return {
            title: data.title || data.name,
            description: data.overview,
            imdbRating: data.vote_average ? (data.vote_average / 2 * 10 / 5).toFixed(1) : 0, // Convert to 10-point scale
            categories: data.genres?.map((g: any) => g.name) || [],
            bannerImageUrl: bannerPath,
            posterImageUrl: posterPath,
        };
    } catch (error) {
        console.error("Error getting TMDB details:", error);
        return null;
    }
}
