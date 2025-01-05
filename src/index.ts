import express from "express";
import { generateLarkUserDesc, getArtistName } from "./message";
import { RecentSongStatus } from "./lib/enum";
import { Happy, Sadness } from "./lib/qaq";
import { registerOrRefresh } from "./bind";
import { safeJsonParse } from "./lib/utils";
import { sendMessage } from "./lark_im/im";

const app = express();

app.use(express.json());

app.get("/message", async (req, res) => {
  try {
    const { sender_id } = req.query as { sender_id: string };
    const { status, firstSong } = await generateLarkUserDesc(sender_id);

    const musicUrl = `https://music.163.com/#/playlist?id=${firstSong?.id}`;

    if (status === RecentSongStatus.NOT_LOGIN) {
      res.json({
        text: Sadness("登录状态掉了，点我找机器人重新授权吧~"),
        redirect: "https://applink.larkoffice.com/T8SOilzvw9ph",
      });
      return;
    } else if (status === RecentSongStatus.NO_RECENT_SONG) {
      res.json({
        text: Happy("最近没有听歌记录哦"),
        redirect: "https://applink.larkoffice.com/T8SOilzvw9ph",
      });
      return;
    } else if (status === RecentSongStatus.IS_PLAYING) {
      res.json({
        text: `正在听 ${firstSong!.name} - ${getArtistName(firstSong!)}`,
        redirect: musicUrl,
      });
      return;
    } else if (status === RecentSongStatus.JUST_PLAYED) {
      res.json({
        text: `刚刚在听 ${firstSong!.name} - ${getArtistName(firstSong!)}`,
        redirect: musicUrl,
      });
      return;
    } else if (status === RecentSongStatus.TODAY_PLAYED) {
      res.json({
        text: `今天在听 ${firstSong!.name} - ${getArtistName(firstSong!)}`,
        redirect: musicUrl,
      });
      return;
    }

    res.json({
      text: `最近在听 ${firstSong!.name} - ${getArtistName(firstSong!)}`,
    });
    return;
  } catch (error) {
    console.error("Error handling feishu callback:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

app.post("/bind", async (req, res) => {
  let sender_id = "";
  try {
    const event = req.body?.event;
    const text = safeJsonParse(event?.message?.content)?.text;

    sender_id = event?.sender?.sender_id?.union_id;

    if (text && text.length > 0) {
      const registerResult = await registerOrRefresh(sender_id, text);

      if (registerResult.status === RecentSongStatus.BIND_SUCCESS) {
        console.log("绑定成功", {
          sender_id,
          text,
        });
      }
    }

    res.json({
      challenge: req?.body?.challenge,
    });
    return;
  } catch (error) {
    console.error("Error handling feishu callback:", error);
    res.status(500).json({ error: "Internal server error" });
    sendMessage(sender_id, Sadness("糟糕，服务器出错了，快给管理员提oncall反馈吧"));
    return;
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000", process.env.LARK_BOT_TOKEN);
});
