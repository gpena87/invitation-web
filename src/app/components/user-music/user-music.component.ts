import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit,
  inject, signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, map, finalize, throwError } from 'rxjs';
import { SpotifyService, SpotifyTrack } from '../../services/spotify.service';
import { environment } from '../../../environments/environment';
const AUTOCOMPLETE_MIN_CHARS = 3;

interface AutocompleteItem {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  spotifyTrack: SpotifyTrack | null;
}

interface ItunesSearchResponse {
  results: Array<{
    trackId?: number;
    trackName?: string;
    artistName?: string;
  }>;
}

@Component({
  selector: 'app-user-music',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-music.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMusicComponent implements OnInit {
  title = signal('Nuestra playlist de Spotify');
  subtitle = signal('Hemos creado una playlist especial en Spotify con canciones que significan mucho para nosotros. ¡Esperamos que disfrutes escuchándola tanto como nosotros disfrutamos seleccionando cada canción!');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly fb = inject(FormBuilder);
  private readonly spotify = inject(SpotifyService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly spotifyAutoplayEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(environment.spotifyPlaylistEmbedUrl);

  readonly isAuthenticated = signal(this.spotify.isAuthenticated());
  readonly isExchanging = signal(false);
  readonly isCheckingWriteAccess = signal(false);
  readonly canWriteToPlaylist = signal(true);
  readonly writeAccessMessage = signal<string | null>(null);
  readonly isAdding = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly suggestions = signal<AutocompleteItem[]>([]);
  readonly showSuggestions = signal(false);
  readonly isSearching = signal(false);
  readonly noResults = signal(false);
  readonly searchErrorMessage = signal<string | null>(null);
  readonly selectedTrack = signal<SpotifyTrack | null>(null);
  readonly activeSuggestionIndex = signal(-1);

  readonly songForm = this.fb.nonNullable.group({
    suggestion: ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.checkPlaylistWriteAccess();
    }

    // Handle Spotify OAuth callback (?code=...)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const code = params['code'];
      if (code && !this.spotify.isAuthenticated()) {
        this.isExchanging.set(true);
        this.spotify.exchangeCodeForToken(code).subscribe({
          next: () => {
            this.isAuthenticated.set(true);
            this.checkPlaylistWriteAccess();
            this.isExchanging.set(false);
            // Clean up URL
            this.router.navigate([], { replaceUrl: true });
          },
          error: () => {
            this.isExchanging.set(false);
            this.errorMessage.set('Error al conectar con Spotify. Intenta de nuevo.');
            this.router.navigate([], { replaceUrl: true });
          },
        });
      }
    });

    // Spotify search autocomplete
    this.songForm.controls.suggestion.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();
        this.selectedTrack.set(null);
        if (q.length < AUTOCOMPLETE_MIN_CHARS || !this.spotify.isAuthenticated()) {
          this.suggestions.set([]);
          this.showSuggestions.set(false);
          this.isSearching.set(false);
          this.noResults.set(false);
          this.searchErrorMessage.set(null);
          return of([]);
        }

        this.isSearching.set(true);
        this.noResults.set(false);
        this.searchErrorMessage.set(null);

        return this.spotify.searchTracks(q).pipe(
          map(tracks => this.rankTracks(q, tracks).map(track => this.toAutocompleteFromSpotify(track))),
          catchError(() =>
            this.searchItunesSuggestions(q).pipe(
              catchError((error: unknown) => {
                this.handleSearchError(error);
                return of([]);
              })
            )
          ),
          finalize(() => this.isSearching.set(false))
        );
      })
    ).subscribe(tracks => {
      this.suggestions.set(tracks);
      this.showSuggestions.set(tracks.length > 0);
      this.noResults.set(!this.searchErrorMessage() && tracks.length === 0);
      this.activeSuggestionIndex.set(tracks.length > 0 ? 0 : -1);
    });

    this.songForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.successMessage()) this.successMessage.set(null);
      if (this.errorMessage()) this.errorMessage.set(null);
    });
  }

  loginWithSpotify(): void {
    this.spotify.initiateLogin();
  }

  selectSuggestion(track: SpotifyTrack): void {
    const item = this.toAutocompleteFromSpotify(track);
    this.selectAutocompleteItem(item);
  }

  selectAutocompleteItem(item: AutocompleteItem): void {
    this.selectedTrack.set(item.spotifyTrack);
    this.songForm.controls.suggestion.setValue(item.query, { emitEvent: false });
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.noResults.set(false);
    this.activeSuggestionIndex.set(-1);
  }

  onSuggestionInputChange(): void {
    const value = this.normalize(this.songForm.controls.suggestion.value);
    const match = this.suggestions().find(track => {
      const label = this.normalize(track.query);
      const song = this.normalize(track.title);
      return label === value || song === value;
    }) ?? null;
    this.selectedTrack.set(match?.spotifyTrack ?? null);

    if (value.length >= AUTOCOMPLETE_MIN_CHARS && this.suggestions().length > 0) {
      this.showSuggestions.set(true);
    }

    if (value.length < AUTOCOMPLETE_MIN_CHARS) {
      this.searchErrorMessage.set(null);
    }
  }

  showSuggestionsOnFocus(): void {
    const value = this.normalize(this.songForm.controls.suggestion.value);
    if (value.length >= AUTOCOMPLETE_MIN_CHARS && this.suggestions().length > 0) {
      this.showSuggestions.set(true);
      if (this.activeSuggestionIndex() < 0) this.activeSuggestionIndex.set(0);
    }
  }

  onSuggestionKeydown(event: KeyboardEvent): void {
    const items = this.suggestions();
    if (!this.showSuggestions() || items.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (this.activeSuggestionIndex() + 1) % items.length;
      this.activeSuggestionIndex.set(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (this.activeSuggestionIndex() - 1 + items.length) % items.length;
      this.activeSuggestionIndex.set(prev);
      return;
    }

    if (event.key === 'Enter') {
      const idx = this.activeSuggestionIndex();
      if (idx >= 0 && idx < items.length) {
        event.preventDefault();
        this.selectAutocompleteItem(items[idx]);
      }
    }
  }

  trackLabel(track: SpotifyTrack): string {
    const artist = track.artists[0]?.name ?? '';
    return artist ? `${track.name} - ${artist}` : track.name;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private rankTracks(query: string, tracks: SpotifyTrack[]): SpotifyTrack[] {
    const normalizedQuery = this.normalize(query);
    const terms = normalizedQuery.split(' ').filter(Boolean);

    return [...tracks].sort((a, b) => this.scoreTrack(b, normalizedQuery, terms) - this.scoreTrack(a, normalizedQuery, terms));
  }

  private scoreTrack(track: SpotifyTrack, normalizedQuery: string, terms: string[]): number {
    const song = this.normalize(track.name);
    const artist = this.normalize(track.artists[0]?.name ?? '');
    const label = this.normalize(this.trackLabel(track));

    let score = 0;

    if (label === normalizedQuery) score += 120;
    if (song === normalizedQuery) score += 110;
    if (artist === normalizedQuery) score += 100;

    if (song.startsWith(normalizedQuery)) score += 80;
    if (artist.startsWith(normalizedQuery)) score += 70;
    if (label.includes(normalizedQuery)) score += 40;

    if (terms.length > 1) {
      const allTermsInLabel = terms.every(term => label.includes(term));
      if (allTermsInLabel) score += 35;
    }

    return score;
  }

  private handleSearchError(error: unknown): void {
    if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
      this.showSuggestions.set(false);
      this.searchErrorMessage.set('No se pudo buscar en Spotify ahora. Intenta nuevamente en unos segundos.');
      return;
    }

    this.searchErrorMessage.set('No pudimos buscar canciones en Spotify. Intenta nuevamente.');
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions.set(false);
      this.noResults.set(false);
    }, 150);
  }

  onAddSong(): void {
    if (this.isCheckingWriteAccess()) {
      this.errorMessage.set('Estamos verificando permisos de la playlist en Spotify. Intenta nuevamente en unos segundos.');
      return;
    }

    this.isAdding.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const selectedTrack = this.selectedTrack();
    const query = this.songForm.controls.suggestion.value.trim();
    const track$ = selectedTrack
      ? of(selectedTrack)
      : this.spotify.searchTracks(query).pipe(map(tracks => tracks[0] ?? null));

    track$.pipe(
      switchMap(track => {
        if (!track) {
          return throwError(() => new Error('TRACK_NOT_FOUND'));
        }
        return this.spotify.addTrackToPlaylist(track.uri).pipe(map(() => track));
      }),
      finalize(() => this.isAdding.set(false))
    ).subscribe({
      next: track => {
        this.successMessage.set(`"${track.name}" fue agregada a la playlist 🎶`);
        this.songForm.reset({ suggestion: '' });
        this.selectedTrack.set(null);
      },
      error: (error: unknown) => {
        const message = this.resolveAddSongErrorMessage(error);
        this.errorMessage.set(message);
      },
    });
  }

  private resolveAddSongErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message === 'TRACK_NOT_FOUND') {
      return 'No encontramos esa canción en Spotify. Intenta con otro nombre o artista.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Tu sesión de Spotify expiró. Vuelve a conectar tu cuenta e inténtalo de nuevo.';
      }

      if (error.status === 403) {
        const spotifyMessage = this.getSpotifyApiMessage(error);
        if (spotifyMessage.includes('insufficient client scope')) {
          return 'Spotify devolvio 403 por permisos OAuth insuficientes. Desconecta y vuelve a conectar Spotify para renovar permisos.';
        }

        return 'Spotify devolvio 403: tu usuario no puede agregar canciones a esta playlist. Debe ser colaborativa o tuya, y luego debes volver a conectar Spotify.';
      }

      if (error.status === 404) {
        return 'No encontramos la playlist configurada en Spotify. Verifica el playlist ID.';
      }

      if (error.status === 429) {
        return 'Spotify limitó temporalmente las solicitudes. Espera un momento e inténtalo de nuevo.';
      }
    }

    return 'No se pudo agregar la canción. Intenta nuevamente en unos minutos.';
  }

  private getSpotifyApiMessage(error: HttpErrorResponse): string {
    const body = error.error as
      | { error?: { message?: string } }
      | { message?: string }
      | null;

    if (typeof body === 'object' && body !== null) {
      if ('error' in body && typeof body.error?.message === 'string') {
        return body.error.message.toLowerCase();
      }

      if ('message' in body && typeof body.message === 'string') {
        return body.message.toLowerCase();
      }
    }

    return '';
  }

  private checkPlaylistWriteAccess(): void {
    this.isCheckingWriteAccess.set(true);
    this.writeAccessMessage.set(null);

    this.spotify.canCurrentUserWritePlaylist().pipe(
      finalize(() => this.isCheckingWriteAccess.set(false))
    ).subscribe({
      next: access => {
        this.canWriteToPlaylist.set(access.canWrite);
        if (!access.canWrite) {
          this.writeAccessMessage.set('No pudimos confirmar permisos de escritura para esta cuenta. Igualmente puedes intentar agregar la canción.');
        }
      },
      error: (error: unknown) => {
        this.canWriteToPlaylist.set(true);
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.writeAccessMessage.set('Tu sesión de Spotify podría haber expirado. Si falla al agregar, vuelve a conectar tu cuenta.');
          return;
        }

        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.writeAccessMessage.set('Spotify no permitió validar permisos por adelantado. Puedes intentar agregar y, si falla, reconectar la cuenta.');
          return;
        }

        this.writeAccessMessage.set('No pudimos validar permisos de la playlist, pero puedes intentar agregar la canción.');
      }
    });
  }

  private toAutocompleteFromSpotify(track: SpotifyTrack): AutocompleteItem {
    const artist = track.artists[0]?.name ?? '';
    return {
      id: track.id,
      title: track.name,
      subtitle: artist,
      query: artist ? `${track.name} - ${artist}` : track.name,
      spotifyTrack: track,
    };
  }

  private searchItunesSuggestions(query: string) {
    return this.http
      .get<ItunesSearchResponse>(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=8`
      )
      .pipe(
        map(response => {
          const seen = new Set<string>();
          return response.results
            .filter(item => !!item.trackName)
            .map(item => {
              const title = (item.trackName ?? '').trim();
              const subtitle = (item.artistName ?? '').trim();
              const queryLabel = subtitle ? `${title} - ${subtitle}` : title;
              return {
                id: `itunes-${item.trackId ?? queryLabel}`,
                title,
                subtitle,
                query: queryLabel,
                spotifyTrack: null,
              } as AutocompleteItem;
            })
            .filter(item => {
              const key = this.normalize(item.query);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
        })
      );
  }

  logout(): void {
    this.spotify.logout();
    this.isAuthenticated.set(false);
    this.canWriteToPlaylist.set(true);
    this.writeAccessMessage.set(null);
    this.songForm.reset({ suggestion: '' });
  }
}
