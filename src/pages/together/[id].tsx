import LoadingSpinner from "components/LoadingSpinner";
import axiosClient from "configs/axiosClient";
import { defaultAvatar } from "constants/global";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import LayoutPrimary from "layouts/LayoutPrimary";
import { db } from "libs/firebase-app";
import CommentList from "modules/CommentList";
import Message from "modules/Message";
import MovieCard from "modules/MovieCard";
import MovieList from "modules/MovieList";
import WatchActions from "modules/WatchActions";
import WatchCategory from "modules/WatchCategory";
import WatchMeta from "modules/WatchMeta";
import WatchStar from "modules/WatchStar";
import WatchSummary from "modules/WatchSummary";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { FormEvent, memo, SyntheticEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Player } from "react-tuby";
import { useAppSelector } from "store/global-store";
import styles from "styles/watch.module.scss";
import { IEpisode, IRoomInfo } from "types";
import classNames from "utils/classNames";
import { v4 as uuidv4 } from "uuid";
const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false
});

const WatchTogether = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const [isFirstPlay, setIsFirstPlay] = useState(true);
  const { currentUser } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IEpisode>();
  const [commentValue, setCommentValue] = useState("");
  const [roomInfo, setRoomInfo] = useState<IRoomInfo>();
  const playerRef = useRef<HTMLVideoElement | null>(null);

  const handleFirstPlay = (e: SyntheticEvent<HTMLVideoElement>) => {
    if (!isFirstPlay) return;
    const node = e.target as HTMLVideoElement;
    node.currentTime = roomInfo?.currentTime || 0;
    setIsFirstPlay(false);
  };
  const handlePlay = async () => {
    const roomRef = doc(db, "rooms", id);
    await updateDoc(roomRef, {
      isPlaying: true
    });
  };
  const handlePause = async () => {
    const roomRef = doc(db, "rooms", id);
    await updateDoc(roomRef, {
      isPlaying: false
    });
  };
  const handleTimeUpdate = async (e: SyntheticEvent<HTMLVideoElement>) => {
    const node = e.target as HTMLVideoElement;
    const colRef = doc(db, "rooms", id);
    await updateDoc(colRef, {
      currentTime: node.currentTime
    });
  };
  const handleAddComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in!");
      return;
    }
    try {
      const colRef = doc(db, "rooms", id as string);
      const cloneRoomInfo = roomInfo;
      cloneRoomInfo?.messages.push({
        id: uuidv4(),
        userId: currentUser.uid,
        avatar: currentUser.photoURL || defaultAvatar,
        fullname: currentUser.displayName,
        content: commentValue
      });
      await updateDoc(colRef, { messages: cloneRoomInfo?.messages });
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setCommentValue("");
    }
  };

  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!id) return;
      const roomRef = doc(db, "rooms", id);
      const docSnap = await getDoc(roomRef);
      if (!docSnap.exists()) return;
      setRoomInfo(docSnap.data() as IRoomInfo);
    };
    fetchRoomInfo();
  }, [id]);
  useEffect(() => {
    const fetchDetailsMovie = async () => {
      if (!roomInfo?.movieId) return;
      setLoading(true);
      const { movieId, categoryId, episodeId } = roomInfo;
      try {
        const { data } = await axiosClient.get(`/api/episode`, {
          params: { id: movieId, category: categoryId, episode: episodeId }
        });
        setData(data);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetailsMovie();
  }, [roomInfo]);

  if (!data || loading) {
    return (
      <LayoutPrimary>
        <LoadingSpinner />
      </LayoutPrimary>
    );
  }
  return (
    <LayoutPrimary>
      <div className="container">
        <div className={styles.layout}>
          <div
            className={classNames(
              styles.layoutMain,
              currentUser?.uid !== roomInfo?.hostId && "tuby-controls-hidden"
            )}
          >
            <Player src={data.qualities} subtitles={data.subtitles} playerRef={playerRef}>
              {(ref, props) => (
                <ReactHlsPlayer
                  {...props}
                  playerRef={ref}
                  autoPlay={true}
                  poster={data.coverHorizontalUrl}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeeked={handleTimeUpdate}
                  onProgress={handleTimeUpdate}
                  onCanPlay={handleFirstPlay}
                />
              )}
            </Player>
            <h1 className={styles.heading}>
              {data.name} {data.currentEpName && `- ${data.currentEpName}`}
            </h1>
            <div className={styles.meta}>
              <WatchMeta
                areaList={data.areaList}
                currentEpisode={data.currentEpisode}
                episodeCount={data.episodeCount}
                year={data.year}
                score={data.score}
              />
              <WatchActions
                id={data.id}
                title={data.name}
                domainType={data.category}
                poster={data.coverVerticalUrl}
              />
            </div>
            <WatchCategory categories={data.tagList} />
            <WatchSummary introduction={data.introduction} />
            <WatchStar starList={data.starList} />
          </div>
          <div className={classNames(styles.layoutSidebar, "scrollbar")}>
            <span className={styles.notification}>
              <b>Thuan Bach</b> has joined the room
            </span>
            {roomInfo?.messages.map((message: any) => (
              <Message
                key={message.id}
                isMe={currentUser?.uid === message.userId}
                username={message.fullname}
                content={message.content}
                avatar={defaultAvatar}
              />
            ))}
            <form className={styles.form} onSubmit={handleAddComment}>
              <input
                type="text"
                placeholder="Write comment"
                value={commentValue}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onChange={(e) => setCommentValue(e.target.value)}
              />
            </form>
          </div>
        </div>
        <div className={styles.layoutMain}>
          <CommentList />
        </div>
        <MovieList heading="You may like">
          {data.likeList.map((movie: any) => (
            <MovieCard
              key={movie.id}
              id={movie.id}
              title={movie.name}
              poster={movie.coverVerticalUrl}
              domainType={movie.category}
            />
          ))}
        </MovieList>
      </div>
    </LayoutPrimary>
  );
};

export default memo(WatchTogether);
