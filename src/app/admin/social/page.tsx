
"use client";

import { useState, useMemo } from "react";
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
import { Search, Loader2, Download, Copy } from "lucide-react";
import { searchContent, getSocialImages, getContentDetails, generatePostDetails } from "../add-content/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface SocialImage {
    file_path: string;
    aspect_ratio: number;
    type: 'poster' | 'backdrop' | 'logo';
}

interface SocialPost {
    caption: string;
    hashtags: string[];
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
            <div className="aspect-[2/3] w-full bg-muted">
                <Image
                    src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                    alt={`${contentTitle} ${image.type}`}
                    fill
                    className="object-contain"
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

function PostDetailsCard({ title, post, onCopy }: { title: string, post: SocialPost, onCopy: (text: string, type: string) => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Post Details for: {title}</CardTitle>
                <CardDescription>Use the generated caption and hashtags for your social media post.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold">Generated Caption</h4>
                        <Button variant="ghost" size="sm" onClick={() => onCopy(post.caption, "Caption")}>
                            <Copy className="mr-2 h-4 w-4"/> Copy
                        </Button>
                    </div>
                    <Textarea readOnly value={post.caption} rows={4} className="bg-muted/50" />
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold">Hashtags</h4>
                        <Button variant="ghost" size="sm" onClick={() => onCopy(post.hashtags.join(' '), "Hashtags")}>
                            <Copy className="mr-2 h-4 w-4"/> Copy
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/50">
                        {post.hashtags.join(' ')}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SocialPage() {
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
    const [tmdbSearchType, setTmdbSearchType] = useState<'movie' | 'tv'>("movie");
    const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const [selectedContent, setSelectedContent] = useState<{ id: number, title: string, type: 'movie' | 'tv' } | null>(null);
    const [postDetails, setPostDetails] = useState<SocialPost | null>(null);
    const [images, setImages] = useState<{posters: SocialImage[], backdrops: SocialImage[], logos: SocialImage[]}>({posters: [], backdrops: [], logos: []});

    const handleTmdbSearch = async () => {
        if (!tmdbSearchQuery) return;
        setIsSearching(true);
        setSelectedContent(null);
        setImages({posters: [], backdrops: [], logos: []});
        setPostDetails(null);
        const results = await searchContent(tmdbSearchQuery, tmdbSearchType, false);
        setTmdbSearchResults(results);
        setIsSearching(false);
    };

    const handleSelectTmdbResult = async (result: any) => {
        const tmdbType = result.media_type === 'movie' ? 'movie' : 'tv';
        setSelectedContent({ id: result.id, title: result.title, type: tmdbType });
        setTmdbSearchResults([]);
        setTmdbSearchQuery(result.title);
        
        setIsFetchingDetails(true);
        
        const [fetchedImages, details] = await Promise.all([
             getSocialImages(result.id, tmdbType),
             getContentDetails(result.id, tmdbType)
        ]);
        
        const posters: SocialImage[] = (fetchedImages.posters || []).map((p: any) => ({...p, type: 'poster'}));
        const backdrops: SocialImage[] = (fetchedImages.backdrops || []).map((b: any) => ({...b, type: 'backdrop'}));
        const logos: SocialImage[] = (fetchedImages.logos || []).map((l: any) => ({...l, type: 'logo'}));
        setImages({ posters: posters.slice(0, 20), backdrops: backdrops.slice(0, 20), logos: logos.slice(0, 10) });

        if (details) {
            const generatedPost = await generatePostDetails({
                title: details.title,
                description: details.description,
                categories: details.categories || []
            });
            setPostDetails(generatedPost);
        }

        setIsFetchingDetails(false);
    };
    
    const handleCopyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: `${type} Copied!`,
            description: `The ${type.toLowerCase()} has been copied to your clipboard.`,
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Media Asset Generator</CardTitle>
                <CardDescription>
                    Search for content to generate social media posts and download promotional images.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                        <h4 className="font-semibold text-center">1. Search for Content</h4>
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

                    {isFetchingDetails && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Generating post and fetching images...</p>
                        </div>
                    )}
                    
                    {!isFetchingDetails && selectedContent && (
                        <div className="space-y-6">
                            {postDetails && (
                                <div>
                                    <h4 className="text-lg font-semibold text-center mb-4">2. Copy Post Details</h4>
                                    <PostDetailsCard title={selectedContent.title} post={postDetails} onCopy={handleCopyToClipboard} />
                                </div>
                            )}

                             <div>
                                <h4 className="text-lg font-semibold text-center mb-4">3. Download Images</h4>
                                <Tabs defaultValue="posters">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="posters" disabled={images.posters.length === 0}>Posters ({images.posters.length})</TabsTrigger>
                                        <TabsTrigger value="backdrops" disabled={images.backdrops.length === 0}>Backdrops ({images.backdrops.length})</TabsTrigger>
                                        <TabsTrigger value="logos" disabled={images.logos.length === 0}>Logos ({images.logos.length})</TabsTrigger>
                                    </TabsList>
                                    <ScrollArea className="h-96 w-full rounded-md border mt-2">
                                        <div className="p-4">
                                            <TabsContent value="posters">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {images.posters.map((image) => (
                                                        <ImageDownloadCard key={image.file_path} image={image} contentTitle={selectedContent.title} />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="backdrops">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {images.backdrops.map((image) => (
                                                        <ImageDownloadCard key={image.file_path} image={{...image, type: 'backdrop'}} contentTitle={selectedContent.title} />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="logos">
                                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {images.logos.map((image) => (
                                                        <ImageDownloadCard key={image.file_path} image={{...image, type: 'logo'}} contentTitle={selectedContent.title} />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </ScrollArea>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

