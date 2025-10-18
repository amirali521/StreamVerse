export interface ContentItem {
  id: string;
  title: string;
  description: string;
  imageId: string;
}

export const trending: ContentItem[] = [
  { id: '1', title: 'The Crown of Ages', description: 'A historical epic.', imageId: 'content-1' },
  { id: '2', title: 'Cybernetic Dawn', description: 'A futuristic thriller.', imageId: 'content-2' },
  { id: '3', title: 'Love in the City', description: 'A modern romance.', imageId: 'content-3' },
  { id: '4', title: 'Shadows of Deceit', description: 'A gripping mystery.', imageId: 'content-4' },
  { id: '5', title: 'Dragon\'s Breath', description: 'A fantasy adventure.', imageId: 'content-5' },
  { id: '6', title: 'The Final Verdict', description: 'A true crime story.', imageId: 'content-6' },
];

export const newReleases: ContentItem[] = [
  { id: '7', title: 'Cosmo Cadets', description: 'An animated space adventure.', imageId: 'content-7' },
  { id: '8', title: 'Maximum Velocity', description: 'A high-octane action film.', imageId: 'content-8' },
  { id: '9', title: 'Victorian Secrets', description: 'A lavish period piece.', imageId: 'content-9' },
  { id: '10', title: 'Neon Blade', description: 'A dark cyberpunk story.', imageId: 'content-10' },
  { id: '11', title: 'Westwood High', description: 'A coming-of-age drama.', imageId: 'content-11' },
  { id: '12', title: 'The Lake House', description: 'An unsettling mystery.', imageId: 'content-12' },
];

export const popularDramas: ContentItem[] = [
  { id: '9', title: 'Victorian Secrets', description: 'A lavish period piece.', imageId: 'content-9' },
  { id: '1', title: 'The Crown of Ages', description: 'A historical epic.', imageId: 'content-1' },
  { id: '11', title: 'Westwood High', description: 'A coming-of-age drama.', imageId: 'content-11' },
  { id: '4', title: 'Shadows of Deceit', description: 'A gripping mystery.', imageId: 'content-4' },
  { id: '6', title: 'The Final Verdict', description: 'A true crime story.', imageId: 'content-6' },
  { id: '2', title: 'Cybernetic Dawn', description: 'A futuristic thriller.', imageId: 'content-2' },
];

export const allContent = [...trending, ...newReleases, ...popularDramas].reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) {
        acc.push(current);
    }
    return acc;
}, [] as ContentItem[]);
