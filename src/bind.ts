import { login_status } from "NeteaseCloudMusicApi";
import { getRecentSongs } from "./lib/music";
import { RecentSongStatus } from "./lib/enum";
import { prisma } from "./lib/prisma";
import { sendMessage } from "./lark_im/im";
import { Happy, Sadness } from "./lib/qaq";

export const registerOrRefresh = async (sender_id: string, message: string) => {
  const parseCookie = (text: string) => {
    const cookie = text.split("/bind ")[1];
    return cookie;
  };

  const cookie = parseCookie(message);

  const recentSong = await getRecentSongs(cookie);

  const loginStatus = await login_status({
    cookie,
  });

  const isLoginActive =
    loginStatus.body.data?.profile !== null &&
    loginStatus.body.data?.account?.userId !== null;

  if (!isLoginActive) {
    sendMessage(
      sender_id,
      Sadness("cookie好像有点问题，请再次确认cookie是否完整且正确~")
    );
    return { status: RecentSongStatus.NOT_LOGIN, firstSong: null };
  }

  const firstSongMeta = recentSong?.[0];
  const firstSong = firstSongMeta?.data;
  const artistName = firstSong?.ar.map((artist) => artist.name).join("/");
  const songName = firstSong?.name;

  const isUserExist = await prisma.user.findFirst({
    where: {
      id: sender_id,
    },
  });

  if (!isUserExist) {
    await prisma.user.create({
      data: {
        id: sender_id,
        cookie: cookie,
        lastSong: {
          create: {
            artistName,
            songId: firstSong.id,
            name: songName,
            lastPlayTime: new Date(firstSongMeta?.playTime || 0),
          },
        },
      },
    });
  } else {
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
  }

  sendMessage(sender_id, Happy("绑定成功啦~"));
  return { status: RecentSongStatus.BIND_SUCCESS };
};
