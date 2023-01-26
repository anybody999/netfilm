export interface IRoomInfo {
  categoryId: string;
  episodeId: string;
  hostId: string;
  movieId: string;
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
