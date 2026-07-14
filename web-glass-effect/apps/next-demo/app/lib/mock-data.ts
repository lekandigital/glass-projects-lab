export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
};

export const tracks: Track[] = [
  {
    id: '1',
    title: 'Northern Lights',
    artist: 'Vela Drive',
    album: 'Moon Signals',
    duration: '3:41',
    coverUrl: 'https://picsum.photos/id/1025/420/420',
  },
  {
    id: '2',
    title: 'City Echoes',
    artist: 'Sonic Harbor',
    album: 'Night Lines',
    duration: '4:03',
    coverUrl: 'https://picsum.photos/id/1011/420/420',
  },
  {
    id: '3',
    title: 'Pulse in Blue',
    artist: 'Neon Chords',
    album: 'Electric Shore',
    duration: '2:58',
    coverUrl: 'https://picsum.photos/id/1040/420/420',
  },
  {
    id: '4',
    title: 'Cloud Anthem',
    artist: 'Aurora Unit',
    album: 'Skylight',
    duration: '3:24',
    coverUrl: 'https://picsum.photos/id/1003/420/420',
  },
  {
    id: '5',
    title: 'Golden Tape',
    artist: 'Mellow Array',
    album: 'Archive FM',
    duration: '4:12',
    coverUrl: 'https://picsum.photos/id/1035/420/420',
  },
];

export const artworkBackdrop = [
  'https://picsum.photos/id/1050/700/700',
  'https://picsum.photos/id/1062/700/700',
  'https://picsum.photos/id/1074/700/700',
  'https://picsum.photos/id/1084/700/700',
  'https://picsum.photos/id/109/700/700',
  'https://picsum.photos/id/110/700/700',
];
