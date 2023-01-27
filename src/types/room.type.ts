export interface IRoomInfo {
  id: string;
  categoryId: string;
  episodeId: string;
  hostId: string;
  movieId: string;
  title: string;
  thumbnail: string;
  currentTime: number;
  isPlaying: boolean;
  messages: {
    id: string;
    userId: string;
    fullname: string;
    avatar: string;
    content: string;
  }[];
}
