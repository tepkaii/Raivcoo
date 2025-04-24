// app/projects/[id]/review/[trackId]/ReviewPage.tsx
"use client";

import React, { useState, useRef, useTransition, useEffect, useMemo } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from "@/components/ui/card";
import { RevButtons } from "@/components/ui/RevButtons";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Send, Play, Check, Edit, ThumbsUp, MessageSquareWarning,
  ShieldAlert, Info, Clock, ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";

// Interface for comment data USED in this component
interface Comment {
  id: string;
  timestamp: number;
  comment: string;
  created_at: string;
  commenter_display_name: string; // This will always be the client's name now
}

// Props expected by the ReviewPage client component
interface ReviewPageProps {
  clientDisplayName: string; // Display name for comments (passed from wrapper)
  track: {
    id: string;
    projectId: string;
    roundNumber: number;
    clientDecision: "pending" | "approved" | "revisions_requested";
  };
  project: {
    id: string;
    title: string;
  };
  deliverableLink: string;
  initialComments: Comment[];
  // Server actions passed down
  addCommentAction: (trackId: string, timestamp: number, comment: string) => Promise<any>;
  approveProjectAction: (projectId: string, trackId: string) => Promise<any>;
  requestRevisionsAction: (trackId: string) => Promise<any>;
}

export default function ReviewPage({
  clientDisplayName, // Use this for display
  track,
  project,
  deliverableLink,
  initialComments,
  addCommentAction,
  approveProjectAction,
  requestRevisionsAction,
}: ReviewPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null); // Can be HTMLVideoElement or HTMLAudioElement

  const isDecisionMade = track.clientDecision !== 'pending';

  useEffect(() => { setComments(initialComments); }, [initialComments]);

  // --- Utility Functions ---
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const handleTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const jumpToTime = (time: number) => { if (videoRef.current) { videoRef.current.currentTime = time; videoRef.current.play().catch(console.error); } };

  // --- Action Handlers ---
  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim() || isPending || isDecisionMade) return;
    startTransition(async () => {
      try {
        await addCommentAction(track.id, currentTime, commentText);
        toast({ title: "Success", description: "Comment added!", variant: "success" });
        setCommentText("");
        router.refresh(); // Refresh data from server
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed.", variant: "destructive" });
      }
    });
  };
  const handleApprove = () => {
    if (isPending || isDecisionMade) return;
    if (!confirm(`Approve project "${project.title}"?`)) return;
    startTransition(async () => {
      try {
        await approveProjectAction(project.id, track.id);
        toast({ title: "Project Approved!", variant: "success" });
        router.refresh();
      } catch (error: any) {
        toast({ title: "Approval Failed", description: error.message, variant: "destructive" });
      }
    });
  };
  const handleRequestRevisions = () => {
    if (isPending || isDecisionMade) return;
    let confirmMsg = `Request revisions for Round ${track.roundNumber}?`;
    if (comments.length === 0) confirmMsg = "No feedback left. Still request revisions?";
    if (!confirm(confirmMsg)) return;
    startTransition(async () => {
      try {
        await requestRevisionsAction(track.id);
        toast({ title: "Revisions Requested", variant: "success" });
        router.refresh();
      } catch (error: any) {
        toast({ title: "Request Failed", description: error.message, variant: "destructive" });
      }
    });
  };

  // --- Video/Deliverable Rendering Logic ---
  const { mediaType, embedUrl } = useMemo(() => {
    if (!deliverableLink) return { mediaType: 'none', embedUrl: '' };

    const link = deliverableLink.toLowerCase();
    if (/youtu\.?be/.test(link)) {
      try {
        const urlObj = new URL(deliverableLink);
        let videoId = urlObj.searchParams.get("v");
        if (!videoId && urlObj.hostname === 'youtu.be') videoId = urlObj.pathname.substring(1);
        if (videoId) return { mediaType: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}` };
      } catch (e) { console.error("Bad YouTube URL:", e); }
    }
    if (/vimeo\.com/.test(link)) {
       try {
          const urlObj = new URL(deliverableLink);
          const videoId = urlObj.pathname.split("/").pop();
          if (videoId && /^\d+$/.test(videoId)) return { mediaType: 'vimeo', embedUrl: `http://vimeo.com/3{videoId}` };
       } catch (e) { console.error("Bad Vimeo URL:", e); }
    }
    if (/\.(mp4|webm|ogg|mov|avi|mkv|wmv)$/i.test(link)) return { mediaType: 'video', embedUrl: deliverableLink };
    if (/\.(mp3|wav|ogg|aac|flac)$/i.test(link)) return { mediaType: 'audio', embedUrl: deliverableLink };

    return { mediaType: 'link', embedUrl: deliverableLink }; // Default to generic link
  }, [deliverableLink]);


  // --- Component Return ---
  return (
    <div className="space-y-6 w-full max-w-5xl px-2">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">{project.title} - Round {track.roundNumber} Review</CardTitle>
          <CardDescription>Deliverable review for {clientDisplayName}. Please add feedback below.</CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content Card */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Media Player / Link */}
          <div className="rounded-lg overflow-hidden border bg-black">
            {mediaType === 'youtube' && (
              <div className="aspect-video"><iframe width="100%" height="100%" src={embedUrl} title="YouTube" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe></div>
            )}
            {mediaType === 'vimeo' && (
               <div className="aspect-video"><iframe src={embedUrl} width="100%" height="100%" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Vimeo"></iframe></div>
            )}
            {mediaType === 'video' && (
              <video ref={videoRef} className="w-full aspect-video block" controls onTimeUpdate={handleTimeUpdate} src={embedUrl} />
            )}
             {mediaType === 'audio' && (
               <div className="p-4 bg-gray-900"><audio ref={videoRef as any} className="w-full" controls onTimeUpdate={handleTimeUpdate} src={embedUrl} /></div>
            )}
             {mediaType === 'link' && (
               <div className="p-6 bg-secondary flex flex-col items-center text-center min-h-[200px] justify-center">
                 <MessageSquareWarning className="w-10 h-10 text-muted-foreground mb-3"/>
                 <p className="font-medium mb-1">Cannot preview this link.</p>
                 <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-center gap-1"><ExternalLink className="h-4 w-4"/>View/Download Deliverable</a>
               </div>
             )}
          </div>

          {/* Decision Display */}
          {isDecisionMade && (
            <div className={`p-4 rounded-md border ${track.clientDecision === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {track.clientDecision === 'approved' ? <ThumbsUp className="h-5 w-5 text-green-600" /> : <ShieldAlert className="h-5 w-5 text-red-600" />}
                <p className={`font-semibold ${track.clientDecision === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                  {track.clientDecision === 'approved' ? 'Project Approved' : 'Revisions Requested'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1 pl-7">
                {track.clientDecision === 'approved' ? 'No further action needed.' : 'Editor notified for next round.'}
              </p>
            </div>
          )}

          {/* Comment Input Area */}
          {!isDecisionMade && (
            <form onSubmit={handleSubmitComment} className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                 <Clock className="h-4 w-4"/> Add feedback at: {formatTime(currentTime)}
              </div>
              <div className="flex gap-2 items-end">
                <Textarea placeholder="Enter feedback..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="flex-1" rows={3} disabled={isPending} required aria-label="Feedback comment input"/>
                <RevButtons type="submit" variant="default" size="lg" disabled={isPending || !commentText.trim()} aria-label="Add comment">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Add</span>
                </RevButtons>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Comments Display Area */}
      <Card>
        <CardHeader><CardTitle>Feedback History ({comments.length})</CardTitle></CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No feedback comments yet.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 border rounded-md bg-muted/50">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{comment.commenter_display_name}</p>
                      <p className="text-xs text-muted-foreground">
                           at {formatTime(comment.timestamp)}
                           {/* Show jump button only if media player exists */}
                           {(mediaType === 'video' || mediaType === 'audio') && videoRef.current && (
                               <button onClick={() => jumpToTime(comment.timestamp)} className="ml-2 inline-flex items-center text-primary hover:underline text-xs" title={`Jump to ${formatTime(comment.timestamp)}`}>
                                   <Play className="h-3 w-3 mr-1" /> Jump
                               </button>
                           )}
                       </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0" title={new Date(comment.created_at).toString()}>
                      {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'})}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Action Buttons Card */}
      {!isDecisionMade && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Decision</CardTitle>
            <CardDescription>Submit your decision for Round {track.roundNumber}.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
             <RevButtons variant="destructive" className="flex-1" onClick={handleRequestRevisions} disabled={isPending} aria-label="Request revisions">
                 {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                 Request Revisions (New Round)
             </RevButtons>
             <RevButtons variant="success" className="flex-1" onClick={handleApprove} disabled={isPending} aria-label="Approve project">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                 Approve Final Project
             </RevButtons>
          </CardFooter>
           <CardContent className="text-xs text-muted-foreground flex items-start gap-2 pt-0">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0"/>
                <span>Approving marks the project complete. Requesting revisions starts a new round using the feedback above.</span>
           </CardContent>
        </Card>
      )}
    </div>
  );
}