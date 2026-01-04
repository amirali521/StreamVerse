
'use server';

import { findContent as findContentFlow } from '@/ai/flows/find-content-flow';
import { getTMDBDetails } from '@/lib/tmdb';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// This is a server-side only file. We can initialize a "server-side" instance of firestore.
// Note: This is still using the client SDK, but in a server environment.
// It's safe because it's only used in Server Actions.
const { firestore } = initializeFirebase();

/**
 * Uses the AI flow to find content based on a natural language query.
 * @param query The natural language query from the user.
 * @returns A promise that resolves to an array of TMDB search results.
 */
export async function findContent(query: string) {
  try {
    const result = await findContentFlow({ query });
    return result.results;
  } catch (error: any) {
    console.error('Error in findContent server action:', error);
    throw new Error(
      `The AI assistant failed to process your request. ${error.message || ''}`
    );
  }
}

/**
 * Fetches full details for a TMDB ID and adds it to the Firestore database.
 * @param tmdbId The TMDB ID of the movie or TV show.
 * @param mediaType The type of content, 'movie' or 'tv'.
 */
export async function addContentFromTmdb(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
) {
  if (!firestore) {
    throw new Error('Firestore is not initialized.');
  }

  // 1. Get full details from TMDB
  const details = await getTMDBDetails(tmdbId, mediaType);
  if (!details) {
    throw new Error('Could not fetch details from TMDB.');
  }

  // 2. Prepare the data for Firestore, matching the Content schema
  const titleWithYear = details.releaseYear ? `${details.title} (${details.releaseYear})` : details.title;

  const contentData = {
    tmdbId,
    title: titleWithYear,
    description: details.description,
    type: mediaType === 'movie' ? 'movie' : 'webseries', // Default 'tv' to 'webseries'
    bannerImageUrl: details.bannerImageUrl,
    posterImageUrl: details.posterImageUrl || details.bannerImageUrl,
    imdbRating: Number(details.imdbRating) || 0,
    categories: details.categories || [],
    isFeatured: false,
    downloadUrl: '',
    embedUrl: '',
    seasons: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 3. Add the document to the 'content' collection
  try {
    const docRef = await addDoc(collection(firestore, 'content'), contentData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error adding content to Firestore:', error);
    throw new Error(`Failed to save content to database: ${error.message}`);
  }
}

    