
export interface VideoSource {
  name: string;
  movieUrlTemplate?: string;
  seriesUrlTemplate?: string;
}

// Prioritized list of video sources. The player will try these in order.
export const videoSources: VideoSource[] = [
  {
    name: 'VidLink',
    movieUrlTemplate: 'https://vidlink.pro/movie/{tmdbId}',
    seriesUrlTemplate: 'https://vidlink.pro/tv/{tmdbId}/{season}/{episode}',
  },
  {
    name: 'AutoEmbed',
    movieUrlTemplate: 'https://autoembed.cc/movie?tmdb={tmdbId}',
    seriesUrlTemplate: 'https://autoembed.cc/tv?tmdb={tmdbId}&s={season}&e={episode}',
  },
  {
    name: '2Embed.cc',
    movieUrlTemplate: 'https://www.2embed.cc/embed/{tmdbId}',
    seriesUrlTemplate: 'https://www.2embed.cc/embedtv/{tmdbId}&s={season}&e={episode}',
  },
  {
    name: '2Embed.skin',
    movieUrlTemplate: 'https://www.2embed.skin/embed/{tmdbId}',
    seriesUrlTemplate: 'https://www.2embed.skin/embedtv/{tmdbId}&s={season}&e={episode}',
  },
  {
    name: 'SmashyStream',
    movieUrlTemplate: 'https://player.smashy.stream/movie/{tmdbId}',
    seriesUrlTemplate: 'https://player.smashy.stream/tv/{tmdbId}/{season}/{episode}',
  },
  {
    name: 'SuperEmbed',
    movieUrlTemplate: 'https://superembed.stream/movie/{tmdbId}',
    seriesUrlTemplate: 'https://superembed.stream/tv/{tmdbId}-{season}-{episode}',
  },
  {
    name: 'MoviesAPI',
    movieUrlTemplate: 'https://moviesapi.club/movie/{tmdbId}',
    seriesUrlTemplate: 'https://moviesapi.club/tv/{tmdbId}-{season}-{episode}',
  }
];

export function generateSourceUrls(
  type: 'movie' | 'webseries' | 'drama',
  tmdbId: number,
  season?: number,
  episode?: number
): { name: string, url: string }[] {
  const sources: { name: string, url: string }[] = [];
  
  for (const source of videoSources) {
    let url: string | undefined;
    if (type === 'movie' && source.movieUrlTemplate) {
      url = source.movieUrlTemplate.replace('{tmdbId}', String(tmdbId));
    } else if ((type === 'webseries' || type === 'drama') && source.seriesUrlTemplate) {
      url = source.seriesUrlTemplate
        .replace('{tmdbId}', String(tmdbId))
        .replace('{season}', String(season || 1))
        .replace('{episode}', String(episode || 1));
    }
    
    if (url) {
      sources.push({ name: source.name, url: url });
    }
  }

  return sources;
}
