import { record_recent_song } from "NeteaseCloudMusicApi";

export interface RecentSong {
  data: {
    id: number;
    name: string;
    ar: {
      name: string;
    }[];
  };
  playTime: number;
}

/**
 * Get recent played songs
 * @param cookie Cookie from login response
 * @param limit Number of songs to return (default: 100)
 * @returns List of recent played songs
 */
export async function getRecentSongs(
  cookie: string,
  limit: number = 100
): Promise<RecentSong[]> {
  try {
    const result = await record_recent_song({
      cookie,
      limit,
    });

    if (result.status !== 200 || result.body.code !== 200) {
      throw new Error("Failed to get recent songs");
    }

    return result.body.data.list;
  } catch (error) {
    console.error("Get recent songs error:", error);
    throw error;
  }
}
