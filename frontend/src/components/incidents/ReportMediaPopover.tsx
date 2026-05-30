import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Image, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { az } from '@/i18n/az';
import {
  hasReportMedia,
  normalizeReportMedia,
  type ReportMediaSource,
} from '@/lib/normalizeReportMedia';
import { parseYouTubeVideoId, youtubeEmbedUrl } from '@/lib/youtube';
import { cn } from '@/lib/utils';

interface Props extends ReportMediaSource {
  className?: string;
  /** High-contrast controls on colored timeline cards. */
  variant?: 'default' | 'timeline';
  /** Show a small inline photo thumbnail (reports list / timeline). */
  showInlinePreview?: boolean;
}

const POPOVER_CONTENT_CLASS =
  'z-[1300] data-[state=open]:animate-in data-[state=closed]:animate-out';

const MediaIconButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'> & {
    label: string;
    variant?: 'default' | 'timeline';
    children: ReactNode;
  }
>(function MediaIconButton(
  { label, children, className, variant = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 transition-colors',
        variant === 'timeline'
          ? 'border-border/70 bg-background text-foreground shadow-sm hover:bg-muted/70'
          : 'h-8 w-8 border-primary/25 bg-primary/10 text-primary hover:border-primary/40 hover:bg-primary/15',
        className,
      )}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
});

function PhotoPopoverContent({ photoUrl }: { photoUrl: string }) {
  return (
    <>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {az.reportMedia.photo}
      </p>
      <img
        src={photoUrl}
        alt=""
        className="max-h-48 w-full rounded-md object-cover"
      />
      <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
        <a href={photoUrl} download target="_blank" rel="noopener noreferrer">
          {az.reportMedia.download}
        </a>
      </Button>
    </>
  );
}

function VideoPopoverContent({ videoUrl }: { videoUrl: string }) {
  const videoId = parseYouTubeVideoId(videoUrl);
  return (
    <>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {az.reportMedia.video}
      </p>
      {videoId ? (
        <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
          <iframe
            title={az.reportMedia.videoEmbedTitle}
            src={youtubeEmbedUrl(videoId)}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {az.reportMedia.videoInvalid}
        </p>
      )}
      <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
          {az.reportMedia.openVideo}
        </a>
      </Button>
    </>
  );
}

export function ReportMediaPopover({
  photoUrl: photoUrlRaw,
  videoUrl: videoUrlRaw,
  photo_url,
  video_url,
  className,
  variant = 'default',
  showInlinePreview = false,
}: Props) {
  const { photoUrl, videoUrl } = normalizeReportMedia({
    photoUrl: photoUrlRaw,
    videoUrl: videoUrlRaw,
    photo_url,
    video_url,
  });

  if (!hasReportMedia({ photoUrl, videoUrl })) return null;

  const isTimeline = variant === 'timeline';
  const showThumb = showInlinePreview || isTimeline;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        isTimeline && 'rounded-md border border-border/60 bg-muted/40 p-2',
        className,
      )}
    >
      {photoUrl && showThumb && (
        <Popover modal>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'block overflow-hidden rounded-md border ring-offset-background transition hover:ring-2',
                isTimeline
                  ? 'border-border/70 hover:ring-primary/30'
                  : 'border-border/80 hover:ring-primary/30',
              )}
              aria-label={az.reportMedia.photoAria}
            >
              <img
                src={photoUrl}
                alt=""
                className="h-14 w-20 object-cover"
                loading="lazy"
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="left"
            align="start"
            collisionPadding={12}
            className={cn(
              POPOVER_CONTENT_CLASS,
              'w-auto max-w-[min(20rem,calc(100vw-2rem))] p-3',
            )}
          >
            <PhotoPopoverContent photoUrl={photoUrl} />
          </PopoverContent>
        </Popover>
      )}

      {photoUrl && !showThumb && (
        <Popover modal>
          <PopoverTrigger asChild>
            <MediaIconButton label={az.reportMedia.photoAria} variant={variant}>
              <Image className="h-4 w-4 shrink-0" aria-hidden />
            </MediaIconButton>
          </PopoverTrigger>
          <PopoverContent
            side="left"
            align="end"
            collisionPadding={12}
            className={cn(
              POPOVER_CONTENT_CLASS,
              'w-auto max-w-[min(20rem,calc(100vw-2rem))] p-3',
            )}
          >
            <PhotoPopoverContent photoUrl={photoUrl} />
          </PopoverContent>
        </Popover>
      )}

      {videoUrl && (
        <Popover modal>
          <PopoverTrigger asChild>
            <MediaIconButton label={az.reportMedia.videoAria} variant={variant}>
              <Youtube className="h-4 w-4 shrink-0" aria-hidden />
              {isTimeline && (
                <span className="text-xs font-medium">{az.reportMedia.video}</span>
              )}
            </MediaIconButton>
          </PopoverTrigger>
          <PopoverContent
            side="left"
            align="end"
            collisionPadding={12}
            className={cn(POPOVER_CONTENT_CLASS, 'w-80 p-3 sm:w-96')}
          >
            <VideoPopoverContent videoUrl={videoUrl} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
