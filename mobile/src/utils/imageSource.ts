import { ImageSourcePropType } from 'react-native';
import { API_URL } from '../constants';

/**
 * Wikimedia's image servers reject requests with a generic User-Agent (Android's
 * image loader sends "okhttp/x" and gets HTTP 403), and a custom header isn't
 * passed through by the image loader in Expo Go. So Wikimedia photos are loaded
 * through our server (GET /api/photos), which fetches them with a proper
 * User-Agent and caches them.
 */
const WIKIMEDIA = /^https:\/\/(thumb|upload)\.wikimedia\.org\//;

/** An <Image> source for `uri`; Wikimedia photos go through our server. */
export function imageSource(uri: string): ImageSourcePropType {
  if (WIKIMEDIA.test(uri)) {
    return { uri: `${API_URL}/photos?src=${encodeURIComponent(uri)}` };
  }
  return { uri };
}
