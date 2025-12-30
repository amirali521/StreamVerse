
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
    name: '2Embed',
    movieUrlTemplate: 'https://www.2embed.cc/embed/{tmdbId}',
    seriesUrlTemplate: 'https://www.2embed.cc/embedtv/{tmdbId}&s={season}&e={episode}',
  },
  {
    name: 'SmashyStream',
    movieUrlTemplate: 'https://player.smashy.stream/movie/{tmdbId}',
    seriesUrlTemplate: 'https://player.smashy.stream/tv/{tmdbId}/{season}/{episode}',
  },
  // Add other sources here in the future
  // {
  //   name: 'SuperEmbed',
  //   movieUrlTemplate: 'https://superembed.stream/movie/{tmdbId}',
  //   seriesUrlTemplate: 'https://superembed.stream/tv/{tmdbId}-{season}-{episode}',
  // },
];

export function generateSourceUrls(
  type: 'movie' | 'webseries' | 'drama',
  tmdbId: number,
  season?: number,
  episode?: number
): string[] {
  const urls: string[] = [];
  
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
      urls.push(url);
    }
  }

  return urls;
}
