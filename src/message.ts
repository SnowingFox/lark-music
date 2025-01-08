import { login_status, song_detail, login_refresh } from "NeteaseCloudMusicApi";
import { RecentSongStatus } from "./lib/enum";
import { prisma } from "./lib/prisma";
import { getRecentSongs, RecentSong } from "./lib/music";

export const getArtistName = (song: RecentSong["data"]) => {
  return song.ar.map((artist) => artist.name).join("/");
};

const fetchNewCookie = async (oldCookie: string) => {
  const refreshResult = await login_refresh({
    cookie: oldCookie,
  });
  return refreshResult.cookie[0].split('; ').filter(item => item.includes('NMTID=')).join('') + '; ';
}

const updateCookie = async (oldCookie: string) => {
  const NMTID_Cookie = oldCookie.split('; ').find(item => item.includes('NMTID='))
  const newCookie = await fetchNewCookie(NMTID_Cookie?.split('=')[1] as string)
  return oldCookie.split('; ').map(item => item.includes('NMTID=') ? newCookie : item).join('; ');
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

  const recentSong = (await getRecentSongs(cookie))

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

  const firstSongMeta = recentSong?.[1];
  const firstSong = firstSongMeta!.data as RecentSong["data"];

  console.log(`[${new Date().toISOString()}] sender_id: ${sender_id}, first song: ${firstSong.name}`)

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

generateLarkUserDesc('on_8f50697eaec80a106143fcfa067d52a6')