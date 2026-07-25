'use client';

export type SharedBackdrop = 'default' | 'photograph' | 'video';

export const SHARED_PHOTO_URL = 'https://picsum.photos/id/1043/1200/900';
export const SHARED_VIDEO_URL = 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4';

export const SHARED_BACKDROPS: Array<{ key: SharedBackdrop; label: string }> = [
    { key: 'default', label: 'Default scene' },
    { key: 'photograph', label: 'Photograph' },
    { key: 'video', label: 'Video' },
];

export function SharedMediaLayer({ backdrop }: { backdrop: SharedBackdrop }) {
    if (backdrop === 'default') return null;

    if (backdrop === 'video') {
        return (
            <video
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                src={SHARED_VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden
            />
        );
    }

    return (
        <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${SHARED_PHOTO_URL}")` }}
            aria-hidden
        />
    );
}
