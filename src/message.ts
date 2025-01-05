import { login_status, song_detail } from "NeteaseCloudMusicApi";
import { RecentSongStatus } from "./lib/enum";
import { prisma } from "./lib/prisma";
import { getRecentSongs, RecentSong } from "./lib/music";

export const getArtistName = (song: RecentSong["data"]) => {
  return song.ar.map((artist) => artist.name).join("/");
};

export const generateLarkUserDesc = async (sender_id: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: sender_id,
    },
  });

  if (!user) {
    return { status: RecentSongStatus.NOT_LOGIN, firstSong: null };
  }

  const cookie = user.cookie;

  const recentSong = await getRecentSongs(cookie);

  const loginStatus = await login_status({
    cookie,
  });

  const isLoginActive =
    loginStatus.body.data?.profile !== null &&
    loginStatus.body.data?.account?.userId !== null;

  if (!isLoginActive) {
    return { status: RecentSongStatus.NOT_LOGIN, firstSong: null };
  }
  if (recentSong?.length === 0) {
    return { status: RecentSongStatus.NO_RECENT_SONG, firstSong: null };
  }

  const firstSongMeta = recentSong?.[0];
  const firstSong = firstSongMeta!.data as RecentSong["data"];
  const artistName = firstSong?.ar.map((artist) => artist.name).join("/");
  const songName = firstSong?.name;

  const songDetail = await song_detail({
    ids: firstSong?.id.toString(),
  });

  await prisma.user.update({
    where: {
      id: sender_id,
    },
    data: {
      cookie: cookie,
      lastSong: {
        update: {
          artistName,
          songId: firstSong.id,
          name: songName,
          lastPlayTime: new Date(firstSongMeta?.playTime || 0),
        },
      },
    },
  });

  const duration = songDetail.body.songs[0]?.dt || 0;

  let status;
  if (Date.now() - firstSongMeta.playTime < duration) {
    status = RecentSongStatus.IS_PLAYING;
  } else if (Date.now() - firstSongMeta.playTime > duration) {
    status = RecentSongStatus.JUST_PLAYED;
  } else if (
    new Date(firstSongMeta.playTime).toDateString() ===
    new Date().toDateString()
  ) {
    status = RecentSongStatus.TODAY_PLAYED;
  } else {
    status = RecentSongStatus.RECENT_PLAYED;
  }

  return { status, firstSong };
};


