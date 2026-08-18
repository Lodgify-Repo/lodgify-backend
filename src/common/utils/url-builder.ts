export class UrlBuilder {
  /**
   * Takes an array of strings representing different parts of the URL and returns a sanitized URL by joining these parts together.
   */
  static compose(parts: string[]): string {
    const joined = parts.join('/');
    return UrlBuilder.sanitizeURL(joined);
  }

  /**
   * Constructs a complete endpoint URL by appending a specific endpoint to the base URL and API version.
   */
  buildEndpoint(baseUrl: string, version: string, endpoint: string): string {
    return UrlBuilder.compose([baseUrl, version, endpoint]);
  }

  /**
   * Replaces any occurrences of consecutive slashes with a single slash, ensuring that the URL is valid.
   * Preserves '://' for protocols.
   */
  static sanitizeURL(url: string): string {
    return url.replace(/([^:]\/)\/+/g, '$1');
  }
}
