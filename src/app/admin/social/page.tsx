
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, Loader2, Download } from "lucide-react";
import { searchContent, getSocialImages } from "../add-content/actions";

interface SocialImage {
    file_path: string;
    aspect_ratio: number;
    type: 'poster' | 'backdrop';
}

function ImageDownloadCard({ image, contentTitle }: { image: SocialImage, contentTitle: string }) {
    const imageUrl = `https://image.tmdb.org/t/p/original${image.file_path}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error("Failed to fetch image.");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;

            const extension = blob.type.split('/')[1] || 'jpg';
            const title = contentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const imageType = image.type;
            const shortPath = image.file_path.substring(image.file_path.lastIndexOf('/') + 1).split('.')[0];
            
            a.download = `${title}_${imageType}_${shortPath}.${extension}`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast({ title: "Download Started", description: `Downloading ${imageType} image.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Download Failed", description: error.message });
        }
    };

    return (
        <Card className="overflow-hidden group relative">
            <div className="aspect-[2/3] w-full">
                <Image
                    src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                    alt={`${contentTitle} ${image.type}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
            </div>
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4"/>
                    Download
                </Button>
            </div>
        </Card>
    );
}

export default function SocialPage() {
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
    const [tmdbSearchType, setTmdbSearchType] = useState<'movie' | 'tv'>("movie");
    const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingImages, setIsFetchingImages] = useState(false);
    const [selectedContent, setSelectedContent] = useState<{ id: number, title: string, type: 'movie' | 'tv' } | null>(null);
    const [images, setImages] = useState<SocialImage[]>([]);

    const handleTmdbSearch = async () => {
        if (!tmdbSearchQuery) return;
        setIsSearching(true);
        setSelectedContent(null);
        setImages([]);
        const results = await searchContent(tmdbSearchQuery, tmdbSearchType, false);
        setTmdbSearchResults(results);
        setIsSearching(false);
    };

    const handleSelectTmdbResult = async (result: any) => {
        const tmdbType = result.media_type === 'movie' ? 'movie' : 'tv';
        setSelectedContent({ id: result.id, title: result.title, type: tmdbType });
        setTmdbSearchResults([]);
        setTmdbSearchQuery(result.title);
        
        setIsFetchingImages(true);
        const fetchedImages = await getSocialImages(result.id, tmdbType);
        
        const posters: SocialImage[] = fetchedImages.posters.map((p: any) => ({...p, type: 'poster'}));
        const backdrops: SocialImage[] = fetchedImages.backdrops.map((b: any) => ({...b, type: 'backdrop'}));

        setImages([...posters.slice(0, 10), ...backdrops.slice(0,10)]); // Limit to 10 of each
        setIsFetchingImages(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Media Asset Generator</CardTitle>
                <CardDescription>
                    Search for content to download promotional images like posters and backdrops.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                        <h4 className="font-semibold text-center">Search for Content</h4>
                        <div className="flex w-full items-center space-x-2">
                            <Select
                                value={tmdbSearchType}
                                onValueChange={(value) => setTmdbSearchType(value as any)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="movie">Movie</SelectItem>
                                    <SelectItem value="tv">Series/Drama</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="text"
                                placeholder={`Search for a ${tmdbSearchType}...`}
                                value={tmdbSearchQuery}
                                onChange={(e) => setTmdbSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTmdbSearch(); }}}
                            />
                            <Button type="button" onClick={handleTmdbSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                        {tmdbSearchResults.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {tmdbSearchResults.map((result) => (
                                    <button key={result.id} type="button" onClick={() => handleSelectTmdbResult(result)} className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-4">
                                        <Image src={result.poster_path ? `https://image.tmdb.org/t/p/w92${result.poster_path}` : "/placeholder.svg"} alt="poster" width={40} height={60} className="rounded-sm" />
                                        <div>
                                            <p className="font-semibold">{result.title}</p>
                                            {result.release_date && <p className="text-xs text-muted-foreground">{new Date(result.release_date).getFullYear()}</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {isFetchingImages && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-4">Fetching images...</p>
                        </div>
                    )}
                    
                    {!isFetchingImages && images.length > 0 && selectedContent && (
                        <div>
                             <h3 className="text-xl font-bold mb-4">Images for: {selectedContent.title}</h3>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((image) => (
                                    <ImageDownloadCard key={image.file_path} image={image} contentTitle={selectedContent.title} />
                                ))}
                            </div>
                        </div>
                    )}

                    {!isFetchingImages && selectedContent && images.length === 0 && (
                         <div className="text-center py-10">
                            <p className="text-muted-foreground">No extra images found for this content.</p>
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    );
}
