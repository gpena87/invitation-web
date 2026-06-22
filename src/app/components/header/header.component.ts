import { Component, HostListener, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit {
  @ViewChild('bgAudio', { static: false }) bgAudio!: ElementRef<HTMLAudioElement>;

  readonly isHeaderHidden = signal(false);
  isMuted = signal(true);

  private lastScrollY = 0;
  private audioInitialized = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY || 0;

    if (currentScrollY < 24) {
      this.isHeaderHidden.set(false);
      this.lastScrollY = currentScrollY;
      return;
    }

    const scrollingDown = currentScrollY > this.lastScrollY;
    this.isHeaderHidden.set(scrollingDown);
    this.lastScrollY = currentScrollY;
  }

  ngAfterViewInit(): void {
    this.setupAudioOnInteraction();
  }

  private setupAudioOnInteraction(): void {
    const startAudio = (event: Event) => {
      // Ignorar clicks en el botón de audio
      if ((event.target as HTMLElement).closest('button')) {
        return;
      }

      if (!this.audioInitialized) {
        const audio = this.bgAudio?.nativeElement;
        if (audio) {
          console.log('Starting audio...');
          audio.volume = 0.3;
          audio.muted = false;

          audio.play().then(() => {
            console.log('Audio playing successfully');
            this.audioInitialized = true;
            this.isMuted.set(false);

            // Remover listeners después de primera interacción
            document.removeEventListener('click', startAudio as EventListener);
            document.removeEventListener('touchstart', startAudio as EventListener);
            document.removeEventListener('keydown', startAudio as EventListener);
          }).catch(error => {
            console.log('Audio play failed:', error);
          });
        }
      }
    };

    // Escuchar primer click, tap o tecla (excepto en el botón)
    document.addEventListener('click', startAudio as EventListener);
    document.addEventListener('touchstart', startAudio as EventListener);
    document.addEventListener('keydown', startAudio as EventListener);
  }

  toggleAudio(): void {
    const audio = this.bgAudio?.nativeElement;
    if (audio) {
      audio.muted = !audio.muted;
      this.isMuted.set(audio.muted);
    }
  }
}
