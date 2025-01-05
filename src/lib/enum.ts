export enum RecentSongStatus {
  /**
   * 未登录
   */
  NOT_LOGIN = 0,
  /**
   * 没有听歌记录
   */
  NO_RECENT_SONG = 1,
  /**
   * 正在听歌
   */
  IS_PLAYING = 2,
  /**
   * 刚刚听完
   */
  JUST_PLAYED = 3,
  /**
   * 今天听完
   */
  TODAY_PLAYED = 4,
  /**
   * 最近听完
   */
  RECENT_PLAYED = 5,
  /**
   * 绑定成功
   */
  BIND_SUCCESS = 6,
}
