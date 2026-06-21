import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit,
  inject, signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, map, finalize } from 'rxjs';
import { SpotifyService, SpotifyTrack } from '../../services/spotify.service';

const SPOTIFY_AUTOPLAY_EMBED_URL =
  'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?autoplay=1&utm_source=generator';
const AUTOCOMPLETE_MIN_CHARS = 3;

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly spotifyAutoplayEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(SPOTIFY_AUTOPLAY_EMBED_URL);

  readonly isAuthenticated = signal(this.spotify.isAuthenticated());
  readonly isExchanging = signal(false);
  readonly isAdding = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly suggestions = signal<SpotifyTrack[]>([]);
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
    // Handle Spotify OAuth callback (?code=...)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const code = params['code'];
      if (code && !this.spotify.isAuthenticated()) {
        this.isExchanging.set(true);
        this.spotify.exchangeCodeForToken(code).subscribe({
          next: () => {
            this.isAuthenticated.set(true);
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
          map(tracks => this.rankTracks(q, tracks)),
          catchError((error: unknown) => {
            this.handleSearchError(error);
            return of([]);
          }),
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
    this.selectedTrack.set(track);
    this.songForm.controls.suggestion.setValue(this.trackLabel(track), { emitEvent: false });
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.noResults.set(false);
    this.activeSuggestionIndex.set(-1);
  }

  onSuggestionInputChange(): void {
    const value = this.normalize(this.songForm.controls.suggestion.value);
    const match = this.suggestions().find(track => {
      const label = this.normalize(this.trackLabel(track));
      const song = this.normalize(track.name);
      return label === value || song === value;
    }) ?? null;
    this.selectedTrack.set(match);

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
        this.selectSuggestion(items[idx]);
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
    const track = this.selectedTrack() ?? this.resolveTrackFromInput();
    if (!track) {
      this.errorMessage.set('Seleccioná una canción del autocompletado.');
      return;
    }

    this.isAdding.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.spotify.addTrackToPlaylist(track.uri).subscribe({
      next: () => {
        this.successMessage.set(`"${track.name}" fue agregada a la playlist 🎶`);
        this.songForm.reset({ suggestion: '' });
        this.selectedTrack.set(null);
        this.isAdding.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo agregar la canción. Asegurate de que la playlist sea colaborativa.');
        this.isAdding.set(false);
      },
    });
  }

  private resolveTrackFromInput(): SpotifyTrack | null {
    const value = this.normalize(this.songForm.controls.suggestion.value);
    return this.suggestions().find(track => {
      const label = this.normalize(this.trackLabel(track));
      const song = this.normalize(track.name);
      return label === value || song === value;
    }) ?? this.suggestions()[0] ?? null;
  }

  logout(): void {
    this.spotify.logout();
    this.isAuthenticated.set(false);
    this.songForm.reset({ suggestion: '' });
  }
}
