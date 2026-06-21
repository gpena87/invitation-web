import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

const SCOPES = 'playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
const STORAGE_TOKEN_KEY = 'spotify_access_token';
const STORAGE_EXPIRY_KEY = 'spotify_token_expiry';
const STORAGE_VERIFIER_KEY = 'spotify_code_verifier';
const SPOTIFY_CALLBACK_PATH = '/spotify-callback';

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

interface SpotifyCurrentUser {
  id: string;
}

interface SpotifyPlaylistAccessInfo {
  owner?: { id?: string };
  collaborative?: boolean;
}

export interface PlaylistWriteAccess {
  canWrite: boolean;
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private readonly http = inject(HttpClient);
  private readonly clientId = environment.spotifyClientId;
  private readonly playlistId = environment.spotifyPlaylistId;
  private readonly redirectUri = this.resolveRedirectUri();

  // ── Auth ──────────────────────────────────────────────────────────────────

  async initiateLogin(): Promise<void> {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateCodeChallenge(verifier);
    localStorage.setItem(STORAGE_VERIFIER_KEY, verifier);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  exchangeCodeForToken(code: string): Observable<void> {
    const verifier = localStorage.getItem(STORAGE_VERIFIER_KEY) ?? '';
    const body = new HttpParams()
      .set('client_id', this.clientId)
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', this.redirectUri)
      .set('code_verifier', verifier);

    return this.http
      .post<{ access_token: string; expires_in: number }>(
        'https://accounts.spotify.com/api/token',
        body.toString(),
        { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
      )
      .pipe(
        switchMap(response => {
          this.saveToken(response.access_token, response.expires_in);
          localStorage.removeItem(STORAGE_VERIFIER_KEY);
          return new Observable<void>(obs => { obs.next(); obs.complete(); });
        })
      );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const expiry = Number(localStorage.getItem(STORAGE_EXPIRY_KEY) ?? 0);
    return !!token && Date.now() < expiry;
  }

  getToken(): string | null {
    return this.isAuthenticated() ? localStorage.getItem(STORAGE_TOKEN_KEY) : null;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  }

  // ── Spotify API ───────────────────────────────────────────────────────────

  searchTracks(query: string): Observable<SpotifyTrack[]> {
    const token = this.getToken();
    return this.http
      .get<{ tracks: { items: SpotifyTrack[] } }>(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
        { headers: this.authHeaders(token!) }
      )
      .pipe(switchMap(res => new Observable<SpotifyTrack[]>(obs => {
        obs.next(res.tracks.items);
        obs.complete();
      })));
  }

  addTrackToPlaylist(trackUri: string): Observable<void> {
    const token = this.getToken();
    return this.http.post<void>(
      `https://api.spotify.com/v1/playlists/${this.playlistId}/tracks`,
      { uris: [trackUri] },
      { headers: this.authHeaders(token!) }
    );
  }

  canCurrentUserWritePlaylist(): Observable<PlaylistWriteAccess> {
    const token = this.getToken();
    if (!token) {
      return of({ canWrite: false });
    }

    return forkJoin({
      me: this.http.get<SpotifyCurrentUser>('https://api.spotify.com/v1/me', {
        headers: this.authHeaders(token),
      }),
      playlist: this.http.get<SpotifyPlaylistAccessInfo>(
        `https://api.spotify.com/v1/playlists/${this.playlistId}?fields=owner(id),collaborative`,
        { headers: this.authHeaders(token) }
      ),
    }).pipe(
      map(({ me, playlist }) => {
        const ownerId = playlist.owner?.id ?? '';
        const isOwner = ownerId.length > 0 && ownerId === me.id;
        const isCollaborative = !!playlist.collaborative;
        return { canWrite: isOwner || isCollaborative };
      })
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private saveToken(token: string, expiresIn: number): void {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
  }

  private resolveRedirectUri(): string {
    const configured = (environment.spotifyRedirectUri ?? '').trim();
    if (configured) {
      // If config is root-only, force a deterministic callback path.
      try {
        const parsed = new URL(configured);
        if (!parsed.pathname || parsed.pathname === '/') {
          return `${parsed.origin}${SPOTIFY_CALLBACK_PATH}`;
        }
      } catch {
        return configured;
      }

      // Spotify requires an exact string match with Dashboard settings.
      return configured;
    }
    return `${window.location.origin}${SPOTIFY_CALLBACK_PATH}`;
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
